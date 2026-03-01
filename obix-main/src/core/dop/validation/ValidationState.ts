import { ValidationRule } from "@/core/validation/rules/ValidationRule";

/**
 * Interface for validation state
 */
export interface IValidationState {
  /**
   * Gets the state ID
   */
  getId(): string;
  
  /**
   * Checks if this state is active
   */
  isActive(): boolean;
  
  /**
   * Sets whether this state is active
   */
  setActive(isActive: boolean): void;
  
  /**
   * Gets a metadata value
   */
  getMetadata(key?: string): any;
  
  /**
   * Sets metadata
   */
  setMetadata(metadata: Record<string, any>): void;
  
  /**
   * Sets the equivalence class
   */
  setEquivalenceClass(equivalenceClass: number | null): void;
  
  /**
   * Gets all transitions
   */
  getAllTransitions(): Map<string, IValidationState>;
  
  /**
   * Adds a transition
   */
  addTransition(event: string, targetState: IValidationState): void;
  
  /**
   * Removes a transition
   */
  removeTransition(event: string): void;
  
  /**
   * Gets an error recovery action
   */
  getErrorRecoveryAction(event: string): Function | null;
  
  /**
   * Gets all error recovery actions
   */
  getAllErrorRecoveryActions(): Map<string, Function>;
  
  /**
   * Adds an error recovery action
   */
  addErrorRecoveryAction(event: string, action: Function): void;
  
  /**
   * Removes an error recovery action
   */
  removeErrorRecoveryAction(event: string): void;
  
  /**
   * Gets all validation rules
   */
  getRules(): ValidationRule[];
  
  /**
   * Checks if this state contains a rule
   */
  containsRule(ruleId: string): boolean;
  
  /**
   * Adds a validation rule
   */
  addRule(rule: ValidationRule): void;
  
  /**
   * Removes a validation rule
   */
  removeRule(ruleId: string): void;
  
  /**
   * Clears all validation rules
   */
  clearRules(): void;
  
  /**
   * Creates a clone of this state
   */
  clone(): IValidationState;
  
  /**
   * Converts this state to a plain object
   */
  toObject(): Record<string, any>;
}

/**
 * ValidationState class implementation
 * Represents a state in the validation state machine with Nnamdi Okpala's state minimization
 */
export class ValidationState implements IValidationState {
  /**
   * Unique identifier for this state
   */
  private stateId: string;
  
  /**
   * Whether this state is currently active
   */
  private active: boolean;
  
  /**
   * Additional metadata associated with this state
   */
  private metadata: Record<string, any>;
  
  /**
   * Equivalence class identifier for state minimization
   */
  private equivalenceClass: number | null;
  
  /**
   * Transitions to other states
   */
  private transitions: Map<string, IValidationState>;
  
  /**
   * Error recovery actions
   */
  private errorRecoveryActions: Map<string, Function>;
  
  /**
   * Validation rules associated with this state
   */
  private validationRules: ValidationRule[];
  
  /**
   * Computed state signature (for equivalence class determination)
   */
  private stateSignature: string | null;

  /**
   * Creates a new ValidationState
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
    equivalenceClass: number | null = null
  ) {
    this.stateId = stateId;
    this.active = active;
    this.metadata = { ...metadata };
    this.equivalenceClass = equivalenceClass;
    this.transitions = new Map<string, IValidationState>();
    this.errorRecoveryActions = new Map<string, Function>();
    this.validationRules = [];
    this.stateSignature = null;
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
   * Sets whether this state is active
   * 
   * @param isActive Whether this state should be active
   */
  public setActive(isActive: boolean): void {
    this.active = isActive;
  }

  /**
   * Gets metadata value by key or all metadata if no key is provided
   * 
   * @param key Optional metadata key
   * @returns Metadata value or all metadata
   */
  public getMetadata(key?: string): any {
    if (key) {
      return this.metadata[key];
    }
    return { ...this.metadata };
  }

  /**
   * Sets metadata
   * 
   * @param metadata Metadata to set
   */
  public setMetadata(metadata: Record<string, any>): void {
    this.metadata = { ...metadata };
    this.stateSignature = null; // Invalidate state signature
  }

  /**
   * Gets the equivalence class
   * 
   * @returns The equivalence class ID or null if not set
   */
  public getEquivalenceClass(): number | null {
    return this.equivalenceClass;
  }

  /**
   * Sets the equivalence class
   * 
   * @param equivalenceClass The equivalence class ID or null
   */
  public setEquivalenceClass(equivalenceClass: number | null): void {
    this.equivalenceClass = equivalenceClass;
  }

  /**
   * Gets all transitions
   * 
   * @returns Map of transitions
   */
  public getAllTransitions(): Map<string, IValidationState> {
    return new Map(this.transitions);
  }

  /**
   * Adds a transition
   * 
   * @param event Event that triggers the transition
   * @param targetState Target state
   */
  public addTransition(event: string, targetState: IValidationState): void {
    this.transitions.set(event, targetState);
    this.stateSignature = null; // Invalidate state signature
  }

  /**
   * Removes a transition
   * 
   * @param event Event to remove
   */
  public removeTransition(event: string): void {
    this.transitions.delete(event);
    this.stateSignature = null; // Invalidate state signature
  }

  /**
   * Gets an error recovery action
   * 
   * @param event Event that triggers the action
   * @returns Action function or null if not found
   */
  public getErrorRecoveryAction(event: string): Function | null {
    return this.errorRecoveryActions.get(event) || null;
  }

  /**
   * Gets all error recovery actions
   * 
   * @returns Map of error recovery actions
   */
  public getAllErrorRecoveryActions(): Map<string, Function> {
    return new Map(this.errorRecoveryActions);
  }

  /**
   * Adds an error recovery action
   * 
   * @param event Event that triggers the action
   * @param action Action function
   */
  public addErrorRecoveryAction(event: string, action: Function): void {
    this.errorRecoveryActions.set(event, action);
  }

  /**
   * Removes an error recovery action
   * 
   * @param event Event to remove
   */
  public removeErrorRecoveryAction(event: string): void {
    this.errorRecoveryActions.delete(event);
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
   * Checks if this state contains a rule with the given ID
   * 
   * @param ruleId Rule ID to check for
   * @returns True if the rule is found
   */
  public containsRule(ruleId: string): boolean {
    return this.validationRules.some(rule => rule.getId() === ruleId);
  }

  /**
   * Adds a validation rule
   * 
   * @param rule Rule to add
   */
  public addRule(rule: ValidationRule): void {
    if (!this.containsRule(rule.getId())) {
      this.validationRules.push(rule);
      this.stateSignature = null; // Invalidate state signature
    }
  }

  /**
   * Removes a validation rule
   * 
   * @param ruleId ID of the rule to remove
   */
  public removeRule(ruleId: string): void {
    this.validationRules = this.validationRules.filter(rule => rule.getId() !== ruleId);
    this.stateSignature = null; // Invalidate state signature
  }

  /**
   * Clears all validation rules
   */
  public clearRules(): void {
    this.validationRules = [];
    this.stateSignature = null; // Invalidate state signature
  }

  /**
   * Computes the state signature
   * Used for equivalence class determination in state minimization
   * 
   * @returns State signature string
   */
  public computeStateSignature(): string {
    if (this.stateSignature) {
      return this.stateSignature;
    }
    
    // Build signature components
    const components: string[] = [];
    
    // Add state ID
    components.push(`id:${this.stateId}`);
    
    // Add metadata (sorted keys for determinism)
    const metadataKeys = Object.keys(this.metadata).sort();
    const metadataStr = metadataKeys.map(key => `${key}:${JSON.stringify(this.metadata[key])}`).join('|');
    components.push(`metadata:{${metadataStr}}`);
    
    // Add transitions (sorted events for determinism)
    const transitionEvents = Array.from(this.transitions.keys()).sort();
    const transitionsStr = transitionEvents.map(event => {
      const targetState = this.transitions.get(event);
      return `${event}:${targetState ? targetState.getId() : 'null'}`;
    }).join('|');
    components.push(`transitions:{${transitionsStr}}`);
    
    // Add rule IDs (sorted for determinism)
    const ruleIds = this.validationRules.map(rule => rule.getId()).sort();
    components.push(`rules:[${ruleIds.join(',')}]`);
    
    // Combine all components
    this.stateSignature = components.join('|');
    return this.stateSignature;
  }

  /**
   * Creates a clone of this state
   * 
   * @returns A new ValidationState instance
   */
  public clone(): IValidationState {
    const clone = new ValidationState(
      this.stateId,
      this.active,
      { ...this.metadata },
      this.equivalenceClass
    );
    
    // Clone transitions (shallow)
    this.transitions.forEach((targetState, event) => {
      clone.transitions.set(event, targetState);
    });
    
    // Clone error recovery actions
    this.errorRecoveryActions.forEach((action, event) => {
      clone.errorRecoveryActions.set(event, action);
    });
    
    // Clone validation rules (reference)
    clone.validationRules = [...this.validationRules];
    
    // Copy state signature if available
    clone.stateSignature = this.stateSignature;
    
    return clone;
  }

  /**
   * Converts this state to a plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): Record<string, any> {
    return {
      id: this.stateId,
      active: this.active,
      metadata: { ...this.metadata },
      equivalenceClass: this.equivalenceClass,
      // Store transitions as { event: targetStateId }
      transitions: Object.fromEntries(
        Array.from(this.transitions.entries())
          .map(([event, targetState]) => [event, targetState.getId()])
      ),
      // Don't serialize functions, just store event names
      errorRecoveryEvents: Array.from(this.errorRecoveryActions.keys()),
      // Store rule IDs
      ruleIds: this.validationRules.map(rule => rule.getId())
    };
  }

  /**
   * Creates a ValidationState from a plain object
   * Note: Transitions, error recovery actions, and rules need to be restored separately
   * 
   * @param obj Plain object representation
   * @returns New ValidationState instance
   */
  public static fromObject(obj: Record<string, any>): ValidationState {
    if (!obj || typeof obj !== 'object' || !obj['id']) {
      throw new Error('Invalid object for ValidationState deserialization');
    }
    
    return new ValidationState(
      obj['id'],
      obj['active'] || false,
      obj['metadata'] || {},
      obj['equivalenceClass'] || null
    );
  }
}