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

function normalizeFunctionIdentifier(fn: string | object): string | undefined {
  if (typeof fn === 'string' && fn.trim()) return fn;
  if (fn && typeof fn === 'object') {
    const descriptor = fn as { functionId?: string; id?: string; name?: string };
    return descriptor.functionId ?? descriptor.id ?? descriptor.name;
  }
  return undefined;
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
export function createSwiftBinding(config: SwiftBindingConfig): SwiftBindingBridge {
  let initialized = false;
  const abiBindingName = 'swift';
  return {
    async initialize(): Promise<void> {
      if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
        throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
      }
      initialized = true;
    },

    async invoke(fn: string | object, args: unknown[]): Promise<unknown> {
      const functionId = normalizeFunctionIdentifier(fn);
      const envelope: InvocationEnvelope = {
        functionId: functionId ?? '<unknown>',
        args,
        metadata: {
          schemaMode: config.schemaMode,
          binding: abiBindingName,
          timestampMs: Date.now(),
          ffiPath: config.ffiPath,
        },
      };

      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope } satisfies BindingInvokeError;
      }

      if (!functionId) {
        return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope } satisfies BindingInvokeError;
      }

      const abiInvoker = (globalThis as typeof globalThis & { __obixAbiInvoker?: BindingAbiInvoker }).__obixAbiInvoker;
      if (!abiInvoker?.invoke) {
        return {
          code: 'MISSING_SYMBOL',
          message: 'Required ABI symbol __obixAbiInvoker.invoke is unavailable',
          envelope,
        } satisfies BindingInvokeError;
      }

      try {
        return await abiInvoker.invoke(JSON.stringify(envelope));
      } catch (cause) {
        return {
          code: 'INVOCATION_FAILED',
          message: 'Invocation failed at ABI boundary',
          envelope,
          cause,
        } satisfies BindingInvokeError;
      }
    },

    async destroy(): Promise<void> {
      initialized = false;
    },

    getMemoryUsage() {
      return {
        heapAllocatedBytes: 0,
        autoreleasepoolBytes: 0,
        objectCount: 0,
        nativeMemoryBytes: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async renderView(viewDescriptor: object): Promise<void> {
      // Stub implementation
      console.log('Rendering Swift view');
    },

    async handleUIEvent(eventType: string, eventData: object): Promise<unknown> {
      // Stub implementation
      console.log('Handling Swift UI event:', eventType);
      return undefined;
    },
  };
}

