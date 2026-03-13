/**
 * OBIX Lua Binding
 * Game engine integration (Love2D, Roblox), scripting
 * Connects libpolycall FFI/polyglot bridge to Lua runtime
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
 * FFI descriptor for Lua runtime
 * Defines how Lua interops with libpolycall
 */
export interface LuaFFIDescriptor {
    ffiPath: string;
    luaVersion: '5.1' | '5.2' | '5.3' | '5.4' | 'luajit' | 'love2d' | 'roblox';
    luajitEnabled: boolean;
    ffiLibEnabled: boolean;
    metatableSupport: boolean;
}
/**
 * Configuration for Lua binding
 * Specifies how libpolycall connects to Lua runtime
 */
export interface LuaBindingConfig {
    ffiPath: string;
    luaVersion?: '5.1' | '5.2' | '5.3' | '5.4' | 'luajit' | 'love2d' | 'roblox';
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    luajitEnabled?: boolean;
    ffiLibEnabled?: boolean;
    metatableSupport?: boolean;
    sandboxMode?: boolean;
    gcStepMultiplier?: number;
    gameEngineTarget?: 'love2d' | 'roblox' | 'custom';
    ffiDescriptor?: LuaFFIDescriptor;
}
/**
 * Bridge interface for Lua runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface LuaBindingBridge {
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
        memoryUsedKb: number;
        gcCount: number;
        tableCount: number;
        userDataCount: number;
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
     * Execute a Lua script string
     */
    executeScript(script: string): Promise<unknown>;
    /**
     * Trigger garbage collection
     */
    triggerGarbageCollection(): Promise<void>;
}
/**
 * Create a Lua binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createLuaBinding(config: LuaBindingConfig): LuaBindingBridge;
//# sourceMappingURL=index.d.ts.map