import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js';
import { session, pushLog } from '../store';
import { engine, ensureAudio } from '../engine';

// ── Helpers used by journey steps ─────────────────────────────
const setSteps = async (layerId, modId, pat) => {
  for (let i = 0; i < pat.length; i++) {
    await fetch(`/layer/${layerId}/sequencer/${modId}/step/${i}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gate: !!pat[i], pitch: 60, velocity: 1 }),
    });
  }
};

const wipeNonMixer = async (layerId) => {
  const layer = session.layers?.[layerId];
  if (!layer) return;
  for (const mid of Object.keys(layer.modules || {})) {
    if (mid === layer.mixer_id) continue;
    engine.removeModule(layerId, mid);
  }
};

// ── Scripted journey ──────────────────────────────────────────
const JOURNEY = [
  // 0 — pre-seeded as the conversation opener
  {
    prompt: "let's run a session",
    status: 'session ready.',
    done: "it's already running.",
    run: async () => {},
  },
  // 1 — eleven oscillators with envelopes in polyrhythm
  {
    prompt: 'add eleven oscillators (120–2000 Hz), each with its own envelope, gated in polyrhythm',
    status: 'placing oscillators + envelopes…',
    done: 'eleven voices laid down, gates running in polyrhythm.',
    run: async (layerId) => {
      const mixer = session.layers?.[layerId]?.mixer_id;
      const N = 11;
      const periods = [3, 4, 5, 7, 6, 8, 5, 9, 4, 11, 7];
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1);
        const freq = Math.round(120 * Math.pow(2000 / 120, t));
        const osc = engine.addModule(layerId, { type: 'oscillator', name: `osc_${i + 1}` });
        const env = engine.addModule(layerId, { type: 'adsr',       name: `env_${i + 1}` });
        const vca = engine.addModule(layerId, { type: 'vca',        name: `vca_${i + 1}` });
        const seq = engine.addModule(layerId, { type: 'sequencer',  name: `gate_${i + 1}` });
        engine.setParam(layerId, osc.id, 'frequency', freq);
        engine.setParam(layerId, osc.id, 'amplitude', 0.18);
        engine.setParam(layerId, env.id, 'attack',  0.04);
        engine.setParam(layerId, env.id, 'decay',   0.2);
        engine.setParam(layerId, env.id, 'sustain', 0.0);
        engine.setParam(layerId, env.id, 'release', 0.25);
        engine.setParam(layerId, vca.id, 'level', 0.0);
        engine.addConnection(layerId, { from_module: seq.id, from_port: 'gate',     to_module: env.id, to_port: 'gate'     });
        engine.addConnection(layerId, { from_module: env.id, from_port: 'cv_out',   to_module: vca.id, to_port: 'level_cv' });
        engine.addConnection(layerId, { from_module: osc.id, from_port: 'audio_out', to_module: vca.id, to_port: 'audio_in' });
        if (mixer) engine.addConnection(layerId, { from_module: vca.id, from_port: 'audio_out', to_module: mixer, to_port: `in_${(i % 8) + 1}` });
        await new Promise((r) => setTimeout(r, 10));
        const pat = Array.from({ length: 16 }, (_, s) => (s % periods[i]) === 0);
        await setSteps(layerId, seq.id, pat);
      }
    },
  },
  // 2 — regenerate graph: route everything through a single filter + LFO
  {
    prompt: 'route the whole thing through a filter and sweep the cutoff with an lfo',
    status: 'inserting filter + lfo, rerouting the graph…',
    done: 'all voices now run through one filter, cutoff is breathing.',
    run: async (layerId) => {
      const layer  = session.layers?.[layerId];
      const mixer  = layer?.mixer_id;
      const filt   = engine.addModule(layerId, { type: 'filter', name: 'filt' });
      const lfo    = engine.addModule(layerId, { type: 'lfo',    name: 'sweep' });
      engine.setParam(layerId, filt.id, 'cutoff',     1600);
      engine.setParam(layerId, filt.id, 'resonance',  2.2);
      engine.setParam(layerId, filt.id, 'type',       0);
      engine.setParam(layerId, lfo.id,  'rate',  0.08);
      engine.setParam(layerId, lfo.id,  'depth', 0.45);
      engine.addConnection(layerId, { from_module: lfo.id, from_port: 'cv_out', to_module: filt.id, to_port: 'cutoff_cv' });
      // Tear down every VCA→mixer connection so the filter can sit in between.
      const vcaIds  = Object.values(layer?.modules || {}).filter((m) => m.type_name === 'vca').map((m) => m.id);
      const vcaSet  = new Set(vcaIds);
      const toMixer = (layer?.connections || []).filter((c) => c.to_module === mixer && vcaSet.has(c.from_module));
      for (const c of toMixer) await fetch(`/layer/${layerId}/patch/${c.id}`, { method: 'DELETE' });
      for (const vid of vcaIds) {
        engine.addConnection(layerId, { from_module: vid, from_port: 'audio_out', to_module: filt.id, to_port: 'audio_in' });
      }
      if (mixer) engine.addConnection(layerId, { from_module: filt.id, from_port: 'audio_out', to_module: mixer, to_port: 'in_1' });
    },
  },
  // 3 — hihat with its OWN internal sequencer (no separate sequencer module)
  {
    prompt: 'sprinkle hihats on top — use the module’s own step sequencer',
    status: 'placing hihats, programming internal pattern…',
    done: 'hihats running on their own internal steps.',
    run: async (layerId) => {
      const mixer = session.layers?.[layerId]?.mixer_id;
      const hat = engine.addModule(layerId, { type: 'hihat', name: 'hat' });
      engine.setParam(layerId, hat.id, 'level', 0.6);
      // Drive the hihat directly via its internal step sequencer — no external gate module.
      await setSteps(layerId, hat.id, [0,0,1,0, 0,0,1,1, 0,0,1,0, 0,1,1,0]);
      if (mixer) engine.addConnection(layerId, { from_module: hat.id, from_port: 'audio_out', to_module: mixer, to_port: 'in_2' });
    },
  },
  // 4 — staggered LFOs modulating each VCA
  {
    prompt: 'add staggered lfos that breathe on each oscillator’s gate',
    status: 'wiring eleven lfos, staggering the rates…',
    done: 'each voice now drifts under its own slow oscillator.',
    run: async (layerId) => {
      const layer = session.layers?.[layerId];
      const vcas = Object.values(layer?.modules || {}).filter((m) => m.type_name === 'vca');
      for (let i = 0; i < vcas.length; i++) {
        const lfo = engine.addModule(layerId, { type: 'lfo', name: `breath_${i + 1}` });
        engine.setParam(layerId, lfo.id, 'rate',  0.05 + i * 0.04);
        engine.setParam(layerId, lfo.id, 'depth', 0.25);
        engine.addConnection(layerId, { from_module: lfo.id, from_port: 'cv_out', to_module: vcas[i].id, to_port: 'level_cv' });
        await new Promise((r) => setTimeout(r, 6));
      }
    },
  },
  // 5 — reset → next journey
  {
    prompt: "let's start a new session",
    status: 'clearing the patch…',
    done: 'fresh canvas — pick a direction.',
    run: async (layerId) => { await wipeNonMixer(layerId); },
  },
  // 6 — techno drums (internal sequencers per drum)
  {
    prompt: "let's make some techno drums",
    status: 'placing drums + programming patterns…',
    done: 'kick on the floor, snare on 2 & 4, hat in between.',
    run: async (layerId) => {
      const mixer = session.layers?.[layerId]?.mixer_id;
      const kick  = engine.addModule(layerId, { type: 'kick_drum', name: 'kick' });
      const snare = engine.addModule(layerId, { type: 'snare',     name: 'snare' });
      const hat   = engine.addModule(layerId, { type: 'hihat',     name: 'hat' });
      engine.setParam(layerId, kick.id,  'level', 0.95);
      engine.setParam(layerId, snare.id, 'level', 0.82);
      engine.setParam(layerId, hat.id,   'level', 0.6);
      await setSteps(layerId, kick.id,  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]);
      await setSteps(layerId, snare.id, [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0]);
      await setSteps(layerId, hat.id,   [0,0,1,0, 0,0,1,1, 0,0,1,0, 0,1,1,0]);
      if (mixer) {
        engine.addConnection(layerId, { from_module: kick.id,  from_port: 'audio_out', to_module: mixer, to_port: 'in_1' });
        engine.addConnection(layerId, { from_module: snare.id, from_port: 'audio_out', to_module: mixer, to_port: 'in_2' });
        engine.addConnection(layerId, { from_module: hat.id,   from_port: 'audio_out', to_module: mixer, to_port: 'in_3' });
      }
    },
  },
  // 7 — sub-bass riff
  {
    prompt: 'lay a sub-bass riff under the kick',
    status: 'adding bass + sequencer…',
    done: 'sub-bass driving under the kick.',
    run: async (layerId) => {
      const mixer = session.layers?.[layerId]?.mixer_id;
      const bass = engine.addModule(layerId, { type: 'bass_line', name: 'sub' });
      const seq  = engine.addModule(layerId, { type: 'sequencer', name: 'bass_seq' });
      engine.setParam(layerId, bass.id, 'freq',     45);
      engine.setParam(layerId, bass.id, 'cutoff',   320);
      engine.setParam(layerId, bass.id, 'resonance', 6);
      engine.setParam(layerId, bass.id, 'decay',    0.28);
      const notes = [45, 45, 47, 45, 45, 50, 43, 45];
      for (let s = 0; s < 16; s++) {
        await fetch(`/layer/${layerId}/sequencer/${seq.id}/step/${s}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gate: (s % 2) === 0, pitch: notes[Math.floor(s / 2) % notes.length], velocity: 0.9 }),
        });
      }
      engine.addConnection(layerId, { from_module: seq.id,  from_port: 'gate',     to_module: bass.id,  to_port: 'gate_cv' });
      engine.addConnection(layerId, { from_module: seq.id,  from_port: 'pitch_cv', to_module: bass.id,  to_port: 'pitch_cv' });
      if (mixer) engine.addConnection(layerId, { from_module: bass.id, from_port: 'audio_out', to_module: mixer, to_port: 'in_4' });
    },
  },
  // 8 — reverb on the master: insert a submix, route everything through reverb
  {
    prompt: 'put a long reverb on the master — submix, reverb, then back to the bus',
    status: 'rerouting through a submix → reverb → master…',
    done: 'everything now passes through the reverb tail before hitting the master.',
    run: async (layerId) => {
      const layer = session.layers?.[layerId];
      const master = layer?.mixer_id;
      if (!master) return;
      // Capture every connection currently feeding the master mixer.
      const intoMaster = (layer?.connections || []).filter((c) => c.to_module === master);
      const submix = engine.addModule(layerId, { type: 'mixer',  name: 'submix' });
      const rev    = engine.addModule(layerId, { type: 'reverb', name: 'tail'   });
      engine.setParam(layerId, rev.id, 'decay', 0.92);
      engine.setParam(layerId, rev.id, 'mix',   1);
      // Move each existing master connection onto the same channel of the submix.
      for (const c of intoMaster) {
        await fetch(`/layer/${layerId}/patch/${c.id}`, { method: 'DELETE' });
        engine.addConnection(layerId, {
          from_module: c.from_module, from_port: c.from_port,
          to_module: submix.id,       to_port:   c.to_port,
        });
      }
      // submix → reverb → master.in_1
      engine.addConnection(layerId, { from_module: submix.id, from_port: 'audio_out', to_module: rev.id,  to_port: 'audio_in' });
      engine.addConnection(layerId, { from_module: rev.id,    from_port: 'audio_out', to_module: master,  to_port: 'in_1' });
    },
  },
];

export default function ChatPanel() {
  const initialHistory = () => [
    { kind: 'user',      text: JOURNEY[0].prompt },
    { kind: 'assistant', text: JOURNEY[0].done   },
  ];
  // Pre-seeded: the conversation already opened with step 0.
  const [history, setHistory] = createSignal(initialHistory());
  const [stepIdx, setStepIdx] = createSignal(1);
  const [busy, setBusy] = createSignal(false);
  let scrollEl;

  const firstLayerId = () => Object.keys(session.layers || {})[0];
  const nextStep = () => JOURNEY[stepIdx()];
  const journeyDone = () => stepIdx() >= JOURNEY.length;

  // Typewriter effect for the pending prompt — direct DOM textContent
  // updates via ref so we don't trigger SolidJS re-renders every tick.
  let typedEl;
  createEffect(() => {
    if (journeyDone()) return;
    const target = nextStep()?.prompt || '';
    if (typedEl) typedEl.textContent = '';
    let timer;
    const startDelay = setTimeout(() => {
      let i = 0;
      timer = setInterval(() => {
        i++;
        if (typedEl) typedEl.textContent = target.slice(0, i);
        if (i >= target.length) clearInterval(timer);
      }, 35);
    }, 600);
    onCleanup(() => { clearTimeout(startDelay); clearInterval(timer); });
  });
  const clearTyped = () => { if (typedEl) typedEl.textContent = ''; };

  const scrollToBottom = () => queueMicrotask(() => { if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight; });

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const sendNext = async () => {
    if (busy() || journeyDone()) return;
    const step = nextStep();
    setBusy(true);
    clearTyped();
    setHistory((h) => [...h, { kind: 'user', text: step.prompt }]);
    scrollToBottom();
    try {
      await ensureAudio();
      const lid = firstLayerId();
      if (!lid) throw new Error('no layer');
      await wait(450);
      setHistory((h) => [...h, { kind: 'status', text: step.status }]);
      scrollToBottom();
      const runP = step.run(lid);
      // Ensure the status line sits on screen for a beat even if step.run is fast.
      await Promise.all([runP, wait(700)]);
      await wait(350);
      setHistory((h) => [...h, { kind: 'assistant', text: step.done }]);
      pushLog('sys', `journey: ${step.prompt}`);
      setStepIdx((i) => i + 1);
    } catch (e) {
      setHistory((h) => [...h, { kind: 'assistant', text: `error: ${e.message}` }]);
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  };

  const restartJourney = async () => {
    if (busy()) return;
    setBusy(true);
    clearTyped();
    try {
      await ensureAudio();
      const lid = firstLayerId();
      if (lid) await Promise.all([wipeNonMixer(lid), wait(700)]);
      setHistory(initialHistory());
      setStepIdx(1);
      pushLog('sys', 'journey reset');
    } catch (e) {
      setHistory((h) => [...h, { kind: 'assistant', text: `error: ${e.message}` }]);
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  };

  return (
    <aside class="flex flex-col h-full border-r border-border bg-bg-primary w-full">
      <div
        ref={(el) => (scrollEl = el)}
        class="flex-1 overflow-y-auto flex flex-col gap-4"
        style="padding:16px 20px 12px 20px"
      >
        <For each={history()}>
          {(msg) => (
            <Show when={msg.kind === 'status'} fallback={
              <Show when={msg.kind === 'user'} fallback={
                <div class="dc-msg-in self-start max-w-[85%] text-sm leading-relaxed text-text-primary">
                  {msg.text}
                </div>
              }>
                <div class="dc-msg-in self-end max-w-[85%] text-sm leading-relaxed text-text-primary text-right">
                  {msg.text}
                </div>
              </Show>
            }>
              <div class="dc-msg-in self-start text-sm leading-relaxed text-text-muted italic">
                <span class="select-none mr-2">·</span>{msg.text}
              </div>
            </Show>
          )}
        </For>
      </div>

      <footer style="padding:8px 20px 16px 20px">
        <Show
          when={!journeyDone()}
          fallback={
            <div class="flex flex-col gap-3">
              <div class="text-sm leading-relaxed text-text-muted italic">
                <span class="select-none mr-2">·</span>journey complete. tweak knobs and ports on the right.
              </div>
              <button
                disabled={busy()}
                onClick={restartJourney}
                class="w-full text-left bg-transparent border-0 p-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors group"
              >
                <span class="text-sm leading-relaxed text-text-muted group-hover:text-text-primary transition-colors">
                  let's start a new session<span class="dc-caret">▍</span>
                </span>
              </button>
            </div>
          }
        >
          <button
            disabled={busy()}
            onClick={sendNext}
            class="w-full text-left bg-transparent border-0 p-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors group"
          >
            <span class="text-sm leading-relaxed text-text-muted group-hover:text-text-primary transition-colors">
              <span ref={(el) => (typedEl = el)} />
              <span class="dc-caret">▍</span>
            </span>
          </button>
        </Show>
      </footer>
    </aside>
  );
}
