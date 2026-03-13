/**
 * OBIX TypeScript Binding
 * Primary web runtime, Node.js & browser
 * Connects libpolycall FFI/polyglot bridge to TypeScript runtime
 */
function normalizeFunctionIdentifier(fn) {
    if (typeof fn === 'string' && fn.trim())
        return fn;
    if (fn && typeof fn === 'object') {
        const descriptor = fn;
        return descriptor.functionId ?? descriptor.id ?? descriptor.name;
    }
    return undefined;
}
/**
 * Create a TypeScript binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export function createTypeScriptBinding(config) {
    let initialized = false;
    const abiBindingName = 'typescript';
    return {
        async initialize() {
            if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
                throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
            }
            initialized = true;
        },
        async invoke(fn, args) {
            const functionId = normalizeFunctionIdentifier(fn);
            const envelope = {
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
                return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope };
            }
            if (!functionId) {
                return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope };
            }
            const abiInvoker = globalThis.__obixAbiInvoker;
            if (!abiInvoker?.invoke) {
                return {
                    code: 'MISSING_SYMBOL',
                    message: 'Required ABI symbol __obixAbiInvoker.invoke is unavailable',
                    envelope,
                };
            }
            try {
                return await abiInvoker.invoke(JSON.stringify(envelope));
            }
            catch (cause) {
                return {
                    code: 'INVOCATION_FAILED',
                    message: 'Invocation failed at ABI boundary',
                    envelope,
                    cause,
                };
            }
        },
        async destroy() {
            initialized = false;
        },
        getMemoryUsage() {
            // Node.js environment check
            try {
                const proc = globalThis.process;
                if (proc && typeof proc.memoryUsage === 'function') {
                    return proc.memoryUsage();
                }
            }
            catch {
                // Not Node.js environment
            }
            return {
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0,
            };
        },
        getSchemaMode() {
            return config.schemaMode;
        },
        isInitialized() {
            return initialized;
        },
    };
}
//# sourceMappingURL=index.js.map