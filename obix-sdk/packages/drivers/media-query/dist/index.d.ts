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
    breakpoints?: Breakpoint[];
    safeAreaHandling?: boolean;
    orientationLock?: "portrait" | "landscape" | "auto";
}
export interface MediaQueryDriverAPI {
    initialize(): Promise<void>;
    watch(query: string, handler: MediaQueryChangeHandler): void;
    unwatch(query: string, handler: MediaQueryChangeHandler): void;
    matches(query: string): boolean;
    getCurrentBreakpoint(): Breakpoint | null;
    getSafeAreaInsets(): SafeAreaInsets;
    getViewportSize(): {
        width: number;
        height: number;
    };
    getOrientation(): "portrait" | "landscape";
    setOrientationLock(lock: "portrait" | "landscape" | "auto"): Promise<void>;
    destroy(): Promise<void>;
}
export declare function createMediaQueryDriver(config: MediaQueryDriverConfig): MediaQueryDriverAPI;
//# sourceMappingURL=index.d.ts.map