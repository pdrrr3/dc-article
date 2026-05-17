import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { getParamDefs } from '../store';
import { wsUrl } from '../network';

// Drum modules lock params on themselves — no target picker needed.
const SELF_LOCK_TYPES = ['kick_drum', 'snare', 'hihat'];

function fmtVal(v) {
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 10)   return n.toFixed(1);
  return n.toFixed(3);
}

function putStep(layerId, modId, n, fields) {
  fetch(`/layer/${layerId}/sequencer/${modId}/step/${n}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  }).catch(e => console.warn('seq step PUT failed', e));
}

function apiPlock(layerId, seqId, step, targetId, param, value) {
  return fetch(`/layer/${layerId}/sequencer/${seqId}/step/${step}/plock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId, param, value }),
  }).catch(e => console.warn('plock POST failed', e));
}

function apiUnplock(layerId, seqId, step, targetId, param) {
  return fetch(`/layer/${layerId}/sequencer/${seqId}/step/${step}/plock`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target_id: targetId, param }),
  }).catch(e => console.warn('plock DELETE failed', e));
}

// ── SeqGrid ───────────────────────────────────────────────────
// props: modId, layerId, modType, modParams (accessor), params (accessor), layer (accessor)

export default function SeqGrid(props) {
  const [steps,       setSteps]       = createSignal([]);
  const [currentStep, setCurrentStep] = createSignal(undefined);
  const [popover,     setPopover]     = createSignal(null);

  let stepEls   = [];
  let prevStep  = undefined;
  let clockSock = null;
  let dragging  = false;
  let dragValue = false;

  const activeLen = () => {
    const p = props.params?.();
    return Math.max(1, Math.min(64, Math.round(p?.length ?? 16)));
  };

  onMount(async () => {
    try {
      const res = await fetch(`/layer/${props.layerId}/sequencer/${props.modId}`);
      if (res.ok) setSteps(await res.json());
    } catch {}
    openClock();
    const stopDrag = () => { dragging = false; };
    window.addEventListener('mouseup', stopDrag);
    onCleanup(() => window.removeEventListener('mouseup', stopDrag));
  });

  onCleanup(() => { if (clockSock) clockSock.close(); });

  function openClock() {
    if (clockSock) clockSock.close();
    clockSock = new WebSocket(wsUrl(`/seq/${props.modId}/clock`));
    clockSock.binaryType = 'arraybuffer';
    clockSock.onmessage = (ev) => {
      const step = new Uint8Array(ev.data)[0];
      if (prevStep !== undefined && stepEls[prevStep])
        stepEls[prevStep].classList.remove('seq-playing');
      prevStep = step;
      setCurrentStep(step);
      if (stepEls[step]) stepEls[step].classList.add('seq-playing');
    };
    clockSock.onclose = () => { clockSock = null; };
  }

  function applyGate(n, on) {
    const cur = steps()[n]?.gate;
    if (cur === on) return;
    setSteps(prev => { const c = [...prev]; c[n] = { ...(c[n] || {}), gate: on }; return c; });
    putStep(props.layerId, props.modId, n, { gate: on });
  }

  const onStepMouseDown = (e, n) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragging  = true;
    dragValue = !steps()[n]?.gate;
    applyGate(n, dragValue);
  };

  const onStepMouseEnter = (n) => { if (dragging) applyGate(n, dragValue); };

  function addPlock(stepIdx, targetId, param, value) {
    setSteps(prev => {
      const c = [...prev];
      const existing = [...(c[stepIdx]?.p_locks || [])];
      const i = existing.findIndex(p => p.target_id === targetId && p.param === param);
      if (i >= 0) existing[i] = { target_id: targetId, param, value };
      else existing.push({ target_id: targetId, param, value });
      c[stepIdx] = { ...(c[stepIdx] || {}), p_locks: existing };
      return c;
    });
    apiPlock(props.layerId, props.modId, stepIdx, targetId, param, value);
  }

  function removePlock(stepIdx, targetId, param) {
    setSteps(prev => {
      const c = [...prev];
      const existing = (c[stepIdx]?.p_locks || []).filter(
        p => !(p.target_id === targetId && p.param === param)
      );
      c[stepIdx] = { ...(c[stepIdx] || {}), p_locks: existing };
      return c;
    });
    apiUnplock(props.layerId, props.modId, stepIdx, targetId, param);
  }

  const COLS = 16;
  const visLen  = () => activeLen();
  const numRows = () => Math.ceil(visLen() / COLS);
  const cardWidth = () => {
    const len = visLen();
    return '100%';
  };

  const stepClass = (n) => {
    // Bar separators: extra left margin every 4 steps (skip first in row)
    const inRow = n % COLS;
    const sep = inRow > 0 && inRow % 4 === 0 ? ' seq-cell-bar' : '';
    return 'seq-cell cursor-pointer relative min-w-0 transition-colors duration-75 select-none' + sep;
  };
  const stepStyle = (step) => `background:${step?.gate ? 'var(--color-label)' : 'var(--color-bg-tertiary)'}; outline:0.5px solid var(--color-border); outline-offset:-0.5px; height:18px`;

  return (
    <div data-no-ctx-menu class="px-2 pt-6 pb-1" style={`width:${cardWidth()}`}>
      <style>{`
        .seq-cell-bar { margin-left: 3px; }
      `}</style>
      <For each={Array.from({ length: numRows() }, (_, r) => r)}>
        {(r) => {
          const rowStart = r * COLS;
          const rowCount = Math.min(COLS, visLen() - rowStart);
          return (
            <div class="flex flex-col gap-0.5 mb-1">
              <div class="grid gap-0.5" style={`grid-template-columns:repeat(${rowCount},minmax(0,1fr))`}>
                <For each={Array.from({ length: rowCount }, (_, i) => rowStart + i)}>
                  {(abs) => (
                    <div class="type-port text-text-muted text-center leading-none">
                      {abs % 4 === 0 ? String(abs / 4 + 1) : ''}
                    </div>
                  )}
                </For>
              </div>
              <div class="grid gap-0.5" style={`grid-template-columns:repeat(${rowCount},minmax(0,1fr))`}>
                <For each={Array.from({ length: rowCount }, (_, i) => rowStart + i)}>
                  {(n) => {
                    const step = () => steps()[n] || { gate:false, pitch:0, velocity:1, length:0.5, probability:1, p_locks:[] };
                    const velH = () => `${Math.round((step().velocity ?? 1) * 100)}%`;
                    const pitch = () => step().pitch ?? 0;
                    const pipW  = () => Math.abs(pitch()) / 2;
                    const hasPlocks = () => (step().p_locks?.length || 0) > 0;
                    return (
                      <div
                        ref={el => { stepEls[n] = el; }}
                        class={stepClass(n)}
                        style={stepStyle(step())}
                        onMouseDown={(e) => onStepMouseDown(e, n)}
                        onMouseEnter={() => onStepMouseEnter(n)}
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setPopover({ stepIdx: n, x: e.clientX, y: e.clientY }); }}
                        title={`step ${n + 1}${hasPlocks() ? ' [plocked]' : ''}`}
                      >
                        <div
                          class={`absolute left-0.5 w-0.5 ${step()?.gate ? 'bg-white/50' : 'bg-warning/50'}`}
                          style={`bottom:1px;height:calc(${velH()} - 2px)`}
                        />
                        <div
                          class={`absolute h-0.5 ${pitch() >= 0 ? 'left-1' : 'right-1'} ${step()?.gate ? 'bg-white/70' : 'bg-text-secondary'}`}
                          style={`bottom:2px;${pitch() >= 0 ? 'right' : 'left'}:${Math.round((1 - pipW()) * 100)}%;opacity:${step()?.gate ? 1 : 0}`}
                        />
                        {/* P-lock dot */}
                        <Show when={hasPlocks()}>
                          <div class="absolute pointer-events-none" style="width:3px;height:3px;top:2px;right:2px;background:var(--color-accent)" />
                        </Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>
          );
        }}
      </For>

      <Show when={popover()}>
        <StepPopover
          stepIdx={popover().stepIdx}
          x={popover().x}
          y={popover().y}
          seqId={props.modId}
          layerId={props.layerId}
          modType={props.modType}
          modParams={props.modParams}
          layer={props.layer}
          step={() => steps()[popover().stepIdx] || { gate:false, pitch:0, velocity:1, length:0.5, probability:1, p_locks:[] }}
          onChange={(field, val) => {
            setSteps(prev => { const c = [...prev]; c[popover().stepIdx] = { ...(c[popover().stepIdx] || {}), [field]: val }; return c; });
            putStep(props.layerId, props.modId, popover().stepIdx, { [field]: val });
          }}
          onAddPlock={(targetId, param, value) => addPlock(popover().stepIdx, targetId, param, value)}
          onRemovePlock={(targetId, param) => removePlock(popover().stepIdx, targetId, param)}
          onClose={() => setPopover(null)}
        />
      </Show>
    </div>
  );
}

// ── StepPopover ───────────────────────────────────────────────

function StepPopover(props) {
  const vw = window.innerWidth, vh = window.innerHeight;
  let x = props.x + 8, y = props.y + 8;
  if (x + 250 > vw) x = props.x - 258;
  if (y + 420 > vh) y = Math.max(8, vh - 428);

  const isSelfLock = () => SELF_LOCK_TYPES.includes(props.modType);

  onMount(() => {
    const h = (e) => { if (!e.target.closest('.seq-popover-panel')) props.onClose(); };
    setTimeout(() => document.addEventListener('click', h), 0);
    onCleanup(() => document.removeEventListener('click', h));
  });

  // ── Shared: step basics row ───────────────────────────────────
  const stepRow = (label, min, max, stepSize, field) => {
    const [val, setVal] = createSignal(props.step()[field] ?? 0);
    return (
      <div class="flex items-center gap-1.5">
        <span class="data-label w-[52px] flex-shrink-0 text-base">{label}:</span>
        <input type="range" min={min} max={max} step={stepSize} value={val()} class="flex-1"
          onInput={(e) => { const v = parseFloat(e.target.value); setVal(v); props.onChange(field, v); }} />
        <span class="data-value w-[42px] text-right flex-shrink-0 text-base tabular-nums">{fmtVal(val())}</span>
      </div>
    );
  };

  return (
    <div
      class="seq-popover-panel fixed z-[500] bg-bg-secondary border border-border p-2.5 flex flex-col gap-1.5 min-w-[250px] max-h-[90vh] overflow-y-auto"
      style={`left:${x}px;top:${y}px`}
    >
      <div class="section-title">STEP {props.stepIdx + 1}</div>

      {/* Velocity + probability always shown */}
      {stepRow('vel',  0, 1, 0.01, 'velocity')}
      {stepRow('prob', 0, 1, 0.01, 'probability')}

      {/* Pitch only for non-hihat (hihat doesn't use pitch per step meaningfully) */}
      <Show when={props.modType !== 'hihat'}>
        {stepRow('pitch', -2, 2, 0.01, 'pitch')}
      </Show>

      {/* Length only for sequencer / global_seq */}
      <Show when={!isSelfLock()}>
        {stepRow('length', 0.01, 1, 0.01, 'length')}
      </Show>

      {/* ── Drum module: per-step param overrides ──────────────── */}
      <Show when={isSelfLock()}>
        <DrumParamOverrides
          seqId={props.seqId}
          modType={props.modType}
          modParams={props.modParams}
          plocks={() => props.step().p_locks || []}
          onAddPlock={props.onAddPlock}
          onRemovePlock={props.onRemovePlock}
        />
      </Show>

      {/* ── Sequencer: external p-lock picker ──────────────────── */}
      <Show when={!isSelfLock()}>
        <ExternalPlockEditor
          seqId={props.seqId}
          layer={props.layer}
          plocks={() => props.step().p_locks || []}
          onAddPlock={props.onAddPlock}
          onRemovePlock={props.onRemovePlock}
        />
      </Show>

      <button
        onClick={props.onClose}
        class="self-end text-base text-text-secondary bg-transparent border border-border cursor-pointer py-0.5 px-2 font-mono hover:text-text-primary hover:border-text-secondary transition-colors mt-0.5"
      >close</button>
    </div>
  );
}

// ── DrumParamOverrides ────────────────────────────────────────
// Shows every param of the drum module as a per-step override slider.
// A param row is "armed" when there's a plock for it on this step.
// Dragging a slider arms it and saves the plock. The × button clears it.

function DrumParamOverrides(props) {
  const paramDefs = () => getParamDefs(props.modType) || {};

  // Get the plock value for a specific param (targeting self)
  const plockFor = (pName) =>
    props.plocks().find(pl => pl.target_id === props.seqId && pl.param === pName);

  // Base value from the live module params
  const baseVal = (pName, def) => {
    const p = typeof props.modParams === 'function' ? props.modParams() : props.modParams;
    return p?.[pName] ?? def?.[2] ?? 0;
  };

  return (
    <div class="border-t border-border mt-0.5 pt-1.5 flex flex-col gap-1">
      <div class="section-title text-warning border-none mb-0.5" style="font-size:0.65rem">
        PER-STEP OVERRIDES
      </div>
      <For each={Object.entries(paramDefs())}>
        {([pName, [min, max, def]]) => {
          const locked = () => plockFor(pName);
          const displayVal = () => locked()?.value ?? baseVal(pName, [min, max, def]);
          const [localVal, setLocalVal] = createSignal(displayVal());

          // Keep slider in sync when plocks change externally
          const syncedVal = () => {
            const lk = locked();
            return lk ? lk.value : baseVal(pName, [min, max, def]);
          };

          const onChange = (v) => {
            setLocalVal(v);
            props.onAddPlock(props.seqId, pName, v);
          };

          const onClear = (e) => {
            e.stopPropagation();
            setLocalVal(baseVal(pName, [min, max, def]));
            props.onRemovePlock(props.seqId, pName);
          };

          return (
            <div class="flex items-center gap-1.5">
              {/* Lock indicator dot */}
              <div
                class="w-1 h-1 flex-shrink-0 rounded-none"
                style={`background:${locked() ? 'var(--color-accent)' : 'transparent'};border:1px solid ${locked() ? 'var(--color-accent)' : 'var(--color-border)'}`}
              />
              <span
                class="type-label flex-shrink-0"
                style={`width:60px;color:${locked() ? 'var(--color-accent)' : 'var(--color-text-secondary)'}`}
              >{pName}:</span>
              <input
                type="range"
                min={min} max={max}
                step={(max - min) / 200}
                value={syncedVal()}
                class="flex-1"
                style={locked() ? 'accent-color:var(--color-accent)' : 'opacity:0.5'}
                onInput={(e) => onChange(parseFloat(e.target.value))}
              />
              <span
                class="type-value flex-shrink-0"
                style={`width:38px;text-align:right;color:${locked() ? 'var(--color-accent)' : 'var(--color-text-secondary)'}`}
              >{fmtVal(syncedVal())}</span>
              {/* × only visible when armed */}
              <button
                onClick={onClear}
                class="type-button bg-transparent border-none cursor-pointer leading-none flex-shrink-0 transition-opacity"
                style={`color:var(--color-accent);opacity:${locked() ? 1 : 0};pointer-events:${locked() ? 'auto' : 'none'};width:12px`}
                title="clear override"
              >×</button>
            </div>
          );
        }}
      </For>
    </div>
  );
}

// ── ExternalPlockEditor ───────────────────────────────────────
// For sequencer / global_seq: pick any module + param in the layer.

function ExternalPlockEditor(props) {
  const [plTarget, setPlTarget] = createSignal('');
  const [plParam,  setPlParam]  = createSignal('');
  const [plValue,  setPlValue]  = createSignal(0);

  const otherMods = () => {
    const lyr = typeof props.layer === 'function' ? props.layer() : props.layer;
    if (!lyr?.modules) return [];
    return Object.values(lyr.modules).filter(m => m.id !== props.seqId);
  };

  const targetParamDefs = () => {
    if (!plTarget()) return {};
    const lyr = typeof props.layer === 'function' ? props.layer() : props.layer;
    const mod = lyr?.modules?.[plTarget()];
    return mod ? (getParamDefs(mod.type_name) || {}) : {};
  };

  const onTargetChange = (e) => { setPlTarget(e.target.value); setPlParam(''); setPlValue(0); };
  const onParamChange  = (e) => {
    const p = e.target.value; setPlParam(p);
    const def = targetParamDefs()[p]; if (def) setPlValue(def[2] ?? 0);
  };

  const canAdd = () => plTarget() && plParam();
  const doAdd  = () => { if (!canAdd()) return; props.onAddPlock(plTarget(), plParam(), plValue()); setPlParam(''); setPlValue(0); };

  const modName = (targetId) => {
    const lyr = typeof props.layer === 'function' ? props.layer() : props.layer;
    return lyr?.modules?.[targetId]?.name || targetId.slice(0, 8);
  };

  const plocks = () => props.plocks();
  const paramMin = () => targetParamDefs()[plParam()]?.[0] ?? -99999;
  const paramMax = () => targetParamDefs()[plParam()]?.[1] ?? 99999;

  return (
    <div class="border-t border-border mt-0.5 pt-1.5 flex flex-col gap-1">
      <div class="section-title text-warning border-none mb-0.5" style="font-size:0.65rem">PLOCKS</div>

      {/* Existing plocks */}
      <Show when={plocks().length > 0} fallback={
        <div class="text-base text-text-secondary italic">none</div>
      }>
        <div class="flex flex-col gap-0.5 mb-1">
          <For each={plocks()}>
            {(pl) => (
              <div class="flex items-center gap-1 min-w-0">
                <span class="data-value text-base flex-1 truncate min-w-0">
                  {modName(pl.target_id)}<span class="text-text-secondary">.</span>{pl.param}
                </span>
                <span class="data-value tabular-nums text-base w-[34px] text-right flex-shrink-0">{fmtVal(pl.value)}</span>
                <button
                  onClick={() => props.onRemovePlock(pl.target_id, pl.param)}
                  class="text-danger text-base bg-transparent border-none cursor-pointer px-0.5 leading-none opacity-60 hover:opacity-100"
                >×</button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Add form */}
      <div class="flex flex-col gap-1 border border-border/40 p-1.5">
        <div class="data-label text-base text-text-secondary uppercase">add</div>
        <select class="bg-bg-secondary border border-border text-text-primary text-base py-0.5 px-1 w-full" value={plTarget()} onChange={onTargetChange}>
          <option value="">— module —</option>
          <For each={otherMods()}>{(m) => <option value={m.id}>{m.name}</option>}</For>
        </select>
        <Show when={plTarget()}>
          <select class="bg-bg-secondary border border-border text-text-primary text-base py-0.5 px-1 w-full" value={plParam()} onChange={onParamChange}>
            <option value="">— param —</option>
            <For each={Object.keys(targetParamDefs())}>{(p) => <option value={p}>{p}</option>}</For>
          </select>
        </Show>
        <Show when={plParam()}>
          <div class="flex items-center gap-1.5">
            <input type="range" min={paramMin()} max={paramMax()} step={(paramMax()-paramMin())/200} value={plValue()} class="flex-1"
              onInput={(e) => setPlValue(parseFloat(e.target.value))} />
            <input type="number" min={paramMin()} max={paramMax()} value={plValue()}
              class="w-[48px] bg-bg-secondary border border-border text-text-primary text-base py-0.5 px-1 tabular-nums"
              onInput={(e) => setPlValue(parseFloat(e.target.value)||0)} />
          </div>
        </Show>
        <button onClick={doAdd} disabled={!canAdd()}
          class="self-start text-base bg-transparent border border-border cursor-pointer py-0.5 px-2 font-mono transition-colors"
          classList={{ 'text-warning border-warning hover:bg-warning/10': canAdd(), 'text-text-secondary opacity-40 cursor-not-allowed': !canAdd() }}
        >+ lock</button>
      </div>
    </div>
  );
}
