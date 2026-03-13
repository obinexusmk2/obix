/**
 * OBIX Runtime Engine
 * Manages component lifecycle, state updates, and halting
 * Data-oriented: accepts pure objects, not class instances
 */
import { ComponentDefinition, ComponentInstance, LifecycleHandler, StateHaltConfig, Policy } from "./types.js";
/**
 * ObixRuntime - Core runtime engine for OBIX components
 */
export declare class ObixRuntime {
    private registry;
    private instances;
    private lifecycleHandlers;
    private stateHaltEngine;
    private policyEngine;
    private haltConfig;
    private nextInstanceId;
    constructor(haltConfig?: Partial<StateHaltConfig>, initialPolicies?: Policy[]);
    /**
     * Register a component definition
     */
    register<S = any>(definition: ComponentDefinition<S>): void;
    /**
     * Create an instance of a registered component
     */
    create<S = any>(componentName: string, initialState?: Partial<S>): ComponentInstance<S>;
    /**
     * Update instance state by applying an action
     */
    update<S = any, A extends any[] = any[]>(instanceId: string, actionName: string, ...args: A): ComponentInstance<S> | null;
    /**
     * Manually halt a component
     */
    halt(instanceId: string, reason?: string): ComponentInstance<any> | null;
    /**
     * Resume a halted component
     */
    resume(instanceId: string): ComponentInstance<any> | null;
    /**
     * Destroy a component instance
     */
    destroy(instanceId: string): void;
    /**
     * Subscribe to lifecycle events
     */
    onLifecycle(handler: LifecycleHandler): void;
    /**
     * Get an instance by ID
     */
    getInstance<S = any>(instanceId: string): ComponentInstance<S> | null;
    /**
     * Get all active instances
     */
    getInstances<S = any>(): ComponentInstance<S>[];
    /**
     * Get all registered components
     */
    getRegistered(): ComponentDefinition<any>[];
    /**
     * Check if instance state has stabilized and halt if needed
     */
    private checkStateStability;
    /**
     * Fire lifecycle hook to all subscribers
     */
    private fireLifecycleHook;
}
//# sourceMappingURL=runtime.d.ts.map