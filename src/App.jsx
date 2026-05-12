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

  return (
    <div
      class="dc-engine relative flex flex-col bg-bg-primary bg-dotted border border-border overflow-hidden"
      style="height:78vh;min-height:560px"
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      <div class="flex-1 flex relative items-stretch min-h-0">
        <ChatPanel />
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
    <div class="flex flex-col min-h-full" style="gap:0;padding-bottom:120px">
      <For each={layers()}>
        {(layer) => (
          <LayerCard layer={layer} onAddModule={props.onAddModule} showBorder={false} onReorder={() => {}} />
        )}
      </For>
    </div>
  );
}
