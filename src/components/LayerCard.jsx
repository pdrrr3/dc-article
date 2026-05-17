import { createSignal, createEffect, onCleanup, For, Show } from 'solid-js';
import { TransitionGroup } from 'solid-transition-group';
import ModuleCard from './ModuleCard';
import { scheduleParamPut } from '../ws';
import { meterLevels } from '../store';

// Module-level cache so per-layer UI state (collapsed) survives card remount
// when the store replaces layer objects on WS patches or full session resync.
const collapsedById = new Map();

export default function LayerCard(props) {
  const layer = () => props.layer;
  const [savedLevels, setSavedLevels] = createSignal(null);
  // Derive muted state from actual mixer params — all levels at 0 means muted
  const muted = () => {
    const m = mixerModule();
    if (!m?.params) return false;
    const levels = Object.entries(m.params).filter(([k]) => k.startsWith('level_'));
    if (levels.length === 0) return false;
    return levels.every(([, v]) => v === 0);
  };
  const [editing, setEditing] = createSignal(false);
  const [editName, setEditName] = createSignal('');
  const [collapsed, setCollapsedRaw] = createSignal(
    collapsedById.get(props.layer.id) ?? false
  );
  const setCollapsed = (v) => {
    setCollapsedRaw(v);
    collapsedById.set(props.layer.id, v);
  };
  const [menuOpen, setMenuOpen] = createSignal(false);

  createEffect(() => {
    if (menuOpen()) {
      const close = () => setMenuOpen(false);
      setTimeout(() => window.addEventListener('click', close), 0);
      onCleanup(() => window.removeEventListener('click', close));
    }
  });

  const startEdit = () => {
    setEditName(layer().name);
    setEditing(true);
  };

  const commitEdit = async () => {
    const name = editName().trim();
    setEditing(false);
    if (!name || name === layer().name) return;
    await fetch(`/layer/${layer().id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).catch(e => console.warn('rename layer failed', e));
  };
  // Sort by seq (creation order) so the list is stable across refreshes and WS resyncs.
  // seq is a monotonic counter set by the server when the module is created.
  // Fallback to 0 for system modules (mixer) that don't have it.
  const modules = () =>
    Object.values(layer().modules || {})
      .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));

  const mixerModule = () => {
    const mid = layer().mixer_id;
    return mid ? layer().modules?.[mid] : null;
  };
  const meterData = () => {
    const mid = layer().mixer_id;
    if (!mid) return [0, 0];
    const levels = meterLevels();
    const entry = levels[mid];
    if (Array.isArray(entry)) return entry;
    return [entry ?? 0, 0];
  };
  // Track this layer's peak volume for relative normalization
  let peakVolume = 0.01;
  const meterLevel = () => {
    const raw = meterData()[0];
    // Expand peak as new highs come in
    if (raw > peakVolume) peakVolume = raw;
    // Slowly decay peak so it adapts to quieter sections
    peakVolume = peakVolume * 0.9995 + raw * 0.0005;
    // Normalize to 0..1 relative to this layer's own peak
    return Math.min(1, raw / Math.max(0.005, peakVolume));
  };
  const meterPitch = () => {
    // Server already log-scales est. frequency into 0..1 over 20Hz..4kHz.
    return Math.max(0, Math.min(1, meterData()[1]));
  };
  const pitchHue = () => {
    // Use full 360° wheel for maximum color separation
    return Math.round(meterPitch() * 360);
  };


  const deleteLayer = async () => {
    if (!confirm('Delete this layer and all its modules?')) return;
    await fetch(`/layer/${layer().id}`, { method: 'DELETE' })
      .catch(e => console.warn('delete layer failed', e));
  };

  return (
    <div class={`${props.showBorder ? 'border-b border-border' : ''} ${menuOpen() ? 'relative z-[500]' : ''}`} data-layer-reorder={layer().id}>
      {/* Section title — like MARIONETTE DATA */}
      <div
        class="flex items-center justify-between pt-6 pb-4 select-none"
        style="cursor:grab"
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          if (editing()) return;
          if (e.target.closest('[data-no-drag]')) return;
          const startX = e.clientX;
          const startY = e.clientY;
          let dragStarted = false;
          const THRESHOLD = 5;
          const layerEl = e.currentTarget.closest('[data-layer-reorder]');
          if (!layerEl) return;
          let hoverTarget = null;
          let indicator = null;

          const startDrag = () => {
            dragStarted = true;
            document.body.style.cursor = 'grabbing';
            layerEl.style.opacity = '0.3';
            indicator = document.createElement('div');
            indicator.style.cssText = 'position:absolute;height:1px;background:rgba(255,255,255,0.6);pointer-events:none;z-index:9999;display:none';
            document.body.appendChild(indicator);
          };

          const onMove = (ev) => {
            if (!dragStarted) {
              const dx = ev.clientX - startX;
              const dy = ev.clientY - startY;
              if (dx * dx + dy * dy < THRESHOLD * THRESHOLD) return;
              startDrag();
            }
            layerEl.style.pointerEvents = 'none';
            const el = document.elementFromPoint(ev.clientX, ev.clientY);
            layerEl.style.pointerEvents = '';
            const target = el?.closest('[data-layer-reorder]');
            if (target && target !== layerEl) {
              hoverTarget = target;
              const rect = target.getBoundingClientRect();
              indicator.style.display = '';
              indicator.style.left = `${rect.left}px`;
              indicator.style.top = `${rect.top - 1}px`;
              indicator.style.width = `${rect.width}px`;
            } else {
              hoverTarget = null;
              if (indicator) indicator.style.display = 'none';
            }
          };

          const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (!dragStarted) return;
            document.body.style.cursor = '';
            layerEl.style.opacity = '';
            indicator?.remove();
            // Block the subsequent click (collapse toggle)
            const blockClick = (ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              window.removeEventListener('click', blockClick, true);
            };
            window.addEventListener('click', blockClick, true);
            if (hoverTarget) {
              const fromId = layerEl.dataset.layerReorder;
              const toId = hoverTarget.dataset.layerReorder;
              if (fromId !== toId) props.onReorder?.(fromId, toId);
            }
          };

          window.addEventListener('mousemove', onMove);
          window.addEventListener('mouseup', onUp);
        }}
      >
        <div class="flex items-center gap-3">
          <svg
            width="24" height="24" viewBox="0 0 24 24"
            class="flex-shrink-0 cursor-pointer meter-dot"
            data-no-drag
            onClick={(e) => {
              e.stopPropagation();
              const mid = layer().mixer_id;
              if (!mid) return;
              const steps = 6;
              const duration = 160;
              if (!muted()) {
                const m = mixerModule();
                const levels = {};
                for (let i = 1; i <= 8; i++) {
                  levels[`level_${i}`] = m?.params?.[`level_${i}`] ?? 0.4;
                }
                setSavedLevels(levels);
                for (let s = 1; s <= steps; s++) {
                  setTimeout(() => {
                    const t = 1 - s / steps;
                    for (let i = 1; i <= 8; i++) {
                      scheduleParamPut(layer().id, mid, `level_${i}`, levels[`level_${i}`] * t);
                    }
                  }, (s - 1) * (duration / steps));
                }
              } else {
                const saved = savedLevels() || {};
                for (let s = 1; s <= steps; s++) {
                  setTimeout(() => {
                    const t = s / steps;
                    for (let i = 1; i <= 8; i++) {
                      scheduleParamPut(layer().id, mid, `level_${i}`, (saved[`level_${i}`] ?? 0.4) * t);
                    }
                  }, (s - 1) * (duration / steps));
                }
              }
            }}
          >
            <circle class="meter-dot-ring" cx="12" cy="12" r="11" fill="var(--color-bg-primary)" stroke="var(--color-border)" stroke-width="1" />
            {!muted() && <circle
              cx="12" cy="12"
              r={Math.max(0.5, Math.min(10, meterLevel() * 10))}
              fill={(() => {
                const h = pitchHue();
                const lvl = meterLevel();
                // Peak volume pushes toward white
                const peakBoost = Math.max(0, (lvl - 0.85) / 0.15);
                const lightness = 60 + peakBoost * 35;
                const saturation = 70 - peakBoost * 50;
                return `hsl(${h}, ${saturation}%, ${lightness}%)`;
              })()}
              opacity={0.1 + Math.min(1, meterLevel() * 1.3) * 0.9}
              style="transition:r 0.1s ease,fill 0.2s ease,opacity 0.1s ease"
            />}
            {muted() && <line x1="6" y1="6" x2="18" y2="18" stroke="var(--color-text-primary)" stroke-width="1.5" opacity="0.4" />}
          </svg>
          <Show when={!editing()}>
            <span class="type-section border-none m-0 pb-0">
              {layer().name}
            </span>
          </Show>
          <Show when={editing()}>
            <input
              type="text"
              data-no-drag
              class="type-section border-none m-0 p-0 bg-transparent outline-none text-text-primary"
              style="font-family:var(--font-heading);width:auto;min-width:1ch"
              value={editName()}
              size={Math.max(1, editName().length)}
              onInput={(e) => { setEditName(e.target.value); e.target.size = Math.max(1, e.target.value.length); }}
              onBlur={commitEdit}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditing(false);
              }}
              ref={(el) => setTimeout(() => el.focus(), 0)}
            />
          </Show>
          <span class="type-tag text-label" style="position:relative;top:1px">{layer().id.slice(0, 8)}</span>
        </div>
      </div>

      <div class="flex flex-wrap gap-3 items-start" style="padding-top:16px;padding-bottom:24px">
        <TransitionGroup name="dcmod">
          <For each={modules()}>
            {(mod) => (
              <ModuleCard mod={mod} layer={layer()} />
            )}
          </For>
        </TransitionGroup>
      </div>
    </div>
  );
}
