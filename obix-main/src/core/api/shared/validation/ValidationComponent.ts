
/**
 * core/api/shared/interfaces/ValidatableComponent.ts
 * 
 * Interface for components that can be validated using the OBIX validation system.
 * This integrates with the automaton state minimization and DOP adapter pattern.
 */
import { ValidationResut } from "@/core/dop";
import { Component } from "../components/ComponentInterface";
import { RenderOutput } from "../render/RenderTypes";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";
import { ValidationResult } from "@/core/dop/ValidationResult";



/**
 * Extends the base Component interface with validation capabilities
 * 
 * @typeParam S - State type
 * @typeParam E - Event names (as string literal types)
 */
export interface ValidatableComponent<S = any, E extends string = string> extends Component<S, E> {
  _rootElement: any;
  updateDOM(output: RenderOutput): unknown;
  minimize(): unknown;
  /**
   * Validates the component against registered validation rules
   * @returns Validation result
   */
  validate(): ValidationResult<any>;
  
  /**
   * Gets all validation rules registered with this component
   * @returns Array of validation rules
   */
  getValidationRules(): ValidationRule[];
  
  /**
   * Adds a validation rule to the component
   * @param rule The validation rule to add
   */
  addValidationRule(rule: ValidationRule): void;
  
  /**
   * Removes a validation rule from the component
   * @param id The ID of the rule to remove
   * @returns True if the rule was removed, false if not found
   */
  removeValidationRule(id: string): boolean;
  
  /**
   * Compares functional and OOP implementations
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  compareImplementations(funcImpl: any, oopImpl: any): boolean;
}

/**
 * core/api/shared/interfaces/LifecycleHooks.ts
 * 
 * Interface defining component lifecycle hooks that work for both
 * functional and OOP implementations.
 */

/**
 * Lifecycle hooks interface for component implementations
 */
export interface LifecycleHooks {
  /**
   * Called before the component is mounted
   */
  onBeforeMount?(): void;
  
  /**
   * Called after the component is mounted
   */
  onMounted?(): void;
  
  /**
   * Called before the component updates
   * @param newState The new state
   * @param oldState The previous state
   */
  onBeforeUpdate?<S>(newState: S, oldState: S): void;
  
  /**
   * Called after the component updates
   * @param newState The new state
   * @param oldState The previous state 
   */
  onUpdated?<S>(newState: S, oldState: S): void;
  
  /**
   * Called before the component unmounts
   */
  onBeforeUnmount?(): void;
  
  /**
   * Called after the component unmounts
   */
  onUnmounted?(): void;
  
  /**
   * Called when an error occurs in the component
   * @param error The error that occurred
   */
  onError?(error: Error): void;
  
  /**
   * Called when a state transition occurs
   * @param event The event that triggered the transition
   * @param payload The payload provided with the event
   * @param newState The new state after transition
   * @param oldState The previous state before transition
   */
  onTransition?<S, E extends string>(event: E, payload: any, newState: S, oldState: S): void;
}

/**
 * Supported lifecycle phases
 */
export enum LifecyclePhase {
  CREATED = 'created',
  BEFORE_MOUNT = 'beforeMount',
  MOUNTED = 'mounted',
  BEFORE_UPDATE = 'beforeUpdate',
  UPDATED = 'updated',
  BEFORE_UNMOUNT = 'beforeUnmount',
  UNMOUNTED = 'unmounted',
  ERROR = 'error'
}
