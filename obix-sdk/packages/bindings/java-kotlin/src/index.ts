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

function normalizeFunctionIdentifier(fn: string | object): string | undefined {
  if (typeof fn === 'string' && fn.trim()) return fn;
  if (fn && typeof fn === 'object') {
    const descriptor = fn as { functionId?: string; id?: string; name?: string };
    return descriptor.functionId ?? descriptor.id ?? descriptor.name;
  }
  return undefined;
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
export function createJavaKotlinBinding(
  config: JavaKotlinBindingConfig
): JavaKotlinBindingBridge {
  let initialized = false;
  const abiBindingName = 'java-kotlin';
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
        heapUsedBytes: 0,
        heapMaxBytes: 0,
        nonHeapBytes: 0,
        objectCount: 0,
      };
    },

    getSchemaMode(): SchemaMode {
      return config.schemaMode;
    },

    isInitialized(): boolean {
      return initialized;
    },

    async loadClass(className: string): Promise<object> {
      // Stub implementation
      console.log('Loading Java class:', className);
      return {};
    },

    async forceGarbageCollection(): Promise<void> {
      // Stub implementation
      console.log('Forcing JVM garbage collection');
    },

    async createThreadPool(poolSize: number): Promise<string> {
      // Stub implementation
      console.log('Creating thread pool with size:', poolSize);
      return 'pool-id';
    },
  };
}

