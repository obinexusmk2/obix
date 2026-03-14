/**
 * Feature 8: State & Properties Manager
 * Reactive ARIA state management with batch updates
 */
export function createAriaStateManager(config) {
    const states = new Map();
    const handlers = new Set();
    const pending = [];
    let batchScheduled = false;
    const batchMode = config?.batchUpdates ?? false;
    function applyToDOM(element, key, value) {
        if (typeof element.setAttribute !== "function")
            return;
        if (value === undefined || value === false) {
            element.removeAttribute(key);
        }
        else if (value === true) {
            element.setAttribute(key, "true");
        }
        else {
            element.setAttribute(key, value);
        }
    }
    function notifyHandlers(element, key, value) {
        for (const handler of handlers) {
            handler(element, key, value);
        }
    }
    function flushPending() {
        batchScheduled = false;
        const items = pending.splice(0, pending.length);
        for (const { element, key, value } of items) {
            applyToDOM(element, key, value);
            notifyHandlers(element, key, value);
        }
    }
    return {
        setState(element, key, value) {
            let elementStates = states.get(element);
            if (!elementStates) {
                elementStates = new Map();
                states.set(element, elementStates);
            }
            elementStates.set(key, value);
            if (batchMode) {
                pending.push({ element, key, value });
                if (!batchScheduled) {
                    batchScheduled = true;
                    queueMicrotask(flushPending);
                }
            }
            else {
                applyToDOM(element, key, value);
                notifyHandlers(element, key, value);
            }
        },
        getState(element, key) {
            return states.get(element)?.get(key);
        },
        getAllStates(element) {
            const elementStates = states.get(element);
            if (!elementStates)
                return {};
            const result = {};
            for (const [k, v] of elementStates) {
                result[k] = v;
            }
            return result;
        },
        removeState(element, key) {
            const elementStates = states.get(element);
            if (elementStates) {
                elementStates.delete(key);
                if (elementStates.size === 0)
                    states.delete(element);
            }
            applyToDOM(element, key, undefined);
            notifyHandlers(element, key, undefined);
        },
        onStateChange(handler) {
            handlers.add(handler);
            return () => { handlers.delete(handler); };
        },
        applyPending() {
            flushPending();
        },
        destroy() {
            states.clear();
            handlers.clear();
            pending.length = 0;
        },
    };
}
//# sourceMappingURL=state-properties-manager.js.map