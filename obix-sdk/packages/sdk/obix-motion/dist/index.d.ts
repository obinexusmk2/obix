/**
 * OBIX Motion - Animation system respecting prefers-reduced-motion
 * Accessible animation engine with motion preference detection
 */
/**
 * Easing function type
 */
export type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "cubic" | ((progress: number) => number);
/**
 * Keyframe definition for animations
 */
export interface Keyframe {
    offset: number;
    properties: Record<string, string | number>;
    easing?: Easing;
}
/**
 * Animation timeline
 */
export interface Timeline {
    name: string;
    duration: number;
    delay?: number;
    iterations?: number;
    direction?: "normal" | "reverse" | "alternate";
    keyframes: Keyframe[];
}
/**
 * Strategy for respecting reduced motion preference
 */
export interface ReducedMotionStrategy {
    skipAnimations: boolean;
    skipTransitions: boolean;
    instantDuration?: number;
}
/**
 * Motion engine configuration
 */
export interface MotionConfig {
    respectPrefersReducedMotion: boolean;
    reducedMotionStrategy?: ReducedMotionStrategy;
    defaultEasing?: Easing;
}
/**
 * Motion engine interface
 */
export interface MotionEngine {
    animate(element: HTMLElement, timeline: Timeline): Promise<void>;
    sequence(animations: Array<{
        element: HTMLElement;
        timeline: Timeline;
    }>): Promise<void>;
    respectReducedMotion(): boolean;
    getTimeline(name: string): Timeline | undefined;
}
/**
 * Create a motion engine instance
 */
export declare function createMotionEngine(config: MotionConfig): MotionEngine;
//# sourceMappingURL=index.d.ts.map