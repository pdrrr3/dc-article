import { onMount, onCleanup } from 'solid-js';
import { wsUrl } from '../network';

export default function ScopeCanvas(props) {
  let canvasEl;
  let sock = null;
  let cvHistory = null;
  let cvWritePos = 0;

  onMount(() => {
    const W = 256;
    const H = 80;
    canvasEl.width = W * 2;
    canvasEl.height = H * 2;
    cvHistory = new Float32Array(W * 2);

    openSocket();
  });

  onCleanup(() => {
    if (sock) sock.close();
  });

  function openSocket() {
    if (sock) sock.close();
    sock = new WebSocket(wsUrl(`/scope/${props.moduleId}`));
    sock.binaryType = 'arraybuffer';

    const ctx = canvasEl.getContext('2d');
    const W = canvasEl.width;
    const H = canvasEl.height;

    sock.onmessage = (ev) => {
      if (!(ev.data instanceof ArrayBuffer)) return;
      const buf = ev.data;
      if (buf.byteLength < 5) return;

      const view = new DataView(buf);
      const classId = view.getUint8(0);
      const nSamples = (buf.byteLength - 1) / 4;
      const aligned = buf.slice(1);
      const samples = new Float32Array(aligned, 0, nSamples);

      ctx.clearRect(0, 0, W, H);

      if (classId === 0x00) {
        // Audio oscilloscope
        let trigger = 0;
        for (let i = 1; i < nSamples - 1; i++) {
          if (samples[i - 1] < 0 && samples[i] >= 0) { trigger = i; break; }
        }

        ctx.strokeStyle = '#44dd44';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#44dd44';
        ctx.shadowBlur = 3;
        ctx.beginPath();
        const drawSamples = Math.min(nSamples - trigger, W);
        for (let i = 0; i < drawSamples; i++) {
          const s = samples[trigger + i];
          const x = (i / drawSamples) * W;
          const y = H / 2 - s * (H / 2 - 4);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Zero line
        ctx.strokeStyle = '#333344';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.stroke();
      } else {
        // CV scrolling timeline
        const step = Math.max(1, Math.floor(nSamples / W));
        for (let i = 0; i < nSamples; i += step) {
          cvHistory[cvWritePos % cvHistory.length] = samples[i];
          cvWritePos++;
        }

        const total = Math.min(cvWritePos, cvHistory.length);
        const startIdx = cvWritePos - total;

        ctx.strokeStyle = '#7799bb';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let col = 0; col < W; col++) {
          const ringIdx = (startIdx + col) % cvHistory.length;
          const s = cvHistory[ringIdx];
          const y = H / 2 - s * (H / 2 - 4);
          if (col === 0) ctx.moveTo(col, y); else ctx.lineTo(col, y);
        }
        ctx.stroke();

        // Grid lines
        ctx.strokeStyle = '#333344';
        ctx.lineWidth = 1;
        for (const level of [0.5, 0, -0.5]) {
          const y = H / 2 - level * (H / 2 - 4);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(W, y);
          ctx.stroke();
        }
      }
    };

    sock.onclose = () => {
      if (!canvasEl.isConnected) return;
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.fillStyle = '#666';
      ctx.font = '16px VT323, monospace';
      ctx.fillText('disconnected', 6, canvasEl.height / 2 + 4);
    };
  }

  return (
    <div class="px-2 pt-1 pb-1.5 border-t border-border">
      <canvas
        ref={canvasEl}
        class="block w-full h-[60px] bg-bg-primary border border-border"
      />
      <div class="data-label text-right mt-0.5 text-sm">
        scope
      </div>
    </div>
  );
}
