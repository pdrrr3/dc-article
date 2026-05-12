import { createSignal, createMemo, For } from 'solid-js';
import Knob from './Knob';

const CURVE = '#8899aa';
const CURVE_FILL = 'rgba(136,153,170,0.18)';
const GRID = 'rgba(136,153,170,0.12)';
const GRID_STRONG = 'rgba(136,153,170,0.22)';

/**
 * ADSR Envelope Graph with draggable breakpoints and knobs.
 */
export default function AdsrGraph(props) {
  const W = 280;
  const H = 90;
  const PAD_X = 8;
  const PAD_Y = 12;
  const GRAPH_W = W - PAD_X * 2;
  const GRAPH_H = H - PAD_Y * 2;

  const T_MIN = 0.001;
  const T_MAX = 10;

  const logNorm = (v, min, max) => {
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    return Math.max(0, Math.min(1, (Math.log(v) - logMin) / (logMax - logMin)));
  };
  const logDenorm = (t, min, max) => {
    const logMin = Math.log(min);
    const logMax = Math.log(max);
    return Math.exp(logMin + t * (logMax - logMin));
  };

  const points = createMemo(() => {
    const aN = logNorm(props.attack, T_MIN, T_MAX);
    const dN = logNorm(props.decay, T_MIN, T_MAX);
    const rN = logNorm(props.release, T_MIN, T_MAX);
    const sus = props.sustain;

    const totalT = aN + dN + rN + 0.01;
    const aW = (aN / totalT) * GRAPH_W * 0.85;
    const dW = (dN / totalT) * GRAPH_W * 0.85;
    const sustainW = GRAPH_W * 0.15;
    const rW = GRAPH_W - aW - dW - sustainW;

    const x0 = PAD_X;
    const y0 = PAD_Y + GRAPH_H;
    const yTop = PAD_Y;

    return {
      p0: { x: x0, y: y0 },
      p1: { x: x0 + aW, y: yTop },
      p2: { x: x0 + aW + dW, y: yTop + (1 - sus) * GRAPH_H },
      p3: { x: x0 + aW + dW + sustainW, y: yTop + (1 - sus) * GRAPH_H },
      p4: { x: x0 + aW + dW + sustainW + rW, y: y0 },
    };
  });

  const envelopePath = createMemo(() => {
    const { p0, p1, p2, p3, p4 } = points();
    const dcx = p1.x + (p2.x - p1.x) * 0.7;
    const dcy = p1.y;
    const rcx = p3.x + (p4.x - p3.x) * 0.3;
    const rcy = p3.y;
    return `M${p0.x},${p0.y} L${p1.x},${p1.y} C${dcx},${dcy} ${p2.x},${p2.y} ${p2.x},${p2.y} L${p3.x},${p3.y} C${rcx},${rcy} ${p4.x},${p4.y} ${p4.x},${p4.y}`;
  });

  const [dragging, setDragging] = createSignal(null);
  const [hovered, setHovered] = createSignal(null);

  const onPointDown = (paramType, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(paramType);
    const svgRect = e.target.closest('svg').getBoundingClientRect();

    const onMove = (ev) => {
      const type = dragging();
      if (!type) return;
      const mx = ev.clientX - svgRect.left;
      const my = ev.clientY - svgRect.top;

      if (type === 'sustain') {
        const sus = 1 - Math.max(0, Math.min(1, (my - PAD_Y) / GRAPH_H));
        props.onParam('sustain', sus);
      } else {
        const t = Math.max(0, Math.min(1, (mx - PAD_X) / GRAPH_W));
        const timeVal = logDenorm(Math.max(0.001, t), T_MIN, T_MAX);
        props.onParam(type, Math.max(T_MIN, Math.min(T_MAX, timeVal)));
      }
    };

    const onUp = () => {
      setDragging(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const fmtTime = (v) => (v >= 1 ? `${v.toFixed(2)} s` : `${(v * 1000).toFixed(0)} ms`);
  const fmtSus = (v) => `${(v * 100).toFixed(0)}%`;

  // Log-time grid ticks at 0.01, 0.1, 1, 10s
  const timeTicks = [0.01, 0.1, 1, 10];

  const Node = (propsN) => (
    <g>
      <circle
        cx={propsN.cx}
        cy={propsN.cy}
        r="10"
        fill="transparent"
        style={`cursor:${propsN.cursor}`}
        onMouseDown={(e) => onPointDown(propsN.param, e)}
        onMouseEnter={() => setHovered(propsN.param)}
        onMouseLeave={() => setHovered(null)}
      />
      <circle
        cx={propsN.cx}
        cy={propsN.cy}
        r="5"
        fill="#141414"
        stroke={CURVE}
        stroke-width="1.5"
        style="pointer-events:none"
      />
      {(hovered() === propsN.param || dragging() === propsN.param) && (
        <circle
          cx={propsN.cx}
          cy={propsN.cy}
          r="8"
          fill="none"
          stroke={CURVE}
          stroke-width="1"
          opacity="0.7"
          style="pointer-events:none"
        />
      )}
    </g>
  );

  return (
    <div class="px-2 py-2">
      <svg viewBox={`0 0 ${W} ${H}`} class="block w-full" style="cursor:default;height:auto">
        {/* Log-time grid ticks (faint) */}
        <For each={timeTicks}>
          {(t) => {
            // Approximate position — ticks scaled across the 0..0.85 graph region used for A+D+R
            const x = PAD_X + logNorm(t, T_MIN, T_MAX) * GRAPH_W * 0.85;
            return (
              <line
                x1={x} y1={PAD_Y}
                x2={x} y2={PAD_Y + GRAPH_H}
                stroke={GRID} stroke-width="0.5" stroke-dasharray="2,3"
              />
            );
          }}
        </For>
        {/* Baseline */}
        <line
          x1={PAD_X} y1={PAD_Y + GRAPH_H}
          x2={PAD_X + GRAPH_W} y2={PAD_Y + GRAPH_H}
          stroke={GRID_STRONG} stroke-width="0.5"
        />
        {/* Fill under curve */}
        <path
          d={`${envelopePath()} L${PAD_X + GRAPH_W},${PAD_Y + GRAPH_H} L${PAD_X},${PAD_Y + GRAPH_H} Z`}
          fill={CURVE_FILL}
        />
        {/* Envelope stroke */}
        <path
          d={envelopePath()}
          fill="none"
          stroke={CURVE}
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <Node cx={points().p1.x} cy={points().p1.y} param="attack" cursor="ew-resize" />
        <Node cx={points().p2.x} cy={points().p2.y} param="sustain" cursor="ns-resize" />
        <Node cx={points().p3.x} cy={points().p3.y} param="decay" cursor="ew-resize" />
        <Node cx={points().p4.x} cy={points().p4.y} param="release" cursor="ew-resize" />
      </svg>

      <div class="flex justify-between mt-2 px-1">
        <div class="flex flex-col items-center" style="gap:1px">
          <Knob
            value={logNorm(props.attack, T_MIN, T_MAX)}
            onChange={(v) => props.onParam('attack', logDenorm(v, T_MIN, T_MAX))}
            defaultValue={logNorm(0.01, T_MIN, T_MAX)}
            display={fmtTime(props.attack)}
          />
          <span class="type-port text-text-secondary" style="font-size:8px">Atck</span>
          <span class="type-port text-label" style="font-size:9px;font-variant-numeric:tabular-nums">{fmtTime(props.attack)}</span>
        </div>
        <div class="flex flex-col items-center" style="gap:1px">
          <Knob
            value={logNorm(props.decay, T_MIN, T_MAX)}
            onChange={(v) => props.onParam('decay', logDenorm(v, T_MIN, T_MAX))}
            defaultValue={logNorm(0.1, T_MIN, T_MAX)}
            display={fmtTime(props.decay)}
          />
          <span class="type-port text-text-secondary" style="font-size:8px">Dcay</span>
          <span class="type-port text-label" style="font-size:9px;font-variant-numeric:tabular-nums">{fmtTime(props.decay)}</span>
        </div>
        <div class="flex flex-col items-center" style="gap:1px">
          <Knob
            value={props.sustain}
            onChange={(v) => props.onParam('sustain', v)}
            defaultValue={0.7}
            display={fmtSus(props.sustain)}
          />
          <span class="type-port text-text-secondary" style="font-size:8px">Sus</span>
          <span class="type-port text-label" style="font-size:9px;font-variant-numeric:tabular-nums">{fmtSus(props.sustain)}</span>
        </div>
        <div class="flex flex-col items-center" style="gap:1px">
          <Knob
            value={logNorm(props.release, T_MIN, T_MAX)}
            onChange={(v) => props.onParam('release', logDenorm(v, T_MIN, T_MAX))}
            defaultValue={logNorm(0.3, T_MIN, T_MAX)}
            display={fmtTime(props.release)}
          />
          <span class="type-port text-text-secondary" style="font-size:8px">Rel</span>
          <span class="type-port text-label" style="font-size:9px;font-variant-numeric:tabular-nums">{fmtTime(props.release)}</span>
        </div>
      </div>
    </div>
  );
}
