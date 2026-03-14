/**
 * Feature 1: Live Region Manager
 * Dynamic content announcements for screen readers
 */
import type { AriaLiveRegion, LiveRegionDefaults, Disposable } from "./types.js";
export interface LiveRegionManagerConfig {
    container: Element;
    defaultLevel?: AriaLiveRegion;
    clearDelay?: number;
}
export interface LiveRegionHandle extends Disposable {
    id: string;
    announce(message: string): void;
    setLevel(level: AriaLiveRegion): void;
    getElement(): Element;
}
export interface LiveRegionManagerAPI extends Disposable {
    createRegion(id: string, config?: Partial<LiveRegionDefaults>): LiveRegionHandle;
    getRegion(id: string): LiveRegionHandle | undefined;
    destroyRegion(id: string): void;
    announceGlobal(message: string, level?: AriaLiveRegion): void;
    getActiveRegions(): string[];
}
export declare function createLiveRegionManager(config: LiveRegionManagerConfig): LiveRegionManagerAPI;
//# sourceMappingURL=live-region-manager.d.ts.map