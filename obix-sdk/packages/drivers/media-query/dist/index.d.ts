/**
 * Media Query Driver
 * Responsive breakpoint detection and safe-area handling
 */
export interface Breakpoint {
    name: string;
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
}
export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export type MediaQueryChangeHandler = (matches: boolean) => void;
export interface MediaQueryDriverConfig {
    /** Custom breakpoints to track */
    breakpoints?: Breakpoint[];
    /** Handle safe-area insets (notches, etc.) */
    safeAreaHandling?: boolean;
    /** Lock orientation */
    orientationLock?: "portrait" | "landscape" | "auto";
}
export interface MediaQueryDriverAPI {
    /** Initialize media query driver */
    initialize(): Promise<void>;
    /** Register a media query listener */
    watch(query: string, handler: MediaQueryChangeHandler): void;
    /** Unregister a media query listener */
    unwatch(query: string, handler: MediaQueryChangeHandler): void;
    /** Check if a media query matches */
    matches(query: string): boolean;
    /** Get current breakpoint */
    getCurrentBreakpoint(): Breakpoint | null;
    /** Get safe-area insets */
    getSafeAreaInsets(): SafeAreaInsets;
    /** Get viewport dimensions */
    getViewportSize(): {
        width: number;
        height: number;
    };
    /** Get device orientation */
    getOrientation(): "portrait" | "landscape";
    /** Lock device orientation */
    setOrientationLock(lock: "portrait" | "landscape" | "auto"): Promise<void>;
    /** Destroy the driver */
    destroy(): Promise<void>;
}
export declare function createMediaQueryDriver(config: MediaQueryDriverConfig): MediaQueryDriverAPI;
//# sourceMappingURL=index.d.ts.map