/**
 * OBIX TypeScript Binding
 * Primary web runtime, Node.js & browser
 * Connects libpolycall FFI/polyglot bridge to TypeScript runtime
 */
/**
 * Create a TypeScript binding to libpolycall
 * @param config Configuration for the binding
 * @returns Initialized bridge for invoking polyglot functions
 */
export function createTypeScriptBinding(config) {
    return {
        async initialize() {
            // Stub implementation
            console.log('Initializing TypeScript binding with config:', config);
        },
        async invoke(fn, args) {
            // Stub implementation
            console.log('Invoking:', fn, 'with args:', args);
            return undefined;
        },
        async destroy() {
            // Stub implementation
            console.log('Destroying TypeScript binding');
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
            return false; // Stub
        },
    };
}
//# sourceMappingURL=index.js.map