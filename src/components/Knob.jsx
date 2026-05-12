import { createSignal } from 'solid-js';

/**
 * Rotary knob — drag vertically to adjust.
 *
 * Props
 *   value         normalized 0–1
 *   onChange(v)   called with new normalized value
 *   size          pixels (default 32)
 *   defaultValue  optional normalized reset value for double-click / right-click
 *   display       optional formatted string shown in the drag tooltip
 */

let tooltipEl = null;
function showTooltip(x, y, text) {
  if (!tooltipEl) {
    tooltipEl = document.createElement('div');
    tooltipEl.style.cssText =
      'position:fixed;pointer-events:none;z-index:9999;padding:2px 6px;' +
      'background:var(--color-bg-secondary,#1a1a1d);' +
      'border:0.5px solid var(--color-border,rgba(255,255,255,0.2));' +
      'color:var(--color-text-primary,#e8ecea);' +
      'font:10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;' +
      'font-variant-numeric:tabular-nums;' +
      'white-space:nowrap;transform:translate(10px,10px)';
    document.body.appendChild(tooltipEl);
  }
  tooltipEl.style.left = `${x}px`;
  tooltipEl.style.top = `${y}px`;
  tooltipEl.textContent = text;
  tooltipEl.style.display = '';
}
function hideTooltip() {
  if (tooltipEl) tooltipEl.style.display = 'none';
}

export default function Knob(props) {
  const size = () => props.size || 32;
  const r = () => size() / 2 - 3;
  const cx = () => size() / 2;
  const cy = () => size() / 2;

  const startAngle = 135;
  const endAngle = 405;
  const sweep = endAngle - startAngle;

  const [hovering, setHovering] = createSignal(false);
  const [dragging, setDragging] = createSignal(false);

  const toRad = (d) => (d * Math.PI) / 180;
  const arcPath = (from, to) => {
    const r1 = toRad(from);
    const r2 = toRad(to);
    const x1 = cx() + r() * Math.cos(r1);
    const y1 = cy() + r() * Math.sin(r1);
    const x2 = cx() + r() * Math.cos(r2);
    const y2 = cy() + r() * Math.sin(r2);
    const large = to - from > 180 ? 1 : 0;
    return `M${x1},${y1} A${r()},${r()} 0 ${large} 1 ${x2},${y2}`;
  };

  const clampedValue = () => Math.max(0, Math.min(1, props.value));
  const valueAngle = () => startAngle + clampedValue() * sweep;

  const stroke = () => (hovering() || dragging() ? '#ccddee' : '#8899aa');

  const onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startVal = clampedValue();
    setDragging(true);
    if (props.display) showTooltip(e.clientX, e.clientY, props.display);

    const onMove = (ev) => {
      const dy = startY - ev.clientY;
      const speed = ev.shiftKey ? 0.001 : ev.ctrlKey || ev.metaKey ? 0.0003 : 0.005;
      const v = Math.max(0, Math.min(1, startVal + dy * speed));
      props.onChange(v);
      if (props.display) showTooltip(ev.clientX, ev.clientY, props.display);
    };
    const onUp = () => {
      setDragging(false);
      hideTooltip();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onDblClick = (e) => {
    e.preventDefault();
    if (props.defaultValue !== undefined) props.onChange(props.defaultValue);
  };
  const onContextMenu = (e) => {
    e.preventDefault();
    if (props.defaultValue !== undefined) props.onChange(props.defaultValue);
  };

  return (
    <svg
      width={size()} height={size()} viewBox={`0 0 ${size()} ${size()}`}
      style={`cursor:${dragging() ? 'grabbing' : 'ns-resize'}`}
      onMouseDown={onMouseDown}
      onDblClick={onDblClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <path
        d={arcPath(startAngle, endAngle)}
        fill="none"
        stroke="rgba(136,153,170,0.25)"
        stroke-width="3.5"
        stroke-linecap="round"
      />
      {clampedValue() > 0.005 && (
        <path
          d={arcPath(startAngle, valueAngle())}
          fill="none"
          stroke={stroke()}
          stroke-width="3.5"
          stroke-linecap="round"
        />
      )}
    </svg>
  );
}
