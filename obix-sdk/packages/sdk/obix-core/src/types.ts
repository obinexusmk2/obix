/**
 * Core type definitions for OBIX runtime engine
 * Implements data-oriented component lifecycle management
 */

/**
 * Configuration for state halting behavior
 */
export interface StateHaltConfig {
  /** Maximum number of revisions to track before mandatory halt */
  maxRevisions: number;
  /** Number of identical states needed to determine stability (deep compare) */
  stabilityThreshold: number;
  /** Whether to halt component if policy enforcement fails */
  haltOnPolicyViolation: boolean;
}

/**
 * Lifecycle event types
 */
export enum LifecycleHook {
  CREATED = "CREATED",
  MOUNTED = "MOUNTED",
  UPDATED = "UPDATED",
  HALTED = "HALTED",
  DESTROYED = "DESTROYED"
}

/**
 * Lifecycle event handler callback
 */
export type LifecycleHandler<S = any> = (event: {
  hook: LifecycleHook;
  instanceId: string;
  instance?: ComponentInstance<S>;
  timestamp: number;
}) => void | Promise<void>;

/**
 * Policy enforcement result
 */
export interface PolicyResult {
  passed: boolean;
  violations: Array<{
    policy: string;
    message: string;
  }>;
}

/**
 * Named policy that can be enforced on component instances
 */
export interface Policy<S = any> {
  name: string;
  enforce: (instance: ComponentInstance<S>) => PolicyResult;
}

/**
 * Plain object action that modifies component state
 */
export interface Action<S = any, A extends any[] = any[]> {
  (...args: A): Partial<S>;
}

/**
 * Render function for component UI representation
 */
export type RenderFn<S = any> = (state: S) => any;

/**
 * Component definition - plain data object describing component structure
 * Data-oriented: no classes, pure configuration
 */
export interface ComponentDefinition<S = any> {
  name: string;
  state: S;
  actions: Record<string, Action<S, any>>;
  render: RenderFn<S>;
  policies?: Policy<S>[];
}

/**
 * Active instance of a component with runtime state
 */
export interface ComponentInstance<S = any> {
  id: string;
  definition: ComponentDefinition<S>;
  currentState: S;
  halted: boolean;
  haltReason?: string;
  revision: number;
  createdAt: number;
  lastUpdatedAt: number;
  policyViolations?: Array<{
    policy: string;
    message: string;
  }>;
}

/**
 * Component logic - alias for ComponentDefinition used in adapter/component contexts
 * Represents the pure data description of a component's behavior
 */
export type ComponentLogic<S = any> = ComponentDefinition<S>;

/**
 * State stability recommendation from state halt engine
 */
export interface HaltRecommendation {
  shouldHalt: boolean;
  reason?: string;
  stableForRevisions: number;
}
