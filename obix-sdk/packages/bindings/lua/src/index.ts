/**
 * OBIX Lua Binding
 * Game engine integration (Love2D, Roblox), scripting
 * Connects libpolycall FFI/polyglot bridge to Lua runtime
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
 * FFI descriptor for Lua runtime
 * Defines how Lua interops with libpolycall
 */
export interface LuaFFIDescriptor {
  ffiPath: string;
  luaVersion: '5.1' | '5.2' | '5.3' | '5.4' | 'luajit' | 'love2d' | 'roblox';
  luajitEnabled: boolean;
  ffiLibEnabled: boolean;
  metatableSupport: boolean;
}

/**
 * Configuration for Lua binding
 * Specifies how libpolycall connects to Lua runtime
 */
export interface LuaBindingConfig {
  ffiPath: string;
  luaVersion?: '5.1' | '5.2' | '5.3' | '5.4' | 'luajit' | 'love2d' | 'roblox';
  schemaMode: SchemaMode;
  memoryModel: 'gc' | 'manual' | 'hybrid';
  luajitEnabled?: boolean;
  ffiLibEnabled?: boolean;
  metatableSupport?: boolean;
  sandboxMode?: boolean;
  gcStepMultiplier?: number;
  gameEngineTarget?: 'love2d' | 'roblox' | 'custom';
  ffiDescriptor?: LuaFFIDescriptor;
}

/**
 * Bridge interface for Lua runtime
 * Methods to invoke polyglot functions and manage runtime state
 */
export interface LuaBindingBridge {
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
    memoryUsedKb: number;
    gcCount: number;
    tableCount: number;
    userDataCount: number;
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
   * Execute a Lua script string
   */
  executeScript(script: string): Promise<unknown>;

  /**
   * Trigger garbage collection
   */
  triggerGarbageCollection(): Promise<void>;
}

/**
 * Create a Lua binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export function createLuaBinding(config: LuaBindingConfig): LuaBindingBridge {
  let initialized = false;
  const abiBindingName = 'lua';
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
        memoryUsedKb: 0,
        gcCount: 0,
        tableCount: 0,
        userDataCount: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async executeScript(script: string): Promise<unknown> {
      // Stub implementation
      console.log('Executing Lua script');
      return undefined;
    },

    async triggerGarbageCollection(): Promise<void> {
      // Stub implementation
      console.log('Triggering Lua garbage collection');
    },
  };
}

