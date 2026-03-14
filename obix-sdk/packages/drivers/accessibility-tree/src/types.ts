/**
 * Shared types for the Accessibility Tree Driver
 */

export type AriaLiveRegion = "off" | "polite" | "assertive";
export type AriaRole = string;

export interface Disposable {
  destroy(): void;
}

export interface LiveRegionDefaults {
  level?: AriaLiveRegion;
  atomic?: boolean;
  relevant?: string[];
  label?: string;
}

export interface AccessibilityTreeDriverConfig {
  /** Root element for accessibility tree */
  rootElement: Element;
  /** Default configuration for live regions */
  liveRegionDefaults?: LiveRegionDefaults;
  /** Screen reader hints and optimizations */
  screenReaderHints?: boolean;
}

export interface AccessibilityNode {
  role: AriaRole;
  label?: string;
  description?: string;
  attributes?: Record<string, string>;
  children?: AccessibilityNode[];
}

export interface AccessibilityTreeDriverAPI {
  initialize(): Promise<void>;
  registerLiveRegion(element: Element, config?: LiveRegionDefaults): Promise<void>;
  announce(message: string, level?: AriaLiveRegion): void;
  updateAccessibilityNode(element: Element, node: AccessibilityNode): void;
  getAccessibilityTree(): AccessibilityNode;
  setScreenReaderMode(enabled: boolean): void;
  destroy(): Promise<void>;

  // Sub-feature accessors (optional for backward compat)
  readonly liveRegions?: import("./live-region-manager.js").LiveRegionManagerAPI;
  readonly stateManager?: import("./state-properties-manager.js").AriaStateManagerAPI;
  readonly focusManager?: import("./focus-management.js").FocusManagerAPI;
  readonly screenReaderBridge?: import("./screen-reader-bridge.js").ScreenReaderBridgeAPI;
  readonly keyboardNav?: import("./keyboard-navigation.js").KeyboardNavigationAPI;
  readonly treeMirror?: import("./accessibility-tree-mirror.js").TreeMirrorAPI;
  readonly semanticEnhancer?: import("./semantic-html-enhancer.js").SemanticEnhancerAPI;
  readonly widgetCompliance?: import("./aria-widget-compliance.js").WidgetComplianceAPI;
  readonly axeIntegration?: import("./axe-core-integration.js").AxeIntegrationAPI;
  readonly framework?: import("./framework-integration.js").FrameworkIntegrationAPI;
}
