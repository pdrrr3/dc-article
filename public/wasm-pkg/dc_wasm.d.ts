/* tslint:disable */
/* eslint-disable */

export class Engine {
    free(): void;
    [Symbol.dispose](): void;
    addModule(type_name: string): string | undefined;
    clearPlock(id: string, step: number, target: string, param: string): void;
    connect(from: string, from_port: number, to: string, to_port: number): string | undefined;
    /**
     * Returns the current playing step index for a sequencer module, or -1.
     */
    currentStep(id: string): number;
    disableMeter(id: string): void;
    disconnect(conn_id: string): void;
    enableMeter(id: string): void;
    masterId(): string;
    /**
     * Flat array: for each metered module, [id_hi32, id_mid32_a, id_mid32_b, id_lo32, rms*65535, brightness*65535].
     * JS decodes back to (id_string, rms, brightness).
     * To keep things simple, return a JSON string instead.
     */
    meterLevels(): string;
    static moduleTypes(): any[];
    constructor(sample_rate: number);
    /**
     * Returns JSON `{ "inputs": ["port_name",...], "outputs": [...] }` for the given module type.
     */
    static portsFor(type_name: string): string;
    /**
     * Fill `left` and `right` with `len` samples. Both slices must be length `len`.
     * Calls graph.process and copies master output. Designed to be called once per
     * AudioWorklet quantum (128 samples).
     */
    process(left: Float32Array, right: Float32Array): void;
    removeModule(id: string): void;
    setBpm(bpm: number): void;
    setParam(id: string, name: string, value: number): void;
    setPlock(id: string, step: number, target: string, param: string, value: number): void;
    setStep(id: string, step: number, gate?: boolean | null, pitch?: number | null, velocity?: number | null, length?: number | null, probability?: number | null): void;
}

export function _start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_engine_free: (a: number, b: number) => void;
    readonly engine_addModule: (a: number, b: number, c: number) => [number, number];
    readonly engine_clearPlock: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly engine_connect: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => [number, number];
    readonly engine_currentStep: (a: number, b: number, c: number) => number;
    readonly engine_disableMeter: (a: number, b: number, c: number) => void;
    readonly engine_disconnect: (a: number, b: number, c: number) => void;
    readonly engine_enableMeter: (a: number, b: number, c: number) => void;
    readonly engine_masterId: (a: number) => [number, number];
    readonly engine_meterLevels: (a: number) => [number, number];
    readonly engine_moduleTypes: () => [number, number];
    readonly engine_new: (a: number) => number;
    readonly engine_portsFor: (a: number, b: number) => [number, number];
    readonly engine_process: (a: number, b: number, c: number, d: any, e: number, f: number, g: any) => void;
    readonly engine_removeModule: (a: number, b: number, c: number) => void;
    readonly engine_setBpm: (a: number, b: number) => void;
    readonly engine_setParam: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly engine_setPlock: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly engine_setStep: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly _start: () => void;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
