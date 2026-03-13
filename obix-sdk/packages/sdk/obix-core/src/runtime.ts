/**
 * OBIX Runtime Engine
 * Manages component lifecycle, state updates, and halting
 * Data-oriented: accepts pure objects, not class instances
 */

import {
  ComponentDefinition,
  ComponentInstance,
  LifecycleHook,
  LifecycleHandler,
  StateHaltConfig,
  Policy
} from "./types.js";
import { StateHaltEngine } from "./state-halting.js";
import { PolicyEngine } from "./policy.js";

/**
 * Default state halt configuration
 */
const DEFAULT_HALT_CONFIG: StateHaltConfig = {
  maxRevisions: 100,
  stabilityThreshold: 3,
  haltOnPolicyViolation: true
};

/**
 * ObixRuntime - Core runtime engine for OBIX components
 */
export class ObixRuntime {
  private registry: Map<string, ComponentDefinition<any>> = new Map();
  private instances: Map<string, ComponentInstance<any>> = new Map();
  private lifecycleHandlers: LifecycleHandler[] = [];
  private stateHaltEngine: StateHaltEngine;
  private policyEngine: PolicyEngine;
  private haltConfig: StateHaltConfig;
  private nextInstanceId: number = 0;

  constructor(
    haltConfig: Partial<StateHaltConfig> = {},
    initialPolicies: Policy[] = []
  ) {
    this.haltConfig = { ...DEFAULT_HALT_CONFIG, ...haltConfig };
    this.stateHaltEngine = new StateHaltEngine(
      this.haltConfig.maxRevisions,
      this.haltConfig.stabilityThreshold
    );
    this.policyEngine = new PolicyEngine();

    // Register custom policies
    for (const policy of initialPolicies) {
      this.policyEngine.register(policy);
    }
  }

  /**
   * Register a component definition
   */
  register<S = any>(definition: ComponentDefinition<S>): void {
    if (!definition.name) {
      throw new Error("Component definition must have a name");
    }
    this.registry.set(definition.name, definition);
  }

  /**
   * Create an instance of a registered component
   */
  create<S = any>(
    componentName: string,
    initialState?: Partial<S>
  ): ComponentInstance<S> {
    const definition = this.registry.get(componentName);
    if (!definition) {
      throw new Error(`Component '${componentName}' not registered`);
    }

    const instanceId = `${componentName}-${++this.nextInstanceId}`;

    // Merge initial state with definition state
    const currentState = {
      ...definition.state,
      ...(initialState || {})
    } as S;

    const instance: ComponentInstance<S> = {
      id: instanceId,
      definition,
      currentState,
      halted: false,
      revision: 0,
      createdAt: Date.now(),
      lastUpdatedAt: Date.now()
    };

    this.instances.set(instanceId, instance);
    this.stateHaltEngine.record(instanceId, currentState, 0);

    // Enforce policies and fire lifecycle hook
    const policyResult = this.policyEngine.enforce(instance);
    if (!policyResult.passed) {
      instance.policyViolations = policyResult.violations;
      if (this.haltConfig.haltOnPolicyViolation) {
        instance.halted = true;
        instance.haltReason = "Policy violations on creation";
      }
    }

    this.fireLifecycleHook(LifecycleHook.CREATED, instanceId, instance);

    return instance;
  }

  /**
   * Update instance state by applying an action
   */
  update<S = any, A extends any[] = any[]>(
    instanceId: string,
    actionName: string,
    ...args: A
  ): ComponentInstance<S> | null {
    const instance = this.instances.get(instanceId) as ComponentInstance<S> | undefined;
    if (!instance) {
      throw new Error(`Instance '${instanceId}' not found`);
    }

    if (instance.halted) {
      console.warn(`Instance '${instanceId}' is halted, skipping update`);
      return instance;
    }

    const action = instance.definition.actions[actionName];
    if (!action) {
      throw new Error(`Action '${actionName}' not found on component`);
    }

    // Apply action to get state delta
    const stateDelta = action(...args);
    const newState = {
      ...instance.currentState,
      ...stateDelta
    } as S;

    // Update instance
    instance.currentState = newState;
    instance.revision++;
    instance.lastUpdatedAt = Date.now();

    // Record state for halting detection
    this.stateHaltEngine.record(instanceId, newState, instance.revision);

    // Check for state stability and halt if needed
    this.checkStateStability(instanceId);

    // Enforce policies
    const policyResult = this.policyEngine.enforce(instance);
    instance.policyViolations = policyResult.violations;

    if (!policyResult.passed && this.haltConfig.haltOnPolicyViolation) {
      instance.halted = true;
      instance.haltReason = "Policy violation detected";
      this.fireLifecycleHook(LifecycleHook.HALTED, instanceId, instance);
    } else {
      this.fireLifecycleHook(LifecycleHook.UPDATED, instanceId, instance);
    }

    return instance;
  }

  /**
   * Manually halt a component
   */
  halt(instanceId: string, reason: string = "Manual halt"): ComponentInstance<any> | null {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance '${instanceId}' not found`);
    }

    instance.halted = true;
    instance.haltReason = reason;
    this.fireLifecycleHook(LifecycleHook.HALTED, instanceId, instance);

    return instance;
  }

  /**
   * Resume a halted component
   */
  resume(instanceId: string): ComponentInstance<any> | null {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance '${instanceId}' not found`);
    }

    instance.halted = false;
    instance.haltReason = undefined;
    this.stateHaltEngine.clear(instanceId);

    return instance;
  }

  /**
   * Destroy a component instance
   */
  destroy(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance '${instanceId}' not found`);
    }

    this.fireLifecycleHook(LifecycleHook.DESTROYED, instanceId, instance);
    this.instances.delete(instanceId);
    this.stateHaltEngine.clear(instanceId);
  }

  /**
   * Subscribe to lifecycle events
   */
  onLifecycle(handler: LifecycleHandler): void {
    this.lifecycleHandlers.push(handler);
  }

  /**
   * Get an instance by ID
   */
  getInstance<S = any>(instanceId: string): ComponentInstance<S> | null {
    const instance = this.instances.get(instanceId);
    return instance ? (instance as ComponentInstance<S>) : null;
  }

  /**
   * Get all active instances
   */
  getInstances<S = any>(): ComponentInstance<S>[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get all registered components
   */
  getRegistered(): ComponentDefinition<any>[] {
    return Array.from(this.registry.values());
  }

  /**
   * Check if instance state has stabilized and halt if needed
   */
  private checkStateStability(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.halted) return;

    const recommendation = this.stateHaltEngine.getHaltRecommendation(instanceId);

    if (recommendation.shouldHalt) {
      instance.halted = true;
      instance.haltReason = recommendation.reason;
      this.fireLifecycleHook(LifecycleHook.HALTED, instanceId, instance);
    }
  }

  /**
   * Fire lifecycle hook to all subscribers
   */
  private fireLifecycleHook<S = any>(
    hook: LifecycleHook,
    instanceId: string,
    instance: ComponentInstance<S>
  ): void {
    const timestamp = Date.now();

    for (const handler of this.lifecycleHandlers) {
      try {
        handler({
          hook,
          instanceId,
          instance,
          timestamp
        });
      } catch (error) {
        console.error(`Error in lifecycle handler for ${hook}:`, error);
      }
    }
  }
}
