/**
 * OBIX Swift Binding
 * iOS/macOS native rendering bridge
 * Connects libpolycall FFI/polyglot bridge to Swift runtime
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
 * FFI descriptor for Swift runtime
 * Defines how Swift interops with libpolycall
 */
export interface SwiftFFIDescriptor {
    ffiPath: string;
    swiftVersion: string;
    objcBridgingHeader?: string;
    swiftBridgeModuleName?: string;
    iosDeploymentTarget?: string;
    macosDeploymentTarget?: string;
}
/**
 * Configuration for Swift binding
 * Specifies how libpolycall connects to Swift runtime
 */
export interface SwiftBindingConfig {
    ffiPath: string;
    swiftVersion?: string;
    schemaMode: SchemaMode;
    memoryModel: 'gc' | 'manual' | 'hybrid';
    objcBridging?: boolean;
    swiftConcurrencyEnabled?: boolean;
    asyncAwaitSupport?: boolean;
    iosDeploymentTarget?: string;
    macosDeploymentTarget?: string;
    tvosDeploymentTarget?: string;
    watchosDeploymentTarget?: string;
    ffiDescriptor?: SwiftFFIDescriptor;
}
/**
 * Bridge interface for Swift runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface SwiftBindingBridge {
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
        heapAllocatedBytes: number;
        autoreleasepoolBytes: number;
        objectCount: number;
        nativeMemoryBytes: number;
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
     * Render a view hierarchy through libpolycall
     */
    renderView(viewDescriptor: object): Promise<void>;
    /**
     * Handle touch/input event from UI
     */
    handleUIEvent(eventType: string, eventData: object): Promise<unknown>;
}
/**
 * Create a Swift binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export declare function createSwiftBinding(config: SwiftBindingConfig): SwiftBindingBridge;
//# sourceMappingURL=index.d.ts.map