/**
 * OBIX C# Binding
 * Unity integration, .NET ecosystem
 * Connects libpolycall FFI/polyglot bridge to C#/.NET runtime
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
export function createCsharpBinding(config: CsharpBindingConfig): CsharpBindingBridge {
  let initialized = false;
  const abiBindingName = 'csharp';
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
        managedHeapBytes: 0,
        unmanagedHeapBytes: 0,
        totalAssembliesBytes: 0,
        gen0Collections: 0,
        gen1Collections: 0,
        gen2Collections: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async loadAssembly(assemblyPath: string): Promise<object> {
      // Stub implementation
      console.log('Loading C# assembly:', assemblyPath);
      return {};
    },

    async createGameObject(gameObjectName: string, components: string[]): Promise<string> {
      // Stub implementation
      console.log('Creating Unity GameObject:', gameObjectName);
      return 'gameobject-id';
    },

    async forceGarbageCollection(): Promise<void> {
      // Stub implementation
      console.log('Forcing .NET garbage collection');
    },
  };
}

