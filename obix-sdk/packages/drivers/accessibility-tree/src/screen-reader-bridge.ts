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

export function createScreenReaderBridge(
  config: ScreenReaderBridgeConfig
): ScreenReaderBridgeAPI {
  let optimizationMode = false;
  const lrm = config.liveRegionManager;

  // Create dedicated regions for different announcement types
  const politeRegion = lrm.createRegion("__sr-polite__", { level: "polite" });
  const assertiveRegion = lrm.createRegion("__sr-assertive__", { level: "assertive" });
  const routeRegion = lrm.createRegion("__sr-route__", { level: "assertive" });

  function detect(): ScreenReaderDetectionResult {
    const signals: string[] = [];

    // Check forced-colors (high contrast mode, common with screen readers)
    if (typeof window !== "undefined" && window.matchMedia) {
      if (window.matchMedia("(forced-colors: active)").matches) {
        signals.push("forced-colors-active");
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        signals.push("prefers-reduced-motion");
      }
      if (window.matchMedia("(prefers-contrast: more)").matches) {
        signals.push("prefers-contrast-more");
      }
    }

    // Check for common screen reader indicators in the DOM
    if (typeof document !== "undefined") {
      // NVDA injects a browsing mode indicator
      if (document.querySelector("[data-nvda]")) {
        signals.push("nvda-indicator");
      }
      // Check if aria-live regions are being actively consumed
      if (document.querySelector('[role="application"]')) {
        signals.push("application-role-present");
      }
    }

    const confidence: ScreenReaderDetectionResult["confidence"] =
      signals.length >= 3 ? "high" :
      signals.length >= 2 ? "medium" :
      signals.length >= 1 ? "low" :
      "none";

    return {
      likely: signals.length >= 2,
      confidence,
      signals,
    };
  }

  return {
    detect,

    announcePolite(message) {
      politeRegion.announce(message);
    },

    announceAssertive(message) {
      assertiveRegion.announce(message);
    },

    announceRouteChange(routeName) {
      routeRegion.announce(`Navigated to ${routeName}`);
    },

    setOptimizationMode(enabled) {
      optimizationMode = enabled;
    },

    isOptimizationMode() {
      return optimizationMode;
    },

    destroy() {
      lrm.destroyRegion("__sr-polite__");
      lrm.destroyRegion("__sr-assertive__");
      lrm.destroyRegion("__sr-route__");
    },
  };
}
