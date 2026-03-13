/**
 * Policy Engine
 * Enforces policies on component instances
 * Built-in policies prevent invalid component configurations
 */
/**
 * PolicyEngine manages and enforces policies
 */
export class PolicyEngine {
    policies = new Map();
    constructor() {
        // Register built-in policies
        this.registerBuiltInPolicies();
    }
    /**
     * Register a custom policy
     */
    register(policy) {
        this.policies.set(policy.name, policy);
    }
    /**
     * Enforce all applicable policies on an instance
     */
    enforce(instance) {
        const violations = [];
        for (const [, policy] of this.policies) {
            const result = policy.enforce(instance);
            if (!result.passed) {
                violations.push(...result.violations);
            }
        }
        return {
            passed: violations.length === 0,
            violations
        };
    }
    /**
     * Register built-in policies
     */
    registerBuiltInPolicies() {
        // Require component to have a render function
        this.register({
            name: "RequireRender",
            enforce: (instance) => {
                const hasFn = typeof instance.definition.render === "function";
                return {
                    passed: hasFn,
                    violations: hasFn
                        ? []
                        : [
                            {
                                policy: "RequireRender",
                                message: "Component must define a render function"
                            }
                        ]
                };
            }
        });
        // Require component to have a name
        this.register({
            name: "RequireName",
            enforce: (instance) => {
                const hasName = typeof instance.definition.name === "string" && instance.definition.name.length > 0;
                return {
                    passed: hasName,
                    violations: hasName
                        ? []
                        : [
                            {
                                policy: "RequireName",
                                message: "Component must define a non-empty name"
                            }
                        ]
                };
            }
        });
        // Limit state object depth to prevent circular references
        this.register({
            name: "MaxStateDepth",
            enforce: (instance) => {
                const maxDepth = 10;
                const depth = this.getObjectDepth(instance.currentState);
                const passed = depth <= maxDepth;
                return {
                    passed,
                    violations: passed
                        ? []
                        : [
                            {
                                policy: "MaxStateDepth",
                                message: `State depth ${depth} exceeds maximum ${maxDepth}`
                            }
                        ]
                };
            }
        });
    }
    /**
     * Calculate maximum depth of an object
     */
    getObjectDepth(obj, visited = new WeakSet()) {
        if (obj === null || typeof obj !== "object") {
            return 0;
        }
        if (visited.has(obj)) {
            return 0; // Circular reference
        }
        visited.add(obj);
        let maxDepth = 0;
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const childDepth = 1 + this.getObjectDepth(obj[key], visited);
                maxDepth = Math.max(maxDepth, childDepth);
            }
        }
        return maxDepth;
    }
}
//# sourceMappingURL=policy.js.map