/**
 * Accessibility Tree Driver
 * ARIA/live region management and screen reader bridge
 */
export * from "./types.js";
export * from "./live-region-manager.js";
export * from "./state-properties-manager.js";
export * from "./focus-management.js";
export * from "./screen-reader-bridge.js";
export * from "./keyboard-navigation.js";
export * from "./accessibility-tree-mirror.js";
export * from "./semantic-html-enhancer.js";
export * from "./aria-widget-compliance.js";
export * from "./axe-core-integration.js";
export * from "./framework-integration.js";
import type { AccessibilityTreeDriverConfig, AccessibilityTreeDriverAPI } from "./types.js";
export declare function createAccessibilityTreeDriver(config: AccessibilityTreeDriverConfig): AccessibilityTreeDriverAPI;
//# sourceMappingURL=index.d.ts.map