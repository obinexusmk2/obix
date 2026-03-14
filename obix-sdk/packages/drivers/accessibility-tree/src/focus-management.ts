/**
 * Feature 9: Focus Management System
 * Programmatic focus control, focus traps, save/restore
 */

import type { Disposable } from "./types.js";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[tabindex]:not([tabindex="-1"])',
  "[contenteditable]",
].join(",");

export interface FocusTrapConfig {
  container: Element;
  initialFocus?: Element | string;
  returnFocusOnDeactivate?: boolean;
  escapeDeactivates?: boolean;
}

export interface FocusTrapHandle extends Disposable {
  activate(): void;
  deactivate(): void;
  isActive(): boolean;
}

export interface FocusManagerAPI extends Disposable {
  moveFocus(target: Element | string): boolean;
  getFocusedElement(): Element | null;
  createFocusTrap(config: FocusTrapConfig): FocusTrapHandle;
  saveFocus(key?: string): void;
  restoreFocus(key?: string): boolean;
  getFocusableElements(container: Element): Element[];
}

export function createFocusManager(): FocusManagerAPI {
  const focusStack = new Map<string, Element>();
  const traps = new Set<FocusTrapHandle>();

  function getFocusableElements(container: Element): Element[] {
    return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
  }

  return {
    moveFocus(target) {
      let element: Element | null;
      if (typeof target === "string") {
        element = document.querySelector(target);
      } else {
        element = target;
      }
      if (element && typeof (element as HTMLElement).focus === "function") {
        (element as HTMLElement).focus();
        return document.activeElement === element;
      }
      return false;
    },

    getFocusedElement() {
      return document.activeElement;
    },

    createFocusTrap(config) {
      let active = false;
      let previousFocus: Element | null = null;

      function handleKeyDown(e: Event): void {
        const event = e as KeyboardEvent;
        if (config.escapeDeactivates !== false && event.key === "Escape") {
          handle.deactivate();
          return;
        }
        if (event.key !== "Tab") return;

        const focusable = getFocusableElements(config.container);
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        const current = document.activeElement;

        if (event.shiftKey && current === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && current === last) {
          event.preventDefault();
          first.focus();
        }
      }

      const handle: FocusTrapHandle = {
        activate() {
          if (active) return;
          active = true;
          previousFocus = document.activeElement;
          config.container.addEventListener("keydown", handleKeyDown);

          let initial: Element | null = null;
          if (config.initialFocus) {
            if (typeof config.initialFocus === "string") {
              initial = config.container.querySelector(config.initialFocus);
            } else {
              initial = config.initialFocus;
            }
          }
          if (!initial) {
            const focusable = getFocusableElements(config.container);
            initial = focusable[0] || null;
          }
          if (initial && typeof (initial as HTMLElement).focus === "function") {
            (initial as HTMLElement).focus();
          }
        },

        deactivate() {
          if (!active) return;
          active = false;
          config.container.removeEventListener("keydown", handleKeyDown);
          if (
            config.returnFocusOnDeactivate !== false &&
            previousFocus &&
            typeof (previousFocus as HTMLElement).focus === "function"
          ) {
            (previousFocus as HTMLElement).focus();
          }
          previousFocus = null;
        },

        isActive() {
          return active;
        },

        destroy() {
          handle.deactivate();
          traps.delete(handle);
        },
      };

      traps.add(handle);
      return handle;
    },

    saveFocus(key = "__default__") {
      const current = document.activeElement;
      if (current) {
        focusStack.set(key, current);
      }
    },

    restoreFocus(key = "__default__") {
      const element = focusStack.get(key);
      if (element && typeof (element as HTMLElement).focus === "function") {
        (element as HTMLElement).focus();
        focusStack.delete(key);
        return document.activeElement === element;
      }
      return false;
    },

    getFocusableElements,

    destroy() {
      for (const trap of traps) {
        trap.deactivate();
      }
      traps.clear();
      focusStack.clear();
    },
  };
}
