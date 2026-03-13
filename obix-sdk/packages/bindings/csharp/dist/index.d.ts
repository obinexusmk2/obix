/**
 * OBIX C# Binding
 * Unity integration, .NET ecosystem
 * Connects libpolycall FFI/polyglot bridge to C#/.NET runtime
 */
export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';
/**
 * FFI descriptor for C# runtime
 * Defines how C# interops with libpolycall
 */
export interface CsharpFFIDescriptor {
    ffiPath: string;
    dotnetVersion: string;
    clrVersion?: string;
    unityVersion?: string;
    pInvokeEnabled: boolean;
    nativeAotCompatible: boolean;
}
/**
 * Configuration for C# binding
 * Specifies how libpolycall connects to C#/.NET runtime
 */
export interface CsharpBindingConfig {
    ffiPath: string;
    dotnetVersion?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    pInvokeEnabled?: boolean;
    nativeAotCompatible?: boolean;
    unityEnabled?: boolean;
    unityVersion?: string;
    asyncTaskSupport?: boolean;
    gcMode?: 'workstation' | 'server' | 'concurrent';
    heapCountMax?: number;
    ffiDescriptor?: CsharpFFIDescriptor;
}
/**
 * Bridge interface for C# runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface CsharpBindingBridge {
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
        managedHeapBytes: number;
        unmanagedHeapBytes: number;
        totalAssembliesBytes: number;
        gen0Collections: number;
        gen1Collections: number;
        gen2Collections: number;
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
     * Load a .NET assembly
     */
    loadAssembly(assemblyPath: string): Promise<object>;
    /**
     * Create a Unity GameObject and attach components
     */
    createGameObject(gameObjectName: string, components: string[]): Promise<string>;
    /**
     * Trigger .NET garbage collection
     */
    forceGarbageCollection(): Promise<void>;
}
/**
 * Create a C# binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createCsharpBinding(config: CsharpBindingConfig): CsharpBindingBridge;
//# sourceMappingURL=index.d.ts.map