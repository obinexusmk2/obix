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
    sequence(animations: Array<{
        element: HTMLElement;
        timeline: Timeline;
    }>): Promise<void>;
    respectReducedMotion(): boolean;
    getTimeline(name: string): Timeline | undefined;
}
export declare function createMotionEngine(config: MotionConfig): MotionEngine;
//# sourceMappingURL=index.d.ts.map