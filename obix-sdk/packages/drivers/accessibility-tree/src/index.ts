/**
 * Accessibility Tree Driver
 * ARIA/live region management and screen reader bridge
 */

export type AriaLiveRegion = "off" | "polite" | "assertive";
export type AriaRole = string;

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
}

export function createAccessibilityTreeDriver(
  config: AccessibilityTreeDriverConfig
): AccessibilityTreeDriverAPI {
  let initialized = false;
  let screenReaderMode = Boolean(config.screenReaderHints);
  const nodeMap = new Map<Element, AccessibilityNode>();
  const liveRegions = new Map<Element, LiveRegionDefaults>();
  let lastAnnouncement = "";

  return {
    async initialize() {
      initialized = true;
    },
    async registerLiveRegion(element, overrides) {
      liveRegions.set(element, { ...config.liveRegionDefaults, ...overrides });
    },
    announce(message, level = "polite") {
      lastAnnouncement = message;
      if (typeof config.rootElement.setAttribute === "function") {
        config.rootElement.setAttribute("aria-live", level);
        config.rootElement.setAttribute("aria-label", message);
      }
    },
    updateAccessibilityNode(element, node) {
      nodeMap.set(element, node);
      if (typeof element.setAttribute === "function") {
        element.setAttribute("role", node.role);
        if (node.label) {
          element.setAttribute("aria-label", node.label);
        }
      }
    },
    getAccessibilityTree() {
      const children = Array.from(nodeMap.values());
      return {
        role: "root",
        label: lastAnnouncement || "accessibility-tree",
        children,
      };
    },
    setScreenReaderMode(enabled) {
      screenReaderMode = enabled;
      if (typeof config.rootElement.setAttribute === "function") {
        config.rootElement.setAttribute("data-screen-reader-mode", String(screenReaderMode));
      }
    },
    async destroy() {
      initialized = false;
      nodeMap.clear();
      liveRegions.clear();
      lastAnnouncement = "";
      void initialized;
    },
  };
}
