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

function normalizeFunctionIdentifier(fn: string | object): string | undefined {
  if (typeof fn === 'string' && fn.trim()) return fn;
  if (fn && typeof fn === 'object') {
    const descriptor = fn as { functionId?: string; id?: string; name?: string };
    return descriptor.functionId ?? descriptor.id ?? descriptor.name;
  }
  return undefined;
}

/**
 * FFI descriptor for Zig runtime
 * Defines how Zig interops with libpolycall
 */
export interface ZigFFIDescriptor {
  ffiPath: string;
  zigVersion: string;
  compileTarget:
    | 'native'
    | 'wasm32-wasi'
    | 'wasm32-emscripten'
    | 'x86_64-linux-gnu'
    | 'x86_64-windows'
    | 'aarch64-linux-gnu'
    | 'aarch64-darwin';
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
export function createZigBinding(config: ZigBindingConfig): ZigBindingBridge {
  let initialized = false;
  const abiBindingName = 'zig';
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
        allocatedBytes: 0,
        freedBytes: 0,
        arenaBytes: 0,
        stackBytes: 0,
        allocationCount: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async compileCode(zigSource: string, targetName?: string): Promise<ArrayBuffer> {
      // Stub implementation
      console.log('Compiling Zig code');
      return new ArrayBuffer(0);
    },

    async getCompileTimeResults(): Promise<object> {
      // Stub implementation
      console.log('Getting compile-time results');
      return {};
    },

    async allocate(sizeBytes: number, allocatorType?: string): Promise<number> {
      // Stub implementation
      console.log('Allocating', sizeBytes, 'bytes');
      return 0;
    },
  };
}

