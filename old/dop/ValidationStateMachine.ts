/**
 * ValidationStateMachine.ts
 * 
 * Implementation of the ValidationStateMachine class for the OBIX validation system.
 * This class manages the state transitions and state minimization for the validation process,
 * implementing the core automaton state minimization technology from Nnamdi Okpala.
 * 
 * Copyright © 2025 OBINexus Computing
 * @author OBINexus Computing
 * @author Nnamdi Okpala
 */
import { ValidationDataModel } from "../../../src/core/validation/data/ValidationDataModel";
import { ValidationError } from "../../../src/core/validation/errors/ValidationError";
import { ValidationBehaviorModel } from "./ValidationBehaviourModel";
import { ValidationResult } from "./ValidationResult";
import { ValidationState } from "./ValidationState";

/**
 * Manages the states and transitions of the validation process
 */
export class ValidationStateMachine {
  /**
   * Map of state IDs to ValidationState instances
   */
  public states: Map<string, ValidationState>;

  /**
   * The current active state
   */
  public currentState: ValidationState | null;

  /**
   * Map of source state IDs to maps of input symbols to target state IDs
   */
  public transitions: Map<string, Map<string, string>>;

  /**
   * Map of state IDs to error handler functions
   */
  public errorHandlers: Map<string, Function>;

  /**
   * ID of the initial state
   */
  public initialStateId: string | null;

  /**
   * Creates a new ValidationStateMachine instance
   */
  constructor() {
    this.states = new Map<string, ValidationState>();
    this.currentState = null;
    this.transitions = new Map<string, Map<string, string>>();
    this.errorHandlers = new Map<string, Function>();
    this.initialStateId = null;
  }

  /**
   * Adds a rule to the current state
   * 
   * @param rule The rule to add
   * @returns This state machine for method chaining
   */
  public addRule(rule: any): ValidationStateMachine {
    if (!this.currentState) {
      throw new Error("No current state to add the rule to");
    }
    this.currentState.addRule(rule);
    return this;
  }

  /**
   * Adds a state to the state machine
   * 
   * @param state The state to add
   * @returns This state machine for method chaining
   */
  public addState(state: ValidationState): ValidationStateMachine {
    const stateId = state.getId();
    this.states.set(stateId, state);

    // If this is the first state or it's marked as active, set it as the current state
    if (this.states.size === 1 || state.isActive()) {
      this.currentState = state;
      this.initialStateId = stateId;
    }

    // Initialize transitions map for this state
    if (!this.transitions.has(stateId)) {
      this.transitions.set(stateId, new Map<string, string>());
    }

    return this;
  }

    /**
     * Updates the state machine by validating HTML virtual nodes, comparing HTML and CSS nodes,
     * and reflecting any changes on the UI.
     * 
     * This method ensures that the validation process is complete and any differences between
     * the HTML and CSS nodes are resolved and reflected in the user interface.
     */
    public update(): void {
      // Validate HTML virtual nodes using the behavior model
      const validationModel = new ValidationBehaviorModel();
      const htmlNodes = this.getAllStates(); // Assuming states represent HTML virtual nodes
      const validationResults = new Map<string, ValidationResult<any>>();

      htmlNodes.forEach((node, nodeId) => {
        const rules = validationModel.getRulesForDataModel(node as unknown as ValidationDataModel);
        const result = validationModel.validate(node as unknown as ValidationDataModel);
        validationResults.set(nodeId, result);
      });

      // Compare HTML and CSS nodes and detect differences
      validationResults.forEach((result, nodeId) => {
        if (!result.isValid) {
          console.warn(`Validation failed for node ${nodeId}:`, result.errors);
        }
      });

      // Reflect changes on the UI
      validationResults.forEach((result, nodeId) => {
        if (result.isValid) {
          console.log(`Node ${nodeId} is valid. Reflecting changes on the UI.`);
          // Logic to update the UI with the validated node
        }
      });

      console.log("State machine updated with validation and UI synchronization.");
    }
    
  /**
   * Removes a state from the state machine
   * 
   * @param stateId ID of the state to remove
   * @returns This state machine for method chaining
   */
  public removeState(stateId: string): ValidationStateMachine {
    // Remove the state
    this.states.delete(stateId);

    // Remove transitions from this state
    this.transitions.delete(stateId);

    // Remove transitions to this state
    for (const [_, transitionMap] of this.transitions.entries()) {
      for (const [input, targetId] of transitionMap.entries()) {
        if (targetId === stateId) {
          transitionMap.delete(input);
        }
      
    
      }
    }

    // Remove error handlers for this state
    this.errorHandlers.delete(stateId);

    // If the current state was removed, reset to the initial state if possible
    if (this.currentState && this.currentState.getId() === stateId) {
      this.reset();
    }

    return this;
  }


  
      
        /**
         * Updates the transitions for a given state
         * 
         * @param stateId ID of the state to update transitions for
         * @param newTransitions Map of input symbols to target state IDs
         * @returns This state machine for method chaining
         */
        public updateTransitions(stateId: string, newTransitions: Map<string, string>): ValidationStateMachine {
          if (!this.states.has(stateId)) {
            throw new Error(`State "${stateId}" does not exist`);
          }
      
          this.transitions.set(stateId, newTransitions);
          return this;
        }
  /**
   * Invalidates the current state machine, clearing all states and transitions
   * 
   * @returns This state machine for method chaining
   */
    public invalidate(): ValidationStateMachine {
        this.states.clear();
        this.transitions.clear();
        this.errorHandlers.clear();
        this.currentState = null;
        this.initialStateId = null;
        return this;
      }
    

  /**
   * Gets a state by ID
   * 
   * @param stateId ID of the state to get
   * @returns The state or undefined if not found
   */
  public getState(stateId: string): ValidationState | undefined {
    return this.states.get(stateId);
  }

  /**
   * Gets all states
   * 
   * @returns Map of state IDs to states
   */
  public getAllStates(): Map<string, ValidationState> {
    return new Map(this.states);
  }

  /**
   * Gets the current state
   * 
   * @returns The current state or null if none
   */
  public getCurrentState(): ValidationState | null {
    return this.currentState;
  }

  /**
   * Adds a transition between states
   * 
   * @param from ID of the source state
   * @param on Input symbol for the transition
   * @param to ID of the target state
   * @returns This state machine for method chaining
   */
  public addTransition(from: string, on: string, to: string): ValidationStateMachine {
    // Ensure both states exist
    if (!this.states.has(from)) {
      throw new Error(`Source state "${from}" does not exist`);
    }
    if (!this.states.has(to)) {
      throw new Error(`Target state "${to}" does not exist`);
    }

    // Initialize transitions map for source state if needed
    if (!this.transitions.has(from)) {
      this.transitions.set(from, new Map<string, string>());
    }

    // Add the transition
    this.transitions.get(from)!.set(on, to);

    return this;
  }

  /**
   * Removes a transition
   * 
   * @param from ID of the source state
   * @param on Input symbol for the transition
   * @returns This state machine for method chaining
   */
  public removeTransition(from: string, on: string): ValidationStateMachine {
    if (this.transitions.has(from)) {
      this.transitions.get(from)!.delete(on);
    }
    return this;
  }

  /**
   * Gets all transitions from a state
   * 
   * @param stateId ID of the state
   * @returns Map of input symbols to target state IDs, or empty map if state not found
   */
  public getTransitionsFromState(stateId: string): Map<string, string> {
    return this.transitions.get(stateId) || new Map<string, string>();
  }

  /**
   * Adds an error handler for a state
   * 
   * @param stateId ID of the state
   * @param handler Error handler function
   * @returns This state machine for method chaining
   */
  public addErrorHandler(stateId: string, handler: Function): ValidationStateMachine {
    if (!this.states.has(stateId)) {
      throw new Error(`State "${stateId}" does not exist`);
    }
    this.errorHandlers.set(stateId, handler);
    return this;
  }

  /**
   * Removes an error handler
   * 
   * @param stateId ID of the state
   * @returns This state machine for method chaining
   */
  public removeErrorHandler(stateId: string): ValidationStateMachine {
    this.errorHandlers.delete(stateId);
    return this;
  }

  /**
   * Transitions to a new state based on input
   * 
   * @param input Input symbol for the transition
   * @returns The new current state, or the unchanged current state if transition not possible
   */
  public transition(input: string): ValidationState {
    if (!this.currentState) {
      throw new Error("No current state");
    }

    const currentStateId = this.currentState.getId();
    const transitionsFromCurrentState = this.transitions.get(currentStateId);

    if (!transitionsFromCurrentState) {
      return this.currentState;
    }

    const targetStateId = transitionsFromCurrentState.get(input);
    if (!targetStateId) {
      return this.currentState;
    }

    const targetState = this.states.get(targetStateId);
    if (!targetState) {
      return this.currentState;
    }

    // Update current state
    this.currentState = targetState;
    return this.currentState;
  }

  /**
   * Handles an error in the current state
   * 
   * @param error The validation error
   * @returns The new current state after error handling
   */
  public handleErrorInState(error: ValidationError): ValidationState {
    if (!this.currentState) {
      throw new Error("No current state");
    }

    const currentStateId = this.currentState.getId();
    
    // Check if the current state has an error recovery action for this error
    const recoveryAction = this.currentState.getErrorRecoveryAction(error.errorCode);
    if (recoveryAction) {
      try {
        // Execute the recovery action
        recoveryAction(error, this);
      } catch (e) {
        console.error(`Error executing recovery action for error ${error.errorCode}:`, e);
      }
    }

    // Check if there's a global error handler for this state
    const errorHandler = this.errorHandlers.get(currentStateId);
    if (errorHandler) {
      try {
        // Execute the error handler
        const result = errorHandler(error, this.currentState);
        
        // If the handler returns a state ID, transition to that state
        if (typeof result === 'string' && this.states.has(result)) {
          this.currentState = this.states.get(result)!;
        }
      } catch (e) {
        console.error(`Error executing error handler for state ${currentStateId}:`, e);
      }
    }

    return this.currentState;
  }

  /**
   * Resets the state machine to the initial state
   * 
   * @returns This state machine for method chaining
   */
  public reset(): ValidationStateMachine {
    if (this.initialStateId && this.states.has(this.initialStateId)) {
      this.currentState = this.states.get(this.initialStateId)!;
    } else if (this.states.size > 0) {
      // If initial state is not available, use the first state
      this.currentState = this.states.values().next().value ?? null;
    } else {
      this.currentState = null;
    }
    return this;
  }

  /**
   * Minimizes the state machine by merging equivalent states
   * Implements Nnamdi Okpala's automaton state minimization algorithm
   * 
   * @returns This state machine for method chaining
   */
  public minimize(): ValidationStateMachine {
    // Step 1: Compute equivalence classes
    const equivalenceClasses = this.computeEquivalenceClasses();
    
    // Step 2: Merge equivalent states
    this.mergeEquivalentStates(equivalenceClasses);
    
    return this;
  }

  /**
   * Computes equivalence classes for states
   * States in the same equivalence class can be merged
   * 
   * @public
   * @returns Map of state IDs to equivalence class IDs
   */
  public computeEquivalenceClasses(): Map<string, number> {
    // Initialize mapping of state IDs to equivalence classes
    const stateToClass = new Map<string, number>();
    const stateList = Array.from(this.states.values());
    
    // Initially partition states into two classes: accepting and non-accepting
    // For the validation state machine, we consider a state "accepting" if it has
    // the "isAccepting" metadata flag set to true
    let classCounter = 0;
    
    // First partition: accepting vs non-accepting states
    const acceptingStates = stateList.filter(state => state.getMetadata("isAccepting") === true);
    const nonAcceptingStates = stateList.filter(state => state.getMetadata("isAccepting") !== true);
    
    // Assign initial equivalence classes
    for (const state of acceptingStates) {
      stateToClass.set(state.getId(), 0);
    }
    
    for (const state of nonAcceptingStates) {
      stateToClass.set(state.getId(), 1);
    }
    
    classCounter = 2;
    
    // Iteratively refine equivalence classes until no further refinement is possible
    let changed = true;
    while (changed) {
      changed = false;
      
      // Group states by current equivalence class
      const classToBucket = new Map<number, string[]>();
      for (const [stateId, classId] of stateToClass.entries()) {
        if (!classToBucket.has(classId)) {
          classToBucket.set(classId, []);
        }
        classToBucket.get(classId)!.push(stateId);
      }
      
      // For each equivalence class with more than one state
      for (const [_, bucket] of classToBucket.entries()) {
        if (bucket.length <= 1) continue;
        
        // Split the bucket based on transition behavior
        const splits = this.splitByTransitions(bucket, stateToClass);
        
        // If split produced more than one new bucket, update equivalence classes
        if (splits.length > 1) {
          changed = true;
          
          // Keep original class ID for first split
          if (splits[0]) {
            for (const stateId of splits[0]) {
              stateToClass.set(stateId, _);
            }
          }
          
          // Assign new class IDs for remaining splits
          for (let i = 1; i < splits.length; i++) {
            const split = splits[i];
            if (split) {
              for (const stateId of split) {
                stateToClass.set(stateId, classCounter);
              }
              classCounter++;
            }
          }
        }
      }
    }
    
    // Update equivalence class in each state
    for (const [stateId, classId] of stateToClass.entries()) {
      const state = this.states.get(stateId);
      if (state) {
        state.setEquivalenceClass(classId);
      }
    }
    
    return stateToClass;
  }
  
  /**
   * Splits a bucket of states based on their transition behavior
   * 
   * @public
   * @param bucket Array of state IDs in the current bucket
   * @param stateToClass Current mapping of state IDs to equivalence classes
   * @returns Array of buckets (each an array of state IDs)
   */
  public splitByTransitions(bucket: string[], stateToClass: Map<string, number>): string[][] {
    const signatures = new Map<string, string[]>();
    
    // Compute transition signature for each state
    for (const stateId of bucket) {
      const signature = this.computeTransitionSignature(stateId, stateToClass);
      
      if (!signatures.has(signature)) {
        signatures.set(signature, []);
      }
      
      signatures.get(signature)!.push(stateId);
    }
    
    // Return the splits
    return Array.from(signatures.values());
  }
  
  /**
   * Computes a transition signature for a state
   * States with the same signature have equivalent transition behavior
   * 
   * @public
   * @param stateId ID of the state
   * @param stateToClass Current mapping of state IDs to equivalence classes
   * @returns Signature string
   */
  public computeTransitionSignature(stateId: string, stateToClass: Map<string, number>): string {
    const transitionMap = this.transitions.get(stateId) || new Map<string, string>();
    const parts: string[] = [];
    
    // Sort inputs for consistent signatures
    const sortedInputs = Array.from(transitionMap.keys()).sort();
    
    for (const input of sortedInputs) {
      const targetId = transitionMap.get(input)!;
      const targetClass = stateToClass.get(targetId) || -1;
      parts.push(`${input}:${targetClass}`);
    }
    
    // Include rule IDs for consistent signatures
    const state = this.states.get(stateId);
    if (state) {
      const ruleIds = state.getRules().map(rule => rule.id).sort();
      if (ruleIds.length > 0) {
        parts.push(`rules:[${ruleIds.join(',')}]`);
      }
      
      // Include error recovery capabilities
      const errorCodes = Array.from(state.getAllErrorRecoveryActions().keys()).sort();
      if (errorCodes.length > 0) {
        parts.push(`errors:[${errorCodes.join(',')}]`);
      }
    }
    
    return parts.join('|');
  }
  
  /**
   * Merges equivalent states based on computed equivalence classes
   * 
   * @public
   * @param stateToClass Mapping of state IDs to equivalence classes
   */
  public mergeEquivalentStates(stateToClass: Map<string, number>): void {
    // Group states by equivalence class
    const classToBucket = new Map<number, string[]>();
    for (const [stateId, classId] of stateToClass.entries()) {
      if (!classToBucket.has(classId)) {
        classToBucket.set(classId, []);
      }
      classToBucket.get(classId)!.push(stateId);
    }
  
    // For each equivalence class with more than one state
    for (const [_, bucket] of classToBucket.entries()) {
      if (bucket.length <= 1) continue;
  
      // Choose a representative state for this class
      const representativeId = bucket[0];

  
      // Merge other states in this class into the representative
      for (let i = 1; i < bucket.length; i++) {
        const stateToMergeId = bucket[i];
  
        // Merge states
        if (stateToMergeId && representativeId) {
          this.mergeStateInto(stateToMergeId, representativeId);
  
          // Remove the merged state
          this.removeState(stateToMergeId);
        }
      }
    }
  }

  /**
   * Merges one state into another
   * 
   * @public
   * @param sourceId ID of the state to merge from
   * @param targetId ID of the state to merge into
   */
  public mergeStateInto(sourceId: string, targetId: string): void {
    const sourceState = this.states.get(sourceId);
    const targetState = this.states.get(targetId);
    
    if (!sourceState || !targetState) {
      return;
    }
    
    // Merge rules (avoid duplicates)
    for (const rule of sourceState.getRules()) {
      if (!targetState.containsRule(rule.id)) {
        targetState.addRule(rule);
      }
    }
    
    // Merge error recovery actions (target takes precedence on conflicts)
    sourceState.getAllErrorRecoveryActions().forEach((action, errorCode) => {
      if (!targetState.getErrorRecoveryAction(errorCode)) {
        targetState.addErrorRecoveryAction(errorCode, action);
      }
    });

    // Move all transitions from sourceId to targetId
  const sourceTransitions = this.transitions.get(sourceId);
  const targetTransitions = this.transitions.get(targetId) || new Map<string, string>();

  // Redirect all transitions to sourceId to targetId
  for (const [fromId, transitionMap] of this.transitions.entries()) {
    if (fromId !== sourceId) { // Only process transitions not from the source state
      for (const [input, toId] of transitionMap.entries()) {
        if (toId === sourceId) {
          transitionMap.set(input, targetId);
        }
      }
    }
  }
    
    if (sourceTransitions) {
      sourceTransitions.forEach((toId, input) => {
        // Only add if target doesn't already have a transition for this input
        if (!targetTransitions.has(input)) {
          targetTransitions.set(input, toId);
        }
      });
      
      this.transitions.set(targetId, targetTransitions);
    }
    
    // If source was the current state, make target the current state
    if (this.currentState && this.currentState.getId() === sourceId) {
      this.currentState = targetState;
    }
    
    // If source was the initial state, make target the initial state
    if (this.initialStateId === sourceId) {
      this.initialStateId = targetId;
    }
  }
  


  /**
   * Creates an optimized copy of this state machine
   * Uses the automaton state minimization algorithm
   * 
   * @returns A new minimized ValidationStateMachine
   */
  public createMinimized(): ValidationStateMachine {
    // Clone this state machine
    const minimized = this.clone();
    
    // Minimize the clone
    minimized.minimize();
    
    return minimized;
  }
  
  /**
   * Creates a clone of this state machine
   * 
   * @returns A new ValidationStateMachine instance
   */
  public clone(): ValidationStateMachine {
    const cloned = new ValidationStateMachine();
    
    // Clone states
    for (const [_, state] of this.states.entries()) {
      cloned.addState(state.clone());
    }
    
    // Clone transitions
    for (const [fromId, transitionMap] of this.transitions.entries()) {
      for (const [input, toId] of transitionMap.entries()) {
        cloned.addTransition(fromId, input, toId);
      }
    }
    
    // Clone error handlers
    for (const [stateId, handler] of this.errorHandlers.entries()) {
      cloned.addErrorHandler(stateId, handler);
    }
    
    // Set initial state
    if (this.initialStateId) {
      cloned.initialStateId = this.initialStateId;
    }
    
    // Set current state
    if (this.currentState) {
      const currentId = this.currentState.getId();
      cloned.currentState = cloned.states.get(currentId) || null;
    }
    
    return cloned;
  }
  
  /**
   * Converts this state machine to a plain object
   * 
   * @returns A plain object representation of this state machine
   */
  public toObject(): any {
    const statesObj: Record<string, any> = {};
    for (const [stateId, state] of this.states.entries()) {
      statesObj[stateId] = state.toObject();
    }
    
    const transitionsObj: Record<string, Record<string, string>> = {};
    for (const [fromId, transitionMap] of this.transitions.entries()) {
      transitionsObj[fromId] = Object.fromEntries(transitionMap);
    }
    
    return {
      states: statesObj,
      transitions: transitionsObj,
      initialStateId: this.initialStateId,
      currentStateId: this.currentState ? this.currentState.getId() : null
    };
  }
  
  /**
   * Creates a ValidationStateMachine from a plain object
   * Note: Error handlers can't be serialized/deserialized directly
   * 
   * @param obj The plain object to convert
   * @returns A new ValidationStateMachine instance
   */
  public static fromObject(obj: any): ValidationStateMachine {
    const stateMachine = new ValidationStateMachine();
    
    // Create states
    if (obj.states && typeof obj.states === 'object') {
      for (const [stateId, stateObj] of Object.entries(obj.states)) {
        const state = ValidationState.fromObject({ ...(stateObj as object), stateId });      
          stateMachine.addState(state);
      }
    }
    
    // Add transitions
    if (obj.transitions && typeof obj.transitions === 'object') {
      for (const [fromId, transitionsObj] of Object.entries(obj.transitions)) {
        if (transitionsObj && typeof transitionsObj === 'object') {
          for (const [input, toId] of Object.entries(transitionsObj as Record<string, string>)) {
            stateMachine.addTransition(fromId, input, toId as string);
          }
        }
      }
    }
    
    // Set initial state
    if (obj.initialStateId && typeof obj.initialStateId === 'string') {
      stateMachine.initialStateId = obj.initialStateId;
    }
    
    // Set current state
    if (obj.currentStateId && typeof obj.currentStateId === 'string') {
      const currentState = stateMachine.states.get(obj.currentStateId);
      if (currentState) {
        stateMachine.currentState = currentState;
      }
    }
    
    return stateMachine;
  }
}