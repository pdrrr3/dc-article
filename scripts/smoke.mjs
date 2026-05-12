import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.join(__dirname, '..', 'public', 'wasm-pkg');

// wasm-pack --target web emits ES module init that fetch()es the .wasm by URL.
// In Node we have to pass the wasm bytes directly to the default export.
const mod = await import(path.join(pkgDir, 'dc_wasm.js'));
const wasmBytes = fs.readFileSync(path.join(pkgDir, 'dc_wasm_bg.wasm'));
await mod.default({ module_or_path: wasmBytes });

const SR = 48000;
const engine = new mod.Engine(SR);
console.log('master:', engine.masterId());

const osc = engine.addModule('oscillator');
const mixer = engine.addModule('mixer');
console.log('oscillator:', osc);
console.log('mixer:', mixer);

engine.setParam(osc, 'frequency', 220);
engine.setParam(osc, 'amplitude', 0.5);

const c1 = engine.connect(osc, 0, mixer, 0);
const c2 = engine.connect(mixer, 0, engine.masterId(), 0);
const c3 = engine.connect(mixer, 0, engine.masterId(), 1);
console.log('connections:', c1, c2, c3);

const left = new Float32Array(128);
const right = new Float32Array(128);
let peak = 0;
let energy = 0;
for (let i = 0; i < 100; i++) {
  engine.process(left, right);
  for (let j = 0; j < 128; j++) {
    peak = Math.max(peak, Math.abs(left[j]));
    energy += left[j] * left[j];
  }
}
console.log('peak:', peak.toFixed(4), 'rms:', Math.sqrt(energy / (100 * 128)).toFixed(4));
if (peak < 1e-3) {
  console.error('FAIL: output silent');
  process.exit(1);
}
console.log('OK');
