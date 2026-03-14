/**
 * Feature 6: Semantic HTML Enhancer
 * Auto-inject missing ARIA attributes where they can be inferred
 */

import type { Disposable } from "./types.js";
import type { AriaStateManagerAPI } from "./state-properties-manager.js";

export interface EnhancementRule {
  selector: string;
  test: (element: Element) => boolean;
  enhance: (element: Element, stateManager: AriaStateManagerAPI) => void;
  description: string;
}

export interface SemanticEnhancerConfig {
  rootElement: Element;
  stateManager: AriaStateManagerAPI;
  rules?: EnhancementRule[];
  autoObserve?: boolean;
}

export interface EnhancementReport {
  enhanced: number;
  skipped: number;
  details: Array<{ element: Element; rule: string; attribute: string }>;
}

export interface SemanticEnhancerAPI extends Disposable {
  scan(): EnhancementReport;
  observe(): void;
  disconnect(): void;
  addRule(rule: EnhancementRule): void;
  getBuiltinRules(): EnhancementRule[];
}

function createBuiltinRules(): EnhancementRule[] {
  return [
    {
      selector: "div[onclick], span[onclick]",
      description: "Clickable div/span missing button role",
      test: (el) => !el.getAttribute("role") && !el.getAttribute("tabindex"),
      enhance: (el, sm) => {
        sm.setState(el, "role", "button");
        sm.setState(el, "tabindex", "0");
      },
    },
    {
      selector: "img:not([alt])",
      description: "Image missing alt text",
      test: (el) => !el.hasAttribute("alt"),
      enhance: (el, sm) => {
        // Mark decorative if no alt provided
        sm.setState(el, "role", "presentation");
        el.setAttribute("alt", "");
      },
    },
    {
      selector: "input:not([aria-label]):not([id])",
      description: "Input without label association",
      test: (el) => {
        if (el.getAttribute("aria-label") || el.getAttribute("aria-labelledby")) return false;
        const id = el.getAttribute("id");
        if (id && document.querySelector(`label[for="${id}"]`)) return false;
        return !el.closest("label");
      },
      enhance: (el, sm) => {
        const placeholder = el.getAttribute("placeholder");
        if (placeholder) {
          sm.setState(el, "aria-label", placeholder);
        }
      },
    },
    {
      selector: "nav:not([aria-label]):not([aria-labelledby])",
      description: "Navigation without accessible name",
      test: (el) => !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby"),
      enhance: (el, sm) => {
        sm.setState(el, "aria-label", "Navigation");
      },
    },
    {
      selector: "svg:not([aria-hidden]):not([aria-label]):not([role])",
      description: "SVG without accessibility attributes",
      test: (el) => {
        const hasTitle = el.querySelector("title");
        return !hasTitle && !el.getAttribute("aria-label");
      },
      enhance: (el, sm) => {
        sm.setState(el, "aria-hidden", "true");
      },
    },
    {
      selector: "a:not([href])",
      description: "Anchor without href acting as button",
      test: (el) => !el.getAttribute("href") && !el.getAttribute("role"),
      enhance: (el, sm) => {
        sm.setState(el, "role", "button");
        if (!el.getAttribute("tabindex")) {
          sm.setState(el, "tabindex", "0");
        }
      },
    },
  ];
}

export function createSemanticEnhancer(
  config: SemanticEnhancerConfig
): SemanticEnhancerAPI {
  const rules: EnhancementRule[] = [...createBuiltinRules(), ...(config.rules ?? [])];
  let observer: MutationObserver | null = null;

  function scanElements(root: Element): EnhancementReport {
    const report: EnhancementReport = { enhanced: 0, skipped: 0, details: [] };

    for (const rule of rules) {
      const elements = root.querySelectorAll(rule.selector);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        if (rule.test(el)) {
          rule.enhance(el, config.stateManager);
          report.enhanced++;
          report.details.push({
            element: el,
            rule: rule.description,
            attribute: rule.selector,
          });
        } else {
          report.skipped++;
        }
      }
    }

    return report;
  }

  return {
    scan() {
      return scanElements(config.rootElement);
    },

    observe() {
      if (observer) return;
      observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              scanElements(node as Element);
            }
          }
        }
      });
      observer.observe(config.rootElement, {
        childList: true,
        subtree: true,
      });
    },

    disconnect() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },

    addRule(rule) {
      rules.push(rule);
    },

    getBuiltinRules() {
      return createBuiltinRules();
    },

    destroy() {
      this.disconnect();
    },
  };
}
