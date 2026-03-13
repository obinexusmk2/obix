/**
 * Accessibility Tree Driver
 * ARIA/live region management and screen reader bridge
 */
export function createAccessibilityTreeDriver(config) {
    let initialized = false;
    let screenReaderMode = Boolean(config.screenReaderHints);
    const nodeMap = new Map();
    const liveRegions = new Map();
    let lastAnnouncement = "";
    return {
        async initialize() {
            initialized = true;
        },
        async registerLiveRegion(element, overrides) {
            liveRegions.set(element, { ...config.liveRegionDefaults, ...overrides });
        },
        announce(message, level = "polite") {
            lastAnnouncement = message;
            if (typeof config.rootElement.setAttribute === "function") {
                config.rootElement.setAttribute("aria-live", level);
                config.rootElement.setAttribute("aria-label", message);
            }
        },
        updateAccessibilityNode(element, node) {
            nodeMap.set(element, node);
            if (typeof element.setAttribute === "function") {
                element.setAttribute("role", node.role);
                if (node.label) {
                    element.setAttribute("aria-label", node.label);
                }
            }
        },
        getAccessibilityTree() {
            const children = Array.from(nodeMap.values());
            return {
                role: "root",
                label: lastAnnouncement || "accessibility-tree",
                children,
            };
        },
        setScreenReaderMode(enabled) {
            screenReaderMode = enabled;
            if (typeof config.rootElement.setAttribute === "function") {
                config.rootElement.setAttribute("data-screen-reader-mode", String(screenReaderMode));
            }
        },
        async destroy() {
            initialized = false;
            nodeMap.clear();
            liveRegions.clear();
            lastAnnouncement = "";
            void initialized;
        },
    };
}
//# sourceMappingURL=index.js.map