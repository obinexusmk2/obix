/**
 * OBIX Core - Runtime engine for Heart/Soul UI/UX SDK
 * Data-oriented component lifecycle management with intelligent state halting
 */

export type {
  StateHaltConfig,
  LifecycleHandler,
  PolicyResult,
  Policy,
  Action,
  RenderFn,
  ComponentDefinition,
  ComponentLogic,
  ComponentInstance,
  HaltRecommendation
} from "./types.js";

export { LifecycleHook } from "./types.js";

export { ObixRuntime } from "./runtime.js";
export { StateHaltEngine } from "./state-halting.js";
export { PolicyEngine } from "./policy.js";
