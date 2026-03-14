/**
 * Feature 10: OBINexus Framework Integration
 * Accessible navigation pathways, interaction modes, unified facade
 */
import type { Disposable, AccessibilityTreeDriverAPI } from "./types.js";
import type { LiveRegionManagerAPI } from "./live-region-manager.js";
import type { FocusManagerAPI } from "./focus-management.js";
import type { ScreenReaderBridgeAPI } from "./screen-reader-bridge.js";
import type { AriaStateManagerAPI } from "./state-properties-manager.js";
export type InteractionMode = "keyboard" | "pointer" | "touch" | "screen-reader";
export interface NavigationLandmark {
    role: string;
    label: string;
    element: Element;
}
export interface NavigationPathway {
    id: string;
    label: string;
    landmarks: NavigationLandmark[];
}
export interface FrameworkIntegrationConfig {
    rootElement: Element;
    driver: AccessibilityTreeDriverAPI;
    liveRegionManager?: LiveRegionManagerAPI;
    focusManager?: FocusManagerAPI;
    screenReaderBridge?: ScreenReaderBridgeAPI;
    stateManager?: AriaStateManagerAPI;
}
export interface FrameworkIntegrationAPI extends Disposable {
    detectInteractionMode(): InteractionMode;
    onInteractionModeChange(handler: (mode: InteractionMode) => void): () => void;
    registerPathway(pathway: NavigationPathway): void;
    removePathway(id: string): void;
    navigateToLandmark(pathwayId: string, landmarkLabel: string): boolean;
    getPathways(): NavigationPathway[];
    announceNavigation(description: string): void;
    getAccessibilitySummary(): {
        landmarks: number;
        liveRegions: number;
        interactionMode: InteractionMode;
        pathways: number;
    };
}
export declare function createFrameworkIntegration(config: FrameworkIntegrationConfig): FrameworkIntegrationAPI;
//# sourceMappingURL=framework-integration.d.ts.map