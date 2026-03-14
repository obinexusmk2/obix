/**
 * Feature 5: axe-core Integration & Validation
 * Runtime ARIA validation using axe-core (optional peer dependency)
 */
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
export function createAxeIntegration(config) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let axeModule = null;
    let loadAttempted = false;
    let available = false;
    async function loadAxe() {
        if (loadAttempted)
            return available;
        loadAttempted = true;
        try {
            // Dynamic import - axe-core is an optional peer dependency
            axeModule = await Function('return import("axe-core")')();
            available = true;
        }
        catch {
            available = false;
        }
        return available;
    }
    async function runAxe(context, rules) {
        const loaded = await loadAxe();
        if (!loaded || !axeModule) {
            throw new Error("axe-core is not available. Install it as a dependency.");
        }
        const axe = (axeModule.default || axeModule);
        const axeConfig = {
            runOnly: {
                type: "rule",
                values: rules ?? ARIA_RULES,
            },
        };
        const results = await axe.run(context, axeConfig);
        return results.violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map((n) => ({
                element: (n.element ?? context),
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
//# sourceMappingURL=axe-core-integration.js.map