import { createMemo, Show, For } from 'solid-js';
import Knob from './Knob';
import { meterLevels } from '../store';

// ── Palette ──────────────────────────────────────────────────
const CURVE = '#8899aa';
const CURVE_FILL = 'rgba(136,153,170,0.18)';
const GRID = 'rgba(136,153,170,0.12)';
const GRID_STRONG = 'rgba(136,153,170,0.22)';

// ── Shared helpers ───────────────────────────────────────────
const logNorm = (v, min, max) => {
  if (v <= 0) return 0;
  return (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min));
};
const logDenorm = (t, min, max) =>
  Math.exp(Math.log(min) + t * (Math.log(max) - Math.log(min)));
const linNorm = (v, min, max) => (v - min) / (max - min);
const linDenorm = (t, min, max) => min + t * (max - min);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const fmtHz = (v) =>
  v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${v.toFixed(0)}`;
const fmtHzFull = (v) => (v >= 1000 ? `${(v / 1000).toFixed(2)} kHz` : `${v.toFixed(0)} Hz`);
const fmtMs = (v) => (v >= 1 ? `${v.toFixed(2)}s` : `${(v * 1000).toFixed(0)}ms`);
const fmtPct = (v) => `${(v * 100).toFixed(0)}%`;
const fmtDb = (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`;

// ── Label alias map — no more slice(0,6) truncation ─────────
const LABELS = {
  attack: 'Atck', decay: 'Dcay', sustain: 'Sus', release: 'Rel',
  cutoff: 'Freq', frequency: 'Freq', formant_freq: 'Form',
  resonance: 'Reso', drive: 'Drive', emphasis: 'Emph',
  amplitude: 'Level', level: 'Level', waveform: 'Wave',
  pulse_width: 'PW', detune: 'Dtun', spread: 'Sprd',
  mod_index: 'Mod', mod_freq: 'Mod Hz', carrier_freq: 'Carr',
  feedback: 'Fdbk', threshold: 'Thrsh', ratio: 'Ratio',
  knee: 'Knee', makeup: 'Makup', time: 'Time', mix: 'Mix',
  filter: 'Filt', symmetry: 'Sym', stages: 'Stgs',
  bits: 'Bits', sample_rate_div: 'Rate', bias: 'Bias', tone: 'Tone',
  damping: 'Damp', size: 'Size', pre_delay: 'PreDly', decay_time: 'Dcay',
  depth: 'Depth', rate: 'Rate', voices: 'Vcs', width: 'Wdth',
  pan: 'Pan', center: 'Cntr', rise: 'Rise', fall: 'Fall', shape: 'Shape',
  root: 'Root', scale: 'Scale', glide: 'Glide', amount: 'Amt',
  offset: 'Ofs', division: 'Div', pulse: 'Pulse', bpm: 'BPM',
  length: 'Len', swing: 'Swing', direction: 'Dir',
  density: 'Dens', pitch_spread: 'Pitch', attack_ms: 'Atck',
  release_ms: 'Rel', base_grain_ms: 'Grain',
};
const labelFor = (k) => LABELS[k] || (k.length > 6 ? k.slice(0, 6) : k);

// ── KnobCell: knob + labels + drag tooltip ─────────────────
function KnobCell(props) {
  return (
    <div class="flex flex-col items-center" style="min-width:44px;gap:1px">
      <Knob
        value={props.value}
        onChange={props.onChange}
        defaultValue={props.defaultValue}
        display={props.display}
      />
      <span class="type-port text-text-secondary" style="font-size:8px;letter-spacing:0.02em">{props.label}</span>
      <span
        class="type-port text-label"
        style="font-variant-numeric:tabular-nums;font-size:9px"
      >
        {props.display}
      </span>
    </div>
  );
}

// ── Grid helpers for graphs ──────────────────────────────────
function LogFreqGrid(props) {
  const ticks = [100, 1000, 10000];
  const minor = [50, 200, 500, 2000, 5000];
  const F_MIN = 20, F_MAX = 20000;
  const x = (f) => props.padX + logNorm(f, F_MIN, F_MAX) * props.w;
  return (
    <g>
      <For each={minor}>
        {(f) => (
          <line
            x1={x(f)} y1={props.padY}
            x2={x(f)} y2={props.padY + props.h}
            stroke={GRID} stroke-width="0.5"
            stroke-dasharray="2,2"
          />
        )}
      </For>
      <For each={ticks}>
        {(f) => (
          <>
            <line
              x1={x(f)} y1={props.padY}
              x2={x(f)} y2={props.padY + props.h}
              stroke={GRID_STRONG} stroke-width="0.5"
              stroke-dasharray="2,2"
            />
            <text
              x={x(f)} y={props.padY + props.h - 2}
              fill="rgba(136,153,170,0.5)"
              font-size="7"
              font-family="ui-monospace,monospace"
              text-anchor="middle"
            >{f >= 1000 ? `${f / 1000}k` : `${f}`}</text>
          </>
        )}
      </For>
    </g>
  );
}

// Hover-ring wrapper for draggable graph nodes.
function GraphNode(props) {
  return (
    <g>
      <circle
        cx={props.cx} cy={props.cy} r="10"
        fill="transparent"
        style={`cursor:${props.cursor || 'grab'}`}
        onMouseDown={props.onMouseDown}
      />
      <circle
        cx={props.cx} cy={props.cy} r="5"
        fill="#141414"
        stroke={CURVE}
        stroke-width="1.5"
        style="pointer-events:none"
      />
      <circle
        cx={props.cx} cy={props.cy} r="8"
        fill="none"
        stroke={CURVE}
        stroke-width="1"
        opacity="0"
        style="pointer-events:none"
        class="graph-node-ring"
      />
    </g>
  );
}

// ── Filter editor ─────────────────────────────────────────────
const FILTER_TYPES = [
  { id: 0, label: 'LP' },
  { id: 1, label: 'HP' },
  { id: 2, label: 'BP' },
];

const WAVE_TYPES = [
  { id: 0, label: 'SIN' },
  { id: 1, label: 'TRI' },
  { id: 2, label: 'SQR' },
  { id: 3, label: 'SAW' },
];

function ButtonRow(props) {
  return (
    <div class="flex justify-center gap-1">
      <For each={props.options}>
        {(o) => (
          <button
            class="type-port px-2 py-0.5 border-none cursor-pointer"
            style={`font-size:9px;background:${props.value === o.id ? CURVE : 'transparent'};color:${props.value === o.id ? '#141414' : 'rgba(136,153,170,0.7)'};border:0.5px solid ${GRID_STRONG}`}
            onClick={() => props.onChange(o.id)}
          >
            {o.label}
          </button>
        )}
      </For>
    </div>
  );
}

export function FilterEditor(props) {
  const W = 280, H = 96, PAD = 8;
  const GW = W - PAD * 2, GH = H - PAD * 2;
  const F_MIN = 20, F_MAX = 20000;

  const cutoffKey = () => {
    const d = props.paramDefs || {};
    if ('cutoff' in d) return 'cutoff';
    if ('frequency' in d) return 'frequency';
    if ('formant_freq' in d) return 'formant_freq';
    return 'cutoff';
  };

  const cutoff = () => props.params?.[cutoffKey()] ?? 1000;
  const reso = () => props.params?.resonance ?? 0;
  const drive = () => props.params?.drive ?? props.params?.emphasis ?? 0;
  const ftype = () => Math.round(props.params?.type ?? 0);

  const curvePath = createMemo(() => {
    const fc = cutoff();
    const q = Math.max(0.05, 1 - reso() * 0.95);
    const mode = ftype();
    const pts = [];
    const N = 100;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const f = logDenorm(t, F_MIN, F_MAX);
      const x = f / fc;
      let mag = 1;
      if (mode === 0) mag = 1 / Math.sqrt(Math.pow(1 - x * x, 2) + Math.pow(x * q, 2));
      else if (mode === 1) mag = (x * x) / Math.sqrt(Math.pow(1 - x * x, 2) + Math.pow(x * q, 2));
      else mag = (x * q) / Math.sqrt(Math.pow(1 - x * x, 2) + Math.pow(x * q, 2));
      const db = 20 * Math.log10(Math.max(0.001, mag));
      const dbClamped = Math.max(-40, Math.min(18, db));
      const xPx = PAD + t * GW;
      const yPx = PAD + ((18 - dbClamped) / 58) * GH;
      pts.push([xPx, yPx]);
    }
    return 'M' + pts.map((p) => p.join(',')).join(' L');
  });

  const fillPath = createMemo(() =>
    `${curvePath()} L${PAD + GW},${PAD + GH} L${PAD},${PAD + GH} Z`);

  const nodePos = () => {
    const x = PAD + logNorm(cutoff(), F_MIN, F_MAX) * GW;
    const y = PAD + (1 - clamp01(reso())) * GH * 0.8 + GH * 0.1;
    return { x, y };
  };

  const onNodeDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const svg = e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    const onMove = (ev) => {
      const mx = ((ev.clientX - rect.left) / rect.width) * W;
      const my = ((ev.clientY - rect.top) / rect.height) * H;
      const tx = clamp01((mx - PAD) / GW);
      const ty = clamp01((my - PAD) / GH);
      props.onParam(cutoffKey(), logDenorm(tx, F_MIN, F_MAX));
      if (props.paramDefs?.resonance) {
        props.onParam('resonance', clamp01(1 - (ty - 0.1) / 0.8));
      }
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="cursor:crosshair;height:auto">
        <LogFreqGrid padX={PAD} padY={PAD} w={GW} h={GH} />
        <line x1={PAD} y1={PAD + GH * 0.31} x2={PAD + GW} y2={PAD + GH * 0.31} stroke={GRID} stroke-width="0.5" />
        <path d={fillPath()} fill={CURVE_FILL} />
        <path
          d={curvePath()}
          fill="none"
          stroke={CURVE}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <Show when={props.paramDefs?.resonance}>
          <GraphNode cx={nodePos().x} cy={nodePos().y} onMouseDown={onNodeDown} cursor="move" />
        </Show>
      </svg>
      <Show when={props.paramDefs?.type}>
        <div class="mt-1">
          <ButtonRow options={FILTER_TYPES} value={ftype()} onChange={(id) => props.onParam('type', id)} />
        </div>
      </Show>
      <div class="flex justify-around mt-2 px-1">
        <KnobCell
          label="Freq"
          value={logNorm(cutoff(), F_MIN, F_MAX)}
          onChange={(v) => props.onParam(cutoffKey(), logDenorm(v, F_MIN, F_MAX))}
          display={fmtHzFull(cutoff())}
          defaultValue={logNorm(1000, F_MIN, F_MAX)}
        />
        <Show when={props.paramDefs?.resonance}>
          <KnobCell
            label="Reso"
            value={clamp01(reso())}
            onChange={(v) => props.onParam('resonance', v)}
            display={fmtPct(clamp01(reso()))}
            defaultValue={0.3}
          />
        </Show>
        <Show when={props.paramDefs?.drive}>
          <KnobCell
            label="Drive"
            value={linNorm(drive(), props.paramDefs.drive[0], props.paramDefs.drive[1])}
            onChange={(v) => props.onParam('drive', linDenorm(v, props.paramDefs.drive[0], props.paramDefs.drive[1]))}
            display={drive().toFixed(2)}
            defaultValue={linNorm(props.paramDefs.drive[2], props.paramDefs.drive[0], props.paramDefs.drive[1])}
          />
        </Show>
        <Show when={props.paramDefs?.emphasis}>
          <KnobCell
            label="Emph"
            value={clamp01(props.params?.emphasis ?? 0)}
            onChange={(v) => props.onParam('emphasis', v)}
            display={fmtPct(clamp01(props.params?.emphasis ?? 0))}
          />
        </Show>
      </div>
    </div>
  );
}

// ── Oscillator editor ────────────────────────────────────────
export function OscillatorEditor(props) {
  const W = 280, H = 60, PAD = 8;
  const GW = W - PAD * 2, GH = H - PAD * 2;
  const F_MIN = 20, F_MAX = 20000;

  const freqKey = () => {
    const d = props.paramDefs || {};
    if ('frequency' in d) return 'frequency';
    if ('carrier_freq' in d) return 'carrier_freq';
    return 'frequency';
  };

  const freq = () => props.params?.[freqKey()] ?? 440;
  const amp = () => props.params?.amplitude ?? 0.5;
  const wave = () => Math.round(props.params?.waveform ?? 0);
  const pwm = () => props.params?.pulse_width ?? 0.5;
  const detune = () => props.params?.detune ?? 0;
  const spread = () => props.params?.spread ?? 0;
  const modIdx = () => props.params?.mod_index ?? 0;
  const feedback = () => props.params?.feedback ?? 0;

  const previewPath = createMemo(() => {
    const N = 140;
    const pts = [];
    const w = wave();
    const pw = pwm();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let y = 0;
      if (props.type === 'pwm_oscillator') {
        y = t < pw ? 1 : -1;
      } else if (props.type === 'supersaw') {
        const d = detune() * 0.02;
        y = 0.5 * ((2 * ((t + d) % 1) - 1) + (2 * ((t - d + 1) % 1) - 1));
      } else if (props.type === 'fm_operator') {
        const m = Math.sin(t * Math.PI * 2 * 3);
        y = Math.sin(t * Math.PI * 2 + m * modIdx());
      } else if (w === 0) y = Math.sin(t * Math.PI * 2);
      else if (w === 1) y = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
      else if (w === 2) y = t < 0.5 ? 1 : -1;
      else y = 2 * t - 1;
      const x = PAD + t * GW;
      const py = PAD + GH / 2 - y * (GH / 2) * 0.9;
      pts.push([x, py]);
    }
    return 'M' + pts.map((p) => p.join(',')).join(' L');
  });

  const fillPath = createMemo(() =>
    `${previewPath()} L${PAD + GW},${PAD + GH / 2} L${PAD},${PAD + GH / 2} Z`);

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="height:auto">
        <line x1={PAD} y1={PAD + GH / 2} x2={PAD + GW} y2={PAD + GH / 2} stroke={GRID_STRONG} stroke-width="0.5" />
        <line x1={PAD} y1={PAD + GH * 0.1} x2={PAD + GW} y2={PAD + GH * 0.1} stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3" />
        <line x1={PAD} y1={PAD + GH * 0.9} x2={PAD + GW} y2={PAD + GH * 0.9} stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3" />
        <path d={fillPath()} fill={CURVE_FILL} />
        <path
          d={previewPath()}
          fill="none"
          stroke={CURVE}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <Show when={props.paramDefs?.waveform}>
        <div class="mt-1">
          <ButtonRow options={WAVE_TYPES} value={wave()} onChange={(id) => props.onParam('waveform', id)} />
        </div>
      </Show>
      <div class="flex justify-around mt-2 px-1 flex-wrap" style="gap:4px">
        <KnobCell
          label="Freq"
          value={logNorm(freq(), F_MIN, F_MAX)}
          onChange={(v) => props.onParam(freqKey(), logDenorm(v, F_MIN, F_MAX))}
          display={fmtHzFull(freq())}
          defaultValue={logNorm(440, F_MIN, F_MAX)}
        />
        <Show when={props.paramDefs?.amplitude}>
          <KnobCell
            label="Level"
            value={clamp01(amp())}
            onChange={(v) => props.onParam('amplitude', v)}
            display={fmtPct(clamp01(amp()))}
            defaultValue={0.5}
          />
        </Show>
        <Show when={props.paramDefs?.pulse_width}>
          <KnobCell
            label="PW"
            value={clamp01(pwm())}
            onChange={(v) => props.onParam('pulse_width', v)}
            display={fmtPct(clamp01(pwm()))}
            defaultValue={0.5}
          />
        </Show>
        <Show when={props.paramDefs?.detune}>
          <KnobCell
            label="Dtun"
            value={linNorm(detune(), props.paramDefs.detune[0], props.paramDefs.detune[1])}
            onChange={(v) => props.onParam('detune', linDenorm(v, props.paramDefs.detune[0], props.paramDefs.detune[1]))}
            display={detune().toFixed(2)}
          />
        </Show>
        <Show when={props.paramDefs?.spread}>
          <KnobCell
            label="Sprd"
            value={clamp01(spread())}
            onChange={(v) => props.onParam('spread', v)}
            display={fmtPct(clamp01(spread()))}
          />
        </Show>
        <Show when={props.paramDefs?.mod_index}>
          <KnobCell
            label="Mod"
            value={linNorm(modIdx(), props.paramDefs.mod_index[0], props.paramDefs.mod_index[1])}
            onChange={(v) => props.onParam('mod_index', linDenorm(v, props.paramDefs.mod_index[0], props.paramDefs.mod_index[1]))}
            display={modIdx().toFixed(2)}
          />
        </Show>
        <Show when={props.paramDefs?.feedback}>
          <KnobCell
            label="Fdbk"
            value={clamp01(feedback())}
            onChange={(v) => props.onParam('feedback', v)}
            display={fmtPct(clamp01(feedback()))}
          />
        </Show>
      </div>
    </div>
  );
}

// ── Tempo-sync helper (shared by LFO + Delay) ───────────────
const SYNC_DIVISIONS = [
  { label: '1/4',  beats: 1 },
  { label: '1/8',  beats: 0.5 },
  { label: '1/8D', beats: 0.75 },
  { label: '1/8T', beats: 1 / 3 },
  { label: '1/16', beats: 0.25 },
  { label: '1/32', beats: 0.125 },
];

// ── LFO editor ───────────────────────────────────────────────
export function LfoEditor(props) {
  const W = 280, H = 60, PAD = 8;
  const GW = W - PAD * 2, GH = H - PAD * 2;
  const rate = () => props.params?.rate ?? 1;
  const depth = () => props.params?.depth ?? 0.5;
  const wave = () => Math.round(props.params?.waveform ?? 0);

  const previewPath = createMemo(() => {
    const N = 140;
    const pts = [];
    const w = wave();
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let y = 0;
      if (w === 0) y = Math.sin(t * Math.PI * 2);
      else if (w === 1) y = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
      else if (w === 2) y = t < 0.5 ? 1 : -1;
      else y = 1 - 2 * t;
      y *= clamp01(depth());
      const x = PAD + t * GW;
      const py = PAD + GH / 2 - y * (GH / 2) * 0.9;
      pts.push([x, py]);
    }
    return 'M' + pts.map((p) => p.join(',')).join(' L');
  });

  const fillPath = createMemo(() =>
    `${previewPath()} L${PAD + GW},${PAD + GH / 2} L${PAD},${PAD + GH / 2} Z`);

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="height:auto">
        <line x1={PAD} y1={PAD + GH / 2} x2={PAD + GW} y2={PAD + GH / 2} stroke={GRID_STRONG} stroke-width="0.5" />
        <path d={fillPath()} fill={CURVE_FILL} />
        <path
          d={previewPath()}
          fill="none"
          stroke={CURVE}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <Show when={props.paramDefs?.waveform}>
        <div class="mt-1">
          <ButtonRow options={WAVE_TYPES} value={wave()} onChange={(id) => props.onParam('waveform', id)} />
        </div>
      </Show>
      <div class="flex justify-around mt-2 px-1">
        <KnobCell
          label="Rate"
          value={logNorm(Math.max(0.01, rate()), 0.01, 50)}
          onChange={(v) => props.onParam('rate', logDenorm(v, 0.01, 50))}
          display={`${rate().toFixed(2)} Hz`}
          defaultValue={logNorm(1, 0.01, 50)}
        />
        <KnobCell
          label="Depth"
          value={clamp01(depth())}
          onChange={(v) => props.onParam('depth', v)}
          display={fmtPct(clamp01(depth()))}
          defaultValue={0.5}
        />
      </div>
    </div>
  );
}

// ── Compressor editor ────────────────────────────────────────
export function CompressorEditor(props) {
  const W = 280, H = 110, PAD = 8;
  const GW = W - PAD * 2, GH = H - PAD * 2;
  const DB_LO = -60, DB_HI = 6;

  const thresh = () => props.params?.threshold ?? -24;
  const ratio = () => props.params?.ratio ?? 4;
  const knee = () => props.params?.knee ?? 6;
  const attack = () => props.params?.attack ?? 0.005;
  const release = () => props.params?.release ?? 0.1;
  const makeup = () => props.params?.makeup ?? 0;

  const curvePath = createMemo(() => {
    const T = thresh();
    const R = Math.max(1, ratio());
    const K = Math.max(0.001, knee());
    const pts = [];
    const N = 100;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const inDb = DB_LO + t * (DB_HI - DB_LO);
      let outDb;
      const x = inDb - T;
      if (x < -K / 2) outDb = inDb;
      else if (x > K / 2) outDb = T + (inDb - T) / R;
      else outDb = inDb + (((1 / R) - 1) * (x + K / 2) * (x + K / 2)) / (2 * K);
      outDb += makeup();
      const px = PAD + ((inDb - DB_LO) / (DB_HI - DB_LO)) * GW;
      const py = PAD + (1 - (outDb - DB_LO) / (DB_HI - DB_LO)) * GH;
      pts.push([px, py]);
    }
    return 'M' + pts.map((p) => p.join(',')).join(' L');
  });

  const fillPath = createMemo(() =>
    `${curvePath()} L${PAD + GW},${PAD + GH} L${PAD},${PAD + GH} Z`);

  const threshNode = () => {
    const x = PAD + ((thresh() - DB_LO) / (DB_HI - DB_LO)) * GW;
    const y = PAD + (1 - (thresh() - DB_LO) / (DB_HI - DB_LO)) * GH;
    return { x, y };
  };

  const onThreshDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const svg = e.currentTarget.closest('svg');
    const rect = svg.getBoundingClientRect();
    const onMove = (ev) => {
      const mx = ((ev.clientX - rect.left) / rect.width) * W;
      const tx = clamp01((mx - PAD) / GW);
      const db = DB_LO + tx * (DB_HI - DB_LO);
      props.onParam('threshold', Math.max(-60, Math.min(0, db)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Horizontal dashed guides at -40/-20/0 dB
  const dbY = (db) => PAD + (1 - (db - DB_LO) / (DB_HI - DB_LO)) * GH;
  const dbX = (db) => PAD + ((db - DB_LO) / (DB_HI - DB_LO)) * GW;

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="cursor:default;height:auto">
        {/* dB grid */}
        <For each={[-40, -20, 0]}>
          {(db) => (
            <g>
              <line
                x1={PAD} y1={dbY(db)}
                x2={PAD + GW} y2={dbY(db)}
                stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3"
              />
              <line
                x1={dbX(db)} y1={PAD}
                x2={dbX(db)} y2={PAD + GH}
                stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3"
              />
            </g>
          )}
        </For>
        {/* unity line (y = x + makeup) */}
        <line
          x1={PAD} y1={PAD + GH}
          x2={PAD + GW} y2={PAD}
          stroke={GRID_STRONG} stroke-width="0.5"
        />
        <path d={fillPath()} fill={CURVE_FILL} />
        <path
          d={curvePath()}
          fill="none"
          stroke={CURVE}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <GraphNode cx={threshNode().x} cy={threshNode().y} onMouseDown={onThreshDown} cursor="ew-resize" />
      </svg>
      <div
        class="grid mt-2 px-1"
        style="grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 6px;justify-items:center"
      >
        <KnobCell
          label="Thrsh"
          value={linNorm(thresh(), -60, 0)}
          onChange={(v) => props.onParam('threshold', linDenorm(v, -60, 0))}
          display={fmtDb(thresh())}
          defaultValue={linNorm(-24, -60, 0)}
        />
        <KnobCell
          label="Ratio"
          value={linNorm(Math.log(Math.max(1, ratio())), 0, Math.log(20))}
          onChange={(v) => props.onParam('ratio', Math.exp(v * Math.log(20)))}
          display={`${ratio().toFixed(1)}:1`}
          defaultValue={linNorm(Math.log(4), 0, Math.log(20))}
        />
        <KnobCell
          label="Knee"
          value={linNorm(knee(), 0, 24)}
          onChange={(v) => props.onParam('knee', linDenorm(v, 0, 24))}
          display={`${knee().toFixed(1)} dB`}
          defaultValue={linNorm(6, 0, 24)}
        />
        <KnobCell
          label="Atck"
          value={logNorm(Math.max(0.0001, attack()), 0.0001, 1)}
          onChange={(v) => props.onParam('attack', logDenorm(v, 0.0001, 1))}
          display={fmtMs(attack())}
          defaultValue={logNorm(0.005, 0.0001, 1)}
        />
        <KnobCell
          label="Rel"
          value={logNorm(Math.max(0.001, release()), 0.001, 5)}
          onChange={(v) => props.onParam('release', logDenorm(v, 0.001, 5))}
          display={fmtMs(release())}
          defaultValue={logNorm(0.1, 0.001, 5)}
        />
        <KnobCell
          label="Makup"
          value={linNorm(makeup(), 0, 24)}
          onChange={(v) => props.onParam('makeup', linDenorm(v, 0, 24))}
          display={fmtDb(makeup())}
          defaultValue={linNorm(0, 0, 24)}
        />
      </div>
    </div>
  );
}

// ── Channel strip (mixer, cv_mixer) ──────────────────────────
export function ChannelStrip(props) {
  const levelKeys = () =>
    Object.keys(props.paramDefs || {}).filter((k) => k.startsWith('level_'));

  // Per-layer mixer meter: reuse meterLevels (keyed by this module's id)
  const meterFor = (idx) => {
    const entry = meterLevels()[props.modId];
    if (!entry) return 0;
    // Main mixer entry is an array [rms, pitch]; per-channel data not exposed
    // yet. Use aggregate rms, scaled by per-channel level, as a proxy.
    const rms = Array.isArray(entry) ? entry[0] : entry;
    const key = `level_${idx + 1}`;
    const lvl = props.params?.[key] ?? 0;
    return clamp01(rms * (1 + lvl));
  };

  const onFaderDown = (key, def, e) => {
    e.preventDefault();
    const max = def[1];
    const min = def[0];
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const set = (clientY) => {
      const t = 1 - clamp01((clientY - rect.top) / rect.height);
      props.onParam(key, min + t * (max - min));
    };
    set(e.clientY);
    const onMove = (ev) => set(ev.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div class="px-2 py-2">
      <div class="flex justify-between items-end gap-1" style="height:120px">
        <For each={levelKeys()}>
          {(key, i) => {
            const def = props.paramDefs[key];
            const cur = () => props.params?.[key] ?? def[2];
            const pct = () => clamp01((cur() - def[0]) / (def[1] - def[0]));
            const inactive = () => props.inactiveChannels?.has(i()) ?? false;
            return (
              <div
                class="flex flex-col items-center"
                style={`flex:1;opacity:${inactive() ? 0.3 : 1}`}
                title={inactive() ? 'No input connected' : `channel ${i() + 1}`}
              >
                <div class="flex items-end gap-0.5">
                  <div
                    class="relative"
                    style="width:10px;height:92px;background:rgba(136,153,170,0.2);cursor:ns-resize"
                    onMouseDown={(e) => onFaderDown(key, def, e)}
                    onDblClick={() => props.onParam(key, def[2])}
                    onContextMenu={(e) => { e.preventDefault(); props.onParam(key, def[2]); }}
                  >
                    <div
                      class="absolute bottom-0 left-0 w-full pointer-events-none"
                      style={`height:${pct() * 100}%;background:${CURVE}`}
                    />
                  </div>
                  {/* Peak meter column */}
                  <div
                    class="relative"
                    style="width:3px;height:92px;background:rgba(136,153,170,0.1);pointer-events:none"
                  >
                    <div
                      class="absolute bottom-0 left-0 w-full"
                      style={`height:${meterFor(i()) * 100}%;background:${CURVE};transition:height 0.08s linear`}
                    />
                  </div>
                </div>
                <span class="type-port text-text-secondary mt-1" style="font-size:8px">{i() + 1}</span>
                <span
                  class="type-port text-label"
                  style="font-size:8px;font-variant-numeric:tabular-nums"
                >{cur().toFixed(2)}</span>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
}

// ── Delay editor ─────────────────────────────────────────────
export function DelayEditor(props) {
  const W = 280, H = 60, PAD = 8;
  const GW = W - PAD * 2, GH = H - PAD * 2;
  const time = () => props.params?.time ?? 250;
  const fb = () => props.params?.feedback ?? 0.3;
  const mix = () => props.params?.mix ?? 0.3;
  const filter = () => props.params?.filter ?? 1;

  const taps = createMemo(() => {
    const out = [];
    let amp = 1;
    const maxTaps = 8;
    for (let i = 0; i < maxTaps; i++) {
      if (amp < 0.02) break;
      out.push({ t: (i + 1) / (maxTaps + 1), amp });
      amp *= clamp01(fb()) * 0.95;
    }
    return out;
  });

  const fmtTime = (ms) =>
    ms < 1000 ? `${ms.toFixed(0)} ms` : `${(ms / 1000).toFixed(2)} s`;

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="height:auto">
        <line
          x1={PAD} y1={PAD + GH / 2}
          x2={PAD + GW} y2={PAD + GH / 2}
          stroke={GRID} stroke-width="0.5"
        />
        <g style="pointer-events:none">
          <For each={taps()}>
            {(tap) => {
              const x = PAD + tap.t * GW;
              const h = tap.amp * GH * 0.9;
              const y = PAD + (GH - h) / 2;
              return (
                <line
                  x1={x} y1={y} x2={x} y2={y + h}
                  stroke={CURVE} stroke-width="1.5"
                  stroke-linecap="round"
                  opacity={0.3 + tap.amp * 0.7}
                />
              );
            }}
          </For>
        </g>
      </svg>
      <div class="flex justify-around mt-2 px-1 flex-wrap" style="gap:4px">
        <KnobCell
          label="Time"
          value={logNorm(Math.max(0.1, time()), 0.1, 5000)}
          onChange={(v) => props.onParam('time', logDenorm(v, 0.1, 5000))}
          display={fmtTime(time())}
          defaultValue={logNorm(250, 0.1, 5000)}
        />
        <KnobCell
          label="Fdbk"
          value={clamp01(fb())}
          onChange={(v) => props.onParam('feedback', v * 0.99)}
          display={fmtPct(clamp01(fb()))}
          defaultValue={0.3}
        />
        <Show when={props.paramDefs?.filter}>
          <KnobCell
            label="Filt"
            value={clamp01(filter())}
            onChange={(v) => props.onParam('filter', v)}
            display={fmtPct(clamp01(filter()))}
            defaultValue={1}
          />
        </Show>
        <KnobCell
          label="Mix"
          value={clamp01(mix())}
          onChange={(v) => props.onParam('mix', v)}
          display={fmtPct(clamp01(mix()))}
          defaultValue={0.3}
        />
      </div>
    </div>
  );
}

// ── Shaper editor (wavefolder, ring_mod, bitcrusher, tape_saturation) ──
export function ShaperEditor(props) {
  const W = 280, H = 80, PAD = 8;
  const GW = W - PAD * 2, GH = H - PAD * 2;

  // Live input-level dot: reuse meterLevels if this module is metered.
  const liveLevel = () => {
    const entry = meterLevels()[props.modId];
    if (!entry) return null;
    const rms = Array.isArray(entry) ? entry[0] : entry;
    return clamp01(rms);
  };

  const shape = (x) => {
    const drive = props.params?.drive ?? 1;
    const sym = props.params?.symmetry ?? 0;
    const bits = props.params?.bits ?? 16;
    const bias = props.params?.bias ?? 0;
    let y = x;
    if (props.type === 'wavefolder') {
      let s = (x + sym) * drive;
      s = s - 4 * Math.floor((s + 1) / 4);
      y = Math.max(-1, Math.min(1, -(Math.abs(s - 2) - 1)));
    } else if (props.type === 'bitcrusher') {
      const steps = Math.pow(2, Math.max(1, bits));
      y = Math.round(x * steps / 2) / (steps / 2);
    } else if (props.type === 'tape_saturation') {
      y = Math.tanh((x + bias) * (1 + drive));
    } else if (props.type === 'ring_mod') {
      y = x * Math.sin(x * Math.PI * 2);
    } else {
      y = Math.tanh(x * drive);
    }
    return Math.max(-1, Math.min(1, y));
  };

  const curvePath = createMemo(() => {
    const pts = [];
    const N = 100;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = t * 2 - 1;
      const y = shape(x);
      const px = PAD + t * GW;
      const py = PAD + (1 - (y + 1) / 2) * GH;
      pts.push([px, py]);
    }
    return 'M' + pts.map((p) => p.join(',')).join(' L');
  });

  const liveDot = () => {
    const lvl = liveLevel();
    if (lvl === null) return null;
    const x = lvl;
    const y = shape(x);
    return {
      cx: PAD + ((x + 1) / 2) * GW,
      cy: PAD + (1 - (y + 1) / 2) * GH,
    };
  };

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="height:auto">
        {/* Quadrant guides */}
        <line x1={PAD + GW / 2} y1={PAD} x2={PAD + GW / 2} y2={PAD + GH} stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3" />
        <line x1={PAD} y1={PAD + GH / 2} x2={PAD + GW} y2={PAD + GH / 2} stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3" />
        {/* unity (y=x) diagonal */}
        <line x1={PAD} y1={PAD + GH} x2={PAD + GW} y2={PAD} stroke={GRID_STRONG} stroke-width="0.5" />
        <path
          d={curvePath()}
          fill="none"
          stroke={CURVE}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <Show when={liveDot()}>
          <circle cx={liveDot().cx} cy={liveDot().cy} r="3" fill="#ffdd88" />
        </Show>
      </svg>
      <div
        class="grid mt-2 px-1"
        style="grid-template-columns:repeat(3,minmax(0,1fr));gap:4px 6px;justify-items:center"
      >
        <For each={Object.entries(props.paramDefs || {})}>
          {([k, def]) => {
            const cur = () => props.params?.[k] ?? def[2];
            return (
              <KnobCell
                label={labelFor(k)}
                value={linNorm(cur(), def[0], def[1])}
                onChange={(v) => props.onParam(k, linDenorm(v, def[0], def[1]))}
                defaultValue={linNorm(def[2], def[0], def[1])}
                display={cur().toFixed(2)}
              />
            );
          }}
        </For>
      </div>
    </div>
  );
}

// ── Group map for KnobPanel sections (reverb etc.) ───────────
const PARAM_GROUPS = {
  reverb: {
    Space: ['size', 'decay', 'decay_time', 'pre_delay'],
    Tone:  ['damping', 'tone', 'filter'],
    Mix:   ['mix', 'level'],
  },
  chorus:  { Modulation: ['rate', 'depth', 'voices'], Mix: ['mix', 'feedback'] },
  flanger: { Modulation: ['rate', 'depth', 'feedback'], Mix: ['mix'] },
  phaser:  { Modulation: ['rate', 'depth', 'stages'], Tone: ['center', 'feedback'], Mix: ['mix'] },
};

// ── Generic knob panel (reverb, chorus, utilities, …) ────────
export function KnobPanel(props) {
  const groups = () => PARAM_GROUPS[props.type];
  const allKeys = () => Object.keys(props.paramDefs || {});

  const renderKnob = (k) => {
    const def = props.paramDefs?.[k];
    if (!def) return null;
    const cur = () => props.params?.[k] ?? def[2];
    // Render waveform as a button row, not a knob
    if (k === 'waveform') {
      return (
        <div style="grid-column:1/-1;width:100%">
          <ButtonRow
            options={WAVE_TYPES}
            value={Math.round(cur())}
            onChange={(id) => props.onParam(k, id)}
          />
        </div>
      );
    }
    return (
      <KnobCell
        label={labelFor(k)}
        value={linNorm(cur(), def[0], def[1])}
        onChange={(v) => props.onParam(k, linDenorm(v, def[0], def[1]))}
        defaultValue={linNorm(def[2], def[0], def[1])}
        display={cur().toFixed(2)}
      />
    );
  };

  return (
    <div class="px-2 py-2">
      <Show
        when={groups()}
        fallback={
          <div
            class="grid px-1"
            style="grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;justify-items:center"
          >
            <For each={allKeys()}>{(k) => renderKnob(k)}</For>
          </div>
        }
      >
        <For each={Object.entries(groups())}>
          {([section, keys]) => {
            const present = () => keys.filter((k) => k in (props.paramDefs || {}));
            return (
              <Show when={present().length > 0}>
                <div class="mb-2">
                  <div
                    class="type-port text-text-secondary mb-1 px-1"
                    style="font-size:8px;letter-spacing:0.18em;opacity:0.7"
                  >
                    {section.toUpperCase()}
                  </div>
                  <div
                    class="grid px-1"
                    style="grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;justify-items:center"
                  >
                    <For each={present()}>{(k) => renderKnob(k)}</For>
                  </div>
                </div>
              </Show>
            );
          }}
        </For>
        {/* Uncategorized leftovers */}
        <Show
          when={
            allKeys().filter(
              (k) => !Object.values(groups()).flat().includes(k)
            ).length > 0
          }
        >
          <div
            class="grid px-1 pt-1"
            style="grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;justify-items:center;border-top:0.5px solid rgba(136,153,170,0.12)"
          >
            <For
              each={allKeys().filter(
                (k) => !Object.values(groups()).flat().includes(k)
              )}
            >
              {(k) => renderKnob(k)}
            </For>
          </div>
        </Show>
      </Show>
    </div>
  );
}
