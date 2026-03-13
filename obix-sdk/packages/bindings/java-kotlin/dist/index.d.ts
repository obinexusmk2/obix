/**
 * OBIX Java/Kotlin Binding
 * Android native, enterprise backend
 * Connects libpolycall FFI/polyglot bridge to JVM runtime
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
 * FFI descriptor for Java/Kotlin runtime
 * Defines how Java/Kotlin interops with libpolycall
 */
export interface JavaKotlinFFIDescriptor {
    ffiPath: string;
    javaVersion: string;
    jniEnabled: boolean;
    jniLibPath?: string;
    kotlinEnabled: boolean;
    androidSdkLevel?: number;
}
/**
 * Configuration for Java/Kotlin binding
 * Specifies how libpolycall connects to JVM runtime
 */
export interface JavaKotlinBindingConfig {
    ffiPath: string;
    javaVersion?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    jniEnabled?: boolean;
    jniLibPath?: string;
    kotlinEnabled?: boolean;
    androidTarget?: boolean;
    androidSdkLevel?: number;
    classpath?: string[];
    jvmOptions?: string[];
    heapSizeMaxMb?: number;
    ffiDescriptor?: JavaKotlinFFIDescriptor;
}
/**
 * Bridge interface for Java/Kotlin runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface JavaKotlinBindingBridge {
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
        heapUsedBytes: number;
        heapMaxBytes: number;
        nonHeapBytes: number;
        objectCount: number;
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
     * Load a Java class and get a proxy for it
     */
    loadClass(className: string): Promise<object>;
    /**
     * Trigger JVM garbage collection
     */
    forceGarbageCollection(): Promise<void>;
    /**
     * Create a thread pool for executing tasks
     */
    createThreadPool(poolSize: number): Promise<string>;
}
/**
 * Create a Java/Kotlin binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createJavaKotlinBinding(config: JavaKotlinBindingConfig): JavaKotlinBindingBridge;
//# sourceMappingURL=index.d.ts.map