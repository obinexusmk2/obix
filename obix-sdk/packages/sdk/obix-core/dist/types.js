/**
 * Core type definitions for OBIX runtime engine
 * Implements data-oriented component lifecycle management
 */
/**
 * Lifecycle event types
 */
export var LifecycleHook;
(function (LifecycleHook) {
    LifecycleHook["CREATED"] = "CREATED";
    LifecycleHook["MOUNTED"] = "MOUNTED";
    LifecycleHook["UPDATED"] = "UPDATED";
    LifecycleHook["HALTED"] = "HALTED";
    LifecycleHook["DESTROYED"] = "DESTROYED";
})(LifecycleHook || (LifecycleHook = {}));
//# sourceMappingURL=types.js.map