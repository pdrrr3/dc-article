// Local sound engine — runs the Rust drone DSP engine as wasm inside an
// AudioWorklet. The fetch + WebSocket proxies (and Solid-store mirror) preserve
// the same surface the drone client uses, so UI components are unchanged.

import {
  session,
  setSession,
  setModuleTypes,
  setWasmTypes,
  setMeterLevels,
  pushLog,
  setWsConnected,
  getParamDefs,
  getPortDefs,
} from './store';

// ── ID helpers (UI-side strings) ──────────────────────────────
let _seq = 0;
const newId = (prefix) => `${prefix}_${Date.now().toString(36)}_${(++_seq).toString(36)}`;

// ── Module catalog — same shape as before; UI uses this for the picker. ──
const SUPPORTED_TYPES = [
  'oscillator', 'pwm_oscillator', 'fm_operator', 'supersaw', 'wavetable',
  'additive_osc', 'phase_distortion', 'noise_gen',
  'lfo', 'adsr', 'envelope_follower', 'slew_limiter', 'sample_hold',
  'attenuverter', 'pitch_quantizer',
  'filter', 'svf', 'moog_filter', 'ms20_filter', 'formant_filter', 'comb_filter',
  'wavefolder', 'ring_mod', 'bitcrusher', 'tape_saturation',
  'vca', 'compressor', 'stereo_panner',
  'delay_line', 'reverb', 'chorus', 'phaser', 'flanger',
  'clock', 'clock_divider', 'sequencer', 'global_seq', 'euclidean',
  'arpeggiator', 'bernoulli_gate',
  'kick_drum', 'snare', 'hihat', 'bass_line',
  'mixer', 'cv_mixer',
];

const SEQUENCER_TYPES = new Set(['sequencer', 'global_seq']);

// ── Worklet IPC state ─────────────────────────────────────────
let audioCtx = null;
let workletNode = null;
let masterId = null;
let audioReady = false;
let bootPromise = null;
let portsCache = new Map();

// uiId ↔ wasmId mapping. uiId is what the store + components use; wasmId is what the engine uses.
const uiToWasm = new Map();
const wasmToUi = new Map();
const connUiToWasm = new Map();
const seqClockListeners = new Map(); // uiModId -> Set<fn(step)>
const layerMixerConnected = new Set(); // uiLayerId where mixer → master is wired
// In-flight realizeModule promises keyed by uiModId, so dependent realizeConnection
// calls can await the wasm-side module ID before lookup.
const moduleInflight = new Map();

// Pending IPC tokens (for awaitable add_module/connect responses)
let _tok = 0;
const pendingTokens = new Map();
function nextToken() { return `t${++_tok}`; }
function awaitToken(token) {
  return new Promise((resolve, reject) => {
    pendingTokens.set(token, { resolve, reject });
    setTimeout(() => {
      if (pendingTokens.has(token)) { pendingTokens.delete(token); reject(new Error('worklet timeout')); }
    }, 5000);
  });
}

function post(msg) { try { workletNode?.port.postMessage(msg); } catch (e) { pushLog('err', `post: ${e.message}`); } }

// ── ensureAudio ───────────────────────────────────────────────
export async function ensureAudio() {
  if (audioReady) return;
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    const wasmResp = await fetch('/wasm-pkg/dc_wasm_bg.wasm');
    const wasmBytes = await wasmResp.arrayBuffer();
    const wasmModule = await WebAssembly.compile(wasmBytes);

    try {
      await audioCtx.audioWorklet.addModule(`/drone-worklet.js?v=${Date.now()}`);
    } catch (e) {
      pushLog('err', `worklet load failed: ${e.message || e}`);
      console.error('AudioWorklet load failed:', e);
      throw e;
    }
    workletNode = new AudioWorkletNode(audioCtx, 'drone-processor', {
      numberOfInputs: 0,
      numberOfOutputs: 1,
      outputChannelCount: [2],
      processorOptions: { wasmModule },
    });

    workletNode.port.onmessage = (e) => {
      const m = e.data;
      switch (m.type) {
        case 'ready':
          masterId = m.masterId;
          break;
        case 'module_added':
        case 'connected': {
          const p = pendingTokens.get(m.token);
          if (p) { pendingTokens.delete(m.token); p.resolve(m.id); }
          break;
        }
        case 'meters': {
          try {
            const arr = JSON.parse(m.data);
            const next = {};
            for (const [wasmId, rms, brightness] of arr) {
              const uiId = wasmToUi.get(wasmId);
              if (!uiId) continue;
              next[uiId] = [Math.min(1, rms * 4), brightness];
            }
            setMeterLevels(next);
          } catch {}
          break;
        }
        case 'step': {
          const uiId = wasmToUi.get(m.id);
          if (!uiId) break;
          const subs = seqClockListeners.get(uiId);
          if (subs) for (const fn of subs) try { fn(m.step); } catch {}
          break;
        }
        case 'error':
          pushLog('err', m.error);
          break;
      }
    };

    workletNode.connect(audioCtx.destination);

    // Wait for engine ready
    await new Promise((res) => {
      const t0 = Date.now();
      const tick = () => {
        if (masterId) return res();
        if (Date.now() - t0 > 4000) return res();
        setTimeout(tick, 20);
      };
      tick();
    });

    audioReady = true;

    // Materialize everything that was created before audio was ready.
    for (const lid of Object.keys(session.layers || {})) {
      const layer = session.layers[lid];
      for (const mid of Object.keys(layer.modules || {})) await realizeModule(lid, mid);
      for (const c of layer.connections || []) await realizeConnection(lid, c);
      wireMixerToMaster(lid);
    }
  })();
  return bootPromise;
}

// ── Port resolution ───────────────────────────────────────────
async function fetchPorts(typeName) {
  if (portsCache.has(typeName)) return portsCache.get(typeName);
  // We can't call wasm directly from the main thread (it's inside the worklet).
  // Fall back to the store's MODULE_PORTS, which is the source of truth for the UI.
  const defs = getPortDefs(typeName) || { inputs: [], outputs: [] };
  portsCache.set(typeName, defs);
  return defs;
}

function portIndex(ports, name, kind /* 'inputs' | 'outputs' */) {
  const list = ports[kind] || [];
  const i = list.indexOf(name);
  return i >= 0 ? i : 0;
}

// ── Realize / unrealize against the wasm engine ───────────────
function realizeModule(uiLayerId, uiModId) {
  if (!audioReady) return Promise.resolve();
  if (uiToWasm.has(uiModId)) return Promise.resolve();
  const existing = moduleInflight.get(uiModId);
  if (existing) return existing;
  const mod = session.layers?.[uiLayerId]?.modules?.[uiModId];
  if (!mod) return Promise.resolve();
  const promise = (async () => {
    const token = nextToken();
    post({ type: 'add_module', type_name: mod.type_name, token });
    let wasmId;
    try { wasmId = await awaitToken(token); }
    catch (e) { pushLog('err', `add_module ${mod.type_name}: ${e.message}`); return; }
    if (!wasmId) { pushLog('err', `unsupported wasm module: ${mod.type_name}`); return; }
    uiToWasm.set(uiModId, wasmId);
    wasmToUi.set(wasmId, uiModId);
    for (const [k, v] of Object.entries(mod.params || {})) {
      if (typeof v === 'number') post({ type: 'set_param', id: wasmId, name: k, value: v });
    }
    if (SEQUENCER_TYPES.has(mod.type_name)) post({ type: 'register_sequencer', id: wasmId });
    if (mod.type_name === 'mixer')          post({ type: 'enable_meter',       id: wasmId });
  })();
  moduleInflight.set(uiModId, promise);
  promise.finally(() => moduleInflight.delete(uiModId));
  return promise;
}

async function realizeConnection(uiLayerId, conn) {
  if (!audioReady) return;
  if (connUiToWasm.has(conn.id)) return;
  // Wait for in-flight realizeModule on either endpoint to finish.
  const pending = [moduleInflight.get(conn.from_module), moduleInflight.get(conn.to_module)].filter(Boolean);
  if (pending.length) await Promise.all(pending);
  const fromWasm = uiToWasm.get(conn.from_module);
  const toWasm = uiToWasm.get(conn.to_module);
  if (!fromWasm || !toWasm) return;
  const fromMod = session.layers?.[uiLayerId]?.modules?.[conn.from_module];
  const toMod = session.layers?.[uiLayerId]?.modules?.[conn.to_module];
  if (!fromMod || !toMod) return;
  const fromPorts = await fetchPorts(fromMod.type_name);
  const toPorts = await fetchPorts(toMod.type_name);
  const fp = portIndex(fromPorts, conn.from_port, 'outputs');
  const tp = portIndex(toPorts, conn.to_port, 'inputs');
  const token = nextToken();
  post({ type: 'connect', from: fromWasm, from_port: fp, to: toWasm, to_port: tp, token });
  try {
    const wasmConnId = await awaitToken(token);
    if (wasmConnId) connUiToWasm.set(conn.id, wasmConnId);
  } catch (e) { pushLog('err', `connect: ${e.message}`); }
}

function unrealizeModule(uiModId) {
  const wasmId = uiToWasm.get(uiModId);
  if (!wasmId) return;
  post({ type: 'remove_module', id: wasmId });
  uiToWasm.delete(uiModId);
  wasmToUi.delete(wasmId);
}

function unrealizeConnection(uiConnId) {
  const wasmConnId = connUiToWasm.get(uiConnId);
  if (!wasmConnId) return;
  post({ type: 'disconnect', id: wasmConnId });
  connUiToWasm.delete(uiConnId);
}

function wireMixerToMaster(uiLayerId) {
  if (!audioReady || !masterId) return;
  if (layerMixerConnected.has(uiLayerId)) return;
  const layer = session.layers?.[uiLayerId];
  if (!layer?.mixer_id) return;
  const mixerWasm = uiToWasm.get(layer.mixer_id);
  if (!mixerWasm) return;
  // Mixer has output port 0 = audio_out. Master has inputs 0 = left, 1 = right.
  post({ type: 'connect', from: mixerWasm, from_port: 0, to: masterId, to_port: 0 });
  post({ type: 'connect', from: mixerWasm, from_port: 0, to: masterId, to_port: 1 });
  layerMixerConnected.add(uiLayerId);
}

// ── Store mutations (called by both engine.* API and fetch proxy) ──
function createLayer({ name } = {}) {
  const id = newId('layer');
  const mixerId = newId('mod');
  const mixerParams = {};
  for (const [k, [, , def]] of Object.entries(getParamDefs('mixer'))) mixerParams[k] = def;
  const layer = {
    id,
    name: name || `layer ${Object.keys(session.layers || {}).length + 1}`,
    mixer_id: mixerId,
    modules: { [mixerId]: { id: mixerId, name: 'mixer', type_name: 'mixer', params: mixerParams, seq: 0 } },
    connections: [],
  };
  setSession('layers', id, layer);
  if (audioReady) {
    realizeModule(id, mixerId).then(() => wireMixerToMaster(id));
  }
  return layer;
}

function addModule(layerId, { type, name } = {}) {
  const layer = session.layers?.[layerId];
  if (!layer) return { error: 'no such layer' };
  const id = newId('mod');
  const params = {};
  for (const [k, [, , def]] of Object.entries(getParamDefs(type) || {})) params[k] = def;
  const existing = Object.values(layer.modules || {});
  const seq = (existing.reduce((m, x) => Math.max(m, x.seq ?? 0), 0)) + 1;
  const mod = { id, type_name: type, name: name || `${type}_${seq}`, params, seq };
  setSession('layers', layerId, 'modules', id, mod);
  if (audioReady) realizeModule(layerId, id);
  return mod;
}

function removeModule(layerId, modId) {
  const conns = (session.layers?.[layerId]?.connections || []).filter(
    (c) => c.from_module === modId || c.to_module === modId,
  );
  for (const c of conns) removeConnection(layerId, c.id);
  unrealizeModule(modId);
  setSession('layers', layerId, 'modules', modId, undefined);
  return { ok: true };
}

function addConnection(layerId, { from_module, from_port, to_module, to_port }) {
  const id = newId('conn');
  const conn = { id, from_module, from_port, to_module, to_port };
  const list = session.layers?.[layerId]?.connections || [];
  setSession('layers', layerId, 'connections', [...list, conn]);
  if (audioReady) realizeConnection(layerId, conn);
  return conn;
}

function removeConnection(layerId, connId) {
  unrealizeConnection(connId);
  const list = (session.layers?.[layerId]?.connections || []).filter((c) => c.id !== connId);
  setSession('layers', layerId, 'connections', list);
  return { ok: true };
}

function setParam(layerId, modId, name, value) {
  setSession('layers', layerId, 'modules', modId, 'params', name, value);
  const wasmId = uiToWasm.get(modId);
  if (wasmId) post({ type: 'set_param', id: wasmId, name, value });
}

function renameLayer(layerId, name) { setSession('layers', layerId, 'name', name); }

function deleteLayer(layerId) {
  const layer = session.layers?.[layerId];
  if (!layer) return;
  for (const c of layer.connections || []) unrealizeConnection(c.id);
  for (const mid of Object.keys(layer.modules || {})) unrealizeModule(mid);
  layerMixerConnected.delete(layerId);
  setSession('layers', layerId, undefined);
}

function reorderLayer(layerId, order) {
  order.forEach((id, i) => setSession('layers', layerId, 'modules', id, 'seq', i));
}

// ── Sequencer step state — mirrored to wasm ───────────────────
function getSeqSteps(modId) {
  // The wasm engine owns step state; we read back lazily through the local mirror.
  return seqStateLocal.get(modId)?.steps || [];
}

const seqStateLocal = new Map(); // uiModId -> { steps: [...] }
function ensureSeqLocal(modId, length = 16) {
  let st = seqStateLocal.get(modId);
  if (!st) {
    st = { steps: Array.from({ length }, (_, i) => ({ gate: false, pitch: 60 + (i % 12), velocity: 1, length: 0.5, probability: 1, plocks: {} })) };
    seqStateLocal.set(modId, st);
  }
  return st;
}

function putSeqStep(modId, n, fields) {
  const st = ensureSeqLocal(modId);
  st.steps[n] = { ...(st.steps[n] || { gate: false, pitch: 60, velocity: 1, length: 0.5, probability: 1, plocks: {} }), ...fields };
  const wasmId = uiToWasm.get(modId);
  if (wasmId) {
    const s = st.steps[n];
    post({ type: 'set_step', id: wasmId, step: n, gate: s.gate, pitch: s.pitch != null ? (s.pitch - 60) / 12 : undefined, velocity: s.velocity, length: s.length, probability: s.probability });
  }
}

function putPlock(modId, n, targetId, param, value) {
  const st = ensureSeqLocal(modId);
  const step = st.steps[n] ||= { gate: false, pitch: 60, velocity: 1, length: 0.5, probability: 1, plocks: {} };
  step.plocks ||= {};
  step.plocks[targetId] ||= {};
  step.plocks[targetId][param] = value;
  const wasmId = uiToWasm.get(modId);
  const targetWasm = uiToWasm.get(targetId);
  if (wasmId && targetWasm) post({ type: 'set_plock', id: wasmId, step: n, target: targetWasm, param, value });
}

function deletePlock(modId, n, targetId, param) {
  const st = seqStateLocal.get(modId);
  if (!st) return;
  const step = st.steps[n];
  if (step?.plocks?.[targetId]) delete step.plocks[targetId][param];
  const wasmId = uiToWasm.get(modId);
  const targetWasm = uiToWasm.get(targetId);
  if (wasmId && targetWasm) post({ type: 'clear_plock', id: wasmId, step: n, target: targetWasm, param });
}

// ── Fetch proxy ───────────────────────────────────────────────
const okJson = (body) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
const errJson = (status, error) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json' } });
const realFetch = typeof fetch === 'function' ? fetch.bind(window) : null;

function matches(url, pattern) {
  const u = new URL(url, location.origin);
  const p = u.pathname.split('/').filter(Boolean);
  const q = pattern.split('/').filter(Boolean);
  if (p.length !== q.length) return null;
  const params = {};
  for (let i = 0; i < p.length; i++) {
    if (q[i].startsWith(':')) params[q[i].slice(1)] = decodeURIComponent(p[i]);
    else if (q[i] !== p[i]) return null;
  }
  return params;
}

async function readJson(init) {
  if (!init || !init.body) return {};
  try { return JSON.parse(init.body); } catch { return {}; }
}

async function localHandler(input, init = {}) {
  const url = typeof input === 'string' ? input : input.url;
  const method = (init.method || 'GET').toUpperCase();
  let m;

  if (method === 'GET' && matches(url, '/session')) return okJson(JSON.parse(JSON.stringify(session)));
  if (method === 'GET' && matches(url, '/modules')) return okJson(SUPPORTED_TYPES);
  if (method === 'GET' && matches(url, '/wasm/modules')) return okJson({ types: [] });
  if (method === 'GET' && matches(url, '/meters')) {
    // Worklet pushes meters to setMeterLevels(); read from store-style mirror.
    return okJson({});
  }
  if (method === 'GET' && matches(url, '/layers')) return okJson(Object.values(session.layers || {}).map((l) => ({ id: l.id, name: l.name })));
  if ((m = matches(url, '/layer/:id')) && method === 'GET') {
    const l = session.layers?.[m.id];
    return l ? okJson(JSON.parse(JSON.stringify(l))) : errJson(404, 'no such layer');
  }
  if (matches(url, '/layer') && method === 'POST') return okJson(createLayer(await readJson(init)));
  if ((m = matches(url, '/layer/:id')) && method === 'PATCH') {
    const body = await readJson(init);
    if (body.name) renameLayer(m.id, body.name);
    return okJson({ ok: true });
  }
  if ((m = matches(url, '/layer/:id')) && method === 'DELETE') { deleteLayer(m.id); return okJson({ ok: true }); }
  if ((m = matches(url, '/layer/:id/module')) && method === 'POST') {
    const res = addModule(m.id, await readJson(init));
    return res.error ? errJson(400, res.error) : okJson(res);
  }
  if ((m = matches(url, '/layer/:id/module/:mid')) && method === 'DELETE') return okJson(removeModule(m.id, m.mid));
  if ((m = matches(url, '/layer/:id/module/:mid/param')) && method === 'PUT') {
    const body = await readJson(init);
    setParam(m.id, m.mid, body.name, body.value);
    return okJson({ ok: true });
  }
  if ((m = matches(url, '/layer/:id/patch')) && method === 'POST') return okJson(addConnection(m.id, await readJson(init)));
  if ((m = matches(url, '/layer/:id/patch/:cid')) && method === 'DELETE') return okJson(removeConnection(m.id, m.cid));
  if ((m = matches(url, '/layer/:id/reorder')) && method === 'PUT') {
    reorderLayer(m.id, (await readJson(init)).order || []);
    return okJson({ ok: true });
  }
  if ((m = matches(url, '/layer/:id/sequencer/:mid')) && method === 'GET') return okJson(getSeqSteps(m.mid));
  if ((m = matches(url, '/layer/:id/sequencer/:mid/step/:n')) && method === 'PUT') {
    putSeqStep(m.mid, Number(m.n), await readJson(init));
    return okJson({ ok: true });
  }
  if ((m = matches(url, '/layer/:id/sequencer/:mid/step/:n/plock')) && method === 'POST') {
    const body = await readJson(init);
    putPlock(m.mid, Number(m.n), body.target_id, body.param, body.value);
    return okJson({ ok: true });
  }
  if ((m = matches(url, '/layer/:id/sequencer/:mid/step/:n/plock')) && method === 'DELETE') {
    const body = await readJson(init);
    deletePlock(m.mid, Number(m.n), body.target_id, body.param);
    return okJson({ ok: true });
  }

  if (realFetch) return realFetch(input, init);
  return errJson(404, 'no handler');
}

// ── Mock WebSocket for /seq/:mid/clock ────────────────────────
class FakeSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 1;
    this.binaryType = 'arraybuffer';
    this.onopen = null; this.onmessage = null; this.onclose = null; this.onerror = null;
    this._installed = null;
    queueMicrotask(() => this.onopen && this.onopen({}));
    const m = url.match(/\/seq\/([^/]+)\/clock/);
    if (m) {
      const modId = m[1];
      const listener = (step) => {
        if (this.onmessage) this.onmessage({ data: new Uint8Array([step]).buffer });
      };
      let subs = seqClockListeners.get(modId);
      if (!subs) { subs = new Set(); seqClockListeners.set(modId, subs); }
      subs.add(listener);
      this._installed = { modId, listener };
    }
  }
  send() {}
  close() {
    this.readyState = 3;
    if (this._installed) {
      const subs = seqClockListeners.get(this._installed.modId);
      if (subs) subs.delete(this._installed.listener);
    }
    if (this.onclose) this.onclose({});
  }
}

export function installEngineFetchProxy() {
  if (typeof window === 'undefined') return;
  window.fetch = (input, init) => localHandler(input, init);
  const realWS = window.WebSocket;
  window.WebSocket = function (url, ...args) {
    if (typeof url === 'string' && url.startsWith('ws://0.0.0.0:0')) return new FakeSocket(url);
    return new realWS(url, ...args);
  };
  window.WebSocket.CONNECTING = 0; window.WebSocket.OPEN = 1; window.WebSocket.CLOSING = 2; window.WebSocket.CLOSED = 3;
}

// ── ws.js compatibility surface ───────────────────────────────
const paramTimers = {};
export function scheduleParamPut(layerId, moduleId, paramName, value) {
  const key = `${layerId}/${moduleId}/${paramName}`;
  if (paramTimers[key]) clearTimeout(paramTimers[key]);
  setParam(layerId, moduleId, paramName, value);
  paramTimers[key] = setTimeout(() => { delete paramTimers[key]; }, 30);
}

export function sendOsc(address, args) {
  pushLog('osc', `${address} ${JSON.stringify(args)}`);
  if (address === '/transport/bpm') {
    const v = args?.[0]?.value;
    if (typeof v === 'number') { setSession('bpm', v); post({ type: 'set_bpm', bpm: v }); }
  }
  if (address === '/transport/play') setSession('playing', true);
  if (address === '/transport/stop') setSession('playing', false);
}

export async function boot() {
  installEngineFetchProxy();
  setModuleTypes(SUPPORTED_TYPES);
  setWasmTypes([]);
  setWsConnected(true);
  if (Object.keys(session.layers || {}).length === 0) createLayer({ name: 'main' });
  pushLog('sys', 'local engine ready');
  return true;
}

export const engine = {
  ensureAudio, createLayer, addModule, removeModule, addConnection, removeConnection, setParam, deleteLayer,
};
