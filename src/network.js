// Stub network module — kept so copied drone components that import wsUrl/apiFetch
// resolve. Everything is local; we never actually open a remote WS.
import { createSignal } from 'solid-js';

export const [connectionMode] = createSignal('standalone');
export const [remoteOrigin] = createSignal('');
export const activeHostLabel = () => 'local';
export function wsUrl(path) {
  // Return a URL that points nowhere; SeqGrid/ScopeCanvas will fail to connect
  // and silently stay idle. That's fine for the interactive demo.
  return `ws://0.0.0.0:0${path}`;
}
export async function apiFetch(path, opts) {
  return fetch(path, opts);
}
export function initConnectionFromLocation() {}
export function installFetchProxy() {}
