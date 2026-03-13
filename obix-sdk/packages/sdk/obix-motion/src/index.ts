/**
 * OBIX Motion - Animation system respecting prefers-reduced-motion
 * Accessible animation engine with motion preference detection
 */

export type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "cubic" | ((progress: number) => number);

export interface Keyframe {
  offset: number;
  properties: Record<string, string | number>;
  easing?: Easing;
}

export interface Timeline {
  name: string;
  duration: number;
  delay?: number;
  iterations?: number;
  direction?: "normal" | "reverse" | "alternate";
  keyframes: Keyframe[];
}

export interface ReducedMotionStrategy {
  skipAnimations: boolean;
  skipTransitions: boolean;
  instantDuration?: number;
}

export interface MotionConfig {
  respectPrefersReducedMotion: boolean;
  reducedMotionStrategy?: ReducedMotionStrategy;
  defaultEasing?: Easing;
}

export interface MotionEngine {
  animate(element: HTMLElement, timeline: Timeline): Promise<void>;
  sequence(animations: Array<{ element: HTMLElement; timeline: Timeline }>): Promise<void>;
  respectReducedMotion(): boolean;
  getTimeline(name: string): Timeline | undefined;
}

const applyProperties = (element: HTMLElement, frame?: Keyframe): void => {
  if (!frame) {
    return;
  }

  Object.entries(frame.properties).forEach(([key, value]) => {
    element.style.setProperty(key, String(value));
  });
};

export function createMotionEngine(config: MotionConfig): MotionEngine {
  const timelines = new Map<string, Timeline>();
  const strategy: ReducedMotionStrategy = {
    skipAnimations: true,
    skipTransitions: true,
    instantDuration: 0,
    ...(config.reducedMotionStrategy ?? {})
  };

  const shouldReduceMotion = (): boolean => {
    if (!config.respectPrefersReducedMotion || typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  return {
    async animate(element: HTMLElement, timeline: Timeline): Promise<void> {
      timelines.set(timeline.name, timeline);
      const first = timeline.keyframes[0];
      const last = timeline.keyframes[timeline.keyframes.length - 1];

      applyProperties(element, first);

      if (shouldReduceMotion() && strategy.skipAnimations) {
        element.style.transitionDuration = `${strategy.instantDuration ?? 0}ms`;
        applyProperties(element, last);
        return;
      }

      await new Promise<void>((resolve) => {
        const totalDuration = Math.max(0, timeline.duration + (timeline.delay ?? 0));
        setTimeout(() => {
          applyProperties(element, last);
          resolve();
        }, totalDuration);
      });
    },
    async sequence(animations: Array<{ element: HTMLElement; timeline: Timeline }>): Promise<void> {
      for (const animation of animations) {
        await this.animate(animation.element, animation.timeline);
      }
    },
    respectReducedMotion(): boolean {
      return shouldReduceMotion();
    },
    getTimeline(name: string): Timeline | undefined {
      return timelines.get(name);
    }
  };
}
