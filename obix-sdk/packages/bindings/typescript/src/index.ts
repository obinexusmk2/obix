/**
 * OBIX TypeScript Binding
 * Primary web runtime, Node.js & browser
 * Connects libpolycall FFI/polyglot bridge to TypeScript runtime
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
 * FFI descriptor for TypeScript runtime
 * Defines how TypeScript interops with libpolycall
 */
export interface TypeScriptFFIDescriptor {
  ffiPath: string;
  runtimeType: 'browser' | 'node' | 'deno' | 'bun';
  wasm: {
    enabled: boolean;
    wasmPath?: string;
    wasmMemory?: WebAssembly.Memory;
  };
  asyncSupport: boolean;
  promiseIntegration: boolean;
}

/**
 * Configuration for TypeScript binding
 * Specifies how libpolycall connects to TypeScript runtime
 */
export interface TypeScriptBindingConfig {
  ffiPath: string;
  runtimeType: 'browser' | 'node' | 'deno' | 'bun';
  schemaMode: SchemaMode;
  memoryModel: 'gc' | 'manual' | 'hybrid';
  wasmSupport?: boolean;
  wasmPath?: string;
  asyncMode?: 'promise' | 'callback' | 'stream';
  maxPoolSize?: number;
  timeoutMs?: number;
  ffiDescriptor?: TypeScriptFFIDescriptor;
}

/**
 * Bridge interface for TypeScript runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface TypeScriptBindingBridge {
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
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };

  /**
   * Get schema mode of current binding
   */
  getSchemaMode(): SchemaMode;

  /**
   * Check if binding is initialized and ready
   */
  isInitialized(): boolean;
}

/**
 * Create a TypeScript binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export function createTypeScriptBinding(
  config: TypeScriptBindingConfig
): TypeScriptBindingBridge {
  let initialized = false;
  const abiBindingName = 'typescript';
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
      // Node.js environment check
      try {
        const proc = (globalThis as any).process;
        if (proc && typeof proc.memoryUsage === 'function') {
          return proc.memoryUsage();
        }
      } catch {
        // Not Node.js environment
      }
      return {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },
  };
}

