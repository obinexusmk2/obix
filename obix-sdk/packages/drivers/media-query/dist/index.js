/**
 * Media Query Driver
 * Responsive breakpoint detection and safe-area handling
 */
export function createMediaQueryDriver(config) {
    const watchers = new Map();
    let orientationLock = config.orientationLock ?? "auto";
    const viewport = () => ({
        width: typeof window !== "undefined" ? window.innerWidth : 1024,
        height: typeof window !== "undefined" ? window.innerHeight : 768,
    });
    return {
        async initialize() { },
        watch(query, handler) {
            if (!watchers.has(query)) {
                watchers.set(query, new Set());
            }
            watchers.get(query)?.add(handler);
            handler(this.matches(query));
        },
        unwatch(query, handler) {
            watchers.get(query)?.delete(handler);
        },
        matches(query) {
            if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
                return window.matchMedia(query).matches;
            }
            return false;
        },
        getCurrentBreakpoint() {
            const size = viewport();
            for (const bp of config.breakpoints ?? []) {
                const widthOk = (bp.minWidth ?? 0) <= size.width && (bp.maxWidth ?? Infinity) >= size.width;
                const heightOk = (bp.minHeight ?? 0) <= size.height && (bp.maxHeight ?? Infinity) >= size.height;
                if (widthOk && heightOk) {
                    return bp;
                }
            }
            return null;
        },
        getSafeAreaInsets() {
            if (!config.safeAreaHandling) {
                return { top: 0, right: 0, bottom: 0, left: 0 };
            }
            return { top: 0, right: 0, bottom: 0, left: 0 };
        },
        getViewportSize() {
            return viewport();
        },
        getOrientation() {
            const size = viewport();
            if (orientationLock !== "auto") {
                return orientationLock;
            }
            return size.width >= size.height ? "landscape" : "portrait";
        },
        async setOrientationLock(lock) {
            orientationLock = lock;
        },
        async destroy() {
            watchers.clear();
        },
    };
}
//# sourceMappingURL=index.js.map