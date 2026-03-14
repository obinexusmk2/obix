/**
 * Accessibility Tree Driver
 * ARIA/live region management and screen reader bridge
 */

// Re-export all types
export * from "./types.js";

// Re-export all feature factories and their types
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

// Import types and factories for the main driver
import type {
  AriaLiveRegion,
  LiveRegionDefaults,
  AccessibilityNode,
  AccessibilityTreeDriverConfig,
  AccessibilityTreeDriverAPI,
} from "./types.js";
import { createLiveRegionManager, type LiveRegionManagerAPI } from "./live-region-manager.js";
import { createAriaStateManager, type AriaStateManagerAPI } from "./state-properties-manager.js";
import { createFocusManager, type FocusManagerAPI } from "./focus-management.js";
import { createScreenReaderBridge, type ScreenReaderBridgeAPI } from "./screen-reader-bridge.js";
import { createKeyboardNavigationController, type KeyboardNavigationAPI } from "./keyboard-navigation.js";
import { createAccessibilityTreeMirror, type TreeMirrorAPI } from "./accessibility-tree-mirror.js";
import { createSemanticEnhancer, type SemanticEnhancerAPI } from "./semantic-html-enhancer.js";
import { createWidgetComplianceEngine, type WidgetComplianceAPI } from "./aria-widget-compliance.js";
import { createAxeIntegration, type AxeIntegrationAPI } from "./axe-core-integration.js";
import { createFrameworkIntegration, type FrameworkIntegrationAPI } from "./framework-integration.js";

export function createAccessibilityTreeDriver(
  config: AccessibilityTreeDriverConfig
): AccessibilityTreeDriverAPI {
  let initialized = false;

  // Sub-features (created lazily during initialize)
  let liveRegions: LiveRegionManagerAPI | undefined;
  let stateManager: AriaStateManagerAPI | undefined;
  let focusManager: FocusManagerAPI | undefined;
  let screenReaderBridge: ScreenReaderBridgeAPI | undefined;
  let keyboardNav: KeyboardNavigationAPI | undefined;
  let treeMirror: TreeMirrorAPI | undefined;
  let semanticEnhancer: SemanticEnhancerAPI | undefined;
  let widgetCompliance: WidgetComplianceAPI | undefined;
  let axeIntegration: AxeIntegrationAPI | undefined;
  let framework: FrameworkIntegrationAPI | undefined;

  // Legacy compatibility: node map for updateAccessibilityNode
  const nodeMap = new Map<Element, AccessibilityNode>();

  const driver: AccessibilityTreeDriverAPI = {
    async initialize() {
      if (initialized) return;
      initialized = true;

      // Create all sub-features
      stateManager = createAriaStateManager();
      focusManager = createFocusManager();

      liveRegions = createLiveRegionManager({
        container: config.rootElement,
        defaultLevel: config.liveRegionDefaults?.level ?? "polite",
      });

      screenReaderBridge = createScreenReaderBridge({
        liveRegionManager: liveRegions,
        enableDetection: config.screenReaderHints,
      });

      keyboardNav = createKeyboardNavigationController();

      treeMirror = createAccessibilityTreeMirror({
        rootElement: config.rootElement,
        observe: false,
      });

      semanticEnhancer = createSemanticEnhancer({
        rootElement: config.rootElement,
        stateManager,
      });

      widgetCompliance = createWidgetComplianceEngine({
        stateManager,
        focusManager,
        keyboardNav,
      });

      axeIntegration = createAxeIntegration({
        rootElement: config.rootElement,
      });

      framework = createFrameworkIntegration({
        rootElement: config.rootElement,
        driver,
        liveRegionManager: liveRegions,
        focusManager,
        screenReaderBridge,
        stateManager,
      });

      // Start tree observation
      treeMirror.observe();

      // Set screen reader mode if configured
      if (config.screenReaderHints) {
        screenReaderBridge.setOptimizationMode(true);
      }
    },

    async registerLiveRegion(element, overrides) {
      if (liveRegions) {
        const id = (element as HTMLElement).id || `region-${Date.now()}`;
        liveRegions.createRegion(id, { ...config.liveRegionDefaults, ...overrides });
      }
    },

    announce(message, level: AriaLiveRegion = "polite") {
      if (screenReaderBridge) {
        if (level === "assertive") {
          screenReaderBridge.announceAssertive(message);
        } else {
          screenReaderBridge.announcePolite(message);
        }
      } else if (liveRegions) {
        liveRegions.announceGlobal(message, level);
      } else if (typeof config.rootElement.setAttribute === "function") {
        // Fallback for uninitialized state
        config.rootElement.setAttribute("aria-live", level);
        config.rootElement.setAttribute("aria-label", message);
      }
    },

    updateAccessibilityNode(element, node) {
      nodeMap.set(element, node);
      if (stateManager) {
        stateManager.setState(element, "role", node.role);
        if (node.label) {
          stateManager.setState(element, "aria-label", node.label);
        }
        if (node.description) {
          stateManager.setState(element, "aria-describedby", node.description);
        }
        if (node.attributes) {
          for (const [key, value] of Object.entries(node.attributes)) {
            stateManager.setState(element, key, value);
          }
        }
      } else if (typeof element.setAttribute === "function") {
        element.setAttribute("role", node.role);
        if (node.label) {
          element.setAttribute("aria-label", node.label);
        }
      }
    },

    getAccessibilityTree() {
      if (treeMirror) {
        return treeMirror.snapshot();
      }
      // Fallback for uninitialized state
      const children = Array.from(nodeMap.values());
      return {
        role: "root",
        label: "accessibility-tree",
        children,
      };
    },

    setScreenReaderMode(enabled) {
      if (screenReaderBridge) {
        screenReaderBridge.setOptimizationMode(enabled);
      }
      if (typeof config.rootElement.setAttribute === "function") {
        config.rootElement.setAttribute("data-screen-reader-mode", String(enabled));
      }
    },

    async destroy() {
      framework?.destroy();
      axeIntegration?.destroy();
      widgetCompliance?.destroy();
      semanticEnhancer?.destroy();
      treeMirror?.destroy();
      keyboardNav?.destroy();
      screenReaderBridge?.destroy();
      focusManager?.destroy();
      liveRegions?.destroy();
      stateManager?.destroy();

      framework = undefined;
      axeIntegration = undefined;
      widgetCompliance = undefined;
      semanticEnhancer = undefined;
      treeMirror = undefined;
      keyboardNav = undefined;
      screenReaderBridge = undefined;
      focusManager = undefined;
      liveRegions = undefined;
      stateManager = undefined;

      nodeMap.clear();
      initialized = false;
    },

    // Sub-feature accessors
    get liveRegions() { return liveRegions; },
    get stateManager() { return stateManager; },
    get focusManager() { return focusManager; },
    get screenReaderBridge() { return screenReaderBridge; },
    get keyboardNav() { return keyboardNav; },
    get treeMirror() { return treeMirror; },
    get semanticEnhancer() { return semanticEnhancer; },
    get widgetCompliance() { return widgetCompliance; },
    get axeIntegration() { return axeIntegration; },
    get framework() { return framework; },
  };

  return driver;
}
