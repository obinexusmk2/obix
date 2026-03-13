/**
 * Policy Engine
 * Enforces policies on component instances
 * Built-in policies prevent invalid component configurations
 */
import { ComponentInstance, Policy, PolicyResult } from "./types.js";
/**
 * PolicyEngine manages and enforces policies
 */
export declare class PolicyEngine {
    private policies;
    constructor();
    /**
     * Register a custom policy
     */
    register<S = any>(policy: Policy<S>): void;
    /**
     * Enforce all applicable policies on an instance
     */
    enforce<S = any>(instance: ComponentInstance<S>): PolicyResult;
    /**
     * Register built-in policies
     */
    private registerBuiltInPolicies;
    /**
     * Calculate maximum depth of an object
     */
    private getObjectDepth;
}
//# sourceMappingURL=policy.d.ts.map