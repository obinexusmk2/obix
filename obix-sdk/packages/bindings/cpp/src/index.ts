/**
 * OBIX C++ Binding
 * Legacy system integration, embedded targets
 * Connects libpolycall FFI/polyglot bridge to C++ runtime
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
 * FFI descriptor for C++ runtime
 * Defines how C++ interops with libpolycall
 */
export interface CppFFIDescriptor {
  ffiPath: string;
  cppStandard: 'c++11' | 'c++14' | 'c++17' | 'c++20';
  compiler: 'gcc' | 'clang' | 'msvc';
  swig: {
    enabled: boolean;
    targetLanguages?: string[];
  };
}

/**
 * Configuration for C++ binding
 * Specifies how libpolycall connects to C++ runtime
 */
export interface CppBindingConfig {
  ffiPath: string;
  cppStandard?: 'c++11' | 'c++14' | 'c++17' | 'c++20';
  schemaMode: SchemaMode;
  memoryModel: 'gc' | 'manual' | 'hybrid';
  compiler?: 'gcc' | 'clang' | 'msvc';
  swigEnabled?: boolean;
  smartPointerPolicy?: 'shared_ptr' | 'unique_ptr' | 'raw';
  exceptionHandling?: boolean;
  rttEnabled?: boolean;
  ffiDescriptor?: CppFFIDescriptor;
}

/**
 * Bridge interface for C++ runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface CppBindingBridge {
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
    heapBytes: number;
    stackBytes: number;
    staticBytes: number;
    externalMemoryBytes: number;
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
   * Load a C++ shared library or DLL
   */
  loadLibrary(libPath: string): Promise<void>;

  /**
   * Unload a C++ shared library
   */
  unloadLibrary(libPath: string): Promise<void>;
}

/**
 * Create a C++ binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export function createCppBinding(config: CppBindingConfig): CppBindingBridge {
  let initialized = false;
  const abiBindingName = 'cpp';
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
        heapBytes: 0,
        stackBytes: 0,
        staticBytes: 0,
        externalMemoryBytes: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async loadLibrary(libPath: string): Promise<void> {
      // Stub implementation
      console.log('Loading C++ library:', libPath);
    },

    async unloadLibrary(libPath: string): Promise<void> {
      // Stub implementation
      console.log('Unloading C++ library:', libPath);
    },
  };
}

