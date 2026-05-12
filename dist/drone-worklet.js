import init, { Engine } from '/wasm-pkg/dc_wasm.js';

class DroneProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.ready = false;
    this.engine = null;
    this.queue = [];
    this.seqIds = new Set();
    this.lastSteps = new Map();
    this.meterCounter = 0;
    this.stepCounter = 0;

    const { wasmModule } = options.processorOptions || {};
    init({ module_or_path: wasmModule })
      .then(() => {
        this.engine = new Engine(sampleRate);
        this.port.postMessage({ type: 'ready', masterId: this.engine.masterId() });
        for (const msg of this.queue) this._handle(msg);
        this.queue = [];
        this.ready = true;
      })
      .catch((e) => this.port.postMessage({ type: 'error', error: String(e) }));

    this.port.onmessage = (e) => {
      if (this.ready) this._handle(e.data);
      else this.queue.push(e.data);
    };
  }

  _handle(msg) {
    const eng = this.engine;
    try {
      switch (msg.type) {
        case 'add_module': {
          const id = eng.addModule(msg.type_name);
          this.port.postMessage({ type: 'module_added', token: msg.token, id });
          break;
        }
        case 'remove_module':
          eng.removeModule(msg.id);
          this.seqIds.delete(msg.id);
          this.lastSteps.delete(msg.id);
          break;
        case 'connect': {
          const cid = eng.connect(msg.from, msg.from_port | 0, msg.to, msg.to_port | 0);
          this.port.postMessage({ type: 'connected', token: msg.token, id: cid });
          break;
        }
        case 'disconnect':
          eng.disconnect(msg.id);
          break;
        case 'set_param':
          eng.setParam(msg.id, msg.name, msg.value);
          break;
        case 'set_step':
          eng.setStep(msg.id, msg.step | 0, msg.gate, msg.pitch, msg.velocity, msg.length, msg.probability);
          break;
        case 'set_plock':
          eng.setPlock(msg.id, msg.step | 0, msg.target, msg.param, msg.value);
          break;
        case 'clear_plock':
          eng.clearPlock(msg.id, msg.step | 0, msg.target, msg.param);
          break;
        case 'set_bpm':
          eng.setBpm(msg.bpm);
          break;
        case 'enable_meter':
          eng.enableMeter(msg.id);
          break;
        case 'disable_meter':
          eng.disableMeter(msg.id);
          break;
        case 'register_sequencer':
          this.seqIds.add(msg.id);
          break;
        case 'unregister_sequencer':
          this.seqIds.delete(msg.id);
          this.lastSteps.delete(msg.id);
          break;
        default:
          break;
      }
    } catch (e) {
      this.port.postMessage({ type: 'error', error: String(e) });
    }
  }

  process(_inputs, outputs) {
    if (!this.ready) return true;
    const out = outputs[0];
    if (!out || out.length === 0) return true;
    const left = out[0];
    const right = out.length > 1 ? out[1] : out[0];
    this.engine.process(left, right);

    // Periodic broadcasts: meters @ ~30Hz, sequencer steps @ ~120Hz
    this.meterCounter += left.length;
    if (this.meterCounter >= 1600) {
      this.meterCounter = 0;
      const json = this.engine.meterLevels();
      if (json !== '[]') this.port.postMessage({ type: 'meters', data: json });
    }
    this.stepCounter += left.length;
    if (this.stepCounter >= 400) {
      this.stepCounter = 0;
      for (const id of this.seqIds) {
        const s = this.engine.currentStep(id);
        if (s < 0) continue;
        if (this.lastSteps.get(id) !== s) {
          this.lastSteps.set(id, s);
          this.port.postMessage({ type: 'step', id, step: s });
        }
      }
    }
    return true;
  }
}

registerProcessor('drone-processor', DroneProcessor);
