import { createSignal, For } from 'solid-js';
import { moduleTypes, wasmTypes } from '../store';

// Mirrors the MechaV2 taxonomy — fam determines color, shape determines glyph.
const ML = {
  mixer:        { fam:'core',    shape:'rect' },
  oscillator:   { fam:'audio',   shape:'circle' },
  pwm_oscillator:{ fam:'audio',  shape:'circle' },
  fm_operator:  { fam:'audio',   shape:'circle' },
  supersaw:     { fam:'audio',   shape:'circle' },
  wavetable:    { fam:'audio',   shape:'circle' },
  additive_osc: { fam:'audio',   shape:'circle' },
  phase_distortion:{ fam:'audio',shape:'circle' },
  noise_gen:    { fam:'audio',   shape:'circle' },
  filter:       { fam:'audio',   shape:'rect'   },
  svf:          { fam:'audio',   shape:'rect'   },
  moog_filter:  { fam:'audio',   shape:'rect'   },
  ms20_filter:  { fam:'audio',   shape:'rect'   },
  formant_filter:{ fam:'audio',  shape:'rect'   },
  comb_filter:  { fam:'audio',   shape:'rect'   },
  adsr:         { fam:'control', shape:'rect'   },
  lfo:          { fam:'control', shape:'circle' },
  envelope_follower:{ fam:'control', shape:'rect' },
  slew_limiter: { fam:'control', shape:'circle' },
  vca:          { fam:'audio',   shape:'circle' },
  ring_mod:     { fam:'audio',   shape:'circle' },
  compressor:   { fam:'audio',   shape:'rect'   },
  delay_line:   { fam:'audio',   shape:'rect'   },
  reverb:       { fam:'audio',   shape:'rect'   },
  chorus:       { fam:'audio',   shape:'rect'   },
  phaser:       { fam:'audio',   shape:'rect'   },
  flanger:      { fam:'audio',   shape:'rect'   },
  wavefolder:   { fam:'audio',   shape:'rect'   },
  bitcrusher:   { fam:'audio',   shape:'rect'   },
  tape_saturation:{ fam:'audio', shape:'rect'   },
  stereo_panner:{ fam:'audio',   shape:'rect'   },
  sequencer:    { fam:'timing',  shape:'rect'   },
  global_seq:   { fam:'timing',  shape:'rect'   },
  clock:        { fam:'timing',  shape:'rect'   },
  euclidean:    { fam:'timing',  shape:'rect'   },
  clock_divider:{ fam:'timing',  shape:'rect'   },
  arpeggiator:  { fam:'timing',  shape:'rect'   },
  cv_mixer:     { fam:'control', shape:'rect'   },
  attenuverter: { fam:'utility', shape:'circle' },
  sample_hold:  { fam:'utility', shape:'rect'   },
  pitch_quantizer:{ fam:'control', shape:'rect' },
  bernoulli_gate:{ fam:'control', shape:'rect'  },
  scope:        { fam:'utility', shape:'rect'   },
  bass_line:    { fam:'inst',    shape:'hex'    },
  kick_drum:    { fam:'inst',    shape:'hex'    },
  snare:        { fam:'inst',    shape:'hex'    },
  hihat:        { fam:'inst',    shape:'hex'    },
};

function metaFor(t) {
  return ML[t] || { fam: 'utility', shape: 'rect' };
}

function famColor(fam) {
  if (fam === 'timing') return '#D5BE59';
  if (fam === 'inst')   return '#E8ECEB';
  if (fam === 'core')   return '#4D8BC6';
  if (fam === 'audio')  return '#4D8BC6';
  return '#A2AB73'; // control / utility / default
}

function ModulePreview(props) {
  const m = () => metaFor(props.type);
  const color = () => famColor(m().fam);
  return (
    <svg width="22" height="22" viewBox="-12 -12 24 24" class="flex-shrink-0">
      {m().shape === 'circle' && (
        <circle cx="0" cy="0" r="8" fill="none" stroke={color()} stroke-width="1.2" />
      )}
      {m().shape === 'hex' && (
        <polygon
          points="8,0 4,6.928 -4,6.928 -8,0 -4,-6.928 4,-6.928"
          fill="none"
          stroke={color()}
          stroke-width="1.2"
        />
      )}
      {m().shape === 'rect' && (
        <rect x="-8" y="-6" width="16" height="12" fill="none" stroke={color()} stroke-width="1.2" />
      )}
    </svg>
  );
}

export default function AddModuleModal(props) {
  const [selectedType, setSelectedType] = createSignal(null);
  const [name, setName] = createSignal('');

  const allTypes = () => [
    ...moduleTypes().map(t => ({ label: t, type: t, wasm: false })),
    ...wasmTypes().map(t => ({ label: t, type: t, wasm: true })),
  ];

  const confirm = async () => {
    if (!selectedType()) return;
    const body = { type: selectedType() };
    if (name().trim()) body.name = name().trim();
    const layerId = props.layerId;
    props.onClose();
    const res = await fetch(`/layer/${layerId}/module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch(e => { console.warn('add module failed', e); return null; });
    if (res && !res.ok) {
      const e = await res.json().catch(() => ({}));
      alert(`Error: ${e.error || res.status}`);
    }
  };

  const isSelected = (t) => selectedType() === t;

  return (
    <>
      <div
        class="fixed inset-0 z-[300] bg-black/85"
        onClick={props.onClose}
      />
      <div
        class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[301] flex flex-col bg-bg-primary border border-border p-4 gap-3"
        style="width:min(720px,92vw);max-height:86vh"
      >
        <div class="type-section section-title">Add Module</div>

        <div class="flex flex-wrap gap-1.5 overflow-y-auto" style="max-height:60vh">
          <For each={allTypes()}>
            {({ label, type: t, wasm }) => (
              <button
                class={`cursor-pointer transition-colors px-2 py-1 border flex items-center gap-2 ${isSelected(t) ? 'bg-accent border-accent text-white' : 'bg-bg-primary border-border text-text-primary hover:border-label'}`}
                onClick={() => setSelectedType(t)}
                title={t}
              >
                <ModulePreview type={t} />
                <span class="type-button">{label}{wasm ? ' [wasm]' : ''}</span>
              </button>
            )}
          </For>
        </div>

        <div class="flex items-center gap-2">
          <span class="type-label data-label">Name:</span>
          <input
            type="text"
            placeholder="(auto)"
            value={name()}
            onInput={(e) => setName(e.target.value)}
            class="flex-1"
          />
        </div>

        <div class="flex gap-2 justify-end">
          <button
            class="type-button cursor-pointer px-3 py-0.5 transition-colors bg-bg-primary border border-border text-text-secondary hover:text-text-primary"
            onClick={props.onClose}
          >cancel</button>
          <button
            class="type-button cursor-pointer px-3 py-0.5 transition-colors bg-bg-primary border border-label text-label hover:bg-label hover:text-white"
            onClick={confirm}
          >add</button>
        </div>
      </div>
    </>
  );
}
