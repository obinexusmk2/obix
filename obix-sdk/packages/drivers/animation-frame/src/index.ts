/**
 * Animation Frame Driver
 * requestAnimationFrame scheduling and timeline orchestration
 */

export type EasingFunction = (t: number) => number;

export interface AnimationFrameCallback {
  (deltaTime: number): void;
}

export interface AnimationFrameDriverConfig {
  /** Target frames per second */
  targetFPS?: number;
  /** Auto-throttle to match screen refresh rate */
  autoThrottle?: boolean;
  /** Maximum timeline entries to keep in memory */
  timelineCapacity?: number;
}

export interface Timeline {
  duration: number;
  easing?: EasingFunction;
  startTime: number;
  onFrame(progress: number): void;
}

export interface AnimationFrameDriverAPI {
  /** Initialize animation frame driver */
  initialize(): Promise<void>;
  /** Schedule a callback to run on the next animation frame */
  scheduleFrame(callback: AnimationFrameCallback): number;
  /** Cancel a scheduled animation frame */
  cancelFrame(id: number): void;
  /** Create and manage a timeline animation */
  createTimeline(timeline: Timeline): Promise<void>;
  /** Set the target frame rate */
  setTargetFPS(fps: number): void;
  /** Get current frame count */
  getFrameCount(): number;
  /** Get elapsed time since driver initialized */
  getElapsedTime(): number;
  /** Pause all animations */
  pause(): void;
  /** Resume all animations */
  resume(): void;
  /** Destroy the driver */
  destroy(): Promise<void>;
}

export function createAnimationFrameDriver(
  config: AnimationFrameDriverConfig
): AnimationFrameDriverAPI {
  let initializedAt = 0;
  let lastFrameAt = 0;
  let targetFPS = Math.max(1, config.targetFPS ?? 60);
  let frameCount = 0;
  let paused = false;
  let idCounter = 1;
  let currentRafId: number | null = null;
  const pending = new Map<number, AnimationFrameCallback>();

  const requestFrame =
    typeof globalThis.requestAnimationFrame === "function"
      ? globalThis.requestAnimationFrame.bind(globalThis)
      : (cb: FrameRequestCallback): number =>
          globalThis.setTimeout(() => cb(Date.now()), 1000 / targetFPS);

  const cancelRequestedFrame =
    typeof globalThis.cancelAnimationFrame === "function"
      ? globalThis.cancelAnimationFrame.bind(globalThis)
      : (id: number) => globalThis.clearTimeout(id);

  const step = (timestamp: number) => {
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
      const easing = timeline.easing ?? ((t: number) => t);
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
