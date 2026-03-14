/**
 * Feature 5: axe-core Integration & Validation
 * Runtime ARIA validation using axe-core (optional peer dependency)
 */

import type { Disposable } from "./types.js";

export interface AxeRunConfig {
  rules?: string[];
  exclude?: string[];
  context?: Element;
}

export interface AxeViolation {
  id: string;
  impact: "minor" | "moderate" | "serious" | "critical";
  description: string;
  helpUrl: string;
  nodes: Array<{ element: Element; failureSummary: string }>;
}

export interface AxeIntegrationConfig {
  rootElement: Element;
}

export interface AxeIntegrationAPI extends Disposable {
  run(config?: AxeRunConfig): Promise<AxeViolation[]>;
  runOnNode(element: Element): Promise<AxeViolation[]>;
  isAvailable(): boolean;
}

/** axe-core run result shape (minimal) */
interface AxeResult {
  violations: Array<{
    id: string;
    impact: string;
    description: string;
    helpUrl: string;
    nodes: Array<{
      element?: Element;
      html: string;
      failureSummary: string;
      target: string[];
    }>;
  }>;
}

interface AxeRunnable {
  run(context: Element, options: Record<string, unknown>): Promise<AxeResult>;
}

// Default ARIA-related axe rules
const ARIA_RULES = [
  "aria-allowed-attr",
  "aria-allowed-role",
  "aria-command-name",
  "aria-dialog-name",
  "aria-hidden-body",
  "aria-hidden-focus",
  "aria-input-field-name",
  "aria-meter-name",
  "aria-progressbar-name",
  "aria-required-attr",
  "aria-required-children",
  "aria-required-parent",
  "aria-roledescription",
  "aria-roles",
  "aria-toggle-field-name",
  "aria-tooltip-name",
  "aria-valid-attr",
  "aria-valid-attr-value",
];

export function createAxeIntegration(
  config: AxeIntegrationConfig
): AxeIntegrationAPI {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let axeModule: any = null;
  let loadAttempted = false;
  let available = false;

  async function loadAxe(): Promise<boolean> {
    if (loadAttempted) return available;
    loadAttempted = true;
    try {
      // Dynamic import - axe-core is an optional peer dependency
      axeModule = await (Function('return import("axe-core")')() as Promise<unknown>);
      available = true;
    } catch {
      available = false;
    }
    return available;
  }

  async function runAxe(
    context: Element,
    rules?: string[],
  ): Promise<AxeViolation[]> {
    const loaded = await loadAxe();
    if (!loaded || !axeModule) {
      throw new Error("axe-core is not available. Install it as a dependency.");
    }

    const axe = (axeModule.default || axeModule) as AxeRunnable;

    const axeConfig: Record<string, unknown> = {
      runOnly: {
        type: "rule",
        values: rules ?? ARIA_RULES,
      },
    };

    const results = await axe.run(context, axeConfig);

    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact as AxeViolation["impact"],
      description: v.description,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => ({
        element: (n.element ?? context) as Element,
        failureSummary: n.failureSummary || "",
      })),
    }));
  }

  return {
    async run(runConfig) {
      const context = runConfig?.context ?? config.rootElement;
      return runAxe(context, runConfig?.rules);
    },

    async runOnNode(element) {
      return runAxe(element);
    },

    isAvailable() {
      return available;
    },

    destroy() {
      axeModule = null;
    },
  };
}
