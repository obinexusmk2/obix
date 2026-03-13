/**
 * OBIX Zig Binding
 * Systems programming, compile-time optimization
 * Connects libpolycall FFI/polyglot bridge to Zig runtime
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
 * FFI descriptor for Zig runtime
 * Defines how Zig interops with libpolycall
 */
export interface ZigFFIDescriptor {
    ffiPath: string;
    zigVersion: string;
    compileTarget: 'native' | 'wasm32-wasi' | 'wasm32-emscripten' | 'x86_64-linux-gnu' | 'x86_64-windows' | 'aarch64-linux-gnu' | 'aarch64-darwin';
    buildMode: 'Debug' | 'ReleaseSafe' | 'ReleaseFast' | 'ReleaseSmall';
    compileTimeOptimization: boolean;
}
/**
 * Configuration for Zig binding
 * Specifies how libpolycall connects to Zig runtime
 */
export interface ZigBindingConfig {
    ffiPath: string;
    zigVersion?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    compileTarget?: string;
    buildMode?: 'Debug' | 'ReleaseSafe' | 'ReleaseFast' | 'ReleaseSmall';
    compileTimeEvaluation?: boolean;
    compileTimeOptimization?: boolean;
    allocator?: 'general-purpose' | 'arena' | 'stack' | 'page';
    llvmOptLevel?: '0' | '1' | '2' | '3' | 's' | 'z';
    ffiDescriptor?: ZigFFIDescriptor;
}
/**
 * Bridge interface for Zig runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface ZigBindingBridge {
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
        allocatedBytes: number;
        freedBytes: number;
        arenaBytes: number;
        stackBytes: number;
        allocationCount: number;
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
     * Compile and link Zig code at runtime
     */
    compileCode(zigSource: string, targetName?: string): Promise<ArrayBuffer>;
    /**
     * Get compile-time evaluation results
     */
    getCompileTimeResults(): Promise<object>;
    /**
     * Allocate memory with specified allocator
     */
    allocate(sizeBytes: number, allocatorType?: string): Promise<number>;
}
/**
 * Create a Zig binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createZigBinding(config: ZigBindingConfig): ZigBindingBridge;
//# sourceMappingURL=index.d.ts.map