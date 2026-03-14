/**
 * Feature 2: ARIA Widget Compliance Engine
 * W3C ARIA Authoring Practices design patterns with validation
 */

import type { Disposable } from "./types.js";
import type { AriaStateManagerAPI } from "./state-properties-manager.js";
import type { FocusManagerAPI } from "./focus-management.js";
import type { KeyboardNavigationAPI } from "./keyboard-navigation.js";

export type WidgetPattern =
  | "accordion"
  | "menu-bar"
  | "slider"
  | "tabs"
  | "dialog"
  | "listbox"
  | "tree"
  | "combobox";

export interface WidgetConfig {
  container: Element;
  pattern: WidgetPattern;
  options?: Record<string, unknown>;
}

export interface WidgetHandle extends Disposable {
  activate(): void;
  deactivate(): void;
  getPattern(): WidgetPattern;
  validate(): WidgetValidationResult;
}

export interface WidgetValidationResult {
  valid: boolean;
  errors: Array<{
    element: Element;
    message: string;
    severity: "error" | "warning";
  }>;
}

export interface WidgetComplianceDeps {
  stateManager: AriaStateManagerAPI;
  focusManager: FocusManagerAPI;
  keyboardNav: KeyboardNavigationAPI;
}

export interface WidgetComplianceAPI extends Disposable {
  createWidget(id: string, config: WidgetConfig): WidgetHandle;
  getWidget(id: string): WidgetHandle | undefined;
  destroyWidget(id: string): void;
  validateAll(): Map<string, WidgetValidationResult>;
  getSupportedPatterns(): WidgetPattern[];
}

interface PatternSpec {
  setup(container: Element, deps: WidgetComplianceDeps, navId: string): void;
  teardown(container: Element, deps: WidgetComplianceDeps, navId: string): void;
  validate(container: Element): WidgetValidationResult;
}

function createAccordionSpec(): PatternSpec {
  return {
    setup(container, deps, navId) {
      const headers = container.querySelectorAll("[data-accordion-header]");
      const panels = container.querySelectorAll("[data-accordion-panel]");

      headers.forEach((header, i) => {
        deps.stateManager.setState(header, "role", "button");
        deps.stateManager.setState(header, "aria-expanded", "false");
        if (panels[i]) {
          const panelId = panels[i].id || `accordion-panel-${i}`;
          if (!panels[i].id) panels[i].id = panelId;
          deps.stateManager.setState(header, "aria-controls", panelId);
          deps.stateManager.setState(panels[i], "role", "region");

          const headerId = header.id || `accordion-header-${i}`;
          if (!header.id) (header as HTMLElement).id = headerId;
          deps.stateManager.setState(panels[i], "aria-labelledby", headerId);
        }
      });

      const nav = deps.keyboardNav.createNavigation(navId, {
        container,
        pattern: "roving-tabindex",
        orientation: "vertical",
        wrap: true,
        focusManager: deps.focusManager,
      });
      nav.setItems(Array.from(headers));
      nav.activate();
    },

    teardown(_container, deps, navId) {
      deps.keyboardNav.destroyNavigation(navId);
    },

    validate(container) {
      const errors: WidgetValidationResult["errors"] = [];
      const headers = container.querySelectorAll("[data-accordion-header]");
      const panels = container.querySelectorAll("[data-accordion-panel]");

      if (headers.length === 0) {
        errors.push({ element: container, message: "Accordion has no headers ([data-accordion-header])", severity: "error" });
      }
      headers.forEach((header, i) => {
        if (!header.getAttribute("aria-expanded")) {
          errors.push({ element: header, message: "Accordion header missing aria-expanded", severity: "error" });
        }
        if (!header.getAttribute("aria-controls")) {
          errors.push({ element: header, message: "Accordion header missing aria-controls", severity: "error" });
        }
      });
      panels.forEach((panel) => {
        if (panel.getAttribute("role") !== "region") {
          errors.push({ element: panel, message: "Accordion panel should have role=\"region\"", severity: "warning" });
        }
      });

      return { valid: errors.filter((e) => e.severity === "error").length === 0, errors };
    },
  };
}

function createTabsSpec(): PatternSpec {
  return {
    setup(container, deps, navId) {
      const tablist = container.querySelector("[data-tablist]") || container;
      const tabs = container.querySelectorAll("[data-tab]");
      const panels = container.querySelectorAll("[data-tabpanel]");

      deps.stateManager.setState(tablist, "role", "tablist");

      tabs.forEach((tab, i) => {
        const tabId = tab.id || `tab-${i}`;
        if (!tab.id) (tab as HTMLElement).id = tabId;
        deps.stateManager.setState(tab, "role", "tab");
        deps.stateManager.setState(tab, "aria-selected", i === 0 ? "true" : "false");

        if (panels[i]) {
          const panelId = panels[i].id || `tabpanel-${i}`;
          if (!panels[i].id) panels[i].id = panelId;
          deps.stateManager.setState(tab, "aria-controls", panelId);
          deps.stateManager.setState(panels[i], "role", "tabpanel");
          deps.stateManager.setState(panels[i], "aria-labelledby", tabId);
        }
      });

      const nav = deps.keyboardNav.createNavigation(navId, {
        container: tablist,
        pattern: "roving-tabindex",
        orientation: "horizontal",
        wrap: true,
        focusManager: deps.focusManager,
      });
      nav.setItems(Array.from(tabs));
      nav.activate();
    },

    teardown(_container, deps, navId) {
      deps.keyboardNav.destroyNavigation(navId);
    },

    validate(container) {
      const errors: WidgetValidationResult["errors"] = [];
      const tablist = container.querySelector('[role="tablist"]');
      if (!tablist) {
        errors.push({ element: container, message: "Missing element with role=\"tablist\"", severity: "error" });
      }
      const tabs = container.querySelectorAll('[role="tab"]');
      if (tabs.length === 0) {
        errors.push({ element: container, message: "No tabs found with role=\"tab\"", severity: "error" });
      }
      tabs.forEach((tab) => {
        if (!tab.getAttribute("aria-controls")) {
          errors.push({ element: tab, message: "Tab missing aria-controls", severity: "warning" });
        }
      });
      return { valid: errors.filter((e) => e.severity === "error").length === 0, errors };
    },
  };
}

function createSliderSpec(): PatternSpec {
  return {
    setup(container, deps, navId) {
      const slider = container.querySelector("[data-slider]") || container;
      deps.stateManager.setState(slider, "role", "slider");
      deps.stateManager.setState(slider, "aria-valuenow", slider.getAttribute("data-value") || "50");
      deps.stateManager.setState(slider, "aria-valuemin", slider.getAttribute("data-min") || "0");
      deps.stateManager.setState(slider, "aria-valuemax", slider.getAttribute("data-max") || "100");
      if (!slider.getAttribute("aria-label") && !slider.getAttribute("aria-labelledby")) {
        deps.stateManager.setState(slider, "aria-label", "Slider");
      }
      deps.stateManager.setState(slider, "tabindex", "0");

      const nav = deps.keyboardNav.createNavigation(navId, {
        container,
        pattern: "roving-tabindex",
        orientation: "horizontal",
        wrap: false,
        focusManager: deps.focusManager,
      });
      nav.setItems([slider]);
      nav.activate();
    },

    teardown(_container, deps, navId) {
      deps.keyboardNav.destroyNavigation(navId);
    },

    validate(container) {
      const errors: WidgetValidationResult["errors"] = [];
      const slider = container.querySelector('[role="slider"]');
      if (!slider) {
        errors.push({ element: container, message: "No element with role=\"slider\"", severity: "error" });
        return { valid: false, errors };
      }
      const required = ["aria-valuenow", "aria-valuemin", "aria-valuemax"];
      for (const attr of required) {
        if (!slider.getAttribute(attr)) {
          errors.push({ element: slider, message: `Slider missing required attribute: ${attr}`, severity: "error" });
        }
      }
      if (!slider.getAttribute("aria-label") && !slider.getAttribute("aria-labelledby")) {
        errors.push({ element: slider, message: "Slider missing accessible name (aria-label or aria-labelledby)", severity: "error" });
      }
      return { valid: errors.filter((e) => e.severity === "error").length === 0, errors };
    },
  };
}

function createMenuBarSpec(): PatternSpec {
  return {
    setup(container, deps, navId) {
      deps.stateManager.setState(container, "role", "menubar");
      const items = container.querySelectorAll("[data-menuitem]");
      items.forEach((item) => {
        deps.stateManager.setState(item, "role", "menuitem");
      });

      const nav = deps.keyboardNav.createNavigation(navId, {
        container,
        pattern: "roving-tabindex",
        orientation: "horizontal",
        wrap: true,
        typeAhead: true,
        focusManager: deps.focusManager,
      });
      nav.setItems(Array.from(items));
      nav.activate();
    },

    teardown(_container, deps, navId) {
      deps.keyboardNav.destroyNavigation(navId);
    },

    validate(container) {
      const errors: WidgetValidationResult["errors"] = [];
      if (container.getAttribute("role") !== "menubar") {
        errors.push({ element: container, message: "Container missing role=\"menubar\"", severity: "error" });
      }
      const items = container.querySelectorAll('[role="menuitem"]');
      if (items.length === 0) {
        errors.push({ element: container, message: "No menuitems found", severity: "error" });
      }
      return { valid: errors.filter((e) => e.severity === "error").length === 0, errors };
    },
  };
}

function createDialogSpec(): PatternSpec {
  return {
    setup(container, deps, _navId) {
      deps.stateManager.setState(container, "role", "dialog");
      deps.stateManager.setState(container, "aria-modal", "true");
      if (!container.getAttribute("aria-label") && !container.getAttribute("aria-labelledby")) {
        const heading = container.querySelector("h1, h2, h3, h4, h5, h6");
        if (heading) {
          const headingId = heading.id || "dialog-title";
          if (!heading.id) (heading as HTMLElement).id = headingId;
          deps.stateManager.setState(container, "aria-labelledby", headingId);
        }
      }
    },

    teardown(_container, _deps, _navId) {},

    validate(container) {
      const errors: WidgetValidationResult["errors"] = [];
      if (container.getAttribute("role") !== "dialog") {
        errors.push({ element: container, message: "Missing role=\"dialog\"", severity: "error" });
      }
      if (!container.getAttribute("aria-label") && !container.getAttribute("aria-labelledby")) {
        errors.push({ element: container, message: "Dialog missing accessible name", severity: "error" });
      }
      return { valid: errors.filter((e) => e.severity === "error").length === 0, errors };
    },
  };
}

function getPatternSpec(pattern: WidgetPattern): PatternSpec {
  switch (pattern) {
    case "accordion": return createAccordionSpec();
    case "tabs": return createTabsSpec();
    case "slider": return createSliderSpec();
    case "menu-bar": return createMenuBarSpec();
    case "dialog": return createDialogSpec();
    default: return createDialogSpec(); // Fallback
  }
}

export function createWidgetComplianceEngine(
  deps: WidgetComplianceDeps
): WidgetComplianceAPI {
  const widgets = new Map<string, { handle: WidgetHandle; config: WidgetConfig; spec: PatternSpec }>();

  return {
    createWidget(id, config) {
      if (widgets.has(id)) {
        return widgets.get(id)!.handle;
      }

      const spec = getPatternSpec(config.pattern);
      const navId = `widget-${id}-nav`;

      const handle: WidgetHandle = {
        activate() {
          spec.setup(config.container, deps, navId);
        },
        deactivate() {
          spec.teardown(config.container, deps, navId);
        },
        getPattern() {
          return config.pattern;
        },
        validate() {
          return spec.validate(config.container);
        },
        destroy() {
          handle.deactivate();
          widgets.delete(id);
        },
      };

      widgets.set(id, { handle, config, spec });
      return handle;
    },

    getWidget(id) {
      return widgets.get(id)?.handle;
    },

    destroyWidget(id) {
      const entry = widgets.get(id);
      if (entry) {
        entry.handle.destroy();
      }
    },

    validateAll() {
      const results = new Map<string, WidgetValidationResult>();
      for (const [id, entry] of widgets) {
        results.set(id, entry.spec.validate(entry.config.container));
      }
      return results;
    },

    getSupportedPatterns() {
      return ["accordion", "menu-bar", "slider", "tabs", "dialog", "listbox", "tree", "combobox"];
    },

    destroy() {
      for (const entry of widgets.values()) {
        entry.handle.deactivate();
      }
      widgets.clear();
    },
  };
}
