import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

// ── Debug log bus ─────────────────────────────────────────────
// Ring-buffer of log entries, capped at MAX_LOG_LINES.
// Each entry: { ts: string, level: string, text: string }
const MAX_LOG_LINES = 500;
export const [debugLog, setDebugLog] = createSignal([]);

export function pushLog(level, text) {
  const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
  setDebugLog(prev => {
    const next = [...prev, { ts, level, text }];
    return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next;
  });
}

// ── Session store ─────────────────────────────────────────────
export const [session, setSession] = createStore({
  layers: {},
  bpm: 120,
  playing: false,
});

// ── WS connection status ──────────────────────────────────────
export const [wsConnected, setWsConnected] = createSignal(false);

// ── Patch bay pending state ───────────────────────────────────
// null | { layerId, moduleId, port }
export const [patchFrom, setPatchFrom] = createSignal(null);

// ── Meter levels (real-time RMS from server) ─────────────────
// { [mixer_module_id]: rms_float }
export const [meterLevels, setMeterLevels] = createSignal({});

// ── Drag cable state (drag-to-connect) ───────────────────────
// null | { layerId, moduleId, port, startX, startY, curX, curY }
export const [dragCable, setDragCable] = createSignal(null);

// ── Patch status message ──────────────────────────────────────
export const [patchMsg, setPatchMsg] = createSignal(null);

let patchMsgTimer = null;
export function showPatchMsg(msg, autoDismissMs) {
  setPatchMsg(msg);
  if (patchMsgTimer) clearTimeout(patchMsgTimer);
  if (autoDismissMs) {
    patchMsgTimer = setTimeout(() => setPatchMsg(null), autoDismissMs);
  }
}
export function clearPatchMsg() {
  setPatchMsg(null);
  if (patchMsgTimer) clearTimeout(patchMsgTimer);
}

// ── Module type metadata ──────────────────────────────────────
export const [moduleTypes, setModuleTypes] = createSignal([]);
export const [wasmTypes, setWasmTypes] = createSignal([]);

// ── Port descriptors per module type ─────────────────────────
export const MODULE_PORTS = {
  oscillator:   { inputs: ['pitch_cv'], outputs: ['audio_out'] },
  lfo:          { inputs: ['rate_cv', 'sync'], outputs: ['cv_out'] },
  vca:          { inputs: ['audio_in', 'level_cv'], outputs: ['audio_out'] },
  filter:       { inputs: ['audio_in', 'cutoff_cv', 'res_cv'], outputs: ['audio_out'] },
  adsr:         { inputs: ['gate'], outputs: ['cv_out'] },
  mixer:        { inputs: ['in_1','in_2','in_3','in_4','in_5','in_6','in_7','in_8'], outputs: ['audio_out'] },
  cv_mixer:     { inputs: ['cv_1','cv_2','cv_3','cv_4'], outputs: ['cv_out'] },
  attenuverter: { inputs: ['cv_in'], outputs: ['cv_out'] },
  sample_hold:  { inputs: ['cv_in', 'gate'], outputs: ['cv_out'] },
  clock:        { inputs: [], outputs: ['gate', 'ramp'] },
  sequencer:    { inputs: [], outputs: ['gate', 'pitch_cv', 'velocity_cv'] },
  global_seq:   { inputs: ['reset'], outputs: ['gate', 'pitch_cv', 'velocity_cv', 'accent'] },
  master_output:{ inputs: ['left', 'right'], outputs: [] },
  scope:        { inputs: ['audio_in', 'cv_in'], outputs: ['sig_out'] },
  kick_drum:    { inputs: ['gate','pitch_cv','tune_cv','decay_cv','punch_cv','sub_cv','drive_cv'], outputs: ['audio'] },
  snare:        { inputs: ['gate','pitch_cv','decay_cv','noise_cv','snap_cv'], outputs: ['audio'] },
  hihat:        { inputs: ['gate','decay_cv','tone_cv','edge_cv'], outputs: ['audio'] },
  bass_line:    { inputs: ['gate_cv', 'pitch_cv'], outputs: ['audio_out'] },
  // ── New modules ──
  pwm_oscillator:    { inputs: ['pitch_cv', 'pw_cv'], outputs: ['audio_out'] },
  fm_operator:       { inputs: ['pitch_cv', 'mod_cv', 'phase_mod'], outputs: ['audio_out'] },
  ring_mod:          { inputs: ['carrier', 'modulator'], outputs: ['audio_out'] },
  svf:               { inputs: ['audio_in', 'cutoff_cv', 'res_cv'], outputs: ['lp', 'hp', 'bp', 'notch'] },
  moog_filter:       { inputs: ['audio_in', 'cutoff_cv', 'res_cv'], outputs: ['audio_out'] },
  wavefolder:        { inputs: ['audio_in', 'drive_cv'], outputs: ['audio_out'] },
  delay_line:        { inputs: ['audio_in', 'time_cv', 'feedback_cv'], outputs: ['audio_out'] },
  euclidean:         { inputs: ['clock', 'reset'], outputs: ['gate', 'accent'] },
  slew_limiter:      { inputs: ['cv_in'], outputs: ['cv_out'] },
  pitch_quantizer:   { inputs: ['cv_in'], outputs: ['cv_out'] },
  supersaw:          { inputs: ['pitch_cv'], outputs: ['out_l', 'out_r'] },
  wavetable:         { inputs: ['pitch_cv', 'position_cv'], outputs: ['audio_out'] },
  comb_filter:       { inputs: ['audio_in', 'pitch_cv', 'gate'], outputs: ['audio_out'] },
  chorus:            { inputs: ['audio_in'], outputs: ['audio_out'] },
  reverb:            { inputs: ['audio_in'], outputs: ['audio_out'] },
  bitcrusher:        { inputs: ['audio_in'], outputs: ['audio_out'] },
  envelope_follower: { inputs: ['audio_in'], outputs: ['cv_out'] },
  clock_divider:     { inputs: ['clock', 'reset'], outputs: ['div_out', 'mult_out'] },
  bernoulli_gate:    { inputs: ['gate_in', 'cv_in'], outputs: ['out_a', 'out_b'] },
  noise_gen:         { inputs: [], outputs: ['audio_out', 'cv_out'] },
  phaser:            { inputs: ['audio_in'], outputs: ['audio_out'] },
  flanger:           { inputs: ['audio_in'], outputs: ['audio_out'] },
  formant_filter:    { inputs: ['audio_in', 'vowel_cv'], outputs: ['audio_out'] },
  ms20_filter:       { inputs: ['audio_in', 'cutoff_cv', 'res_cv'], outputs: ['audio_out'] },
  tape_saturation:   { inputs: ['audio_in'], outputs: ['audio_out'] },
  compressor:        { inputs: ['audio_in', 'sidechain'], outputs: ['audio_out'] },
  stereo_panner:     { inputs: ['audio_in', 'pan_cv'], outputs: ['out_l', 'out_r'] },
  additive_osc:      { inputs: ['pitch_cv'], outputs: ['audio_out'] },
  phase_distortion:  { inputs: ['pitch_cv', 'dist_cv'], outputs: ['audio_out'] },
  arpeggiator:       { inputs: ['pitch_cv', 'gate'], outputs: ['pitch_out', 'gate_out'] },
};

// ── Param ranges per module type ──────────────────────────────
export const MODULE_PARAMS = {
  oscillator:   { frequency: [20,20000,440], amplitude: [0,1,0.8], waveform: [0,3,0] },
  lfo:          { rate: [0.01,50,1], depth: [0,1,1], waveform: [0,3,0] },
  vca:          { level: [0,1,0.8] },
  filter:       { cutoff: [20,20000,1000], resonance: [0.1,20,0.707], type: [0,2,0] },
  adsr:         { attack: [0.001,10,0.01], decay: [0.001,10,0.1], sustain: [0,1,0.7], release: [0.001,10,0.3] },
  mixer:        { level_1:[0,1,0.4], level_2:[0,1,0.4], level_3:[0,1,0.4], level_4:[0,1,0.4],
                  level_5:[0,1,0.4], level_6:[0,1,0.4], level_7:[0,1,0.4], level_8:[0,1,0.4] },
  cv_mixer:     { amount_1:[-1,1,0.5], amount_2:[-1,1,0.5], amount_3:[-1,1,0.5], amount_4:[-1,1,0.5] },
  attenuverter: { amount: [-1,1,1], offset: [-1,1,0] },
  clock:        { bpm: [20,300,120], division: [0.25,32,4], pulse_width: [0.01,0.99,0.5] },
  sequencer:    { bpm: [20,300,120], length: [1,64,16], division: [0.25,16,4], swing: [0.5,0.75,0.5], direction: [0,3,0] },
  global_seq:   { length: [1,64,16], division: [0.25,32,4], direction: [0,3,0] },
  kick_drum:    {
    tune: [20,120,60], punch: [0,1,0.72], pitch_tau: [5,100,18], pitch_end: [0.1,2,1],
    decay: [50,3000,520], body_attack: [0.1,20,0.5], body_mix: [0,1,0.65],
    sub: [0,1,0.65], sub_decay: [100,6000,1100], click: [0,1,0.55],
    click_tone: [0,12000,0], drive: [1,8,2.2], level: [0,1,0.92],
  },
  snare:        {
    tone: [80,600,180], tone_ratio: [1,3,1.83], t2_freq: [0,1200,0],
    pitch_tau: [1,50,8], snap: [0,1,0.65], noise: [0,1,0.72],
    body_mix: [0,1,0.45], decay: [0.04,2,0.16],
    hpf: [200,6000,1500], lpf: [2000,20000,8000], drive: [1,6,2], level: [0,1,0.88],
  },
  hihat:        {
    tune: [0.25,4,1], tone: [1000,18000,6000], bp_freq: [500,12000,3000],
    open: [0,1,0], decay: [0.005,1,0.055], edge: [0.5,10,2.5],
    noise: [0,1,0.25], drive: [1,6,1.6], level: [0,1,0.75], choke: [0,1,1],
  },
  bass_line:    { bpm: [20,300,120], freq: [20,200,55], cutoff: [20,2000,400], resonance: [0.1,20,4], decay: [0.05,2,0.2], level: [0,1,0.8] },
  // ── New modules ──
  pwm_oscillator:    { frequency: [20,20000,440], amplitude: [0,1,0.8], pulse_width: [0.01,0.99,0.5], pw_mod_depth: [0,1,0] },
  fm_operator:       { frequency: [0.1,20000,440], ratio: [0.5,16,1], mod_index: [0,20,0], feedback: [0,1,0], level: [0,1,1] },
  ring_mod:          { mix: [0,1,1], mode: [0,1,0] },
  svf:               { cutoff: [20,20000,1000], resonance: [0,1,0], drive: [0,5,0] },
  moog_filter:       { cutoff: [20,20000,1000], resonance: [0,1.1,0], drive: [1,5,1], compensation: [0,1,0.5] },
  wavefolder:        { drive: [1,10,1], symmetry: [-1,1,0], stages: [1,6,3], mix: [0,1,1] },
  delay_line:        { time: [0.1,5000,250], feedback: [0,0.99,0.3], mix: [0,1,0.5], filter: [0,1,1] },
  euclidean:         { steps: [1,32,16], pulses: [0,32,4], rotation: [0,31,0], probability: [0,1,1] },
  slew_limiter:      { rise: [0,10,0.01], fall: [0,10,0.01], shape: [0,1,0] },
  pitch_quantizer:   { root: [0,11,0], scale: [0,4095,2741], glide: [0,1,0] },
  supersaw:          { frequency: [20,20000,440], amplitude: [0,1,0.8], voices: [1,9,7], detune: [0,1,0.3], mix: [0,1,0.5], stereo_spread: [0,1,0.7] },
  wavetable:         { frequency: [20,20000,440], amplitude: [0,1,0.8], position: [0,1,0] },
  comb_filter:       { frequency: [20,5000,220], feedback: [-0.999,0.999,0.5], damping: [0,1,0.5], mode: [0,2,1] },
  chorus:            { rate: [0.1,10,1.5], depth: [0,20,5], voices: [1,4,2], mix: [0,1,0.5], feedback: [0,0.5,0] },
  reverb:            { decay: [0.1,0.99,0.7], damping: [0,1,0.5], size: [0.1,2,0.5], pre_delay: [0,100,10], mix: [0,1,0.3] },
  bitcrusher:        { bit_depth: [1,24,16], downsample: [1,64,1], mix: [0,1,1] },
  envelope_follower: { attack: [0.1,100,5], release: [1,1000,50], gain: [0.1,10,1] },
  clock_divider:     { divide: [1,64,2], multiply: [1,16,1], reset_count: [0,64,0] },
  bernoulli_gate:    { probability: [0,1,0.5], mode: [0,1,0] },
  noise_gen:         { mode: [0,4,0], rate: [0.01,100,1], range_lo: [-1,1,-1], range_hi: [-1,1,1] },
  phaser:            { rate: [0.01,10,0.5], depth: [0,1,0.7], stages: [2,12,6], feedback: [-0.95,0.95,0.5], center: [100,5000,1000], mix: [0,1,0.5] },
  flanger:           { rate: [0.01,10,0.3], depth: [0,10,3], feedback: [-0.99,0.99,0.7], mix: [0,1,0.5] },
  formant_filter:    { vowel: [0,1,0], resonance: [0.5,20,5], shift: [-12,12,0] },
  ms20_filter:       { cutoff: [20,20000,1000], resonance: [0,1.2,0], mode: [0,1,0] },
  tape_saturation:   { drive: [0,5,1], bias: [0,1,0.5], tone: [0,1,0.5], wow_flutter: [0,1,0] },
  compressor:        { threshold: [-60,0,-12], ratio: [1,20,4], attack: [0.1,100,5], release: [10,1000,100], makeup: [0,30,0], knee: [0,20,6] },
  stereo_panner:     { pan: [-1,1,0] },
  additive_osc:      { frequency: [20,20000,440], amplitude: [0,1,0.8], h1: [0,1,1], h2: [0,1,0.5], h3: [0,1,0.33], h4: [0,1,0.25], h5: [0,1,0], h6: [0,1,0], h7: [0,1,0], h8: [0,1,0], h9: [0,1,0], h10: [0,1,0], h11: [0,1,0], h12: [0,1,0], h13: [0,1,0], h14: [0,1,0], h15: [0,1,0], h16: [0,1,0] },
  phase_distortion:  { frequency: [20,20000,440], amplitude: [0,1,0.8], distortion: [0,1,0], mode: [0,3,0] },
  arpeggiator:       { mode: [0,5,0], octaves: [1,4,2], gate_length: [0.01,1,0.5], division: [0.25,16,4] },
};

export function getPortDefs(typeName) {
  return MODULE_PORTS[typeName] || { inputs: [], outputs: [] };
}

export function getParamDefs(typeName) {
  return MODULE_PARAMS[typeName] || {};
}
