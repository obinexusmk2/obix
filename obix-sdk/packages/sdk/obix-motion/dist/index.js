/**
 * OBIX Motion - Animation system respecting prefers-reduced-motion
 * Accessible animation engine with motion preference detection
 */
const applyProperties = (element, frame) => {
    if (!frame) {
        return;
    }
    Object.entries(frame.properties).forEach(([key, value]) => {
        element.style.setProperty(key, String(value));
    });
};
export function createMotionEngine(config) {
    const timelines = new Map();
    const strategy = {
        skipAnimations: true,
        skipTransitions: true,
        instantDuration: 0,
        ...(config.reducedMotionStrategy ?? {})
    };
    const shouldReduceMotion = () => {
        if (!config.respectPrefersReducedMotion || typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return false;
        }
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    };
    return {
        async animate(element, timeline) {
            timelines.set(timeline.name, timeline);
            const first = timeline.keyframes[0];
            const last = timeline.keyframes[timeline.keyframes.length - 1];
            applyProperties(element, first);
            if (shouldReduceMotion() && strategy.skipAnimations) {
                element.style.transitionDuration = `${strategy.instantDuration ?? 0}ms`;
                applyProperties(element, last);
                return;
            }
            await new Promise((resolve) => {
                const totalDuration = Math.max(0, timeline.duration + (timeline.delay ?? 0));
                setTimeout(() => {
                    applyProperties(element, last);
                    resolve();
                }, totalDuration);
            });
        },
        async sequence(animations) {
            for (const animation of animations) {
                await this.animate(animation.element, animation.timeline);
            }
        },
        respectReducedMotion() {
            return shouldReduceMotion();
        },
        getTimeline(name) {
            return timelines.get(name);
        }
    };
}
//# sourceMappingURL=index.js.map