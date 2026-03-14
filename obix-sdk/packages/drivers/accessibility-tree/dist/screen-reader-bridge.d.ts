/**
 * Feature 3: Screen Reader Bridge
 * Browser-safe screen reader detection and structured announcements
 */
import type { Disposable } from "./types.js";
import type { LiveRegionManagerAPI } from "./live-region-manager.js";
export interface ScreenReaderDetectionResult {
    likely: boolean;
    confidence: "none" | "low" | "medium" | "high";
    signals: string[];
}
export interface ScreenReaderBridgeConfig {
    liveRegionManager: LiveRegionManagerAPI;
    enableDetection?: boolean;
}
export interface ScreenReaderBridgeAPI extends Disposable {
    detect(): ScreenReaderDetectionResult;
    announcePolite(message: string): void;
    announceAssertive(message: string): void;
    announceRouteChange(routeName: string): void;
    setOptimizationMode(enabled: boolean): void;
    isOptimizationMode(): boolean;
}
export declare function createScreenReaderBridge(config: ScreenReaderBridgeConfig): ScreenReaderBridgeAPI;
//# sourceMappingURL=screen-reader-bridge.d.ts.map