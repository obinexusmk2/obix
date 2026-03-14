/**
 * Feature 10: OBINexus Framework Integration
 * Accessible navigation pathways, interaction modes, unified facade
 */
export function createFrameworkIntegration(config) {
    const pathways = new Map();
    const modeHandlers = new Set();
    let currentMode = "pointer";
    const listeners = [];
    function setMode(mode) {
        if (mode === currentMode)
            return;
        currentMode = mode;
        for (const handler of modeHandlers) {
            handler(mode);
        }
    }
    function onKeyDown(e) {
        const event = e;
        if (event.key === "Tab" || event.key.startsWith("Arrow")) {
            setMode("keyboard");
        }
    }
    function onPointerDown() {
        setMode("pointer");
    }
    function onTouchStart() {
        setMode("touch");
    }
    function addListener(target, type, handler) {
        target.addEventListener(type, handler);
        listeners.push({ target, type, handler });
    }
    // Set up interaction mode detection
    if (typeof config.rootElement.addEventListener === "function") {
        addListener(config.rootElement, "keydown", onKeyDown);
        addListener(config.rootElement, "pointerdown", onPointerDown);
        addListener(config.rootElement, "touchstart", onTouchStart);
    }
    return {
        detectInteractionMode() {
            return currentMode;
        },
        onInteractionModeChange(handler) {
            modeHandlers.add(handler);
            return () => { modeHandlers.delete(handler); };
        },
        registerPathway(pathway) {
            pathways.set(pathway.id, pathway);
        },
        removePathway(id) {
            pathways.delete(id);
        },
        navigateToLandmark(pathwayId, landmarkLabel) {
            const pathway = pathways.get(pathwayId);
            if (!pathway)
                return false;
            const landmark = pathway.landmarks.find((l) => l.label === landmarkLabel);
            if (!landmark)
                return false;
            // Use focus manager if available, otherwise direct focus
            if (config.focusManager) {
                config.focusManager.moveFocus(landmark.element);
            }
            else if (typeof landmark.element.focus === "function") {
                landmark.element.focus();
            }
            // Announce navigation if screen reader bridge is available
            if (config.screenReaderBridge) {
                config.screenReaderBridge.announcePolite(`Navigated to ${landmarkLabel}`);
            }
            else if (config.liveRegionManager) {
                config.liveRegionManager.announceGlobal(`Navigated to ${landmarkLabel}`);
            }
            return true;
        },
        getPathways() {
            return Array.from(pathways.values());
        },
        announceNavigation(description) {
            if (config.screenReaderBridge) {
                config.screenReaderBridge.announcePolite(description);
            }
            else if (config.liveRegionManager) {
                config.liveRegionManager.announceGlobal(description);
            }
        },
        getAccessibilitySummary() {
            let landmarkCount = 0;
            for (const pathway of pathways.values()) {
                landmarkCount += pathway.landmarks.length;
            }
            return {
                landmarks: landmarkCount,
                liveRegions: config.liveRegionManager?.getActiveRegions().length ?? 0,
                interactionMode: currentMode,
                pathways: pathways.size,
            };
        },
        destroy() {
            for (const { target, type, handler } of listeners) {
                target.removeEventListener(type, handler);
            }
            listeners.length = 0;
            pathways.clear();
            modeHandlers.clear();
        },
    };
}
//# sourceMappingURL=framework-integration.js.map