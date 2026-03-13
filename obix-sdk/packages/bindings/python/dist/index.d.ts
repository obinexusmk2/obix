/**
 * OBIX Python Binding
 * ML/AI integration, data science workflows
 * Connects libpolycall FFI/polyglot bridge to Python runtime
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
 * FFI descriptor for Python runtime
 * Defines how Python interops with libpolycall
 */
export interface PythonFFIDescriptor {
    ffiPath: string;
    pythonVersion: string;
    ctypesSupport: boolean;
    cffiEnabled: boolean;
    numpyInterop: boolean;
    numpyVersion?: string;
}
/**
 * Configuration for Python binding
 * Specifies how libpolycall connects to Python runtime
 */
export interface PythonBindingConfig {
    ffiPath: string;
    pythonPath: string;
    virtualEnv?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    numpyInterop?: boolean;
    pandasInterop?: boolean;
    torchInterop?: boolean;
    tensorflowInterop?: boolean;
    pythonVersion?: string;
    gcCollectCyclesInterval?: number;
    ffiDescriptor?: PythonFFIDescriptor;
}
/**
 * Bridge interface for Python runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface PythonBindingBridge {
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
        rssBytes: number;
        heapBytes: number;
        numpyArrayBytes: number;
        torchTensorBytes: number;
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
     * Execute garbage collection in Python runtime
     */
    forceGarbageCollection(): Promise<void>;
}
/**
 * Create a Python binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createPythonBinding(config: PythonBindingConfig): PythonBindingBridge;
//# sourceMappingURL=index.d.ts.map