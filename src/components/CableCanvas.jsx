import { onMount, onCleanup, createEffect } from 'solid-js';
import { session, dragCable } from '../store';

const MAX_CABLES = 256;
const FLOATS     = 8;

// SharedArrayBuffer requires a secure context (HTTPS / localhost).
// On plain HTTP (LAN access) we fall back to main-thread canvas drawing.
const SECURE = typeof SharedArrayBuffer !== 'undefined';

// Only allocate SAB in secure contexts
const controlSAB = SECURE ? new SharedArrayBuffer(MAX_CABLES * FLOATS * 4) : null;
const headerSAB  = SECURE ? new SharedArrayBuffer(3 * 4) : null;
const controls   = SECURE ? new Float32Array(controlSAB) : new Float32Array(MAX_CABLES * FLOATS);
const header     = SECURE ? new Int32Array(headerSAB)    : new Int32Array(3);

const DASH = [5, 12];

function catenary(x1, y1, x2, y2) {
  const dx   = x2 - x1;
  const dy   = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const sag  = Math.max(80, dist * 0.55);
  const mx   = (x1 + x2) / 2;
  const my   = (y1 + y2) / 2 + sag;
  return {
    cp1x: (x1 * 2 + mx) / 3,
    cp1y: (y1 * 2 + my) / 3,
    cp2x: (x2 * 2 + mx) / 3,
    cp2y: (y2 * 2 + my) / 3,
  };
}

// ── Shared draw logic (used by both paths) ────────────────────
function drawCables(ctx, t) {
  const n = header[0];
  const W = header[1];
  const H = header[2];
  ctx.clearRect(0, 0, W, H);
  if (n === 0) return;

  // Pass 1: wide glow
  ctx.lineWidth = 8;
  ctx.lineCap   = 'round';
  for (let i = 0; i < n; i++) {
    const b     = i * FLOATS;
    const pulse = 0.5 + 0.5 * Math.sin(t * 2.8 + i * 1.3);
    ctx.globalAlpha = 0.12 + 0.08 * pulse;
    ctx.strokeStyle = '#0d8a3d';
    ctx.beginPath();
    ctx.moveTo(controls[b], controls[b+1]);
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
    ctx.moveTo(controls[b], controls[b+1]);
    ctx.bezierCurveTo(controls[b+2], controls[b+3], controls[b+4], controls[b+5], controls[b+6], controls[b+7]);
    ctx.stroke();
  }
  // Pass 3: dashed core
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.85;
  ctx.setLineDash(DASH);
  for (let i = 0; i < n; i++) {
    const b = i * FLOATS;
    ctx.lineDashOffset = -((t * 55 + i * 17) % 17);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3.2 + i * 1.3);
    const g = (138 + (40 * pulse) | 0);
    ctx.strokeStyle = `rgb(13,${g},61)`;
    ctx.beginPath();
    ctx.moveTo(controls[b], controls[b+1]);
    ctx.bezierCurveTo(controls[b+2], controls[b+3], controls[b+4], controls[b+5], controls[b+6], controls[b+7]);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

export default function CableCanvas() {
  let canvasEl;
  let worker;
  let rafId;
  let posInterval;

  function updatePositions() {
    const dpr = window.devicePixelRatio || 1;
    // Canvas is positioned absolute inside the engine container — convert
    // viewport coords from getBoundingClientRect into canvas-local coords.
    const canvasRect = canvasEl?.getBoundingClientRect();
    const offX = canvasRect ? canvasRect.left : 0;
    const offY = canvasRect ? canvasRect.top  : 0;
    let idx = 0;
    for (const layer of Object.values(session.layers || {})) {
      for (const conn of layer.connections || []) {
        if (idx >= MAX_CABLES) break;
        const fromDot = document.querySelector(
          `[data-module-id="${conn.from_module}"] .port-dot.output[data-port="${conn.from_port}"]`
        );
        const toDot = document.querySelector(
          `[data-module-id="${conn.to_module}"] .port-dot.input[data-port="${conn.to_port}"]`
        );
        if (!fromDot || !toDot) continue;
        const fr = fromDot.getBoundingClientRect();
        const tr = toDot.getBoundingClientRect();
        const x1 = (fr.left - offX + fr.width  / 2) * dpr;
        const y1 = (fr.top  - offY + fr.height / 2) * dpr;
        const x2 = (tr.left - offX + tr.width  / 2) * dpr;
        const y2 = (tr.top  - offY + tr.height / 2) * dpr;
        const { cp1x, cp1y, cp2x, cp2y } = catenary(x1, y1, x2, y2);
        const b = idx * FLOATS;
        controls[b]   = x1;   controls[b+1] = y1;
        controls[b+2] = cp1x; controls[b+3] = cp1y;
        controls[b+4] = cp2x; controls[b+5] = cp2y;
        controls[b+6] = x2;   controls[b+7] = y2;
        idx++;
      }
    }
    // Add drag cable if active
    const drag = dragCable();
    if (drag && idx < MAX_CABLES) {
      const x1 = (drag.startX - offX) * dpr;
      const y1 = (drag.startY - offY) * dpr;
      const x2 = (drag.curX   - offX) * dpr;
      const y2 = (drag.curY   - offY) * dpr;
      const { cp1x, cp1y, cp2x, cp2y } = catenary(x1, y1, x2, y2);
      const b = idx * FLOATS;
      controls[b]   = x1;   controls[b+1] = y1;
      controls[b+2] = cp1x; controls[b+3] = cp1y;
      controls[b+4] = cp2x; controls[b+5] = cp2y;
      controls[b+6] = x2;   controls[b+7] = y2;
      idx++;
    }

    // Use Atomics in secure context, plain write otherwise
    if (SECURE) {
      Atomics.store(header, 0, idx);
    } else {
      header[0] = idx;
    }
  }

  onMount(() => {
    const dpr = window.devicePixelRatio || 1;
    const W   = (canvasEl?.clientWidth  || window.innerWidth)  * dpr | 0;
    const H   = (canvasEl?.clientHeight || window.innerHeight) * dpr | 0;

    if (SECURE) {
      // ── Off-thread path (secure context) ─────────────────────
      Atomics.store(header, 1, W);
      Atomics.store(header, 2, H);

      import('../cable.worker.js?worker').then(({ default: CableWorker }) => {
        worker = new CableWorker();
        const offscreen = canvasEl.transferControlToOffscreen();
        worker.postMessage({ type: 'init', canvas: offscreen, controlSAB, headerSAB }, [offscreen]);
      });
    } else {
      // ── Main-thread fallback (HTTP / insecure context) ────────
      header[1] = W;
      header[2] = H;
      canvasEl.width  = W;
      canvasEl.height = H;

      const ctx2d = canvasEl.getContext('2d');
      function frame() {
        drawCables(ctx2d, performance.now() / 1000);
        rafId = requestAnimationFrame(frame);
      }
      rafId = requestAnimationFrame(frame);
    }

    function onResize() {
      const dpr2 = window.devicePixelRatio || 1;
      const nW = (canvasEl?.clientWidth  || window.innerWidth)  * dpr2 | 0;
      const nH = (canvasEl?.clientHeight || window.innerHeight) * dpr2 | 0;
      if (SECURE) {
        Atomics.store(header, 1, nW);
        Atomics.store(header, 2, nH);
        worker?.postMessage({ type: 'resize', w: nW, h: nH });
      } else {
        header[1] = nW;
        header[2] = nH;
        canvasEl.width  = nW;
        canvasEl.height = nH;
      }
      updatePositions();
    }

    window.addEventListener('resize', onResize);
    posInterval = setInterval(updatePositions, 100);
    updatePositions();

    // Recompute immediately whenever anything inside the engine scrolls
    // (the layer-panel inner scroll, the page itself, or any nested overflow).
    const onScroll = () => updatePositions();
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('scroll', onScroll);

    onCleanup(() => {
      window.removeEventListener('resize', onResize);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('scroll', onScroll);
      clearInterval(posInterval);
      cancelAnimationFrame(rafId);
      worker?.terminate();
    });
  });

  createEffect(() => {
    void JSON.stringify(Object.values(session.layers || {}).map(l => l.connections));
    void dragCable();
    updatePositions();
  });

  return (
    <canvas
      ref={canvasEl}
      class="absolute top-0 left-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
