/**
 * ValidationState.ts
 * 
 * Implementation of the ValidationState class for the OBIX validation system.
 * This class represents a state within the validation state machine and maintains
 * relationships between states, validation rules, and transitions.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationError } from "../../../src/core/validation/errors/ValidationError";
import { ValidationRule } from "../../../src/core/validation/rules/ValidationRule";

/**
 * Represents a state within the validation state machine
 */
export class ValidationState {
  /**
   * Unique identifier for this state
   */
  public stateId: string;

  /**
   * Whether this state is currently active
   */
  public active: boolean;

  /**
   * Additional metadata associated with this state
   */
  public metadata: Record<string, any>;

  /**
   * Possible transitions from this state to other states
   */
  public transitions: Map<string, ValidationState>;

  /**
   * Validation rules associated with this state
   */
  public validationRules: ValidationRule[];

  /**
   * Equivalence class identifier for state minimization
   */
  public equivalenceClass: number;

  /**
   * Error recovery actions for this state
   */
  public errorRecoveryActions: Map<string, Function>;

  /**
   * Creates a new ValidationState instance
   * 
   * @param stateId Unique identifier for this state
   * @param active Whether this state is initially active
   * @param metadata Additional metadata for this state
   * @param equivalenceClass Optional equivalence class identifier
   */
  constructor(
    stateId: string,
    active: boolean = false,
    metadata: Record<string, any> = {},
    equivalenceClass: number = -1
  ) {
    this.stateId = stateId;
    this.active = active;
    this.metadata = { ...metadata };
    this.transitions = new Map<string, ValidationState>();
    this.validationRules = [];
    this.equivalenceClass = equivalenceClass;
    this.errorRecoveryActions = new Map<string, Function>();
  }

  /**
   * Gets the state ID
   * 
   * @returns State ID
   */
  public getId(): string {
    return this.stateId;
  }

  /**
   * Checks if this state is active
   * 
   * @returns True if the state is active
   */
  public isActive(): boolean {
    return this.active;
  }

  /**
   * Sets the active state
   * 
   * @param active New active state
   * @returns This state for method chaining
   */
  public setActive(active: boolean): ValidationState {
    this.active = active;
    return this;
  }

  /**
   * Gets metadata value by key
   * 
   * @param key Metadata key
   * @returns Metadata value or undefined if not found
   */
  public getMetadata(key: string): any {
    return this.metadata[key];
  }

  /**
   * Sets metadata value
   * 
   * @param key Metadata key
   * @param value Metadata value
   * @returns This state for method chaining
   */
  public setMetadata(key: string, value: any): ValidationState {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Gets all metadata
   * 
   * @returns Metadata record
   */
  public getAllMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  /**
   * Adds a transition to another state
   * 
   * @param targetStateId ID of the target state
   * @param targetState The target state
   * @returns This state for method chaining
   */
  public addTransition(targetStateId: string, targetState: ValidationState): ValidationState {
    this.transitions.set(targetStateId, targetState);
    return this;
  }

  /**
   * Removes a transition
   * 
   * @param targetStateId ID of the target state
   * @returns This state for method chaining
   */
  public removeTransition(targetStateId: string): ValidationState {
    this.transitions.delete(targetStateId);
    return this;
  }

  /**
   * Gets a target state by ID
   * 
   * @param targetStateId ID of the target state
   * @returns Target state or undefined if not found
   */
  public getTransition(targetStateId: string): ValidationState | undefined {
    return this.transitions.get(targetStateId);
  }

  /**
   * Gets all transitions
   * 
   * @returns Map of state IDs to states
   */
  public getAllTransitions(): Map<string, ValidationState> {
    return new Map(this.transitions);
  }

  /**
   * Checks if this state can transition to a target state
   * 
   * @param targetStateId ID of the target state
   * @returns True if the transition is possible
   */
  public canTransitionTo(targetStateId: string): boolean {
    return this.transitions.has(targetStateId);
  }

  /**
   * Adds a validation rule to this state
   * 
   * @param rule The validation rule to add
   * @returns This state for method chaining
   */
  public addRule(rule: ValidationRule): ValidationState {
    this.validationRules.push(rule);
    return this;
  }

  /**
   * Removes a validation rule from this state
   * 
   * @param ruleId ID of the rule to remove
   * @returns This state for method chaining
   */
  public removeRule(ruleId: string): ValidationState {
    this.validationRules = this.validationRules.filter(rule => rule.id !== ruleId);
    return this;
  }

  /**
   * Gets all validation rules
   * 
   * @returns Array of validation rules
   */
  public getRules(): ValidationRule[] {
    return [...this.validationRules];
  }

  /**
   * Checks if this state contains a specific rule
   * 
   * @param ruleId ID of the rule to check
   * @returns True if the rule exists in this state
   */
  public containsRule(ruleId: string): boolean {
    return this.validationRules.some(rule => rule.id === ruleId);
  }

  /**
   * Gets the equivalence class for this state
   * 
   * @returns Equivalence class identifier
   */
  public getEquivalenceClass(): number {
    return this.equivalenceClass;
  }

  /**
   * Sets the equivalence class for this state
   * 
   * @param equivalenceClass New equivalence class identifier
   * @returns This state for method chaining
   */
  public setEquivalenceClass(equivalenceClass: number): ValidationState {
    this.equivalenceClass = equivalenceClass;
    return this;
  }

  /**
   * Adds an error recovery action for a specific error code
   * 
   * @param errorCode The error code to handle
   * @param action The recovery action function
   * @returns This state for method chaining
   */
  public addErrorRecoveryAction(errorCode: string, action: Function): ValidationState {
    this.errorRecoveryActions.set(errorCode, action);
    return this;
  }

  /**
   * Removes an error recovery action
   * 
   * @param errorCode The error code to remove the action for
   * @returns This state for method chaining
   */
  public removeErrorRecoveryAction(errorCode: string): ValidationState {
    this.errorRecoveryActions.delete(errorCode);
    return this;
  }

  /**
   * Gets an error recovery action for a specific error code
   * 
   * @param errorCode The error code to get the action for
   * @returns The recovery action function or undefined if not found
   */
  public getErrorRecoveryAction(errorCode: string): Function | undefined {
    return this.errorRecoveryActions.get(errorCode);
  }

  /**
   * Checks if this state can handle a specific error
   * 
   * @param error The validation error to check
   * @returns True if the state can handle this error
   */
  public canHandleError(error: ValidationError): boolean {
    return this.errorRecoveryActions.has(error.errorCode);
  }

  /**
   * Gets all error recovery actions
   * 
   * @returns Map of error codes to recovery actions
   */
  public getAllErrorRecoveryActions(): Map<string, Function> {
    return new Map(this.errorRecoveryActions);
  }

  /**
   * Computes a unique signature for this state
   * Used for state equivalence comparison during minimization
   * 
   * @returns A string signature representing this state's characteristics
   */
  public getSignature(): string {
    const parts: string[] = [
      `id:${this.stateId}`,
      `active:${this.active}`,
      `equiv:${this.equivalenceClass}`
    ];

    // Add rule IDs (sorted for consistency)
    const ruleIds = this.validationRules.map(rule => rule.id).sort();
    parts.push(`rules:[${ruleIds.join(',')}]`);

    // Add transition targets (sorted for consistency)
    const transitionTargets = Array.from(this.transitions.keys()).sort();
    parts.push(`transitions:[${transitionTargets.join(',')}]`);

    // Add error handlers (sorted for consistency)
    const errorCodes = Array.from(this.errorRecoveryActions.keys()).sort();
    parts.push(`errors:[${errorCodes.join(',')}]`);

    return parts.join('|');
  }

  /**
   * Creates a deep clone of this state
   * 
   * @returns A new ValidationState with the same properties
   */
  public clone(): ValidationState {
    const cloned = new ValidationState(
      this.stateId,
      this.active,
      { ...this.metadata },
      this.equivalenceClass
    );

    // Clone rules (references are enough since rules should be immutable)
    for (const rule of this.validationRules) {
      cloned.addRule(rule);
    }

    // Clone error recovery actions
    this.errorRecoveryActions.forEach((action, errorCode) => {
      cloned.addErrorRecoveryAction(errorCode, action);
    });

    // Note: Transitions are not cloned here to avoid circular references
    // They need to be re-established separately

    return cloned;
  }

  /**
   * Merges another state into this one
   * 
   * @param other The other state to merge
   * @returns A new merged ValidationState
   */
  public mergeWith(other: ValidationState): ValidationState {
    const merged = this.clone();

    // Merge metadata
    merged.metadata = { ...this.metadata, ...other.getAllMetadata() };

    // Merge rules (avoiding duplicates)
    for (const rule of other.getRules()) {
      if (!merged.containsRule(rule.id)) {
        merged.addRule(rule);
      }
    }

    // Merge error recovery actions (other takes precedence)
    other.getAllErrorRecoveryActions().forEach((action, errorCode) => {
      merged.addErrorRecoveryAction(errorCode, action);
    });

    // Merging transitions would need to be handled separately
    // to avoid circular references

    return merged;
  }

  /**
   * Converts this state to a plain object
   * 
   * @returns A plain object representation of this state
   */
  public toObject(): any {
    return {
      stateId: this.stateId,
      active: this.active,
      metadata: this.metadata,
      equivalenceClass: this.equivalenceClass,
      rules: this.validationRules.map(rule => rule.toObject()),
      transitions: Array.from(this.transitions.keys()),
      errorRecoveryActions: Array.from(this.errorRecoveryActions.keys())
    };
  }

  /**
   * Creates a ValidationState from a plain object
   * 
   * @param obj The plain object to convert
   * @returns A new ValidationState instance
   */
  public static fromObject(obj: any): ValidationState {
    const state = new ValidationState(
      obj.stateId || "unknown",
      obj.active || false,
      obj.metadata || {},
      obj.equivalenceClass || -1
    );

    // Note: Rules and transitions would need to be added separately
    // after all states are created to avoid circular references

    return state;
  }
}

/**
 * Factory class for creating validation states
 */
export class ValidationStateFactory {
  /**
   * Creates an initial validation state
   * 
   * @param stateId Optional state ID (defaults to "initial")
   * @returns A new initial ValidationState
   */
  public static createInitialState(stateId: string = "initial"): ValidationState {
    return new ValidationState(stateId, true, { isInitial: true });
  }

  /**
   * Creates a validation state for accepting final results
   * 
   * @param stateId Optional state ID (defaults to "accepting")
   * @returns A new accepting ValidationState
   */
  public static createAcceptingState(stateId: string = "accepting"): ValidationState {
    return new ValidationState(stateId, false, { isAccepting: true });
  }

  /**
   * Creates an error state for handling validation failures
   * 
   * @param stateId Optional state ID (defaults to "error")
   * @returns A new error ValidationState
   */
  public static createErrorState(stateId: string = "error"): ValidationState {
    return new ValidationState(stateId, false, { isError: true });
  }

  /**
   * Creates a validation state from a configuration object
   * 
   * @param config Configuration object
   * @returns A new ValidationState
   */
  public static createFromConfig(config: any): ValidationState {
    if (!config || typeof config !== 'object') {
      throw new Error('Invalid configuration object');
    }

    const state = new ValidationState(
      config.id || "unknown",
      config.active || false,
      config.metadata || {}
    );

    // Add rules if provided
    if (Array.isArray(config.rules)) {
      for (const ruleConfig of config.rules) {
        // This assumes ValidationRuleFactory exists and has this method
        // You might need to modify this based on your actual implementation
        const rule = require('./ValidationRule').ValidationRuleFactory.fromObject(ruleConfig);
        state.addRule(rule);
      }
    }

    // Error recovery actions would need to be added separately
    // as functions can't be serialized

    return state;
  }
}

/**
 * Predicate interface for state transitions
 */
export interface ValidationStatePredicate {
  /**
   * Evaluates whether a transition should occur
   * 
   * @param state The current state
   * @param context Additional context for evaluation
   * @returns True if the transition should occur
   */
  evaluate(state: ValidationState, context: any): boolean;
}

/**
 * Represents a transition between validation states
 */
export class ValidationStateTransition {
  /**
   * ID of the source state
   */
  public fromState: string;

  /**
   * ID of the target state
   */
  public toState: string;

  /**
   * Predicate that determines if the transition should occur
   */
  public predicate: ValidationStatePredicate;

  /**
   * Creates a new validation state transition
   * 
   * @param fromState ID of the source state
   * @param toState ID of the target state
   * @param predicate Predicate for the transition
   */
  constructor(
    fromState: string,
    toState: string,
    predicate: ValidationStatePredicate
  ) {
    this.fromState = fromState;
    this.toState = toState;
    this.predicate = predicate;
  }

  /**
   * Evaluates whether this transition should occur
   * 
   * @param state The current state
   * @param context Additional context for evaluation
   * @returns True if the transition should occur
   */
  public evaluate(state: ValidationState, context: any): boolean {
    return state.getId() === this.fromState && this.predicate.evaluate(state, context);
  }

  /**
   * Executes this transition in a state machine
   * 
   * @param stateMachine The state machine
   * @param context Additional context for execution
   * @returns The new current state after transition
   */
  public execute(stateMachine: any, context: any): ValidationState {
    // This is a simplified implementation
    // In a real system, you would call methods on the state machine
    // to properly transition between states
    const currentState = stateMachine.getCurrentState();
    
    if (this.evaluate(currentState, context)) {
      return stateMachine.transition(this.toState);
    }
    
    return currentState;
  }
}