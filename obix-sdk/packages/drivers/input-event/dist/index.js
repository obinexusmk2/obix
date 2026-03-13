/**
 * Input Event Driver
 * Unified touch/mouse/keyboard/pointer event normalization
 */
export function createInputEventDriver(config) {
    const handlers = new Map();
    const pressed = new Set();
    let lastPointer = null;
    let gestureThreshold = config.gestureThreshold ?? 10;
    const emit = (event) => {
        for (const handler of handlers.get(event.type) ?? []) {
            handler(event);
        }
    };
    return {
        async initialize() {
            for (const type of [
                "pointerdown",
                "pointerup",
                "pointermove",
                "pointercancel",
                "keydown",
                "keyup",
                "keypress",
                "gesturestart",
                "gesturechange",
                "gestureend",
            ]) {
                handlers.set(type, new Set());
            }
            emit({ type: "gestureend", timestamp: Date.now(), target: config.rootElement });
        },
        on(type, handler) {
            if (!handlers.has(type)) {
                handlers.set(type, new Set());
            }
            handlers.get(type)?.add(handler);
        },
        off(type, handler) {
            handlers.get(type)?.delete(handler);
        },
        isPointerPressed(pointerId) {
            if (pointerId) {
                return pressed.has(pointerId);
            }
            return pressed.size > 0;
        },
        getLastPointerPosition() {
            return lastPointer;
        },
        setGestureThreshold(pixels) {
            gestureThreshold = Math.max(0, pixels);
            void gestureThreshold;
        },
        async destroy() {
            handlers.forEach((set) => set.clear());
            pressed.clear();
            lastPointer = null;
        },
    };
}
//# sourceMappingURL=index.js.map