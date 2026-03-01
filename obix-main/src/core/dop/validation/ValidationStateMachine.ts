import { IValidationState, ValidationState } from "./ValidationState";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";

/**
 * Interface for state machine events
 */
export interface StateMachineEvent {
  type: string;
  payload?: any;
}

/**
 * Listener for state machine events
 */
export type StateMachineListener = (event: StateMachineEvent, state: IValidationState) => void;

/**
 * Interface for validation state machine
 */
export interface IValidationStateMachine {
  /**
   * Gets all states
   */
  getAllStates(): Map<string, IValidationState>;
  
  /**
   * Gets a state by ID
   */
  getState(stateId: string): IValidationState | null;
  
  /**
   * Gets the current state
   */
  getCurrentState(): IValidationState | null;
  
  /**
   * Gets the initial state
   */
  getInitialState(): IValidationState | null;
  
  /**
   * Adds a state
   */
  addState(state: IValidationState): void;
  
  /**
   * Removes a state
   */
  removeState(stateId: string): void;
  
  /**
   * Adds a transition
   */
  addTransition(fromStateId: string, event: string, toStateId: string): boolean;
  
  /**
   * Removes a transition
   */
  removeTransition(fromStateId: string, event: string): boolean;
  
  /**
   * Checks if a transition is valid
   */
  canTransition(event: string): boolean;
  
  /**
   * Performs a transition
   */
  transition(event: string): boolean;
  
  /**
   * Resets the state machine to the initial state
   */
  reset(): void;
  
  /**
   * Minimizes the state machine
   */
  minimize(): void;
  
  /**
   * Adds a listener
   */
  addListener(listener: StateMachineListener): void;
  
  /**
   * Removes a listener
   */
  removeListener(listener: StateMachineListener): void;
}

/**
 * Validation state machine implementation
 * Implements Nnamdi Okpala's automaton state minimization algorithm
 */
export class ValidationStateMachine implements IValidationStateMachine {
  /**
   * Map of all states
   */
  private states: Map<string, IValidationState>;
  
  /**
   * Current state
   */
  private currentState: IValidationState | null;
  
  /**
   * Initial state
   */
  private initialState: IValidationState | null;
  
  /**
   * State transition history
   */
  private history: string[];
  
  /**
   * Event listeners
   */
  private listeners: StateMachineListener[];
  
  /**
   * Whether the state machine has been minimized
   */
  private isMinimized: boolean;
  
  /**
   * Equivalence classes after minimization
   */
  private equivalenceClasses: Map<number, Set<IValidationState>>;
  
  /**
   * Optimization metrics
   */
  private optimizationMetrics: {
    originalStateCount: number;
    minimizedStateCount: number;
    optimizationRatio: number;
  };

  /**
   * Creates a new validation state machine
   */
  constructor() {
    this.states = new Map<string, IValidationState>();
    this.currentState = null;
    this.initialState = null;
    this.history = [];
    this.listeners = [];
    this.isMinimized = false;
    this.equivalenceClasses = new Map<number, Set<IValidationState>>();
    this.optimizationMetrics = {
      originalStateCount: 0,
      minimizedStateCount: 0,
      optimizationRatio: 1
    };
    
    // Add initial, error, and validated states
    this.addInitialStates();
  }

  /**
   * Adds the initial set of states
   */
  private addInitialStates(): void {
    // Add initial state
    const initialState = new ValidationState('initial', true);
    this.addState(initialState);
    this.initialState = initialState;
    this.currentState = initialState;
    
    // Add error state
    const errorState = new ValidationState('error', false, { isErrorState: true });
    this.addState(errorState);
    
    // Add validated state
    const validatedState = new ValidationState('validated', false, { isValidated: true });
    this.addState(validatedState);
  }

  /**
   * Gets all states
   * 
   * @returns Map of all states
   */
  public getAllStates(): Map<string, IValidationState> {
    return new Map(this.states);
  }

  /**
   * Gets a state by ID
   * 
   * @param stateId State ID
   * @returns State or null if not found
   */
  public getState(stateId: string): IValidationState | null {
    return this.states.get(stateId) || null;
  }

  /**
   * Gets the current state
   * 
   * @returns Current state or null
   */
  public getCurrentState(): IValidationState | null {
    return this.currentState;
  }

  /**
   * Gets the initial state
   * 
   * @returns Initial state or null
   */
  public getInitialState(): IValidationState | null {
    return this.initialState;
  }

  /**
   * Adds a state
   * 
   * @param state State to add
   */
  public addState(state: IValidationState): void {
    const stateId = state.getId();
    
    // Skip if state already exists
    if (this.states.has(stateId)) {
      return;
    }
    
    this.states.set(stateId, state);
    
    // If this is the first state, set it as initial and current
    if (this.states.size === 1) {
      this.initialState = state;
      this.currentState = state;
    }
    
    // Reset minimization
    this.isMinimized = false;
    this.equivalenceClasses.clear();
  }

  /**
   * Removes a state
   * 
   * @param stateId State ID to remove
   */
  public removeState(stateId: string): void {
    // Cannot remove initial, error, or validated states
    if (['initial', 'error', 'validated'].includes(stateId)) {
      return;
    }
    
    const state = this.states.get(stateId);
    if (!state) {
      return;
    }
    
    // Remove state
    this.states.delete(stateId);
    
    // Remove transitions to this state
    for (const [otherStateId, otherState] of this.states.entries()) {
      const transitions = otherState.getAllTransitions();
      
      for (const [event, targetState] of transitions.entries()) {
        if (targetState.getId() === stateId) {
          otherState.removeTransition(event);
        }
      }
    }
    
    // Reset current state if needed
    if (this.currentState && this.currentState.getId() === stateId) {
      this.currentState = this.initialState;
      this.history = this.initialState ? [this.initialState.getId()] : [];
    }
    
    // Reset minimization
    this.isMinimized = false;
    this.equivalenceClasses.clear();
  }

  /**
   * Adds a transition
   * 
   * @param fromStateId Source state ID
   * @param event Event that triggers the transition
   * @param toStateId Target state ID
   * @returns True if the transition was added
   */
  public addTransition(fromStateId: string, event: string, toStateId: string): boolean {
    const fromState = this.states.get(fromStateId);
    const toState = this.states.get(toStateId);
    
    if (!fromState || !toState) {
      return false;
    }
    
    fromState.addTransition(event, toState);
    
    // Reset minimization
    this.isMinimized = false;
    this.equivalenceClasses.clear();
    
    return true;
  }

  /**
   * Removes a transition
   * 
   * @param fromStateId Source state ID
   * @param event Event to remove
   * @returns True if the transition was removed
   */
  public removeTransition(fromStateId: string, event: string): boolean {
    const fromState = this.states.get(fromStateId);
    
    if (!fromState) {
      return false;
    }
    
    // Get transition before removing it
    const transitions = fromState.getAllTransitions();
    const hadTransition = transitions.has(event);
    
    fromState.removeTransition(event);
    
    // Reset minimization
    if (hadTransition) {
      this.isMinimized = false;
      this.equivalenceClasses.clear();
    }
    
    return hadTransition;
  }

  /**
   * Checks if a transition is valid from the current state
   * 
   * @param event Event to check
   * @returns True if the transition is valid
   */
  public canTransition(event: string): boolean {
    if (!this.currentState) {
      return false;
    }
    
    const transitions = this.currentState.getAllTransitions();
    return transitions.has(event);
  }

  /**
   * Performs a transition
   * 
   * @param event Event to trigger the transition
   * @returns True if the transition was successful
   */
  public transition(event: string): boolean {
    if (!this.currentState) {
      return false;
    }
    
    const transitions = this.currentState.getAllTransitions();
    const nextState = transitions.get(event);
    
    if (!nextState) {
      // Try error recovery
      const errorAction = this.currentState.getErrorRecoveryAction(event);
      if (errorAction) {
        try {
          errorAction();
        } catch (e) {
          console.error('Error during error recovery:', e);
        }
      }
      
      // Transition to error state
      const errorState = this.states.get('error');
      if (errorState) {
        this.currentState.setActive(false);
        errorState.setActive(true);
        this.currentState = errorState;
        this.history.push(errorState.getId());
        
        // Notify listeners
        this.notifyListeners({
          type: 'transition_error',
          payload: { event, fromState: this.currentState.getId(), error: true }
        });
      }
      
      return false;
    }
    
    // Perform transition
    this.currentState.setActive(false);
    nextState.setActive(true);
    this.currentState = nextState;
    this.history.push(nextState.getId());
    
    // Notify listeners
    this.notifyListeners({
      type: 'transition',
      payload: { event, fromState: this.history[this.history.length - 2], toState: nextState.getId() }
    });
    
    return true;
  }

  /**
   * Resets the state machine to the initial state
   */
  public reset(): void {
    if (!this.initialState) {
      return;
    }
    
    // Deactivate current state
    if (this.currentState) {
      this.currentState.setActive(false);
    }
    
    // Activate initial state
    this.initialState.setActive(true);
    this.currentState = this.initialState;
    this.history = [this.initialState.getId()];
    
    // Notify listeners
    this.notifyListeners({
      type: 'reset',
      payload: { initialState: this.initialState.getId() }
    });
  }

  /**
   * Minimizes the state machine using Nnamdi Okpala's algorithm
   */
  public minimize(): void {
    if (this.isMinimized) {
      return;
    }
    
    // Store original state count
    this.optimizationMetrics.originalStateCount = this.states.size;
    
    // Step 1: Compute state signatures
    for (const state of this.states.values()) {
      if (state instanceof ValidationState) {
        (state as ValidationState).computeStateSignature();
      }
    }
    
    // Step 2: Initial partition by accepting/non-accepting states
    const accepting = new Set<IValidationState>();
    const nonAccepting = new Set<IValidationState>();
    
    for (const state of this.states.values()) {
      if (state.getMetadata('isValidated')) {
        accepting.add(state);
      } else {
        nonAccepting.add(state);
      }
    }
    
    // Step 3: Refine partitions until no more refinement is possible
    let partition = [accepting, nonAccepting].filter(set => set.size > 0);
    let refined = true;
    
    while (refined) {
      refined = false;
      const newPartition: Set<IValidationState>[] = [];
      
      for (const stateSet of partition) {
        // Skip single-state partitions
        if (stateSet.size <= 1) {
          newPartition.push(stateSet);
          continue;
        }
        
        // Group states by signature
        const bySignature = new Map<string, Set<IValidationState>>();
        
        for (const state of stateSet) {
          let signature = '';
          
          if (state instanceof ValidationState) {
            signature = (state as ValidationState).computeStateSignature();
          } else {
            // If not a ValidationState, use transitions to calculate signature
            signature = this.computeStateSignature(state, partition);
          }
          
          if (!bySignature.has(signature)) {
            bySignature.set(signature, new Set());
          }
          
          bySignature.get(signature)!.add(state);
        }
        
        // If we found more than one signature, we can refine the partition
        if (bySignature.size > 1) {
          refined = true;
          for (const subSet of bySignature.values()) {
            newPartition.push(subSet);
          }
        } else {
          newPartition.push(stateSet);
        }
      }
      
      partition = newPartition;
    }
    
    // Step 4: Assign equivalence classes
    this.equivalenceClasses.clear();
    partition.forEach((stateSet, index) => {
      this.equivalenceClasses.set(index, stateSet);
      
      for (const state of stateSet) {
        state.setEquivalenceClass(index);
      }
    });
    
    // Update metrics
    this.optimizationMetrics.minimizedStateCount = this.equivalenceClasses.size;
    this.optimizationMetrics.optimizationRatio = 
      this.equivalenceClasses.size / this.optimizationMetrics.originalStateCount;
    
    this.isMinimized = true;
    
    // Notify listeners
    this.notifyListeners({
      type: 'minimized',
      payload: { 
        originalStateCount: this.optimizationMetrics.originalStateCount,
        minimizedStateCount: this.optimizationMetrics.minimizedStateCount,
        optimizationRatio: this.optimizationMetrics.optimizationRatio
      }
    });
  }
  
  /**
   * Compute a state signature for minimization
   * 
   * @param state State to compute signature for
   * @param partition Current partition
   * @returns Signature string
   */
  private computeStateSignature(state: IValidationState, partition: Set<IValidationState>[]): string {
    const components: string[] = [];
    
    // Add state ID
    components.push(`id:${state.getId()}`);
    
    // Add transitions (sorted for determinism)
    const transitions = state.getAllTransitions();
    const events = Array.from(transitions.keys()).sort();
    
    for (const event of events) {
      const targetState = transitions.get(event)!;
      
      // Find which partition the target state belongs to
      const partitionIndex = partition.findIndex(p => p.has(targetState));
      components.push(`${event}:${partitionIndex}`);
    }
    
    // Add rule IDs (sorted for determinism)
    const ruleIds = state.getRules().map(rule => rule.getId()).sort();
    components.push(`rules:[${ruleIds.join(',')}]`);
    
    return components.join('|');
  }
  
  /**
   * Gets the state history
   * 
   * @returns Array of state IDs in the order they were visited
   */
  public getHistory(): string[] {
    return [...this.history];
  }
  
  /**
   * Gets optimization metrics from state minimization
   * 
   * @returns Optimization metrics
   */
  public getOptimizationMetrics(): typeof this.optimizationMetrics {
    return { ...this.optimizationMetrics };
  }
  
  /**
   * Adds a listener for state machine events
   * 
   * @param listener Listener function
   */
  public addListener(listener: StateMachineListener): void {
    if (!this.listeners.includes(listener)) {
      this.listeners.push(listener);
    }
  }
  
  /**
   * Removes a listener
   * 
   * @param listener Listener function to remove
   */
  public removeListener(listener: StateMachineListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * Notifies listeners of an event
   * 
   * @param event Event to notify about
   */
  private notifyListeners(event: StateMachineEvent): void {
    if (!this.currentState) {
      return;
    }
    
    for (const listener of this.listeners) {
      try {
        listener(event, this.currentState);
      } catch (e) {
        console.error('Error in state machine listener:', e);
      }
    }
  }
  
  /**
   * Adds a rule to a state
   * 
   * @param stateId State ID
   * @param rule Rule to add
   * @returns True if the rule was added
   */
  public addRuleToState(stateId: string, rule: ValidationRule): boolean {
    const state = this.states.get(stateId);
    
    if (!state) {
      return false;
    }
    
    state.addRule(rule);
    return true;
  }
  
  /**
   * Removes a rule from a state
   * 
   * @param stateId State ID
   * @param ruleId Rule ID to remove
   * @returns True if the rule was removed
   */
  public removeRuleFromState(stateId: string, ruleId: string): boolean {
    const state = this.states.get(stateId);
    
    if (!state) {
      return false;
    }
    
    if (state.containsRule(ruleId)) {
      state.removeRule(ruleId);
      return true;
    }
    
    return false;
  }
  
  /**
   * Gets all rules for a state
   * 
   * @param stateId State ID
   * @returns Array of validation rules or empty array if state not found
   */
  public getRulesForState(stateId: string): ValidationRule[] {
    const state = this.states.get(stateId);
    
    if (!state) {
      return [];
    }
    
    return state.getRules();
  }
  
  /**
   * Gets all states that belong to a specific equivalence class
   * 
   * @param equivalenceClass Equivalence class ID
   * @returns Set of states or undefined if class not found
   */
  public getStatesInEquivalenceClass(equivalenceClass: number): Set<IValidationState> | undefined {
    return this.equivalenceClasses.get(equivalenceClass);
  }
  
  /**
   * Gets all equivalence classes
   * 
   * @returns Map of equivalence classes
   */
  public getEquivalenceClasses(): Map<number, Set<IValidationState>> {
    return new Map(this.equivalenceClasses);
  }
  
  /**
   * Converts the state machine to a plain object
   * 
   * @returns Plain object representation
   */
  public toObject(): Record<string, any> {
    return {
      states: Array.from(this.states.values()).map(state => state.toObject()),
      currentStateId: this.currentState?.getId() || null,
      initialStateId: this.initialState?.getId() || null,
      history: [...this.history],
      isMinimized: this.isMinimized,
      equivalenceClasses: Object.fromEntries(
        Array.from(this.equivalenceClasses.entries())
          .map(([classId, states]) => [
            classId,
            Array.from(states).map(state => state.getId())
          ])
      ),
      optimizationMetrics: { ...this.optimizationMetrics }
    };
  }
  
  /**
   * Creates a state machine from a plain object
   * Note: Listeners need to be added separately
   * 
   * @param obj Plain object representation
   * @param ruleRegistry Registry of validation rules to reconstruct rule references
   * @returns New ValidationStateMachine instance
   */
  public static fromObject(
    obj: Record<string, any>,
    ruleRegistry: Map<string, ValidationRule>
  ): ValidationStateMachine {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid object for ValidationStateMachine deserialization');
    }
    
    const stateMachine = new ValidationStateMachine();
    
    // Clear default states
    stateMachine.states.clear();
    stateMachine.initialState = null;
    stateMachine.currentState = null;
    
    // Reconstruct states
    const stateMap = new Map<string, IValidationState>();
    if (Array.isArray(obj.states)) {
      for (const stateObj of obj.states) {
        const state = ValidationState.fromObject(stateObj);
        stateMap.set(state.getId(), state);
        stateMachine.states.set(state.getId(), state);
      }
    }
    
    // Reconstruct transitions
    if (Array.isArray(obj.states)) {
      for (const stateObj of obj.states) {
        const state = stateMap.get(stateObj.id);
        
        if (state && stateObj.transitions) {
          for (const [event, targetId] of Object.entries(stateObj.transitions)) {
            const targetState = stateMap.get(targetId as string);
            
            if (targetState) {
              state.addTransition(event, targetState);
            }
          }
        }
      }
    }
    
    // Reconstruct rules
    if (Array.isArray(obj.states)) {
      for (const stateObj of obj.states) {
        const state = stateMap.get(stateObj.id);
        
        if (state && Array.isArray(stateObj.ruleIds)) {
          for (const ruleId of stateObj.ruleIds) {
            const rule = ruleRegistry.get(ruleId);
            
            if (rule) {
              state.addRule(rule);
            }
          }
        }
      }
    }
    
    // Set initial and current states
    if (obj.initialStateId && stateMap.has(obj.initialStateId)) {
      stateMachine.initialState = stateMap.get(obj.initialStateId)!;
    }
    
    if (obj.currentStateId && stateMap.has(obj.currentStateId)) {
      stateMachine.currentState = stateMap.get(obj.currentStateId)!;
      stateMachine.currentState.setActive(true);
    }
    
    // Set history
    if (Array.isArray(obj.history)) {
      stateMachine.history = [...obj.history];
    }
    
    // Set minimization status
    stateMachine.isMinimized = obj.isMinimized || false;
    
    // Reconstruct equivalence classes
    if (obj.equivalenceClasses && typeof obj.equivalenceClasses === 'object') {
      for (const [classId, stateIds] of Object.entries(obj.equivalenceClasses)) {
        if (Array.isArray(stateIds)) {
          const stateSet = new Set<IValidationState>();
          
          for (const stateId of stateIds) {
            const state = stateMap.get(stateId);
            
            if (state) {
              stateSet.add(state);
              state.setEquivalenceClass(Number(classId));
            }
          }
          
          if (stateSet.size > 0) {
            stateMachine.equivalenceClasses.set(Number(classId), stateSet);
          }
        }
      }
    }
    
    // Set optimization metrics
    if (obj['optimizationMetrics'] && typeof obj['optimizationMetrics'] === 'object') {
      stateMachine.optimizationMetrics = {
        originalStateCount: obj['optimizationMetrics']['originalStateCount'] || 0,
        minimizedStateCount: obj['optimizationMetrics']['minimizedStateCount'] || 0,
        optimizationRatio: obj['optimizationMetrics']['optimizationRatio'] || 1
      };
    }
    
    return stateMachine;
  }
}