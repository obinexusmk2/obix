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

export function createLiveRegionManager(
  config: LiveRegionManagerConfig
): LiveRegionManagerAPI {
  const regions = new Map<string, LiveRegionHandle>();
  const clearTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const defaultLevel = config.defaultLevel ?? "polite";
  const clearDelay = config.clearDelay ?? 1000;
  let globalRegion: LiveRegionHandle | null = null;

  function createRegionElement(
    id: string,
    level: AriaLiveRegion,
    regionConfig?: Partial<LiveRegionDefaults>
  ): Element {
    const el = document.createElement("div");
    el.id = `live-region-${id}`;
    el.setAttribute("aria-live", level);
    el.setAttribute("aria-atomic", String(regionConfig?.atomic ?? true));
    if (regionConfig?.relevant) {
      el.setAttribute("aria-relevant", regionConfig.relevant.join(" "));
    }
    if (regionConfig?.label) {
      el.setAttribute("aria-label", regionConfig.label);
    }
    // Visually hidden but accessible to screen readers
    el.style.position = "absolute";
    el.style.width = "1px";
    el.style.height = "1px";
    el.style.overflow = "hidden";
    el.style.clip = "rect(0, 0, 0, 0)";
    el.style.whiteSpace = "nowrap";
    el.style.border = "0";
    el.style.padding = "0";
    el.style.margin = "-1px";
    config.container.appendChild(el);
    return el;
  }

  function scheduleClean(id: string, element: Element): void {
    const existing = clearTimers.get(id);
    if (existing) clearTimeout(existing);
    clearTimers.set(
      id,
      setTimeout(() => {
        element.textContent = "";
        clearTimers.delete(id);
      }, clearDelay)
    );
  }

  function createHandle(id: string, element: Element, level: AriaLiveRegion): LiveRegionHandle {
    let currentLevel = level;
    return {
      id,
      announce(message: string) {
        // Clear then set to ensure screen readers re-read
        element.textContent = "";
        // Force reflow before setting new content
        void (element as HTMLElement).offsetWidth;
        element.textContent = message;
        scheduleClean(id, element);
      },
      setLevel(newLevel: AriaLiveRegion) {
        currentLevel = newLevel;
        element.setAttribute("aria-live", currentLevel);
      },
      getElement() {
        return element;
      },
      destroy() {
        const timer = clearTimers.get(id);
        if (timer) clearTimeout(timer);
        clearTimers.delete(id);
        element.remove();
      },
    };
  }

  return {
    createRegion(id, regionConfig) {
      if (regions.has(id)) {
        return regions.get(id)!;
      }
      const level = regionConfig?.level ?? defaultLevel;
      const element = createRegionElement(id, level, regionConfig);
      const handle = createHandle(id, element, level);
      regions.set(id, handle);
      return handle;
    },

    getRegion(id) {
      return regions.get(id);
    },

    destroyRegion(id) {
      const handle = regions.get(id);
      if (handle) {
        handle.destroy();
        regions.delete(id);
      }
    },

    announceGlobal(message, level) {
      if (!globalRegion) {
        const regionLevel = level ?? defaultLevel;
        const element = createRegionElement("__global__", regionLevel);
        globalRegion = createHandle("__global__", element, regionLevel);
      }
      if (level) {
        globalRegion.setLevel(level);
      }
      globalRegion.announce(message);
    },

    getActiveRegions() {
      return Array.from(regions.keys());
    },

    destroy() {
      for (const [id, handle] of regions) {
        handle.destroy();
        regions.delete(id);
      }
      if (globalRegion) {
        globalRegion.destroy();
        globalRegion = null;
      }
      for (const timer of clearTimers.values()) {
        clearTimeout(timer);
      }
      clearTimers.clear();
    },
  };
}
