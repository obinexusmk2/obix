/**
 * Animation Frame Driver
 * requestAnimationFrame scheduling and timeline orchestration
 */
export function createAnimationFrameDriver(config) {
    let initializedAt = 0;
    let lastFrameAt = 0;
    let targetFPS = Math.max(1, config.targetFPS ?? 60);
    let frameCount = 0;
    let paused = false;
    let idCounter = 1;
    let currentRafId = null;
    const pending = new Map();
    const requestFrame = typeof globalThis.requestAnimationFrame === "function"
        ? globalThis.requestAnimationFrame.bind(globalThis)
        : (cb) => globalThis.setTimeout(() => cb(Date.now()), 1000 / targetFPS);
    const cancelRequestedFrame = typeof globalThis.cancelAnimationFrame === "function"
        ? globalThis.cancelAnimationFrame.bind(globalThis)
        : (id) => globalThis.clearTimeout(id);
    const step = (timestamp) => {
        currentRafId = null;
        if (paused) {
            return;
        }
        const minFrameTime = 1000 / targetFPS;
        if (lastFrameAt !== 0 && timestamp - lastFrameAt < minFrameTime) {
            currentRafId = requestFrame(step);
            return;
        }
        const delta = lastFrameAt === 0 ? minFrameTime : timestamp - lastFrameAt;
        lastFrameAt = timestamp;
        frameCount += 1;
        const callbacks = Array.from(pending.entries());
        pending.clear();
        for (const [, callback] of callbacks) {
            callback(delta);
        }
    };
    const ensureTick = () => {
        if (paused || currentRafId !== null || pending.size === 0) {
            return;
        }
        currentRafId = requestFrame(step);
    };
    return {
        async initialize() {
            initializedAt = Date.now();
            lastFrameAt = 0;
            frameCount = 0;
            paused = false;
        },
        scheduleFrame(callback) {
            const id = idCounter++;
            pending.set(id, callback);
            ensureTick();
            return id;
        },
        cancelFrame(id) {
            pending.delete(id);
        },
        async createTimeline(timeline) {
            const easing = timeline.easing ?? ((t) => t);
            let completed = false;
            const run = () => {
                if (completed || paused) {
                    return;
                }
                this.scheduleFrame(() => {
                    const elapsed = Date.now() - timeline.startTime;
                    const linear = Math.max(0, Math.min(1, elapsed / Math.max(1, timeline.duration)));
                    timeline.onFrame(easing(linear));
                    if (linear >= 1) {
                        completed = true;
                        return;
                    }
                    run();
                });
            };
            run();
        },
        setTargetFPS(fps) {
            targetFPS = Math.max(1, fps);
        },
        getFrameCount() {
            return frameCount;
        },
        getElapsedTime() {
            return initializedAt === 0 ? 0 : Date.now() - initializedAt;
        },
        pause() {
            paused = true;
            if (currentRafId !== null) {
                cancelRequestedFrame(currentRafId);
                currentRafId = null;
            }
        },
        resume() {
            paused = false;
            ensureTick();
        },
        async destroy() {
            this.pause();
            pending.clear();
            initializedAt = 0;
            frameCount = 0;
        },
    };
}
//# sourceMappingURL=index.js.map