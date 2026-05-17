import { createSignal, For, Show, onCleanup } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { createStore } from 'solid-js/store';
import { session, setSession, patchFrom, setPatchFrom, showPatchMsg, clearPatchMsg, getPortDefs, getParamDefs, dragCable, setDragCable } from '../store';
import { scheduleParamPut } from '../ws';
import ScopeCanvas from './ScopeCanvas';
import SeqGrid from './SeqGrid';
import AdsrGraph from './AdsrGraph';
import {
  FilterEditor,
  OscillatorEditor,
  LfoEditor,
  CompressorEditor,
  ChannelStrip,
  DelayEditor,
  ShaperEditor,
  KnobPanel,
} from './ModuleEditors';

// type_name → editor component. adsr has its own graph (below), seq/drum go through SeqGrid.
const CUSTOM_EDITORS = {
  // Filters
  filter: FilterEditor,
  svf: FilterEditor,
  moog_filter: FilterEditor,
  ms20_filter: FilterEditor,
  formant_filter: FilterEditor,
  // Oscillators
  oscillator: OscillatorEditor,
  pwm_oscillator: OscillatorEditor,
  supersaw: OscillatorEditor,
  fm_operator: OscillatorEditor,
  // LFO
  lfo: LfoEditor,
  // Compressor
  compressor: CompressorEditor,
  // Mixers
  mixer: ChannelStrip,
  cv_mixer: ChannelStrip,
  // Delay
  delay_line: DelayEditor,
  // Shapers / distortion
  wavefolder: ShaperEditor,
  ring_mod: ShaperEditor,
  bitcrusher: ShaperEditor,
  tape_saturation: ShaperEditor,
  // Effects — knob panel (grouped rotary layout vs sliders)
  reverb: KnobPanel,
  chorus: KnobPanel,
  flanger: KnobPanel,
  phaser: KnobPanel,
  comb_filter: KnobPanel,
  // Utilities
  slew_limiter: KnobPanel,
  envelope_follower: KnobPanel,
  attenuverter: KnobPanel,
  pitch_quantizer: KnobPanel,
  vca: KnobPanel,
  stereo_panner: KnobPanel,
  clock: KnobPanel,
  clock_divider: KnobPanel,
  noise_gen: KnobPanel,
  grain_player: KnobPanel,
  wavetable: KnobPanel,
  additive_osc: KnobPanel,
};

function fmtVal(v) {
  const n = Number(v);
  if (Math.abs(n) >= 1000) return n.toFixed(0);
  if (Math.abs(n) >= 10) return n.toFixed(1);
  return n.toFixed(3);
}

// ── Filled-bar slider (tight, mech-style) ─────────────────────
function BarSlider(props) {
  let barRef;
  const [dragging, setDragging] = createSignal(false);

  const pct = () => {
    const v = typeof props.value === 'function' ? props.value() : props.value;
    const t = (v - props.min) / (props.max - props.min);
    return Math.max(0, Math.min(1, t));
  };

  const valueFromEvent = (e) => {
    const rect = barRef.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return props.min + t * (props.max - props.min);
  };

  const onMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    props.onValue(valueFromEvent(e));

    const onMove = (e) => { if (dragging()) props.onValue(valueFromEvent(e)); };
    const onUp   = ()  => { setDragging(false); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  onCleanup(() => setDragging(false));

  return (
    <div
      ref={barRef}
      onMouseDown={onMouseDown}
      onDblClick={(e) => { e.preventDefault(); if (props.defaultValue !== undefined) props.onValue(props.defaultValue); }}
      class="relative w-full cursor-ew-resize h-2 dc-bar"
      style="background:var(--color-bg-tertiary);border:0.5px solid var(--color-border)"
    >
      <div
        class="absolute top-0 left-0 h-full pointer-events-none"
        style={`width:${pct() * 100}%;background:var(--color-label);opacity:${dragging() ? 1 : 0.85}`}
      />
      {/* tick marker at the fill edge — reads as TUI caret */}
      <div
        class="absolute top-0 pointer-events-none"
        style={`left:calc(${pct() * 100}% - 0.5px);width:1px;height:100%;background:var(--color-text-primary)`}
      />
    </div>
  );
}

export default function ModuleCard(props) {
  const mod = () => props.mod;
  const layer = () => props.layer;
  const isBus = () => mod().id === layer().mixer_id;
  const [prevParams, setPrevParams] = createSignal(null);
  const typeName = () => mod().type_name;
  const paramDefs = () => getParamDefs(typeName());
  const portDefs = () => getPortDefs(typeName());

  const connectedOutputs = () => new Set(
    (layer().connections || [])
      .filter(c => c.from_module === mod().id)
      .map(c => c.from_port)
  );
  const connectedInputs = () => new Set(
    (layer().connections || [])
      .filter(c => c.to_module === mod().id)
      .map(c => c.to_port)
  );

  const deleteModule = async () => {
    await fetch(`/layer/${layer().id}/module/${mod().id}`, { method: 'DELETE' })
      .catch(e => console.warn('delete module failed', e));
  };

  const onPortClick = async (port, dir) => {
    const from = patchFrom();
    if (from === null) {
      if (dir !== 'output') {
        showPatchMsg('Click an OUTPUT port first (top of card)', 3000);
        return;
      }
      setPatchFrom({ layerId: layer().id, moduleId: mod().id, port });
      showPatchMsg(`FROM: ${mod().name} [${portDefs().outputs[port]}] — now click an INPUT`);
    } else {
      if (dir !== 'input') {
        showPatchMsg('Click an INPUT port (bottom of card) to complete', 3000);
        return;
      }
      const body = {
        from_module: from.moduleId,
        from_port: from.port,
        to_module: mod().id,
        to_port: port,
      };
      setPatchFrom(null);
      clearPatchMsg();
      const res = await fetch(`/layer/${layer().id}/patch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).catch(e => { showPatchMsg(`Network error: ${e.message}`, 3000); return null; });
      if (res && !res.ok) {
        const e = await res.json().catch(() => ({}));
        showPatchMsg(`Error: ${e.error || res.status}`, 3000);
      }
    }
  };

  const isPatchFrom = () => {
    const f = patchFrom();
    return f && f.moduleId === mod().id;
  };

  const outputs = () => isBus() ? [] : portDefs().outputs;
  const inputs = () => {
    if (isBus()) return Array.from({ length: 8 }, (_, i) => `in_${i + 1}`);
    return portDefs().inputs;
  };

  const isInst = () => ['sequencer','global_seq','kick_drum','snare','hihat','bass_line'].includes(typeName());
  const isAdsr = () => typeName() === 'adsr';
  const isMixer = () => ['mixer', 'cv_mixer'].includes(typeName());
  const hasCustomEditor = () => CUSTOM_EDITORS[typeName()] !== undefined;
  const cardWidth = () =>
    isInst() ? '320px' :
    isMixer() ? '240px' :
    (isAdsr() || hasCustomEditor()) ? '220px' :
    '200px';
  const cardMinWidth = () => cardWidth();

  const borderClass = () => {
    if (isPatchFrom()) return 'border-label';
    if (isBus()) return 'border-warning';
    return 'border-border';
  };

  return (
    <div
      data-module-id={mod().id}
      data-layer-id={layer().id}
      class={`flex-shrink-0 flex flex-col border border-border bg-bg-secondary self-start overflow-hidden`}
      style={`width:${cardWidth()};min-width:${cardMinWidth()};max-width:${cardWidth()};border-width:0.5px;padding:14px`}
    >
      {/* Section title — white uppercase with underline, like PARTS DATA */}
      <div
        class="px-2 pt-0.5 pb-4 cursor-grab select-none"
        onMouseDown={(e) => {
          if (e.target.closest('button')) return;
          e.preventDefault();
          const card = e.target.closest('[data-module-id]');
          if (!card) return;
          let hoverTarget = null;
          card.style.opacity = '0.3';

          let indicator = document.createElement('div');
          indicator.style.cssText = 'position:absolute;width:1px;background:rgba(0,0,0,0.3);pointer-events:none;z-index:9999;transition:top 0.1s,left 0.1s,height 0.1s';
          document.body.appendChild(indicator);
          indicator.style.display = 'none';

          const onMove = (ev) => {
            card.style.pointerEvents = 'none';
            const el = document.elementFromPoint(ev.clientX, ev.clientY);
            card.style.pointerEvents = '';
            const target = el?.closest('[data-module-id]');
            if (target && target !== card && target.dataset.layerId === card.dataset.layerId) {
              hoverTarget = target;
              const rect = target.getBoundingClientRect();
              indicator.style.display = '';
              indicator.style.left = `${rect.left - 7}px`;
              indicator.style.top = `${rect.top}px`;
              indicator.style.height = `${rect.height}px`;
            } else {
              hoverTarget = null;
              indicator.style.display = 'none';
            }
          };

          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            card.style.opacity = '';
            indicator.remove();
            if (hoverTarget) {
              const fromId = card.dataset.moduleId;
              const toId = hoverTarget.dataset.moduleId;
              const mods = Object.values(layer().modules || {}).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
              const fromIdx = mods.findIndex(m => m.id === fromId);
              const toIdx = mods.findIndex(m => m.id === toId);
              if (fromIdx >= 0 && toIdx >= 0) {
                const order = mods.map(m => m.id);
                order.splice(fromIdx, 1);
                order.splice(toIdx, 0, fromId);
                order.forEach((id, i) => {
                  setSession('layers', layer().id, 'modules', id, 'seq', i);
                });
                fetch(`/layer/${layer().id}/reorder`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ order }),
                }).catch(e => console.warn('reorder failed', e));
              }
            }
          };

          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <div class="flex items-center justify-between gap-2">
          <span class="type-module border-none m-0 pb-0 text-text-primary truncate">
            {isBus() ? 'Main Mixer' : mod().name}
          </span>
          <Show when={!isBus()}>
            <button
              onClick={deleteModule}
              aria-label="Delete module"
              class="type-button bg-transparent border-none cursor-pointer leading-none opacity-40 hover:opacity-100 hover:text-danger transition-colors text-text-secondary"
              style="padding:2px 4px"
            >[x]</button>
          </Show>
        </div>
        <Show when={!isBus()}>
          <div class="flex items-center gap-2">
            <span class="type-tag text-label">{typeName()}</span>
            <Show when={isInst()}>
              <span class="type-tag text-label leading-none" style="opacity:0.7">[INST]</span>
            </Show>
          </div>
        </Show>
      </div>

      {/* ADSR special graph view */}
      <Show when={typeName() === 'adsr'}>
        <AdsrGraph
          attack={mod().params?.attack ?? 0.01}
          decay={mod().params?.decay ?? 0.1}
          sustain={mod().params?.sustain ?? 0.7}
          release={mod().params?.release ?? 0.3}
          onParam={(name, value) => scheduleParamPut(layer().id, mod().id, name, value)}
        />
      </Show>

      {/* Custom editor dispatch — oscillator/filter/LFO/etc. */}
      <Show when={typeName() !== 'adsr' && !isInst() && CUSTOM_EDITORS[typeName()]}>
        <Dynamic
          component={CUSTOM_EDITORS[typeName()]}
          type={typeName()}
          modId={mod().id}
          params={mod().params || {}}
          paramDefs={paramDefs()}
          inactiveChannels={isBus() ? new Set(Array.from({ length: 8 }, (_, i) => i).filter(i => !connectedInputs().has(`in_${i + 1}`))) : undefined}
          onParam={(name, value) => scheduleParamPut(layer().id, mod().id, name, value)}
        />
      </Show>

      {/* Fallback: generic bar-slider list */}
      <Show when={typeName() !== 'adsr' && !isInst() && !CUSTOM_EDITORS[typeName()] && Object.keys(paramDefs()).length > 0}>
        <div class="flex flex-col px-2 py-1 gap-3">
          <For each={Object.entries(paramDefs())}>
            {([pName, [min, max, def]]) => {
              const cur = () => {
                const v = mod().params?.[pName];
                return v !== undefined ? v : def;
              };
              return (
                <div class="flex flex-col" style="gap:1px">
                  <div class="flex justify-between items-baseline">
                    <span class="type-label data-label">{pName}:</span>
                    <span class="type-value data-value">{fmtVal(cur())}</span>
                  </div>
                  <BarSlider
                    min={min} max={max}
                    value={cur}
                    defaultValue={def}
                    onValue={(v) => scheduleParamPut(layer().id, mod().id, pName, v)}
                  />
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      {/* Scope canvas */}
      <Show when={typeName() === 'scope'}>
        <ScopeCanvas moduleId={mod().id} />
      </Show>

      {/* Sequencer grid */}
      <Show when={isInst()}>
        <SeqGrid
          modId={mod().id}
          layerId={layer().id}
          modType={typeName()}
          modParams={() => mod().params}
          params={() => mod().params}
          layer={layer}
        />
      </Show>

      {/* Output ports */}
      <Show when={outputs().length > 0}>
        <PortSection
          ports={outputs()}
          dir="output"
          connected={connectedOutputs()}
          moduleId={mod().id}
          layerId={layer().id}
          onPortClick={onPortClick}
        />
      </Show>

      {/* Input ports */}
      <Show when={inputs().length > 0}>
        <PortSection
          ports={inputs()}
          dir="input"
          connected={connectedInputs()}
          moduleId={mod().id}
          layerId={layer().id}
          onPortClick={onPortClick}
        />
      </Show>

    </div>
  );
}

// ── Port section (row of dots) ────────────────────────────────
function PortSection(props) {
  const label = () => props.dir === 'output' ? 'OUT' : 'IN';

  return (
    <div class={`px-2 ${props.dir === 'output' ? 'pt-6 pb-1' : 'pt-2 pb-2'}`}>
      <div class="flex flex-col gap-1">
        <For each={props.ports}>
          {(portName, i) => (
            <PortRow
              portName={portName}
              index={i()}
              dir={props.dir}
              dirLabel={label()}
              showLabel={i() === 0}
              moduleId={props.moduleId}
              layerId={props.layerId}
              connected={props.connected.has(portName)}
              onClick={() => props.onPortClick(portName, props.dir)}
            />
          )}
        </For>
      </div>
    </div>
  );
}

// ── Individual port row: OUT / port_name / [■] ───────────────
function PortRow(props) {
  const isOutput = () => props.dir === 'output';
  const dotBorder = () => props.connected ? 'var(--color-accent)' : 'var(--color-text-muted)';
  const dotFill = () => props.connected ? 'var(--color-accent)' : 'transparent';
  const isDropTarget = () => {
    const d = dragCable();
    return d && props.dir === 'input' && d.hoverModuleId === props.moduleId && d.hoverPort === props.index;
  };

  const onDotMouseDown = (e) => {
    if (props.dir !== 'output') return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.target.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    let moved = false;

    setDragCable({
      layerId: props.layerId,
      moduleId: props.moduleId,
      port: props.portName,
      startX, startY,
      curX: startX, curY: startY,
      hoverModuleId: null, hoverPort: null,
    });

    const onMove = (ev) => {
      moved = true;
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const portDot = el?.closest?.('.port-dot.input');
      setDragCable(prev => ({
        ...prev,
        curX: ev.clientX,
        curY: ev.clientY,
        hoverModuleId: portDot?.dataset?.moduleId || null,
        hoverPort: portDot ? portDot.dataset.port : null,
      }));
    };

    const onUp = async (ev) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const drag = dragCable();
      setDragCable(null);

      if (!moved) {
        props.onClick();
        return;
      }

      if (drag?.hoverModuleId && drag.hoverPort !== null) {
        const body = {
          from_module: drag.moduleId,
          from_port: drag.port,
          to_module: drag.hoverModuleId,
          to_port: drag.hoverPort,
        };
        const res = await fetch(`/layer/${drag.layerId}/patch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }).catch(e => { showPatchMsg(`Network error: ${e.message}`, 3000); return null; });
        if (res && !res.ok) {
          const e = await res.json().catch(() => ({}));
          showPatchMsg(`Error: ${e.error || res.status}`, 3000);
        }
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const arrow = () => isOutput() ? '>' : '<';

  return (
    <div
      class="flex items-center gap-2 cursor-pointer dc-port-row"
      onClick={props.onClick}
      title={`${props.dir}: ${props.portName}`}
    >
      <span class="type-port text-label leading-none" style="min-width:24px">
        {props.showLabel ? props.dirLabel : ''}
      </span>
      <span class="type-port text-text-muted leading-none" style="width:8px">
        {arrow()}
      </span>
      <span class="type-port data-label leading-none truncate flex-1">
        {props.portName}
      </span>
      <div
        class={`flex-shrink-0 cursor-pointer port-dot ${props.dir === 'input' ? '!rounded-full' : ''}`}
        classList={{ [props.dir]: true }}
        data-port={props.portName}
        data-module-id={props.moduleId}
        style={`width:10px;height:10px;border:1px solid ${isDropTarget() ? 'var(--color-success)' : dotBorder()};background:${isDropTarget() ? 'var(--color-accent)' : dotFill()};transition:background 80ms,border-color 80ms`}
        onMouseDown={onDotMouseDown}
      />
    </div>
  );
}
