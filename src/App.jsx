import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { session, wsConnected, patchFrom, setPatchFrom, patchMsg, clearPatchMsg, setMeterLevels } from './store';
import { boot } from './engine';
import LayerCard from './components/LayerCard';
import CableCanvas from './components/CableCanvas';
import AddModuleModal from './components/AddModuleModal';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [bootFailed, setBootFailed] = createSignal(false);
  const [addModuleLayer, setAddModuleLayer] = createSignal(null);
  const [chatWidth, setChatWidth] = createSignal(30);
  let splitContainerEl;

  onMount(async () => {
    const ok = await boot();
    if (!ok) setBootFailed(true);

    const meterInterval = setInterval(async () => {
      try {
        const res = await fetch('/meters');
        if (res.ok) setMeterLevels(await res.json());
      } catch {}
    }, 150);
    onCleanup(() => clearInterval(meterInterval));
  });

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setPatchFrom(null);
      clearPatchMsg();
      if (addModuleLayer()) setAddModuleLayer(null);
    }
  };

  const onSplitterDown = (e) => {
    e.preventDefault();
    if (!splitContainerEl) return;
    const containerEl = splitContainerEl;
    const onMove = (ev) => {
      const rect = containerEl.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setChatWidth(Math.max(15, Math.min(75, pct)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      class="dc-engine relative flex flex-col bg-bg-primary bg-dotted border border-border overflow-hidden"
      style="height:78vh;min-height:560px"
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <div ref={(el) => (splitContainerEl = el)} class="dc-engine-layout flex-1 flex relative items-stretch min-h-0">
        <div class="dc-chat-pane flex-shrink-0 h-full overflow-hidden" style={`width:${chatWidth()}%`}>
          <ChatPanel />
        </div>
        <div class="dc-splitter flex-shrink-0 h-full" onMouseDown={onSplitterDown} />
        <div class="dc-layers-scroll flex-1 relative min-w-0 overflow-y-auto overflow-x-auto">
          <Show when={bootFailed()}>
            <div class="p-6 data-label text-base">Engine failed to start.</div>
          </Show>
          <Show when={!bootFailed()}>
            <LayersPanel onAddModule={(layerId) => setAddModuleLayer(layerId)} />
          </Show>
        </div>
      </div>

      <CableCanvas />

      <Show when={patchMsg()}>
        <div class="type-label fixed bottom-3 left-1/2 -translate-x-1/2 border border-border px-4 py-1 z-[200] whitespace-nowrap bg-bg-secondary text-text-primary">
          {patchMsg()}
        </div>
      </Show>

      <Show when={addModuleLayer()}>
        <AddModuleModal layerId={addModuleLayer()} onClose={() => setAddModuleLayer(null)} />
      </Show>
    </div>
  );
}

function LayersPanel(props) {
  const layers = () => Object.values(session.layers || {});
  return (
    <div class="dc-layers-panel flex flex-col min-h-full" style="gap:0;padding:16px 20px 120px 20px">
      <For each={layers()}>
        {(layer) => (
          <LayerCard layer={layer} onAddModule={props.onAddModule} showBorder={false} onReorder={() => {}} />
        )}
      </For>
    </div>
  );
}
