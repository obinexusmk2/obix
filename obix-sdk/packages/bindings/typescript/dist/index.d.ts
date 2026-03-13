/**
 * OBIX TypeScript Binding
 * Primary web runtime, Node.js & browser
 * Connects libpolycall FFI/polyglot bridge to TypeScript runtime
 */
export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';
/**
 * FFI descriptor for TypeScript runtime
 * Defines how TypeScript interops with libpolycall
 */
export interface TypeScriptFFIDescriptor {
    ffiPath: string;
    runtimeType: 'browser' | 'node' | 'deno' | 'bun';
    wasm: {
        enabled: boolean;
        wasmPath?: string;
        wasmMemory?: WebAssembly.Memory;
    };
    asyncSupport: boolean;
    promiseIntegration: boolean;
}
/**
 * Configuration for TypeScript binding
 * Specifies how libpolycall connects to TypeScript runtime
 */
export interface TypeScriptBindingConfig {
    ffiPath: string;
    runtimeType: 'browser' | 'node' | 'deno' | 'bun';
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    wasmSupport?: boolean;
    wasmPath?: string;
    asyncMode?: 'promise' | 'callback' | 'stream';
    maxPoolSize?: number;
    timeoutMs?: number;
    ffiDescriptor?: TypeScriptFFIDescriptor;
}
/**
 * Bridge interface for TypeScript runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface TypeScriptBindingBridge {
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
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    /**
     * Get schema mode of current binding
     */
    getSchemaMode(): SchemaMode;
    /**
     * Check if binding is initialized and ready
     */
    isInitialized(): boolean;
}
/**
 * Create a TypeScript binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createTypeScriptBinding(config: TypeScriptBindingConfig): TypeScriptBindingBridge;
//# sourceMappingURL=index.d.ts.map