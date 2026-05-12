// Compatibility shim — drone components import from '../ws'. Here it's just a
// re-export from the local engine. No WebSocket, no remote.
export { scheduleParamPut, sendOsc, boot } from './engine';
