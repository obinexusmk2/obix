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

export function createFrameworkIntegration(
  config: FrameworkIntegrationConfig
): FrameworkIntegrationAPI {
  const pathways = new Map<string, NavigationPathway>();
  const modeHandlers = new Set<(mode: InteractionMode) => void>();
  let currentMode: InteractionMode = "pointer";
  const listeners: Array<{ target: EventTarget; type: string; handler: EventListener }> = [];

  function setMode(mode: InteractionMode): void {
    if (mode === currentMode) return;
    currentMode = mode;
    for (const handler of modeHandlers) {
      handler(mode);
    }
  }

  function onKeyDown(e: Event): void {
    const event = e as KeyboardEvent;
    if (event.key === "Tab" || event.key.startsWith("Arrow")) {
      setMode("keyboard");
    }
  }

  function onPointerDown(): void {
    setMode("pointer");
  }

  function onTouchStart(): void {
    setMode("touch");
  }

  function addListener(target: EventTarget, type: string, handler: EventListener): void {
    target.addEventListener(type, handler);
    listeners.push({ target, type, handler });
  }

  // Set up interaction mode detection
  if (typeof config.rootElement.addEventListener === "function") {
    addListener(config.rootElement, "keydown", onKeyDown);
    addListener(config.rootElement, "pointerdown", onPointerDown);
    addListener(config.rootElement, "touchstart", onTouchStart);
  }

  return {
    detectInteractionMode() {
      return currentMode;
    },

    onInteractionModeChange(handler) {
      modeHandlers.add(handler);
      return () => { modeHandlers.delete(handler); };
    },

    registerPathway(pathway) {
      pathways.set(pathway.id, pathway);
    },

    removePathway(id) {
      pathways.delete(id);
    },

    navigateToLandmark(pathwayId, landmarkLabel) {
      const pathway = pathways.get(pathwayId);
      if (!pathway) return false;

      const landmark = pathway.landmarks.find((l) => l.label === landmarkLabel);
      if (!landmark) return false;

      // Use focus manager if available, otherwise direct focus
      if (config.focusManager) {
        config.focusManager.moveFocus(landmark.element);
      } else if (typeof (landmark.element as HTMLElement).focus === "function") {
        (landmark.element as HTMLElement).focus();
      }

      // Announce navigation if screen reader bridge is available
      if (config.screenReaderBridge) {
        config.screenReaderBridge.announcePolite(`Navigated to ${landmarkLabel}`);
      } else if (config.liveRegionManager) {
        config.liveRegionManager.announceGlobal(`Navigated to ${landmarkLabel}`);
      }

      return true;
    },

    getPathways() {
      return Array.from(pathways.values());
    },

    announceNavigation(description) {
      if (config.screenReaderBridge) {
        config.screenReaderBridge.announcePolite(description);
      } else if (config.liveRegionManager) {
        config.liveRegionManager.announceGlobal(description);
      }
    },

    getAccessibilitySummary() {
      let landmarkCount = 0;
      for (const pathway of pathways.values()) {
        landmarkCount += pathway.landmarks.length;
      }

      return {
        landmarks: landmarkCount,
        liveRegions: config.liveRegionManager?.getActiveRegions().length ?? 0,
        interactionMode: currentMode,
        pathways: pathways.size,
      };
    },

    destroy() {
      for (const { target, type, handler } of listeners) {
        target.removeEventListener(type, handler);
      }
      listeners.length = 0;
      pathways.clear();
      modeHandlers.clear();
    },
  };
}
