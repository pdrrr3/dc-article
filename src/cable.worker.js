// cable.worker.js — off-main-thread cable animation
//
// SharedArrayBuffer layout:
//   controlSAB: Float32Array — 8 floats per cable: x1,y1,cp1x,cp1y,cp2x,cp2y,x2,y2
//   headerSAB:  Int32Array   — [0]=numCables [1]=canvasW [2]=canvasH
//
// Main thread writes positions when they change.
// Worker owns the OffscreenCanvas and runs its own loop.

const MAX_CABLES = 256;
const FLOATS = 8;
const DASH = [5, 12];

let canvas, ctx;
let controls, header;

self.onmessage = ({ data }) => {
  if (data.type === 'init') {
    canvas = data.canvas;
    controls = new Float32Array(data.controlSAB);
    header   = new Int32Array(data.headerSAB);
    ctx = canvas.getContext('2d');
    loop();
  }
  if (data.type === 'resize') {
    canvas.width  = data.w;
    canvas.height = data.h;
  }
};

// Near-vsync loop without requestAnimationFrame (not available in workers)
function loop() {
  const { port1, port2 } = new MessageChannel();
  port2.onmessage = () => { draw(); port1.postMessage(null); };
  port1.postMessage(null);
}

function draw() {
  const n = Atomics.load(header, 0);
  const W = Atomics.load(header, 1);
  const H = Atomics.load(header, 2);

  ctx.clearRect(0, 0, W, H);
  if (n === 0) return;

  const t = performance.now() / 1000;

  // Pass 1: wide glow — group all cables, vary alpha per cable
  ctx.lineWidth = 8;
  ctx.lineCap   = 'round';
  for (let i = 0; i < n; i++) {
    const b     = i * FLOATS;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.8 + i * 1.3);
    ctx.globalAlpha   = 0.12 + 0.08 * pulse;
    ctx.strokeStyle   = '#0d8a3d';
    ctx.beginPath();
    ctx.moveTo(controls[b], controls[b + 1]);
    ctx.bezierCurveTo(controls[b+2], controls[b+3], controls[b+4], controls[b+5], controls[b+6], controls[b+7]);
    ctx.stroke();
  }

  // Pass 2: mid glow
  ctx.lineWidth = 3;
  for (let i = 0; i < n; i++) {
    const b     = i * FLOATS;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.8 + i * 1.3);
    ctx.globalAlpha = 0.40 + 0.25 * pulse;
    ctx.strokeStyle = '#1aa650';
    ctx.beginPath();
    ctx.moveTo(controls[b], controls[b + 1]);
    ctx.bezierCurveTo(controls[b+2], controls[b+3], controls[b+4], controls[b+5], controls[b+6], controls[b+7]);
    ctx.stroke();
  }

  // Pass 3: bright core with traveling dash (signal flow)
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.setLineDash(DASH);
  for (let i = 0; i < n; i++) {
    const b = i * FLOATS;
    // dash offset travels from source to dest
    ctx.lineDashOffset = -((t * 55 + i * 17) % 17);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2 + i * 1.3);
    const g = (138 + (40 * pulse) | 0);
    ctx.strokeStyle = `rgb(13,${g},61)`;
    ctx.beginPath();
    ctx.moveTo(controls[b], controls[b + 1]);
    ctx.bezierCurveTo(controls[b+2], controls[b+3], controls[b+4], controls[b+5], controls[b+6], controls[b+7]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}
