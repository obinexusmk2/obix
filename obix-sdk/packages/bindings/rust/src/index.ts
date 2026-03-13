/**
 * OBIX Rust Binding
 * Performance-critical components, WebAssembly target
 * Connects libpolycall FFI/polyglot bridge to Rust runtime
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
 * FFI descriptor for Rust runtime
 * Defines how Rust interops with libpolycall
 */
export interface RustFFIDescriptor {
  ffiPath: string;
  wasmTarget: 'wasm32-unknown-unknown' | 'wasm32-wasi' | 'wasm32-unknown-emscripten';
  rustVersion: string;
  bindgenConfig?: {
    useFfiUnwind: boolean;
    implementDefault: boolean;
  };
  crateFeatures: string[];
}

/**
 * Configuration for Rust binding
 * Specifies how libpolycall connects to Rust runtime
 */
export interface RustBindingConfig {
  ffiPath: string;
  wasmTarget?: 'wasm32-unknown-unknown' | 'wasm32-wasi' | 'wasm32-unknown-emscripten';
  schemaMode: SchemaMode;
  memoryModel: 'gc' | 'manual' | 'hybrid';
  crateFeatures?: string[];
  bindgenConfig?: {
    useFfiUnwind?: boolean;
    implementDefault?: boolean;
    useFfiPtrs?: boolean;
  };
  optimizationLevel?: 'dev' | 'release';
  ltoEnabled?: boolean;
  wasmMemory?: WebAssembly.Memory;
  ffiDescriptor?: RustFFIDescriptor;
}

/**
 * Bridge interface for Rust runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface RustBindingBridge {
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
    wasmMemoryPages: number;
    wasmMemoryBytes: number;
    heapAllocationBytes: number;
    stackBytes: number;
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
   * Compile and deploy new Rust code to WASM
   */
  compileAndDeploy(wasmBuffer: ArrayBuffer): Promise<void>;
}

/**
 * Create a Rust binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export function createRustBinding(
  config: RustBindingConfig
): RustBindingBridge {
  let initialized = false;
  const abiBindingName = 'rust';
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
        wasmMemoryPages: 0,
        wasmMemoryBytes: 0,
        heapAllocationBytes: 0,
        stackBytes: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async compileAndDeploy(wasmBuffer: ArrayBuffer): Promise<void> {
      // Stub implementation
      console.log('Compiling and deploying Rust WASM module');
    },
  };
}

