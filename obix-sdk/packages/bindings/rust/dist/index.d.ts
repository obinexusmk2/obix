/**
 * OBIX Rust Binding
 * Performance-critical components, WebAssembly target
 * Connects libpolycall FFI/polyglot bridge to Rust runtime
 */
export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';
export interface InvocationEnvelope {
    functionId: string;
    args: unknown[];
    metadata: {
        schemaMode: SchemaMode;
        binding: string;
        timestampMs: number;
        ffiPath: string;
    };
}
export interface BindingInvokeError {
    code: 'NOT_INITIALIZED' | 'MISSING_SYMBOL' | 'INVOCATION_FAILED';
    message: string;
    envelope: InvocationEnvelope;
    cause?: unknown;
}
export interface BindingAbiInvoker {
    invoke(envelopeJson: string): unknown | Promise<unknown>;
}
/**
 * FFI descriptor for Rust runtime
 * Defines how Rust interops with libpolycall
 */
export interface RustFFIDescriptor {
    ffiPath: string;
    wasmTarget: 'wasm32-unknown-unknown' | 'wasm32-wasi' | 'wasm32-unknown-emscripten';
    rustVersion: string;
    bindgenConfig?: {
        useFfiUnwind: boolean;
        implementDefault: boolean;
    };
    crateFeatures: string[];
}
/**
 * Configuration for Rust binding
 * Specifies how libpolycall connects to Rust runtime
 */
export interface RustBindingConfig {
    ffiPath: string;
    wasmTarget?: 'wasm32-unknown-unknown' | 'wasm32-wasi' | 'wasm32-unknown-emscripten';
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    crateFeatures?: string[];
    bindgenConfig?: {
        useFfiUnwind?: boolean;
        implementDefault?: boolean;
        useFfiPtrs?: boolean;
    };
    optimizationLevel?: 'dev' | 'release';
    ltoEnabled?: boolean;
    wasmMemory?: WebAssembly.Memory;
    ffiDescriptor?: RustFFIDescriptor;
}
/**
 * Bridge interface for Rust runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface RustBindingBridge {
    /**
     * Initialize the binding and connect to libpolycall
     */
    initialize(): Promise<void>;
    /**
     * Invoke a polyglot function through libpolycall
     * @param fn Function name or descriptor
     * @param args Arguments to pass to function
     * @returns Result from polyglot function
     */
    invoke(fn: string | object, args: unknown[]): Promise<unknown>;
    /**
     * Clean up resources and disconnect from libpolycall
     */
    destroy(): Promise<void>;
    /**
     * Get current memory usage of the binding
     * @returns Memory usage statistics
     */
    getMemoryUsage(): {
        wasmMemoryPages: number;
        wasmMemoryBytes: number;
        heapAllocationBytes: number;
        stackBytes: number;
    };
    /**
     * Get schema mode of current binding
     */
    getSchemaMode(): SchemaMode;
    /**
     * Check if binding is initialized and ready
     */
    isInitialized(): boolean;
    /**
     * Compile and deploy new Rust code to WASM
     */
    compileAndDeploy(wasmBuffer: ArrayBuffer): Promise<void>;
}
/**
 * Create a Rust binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createRustBinding(config: RustBindingConfig): RustBindingBridge;
//# sourceMappingURL=index.d.ts.map