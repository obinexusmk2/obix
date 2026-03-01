export   interface StateMetadata {
  equivalenceClass: number | null;
  stateSignature: string | null;
  isMinimized: boolean;
  [key: string]: any;
}


/**
 * State class representing a state in an automaton
 * Core component of the Automaton State Minimization system
 */
export class State {

  /** Unique identifier for the state */
  public _id: string;
  
  /** Current value of the state */
  public _value: any;
  
  /** Transitions to other states based on input symbols */
  public _transitions: Map<string, State>;

  /** Collection of all states in the automaton */
  public states: Map<string, State> = new Map();
  
  public isAccepting: boolean = false;
  public equivalenceClass: number = 0;

  /** Metadata for optimization */
  public _metadata: {
    /** Equivalence class identifier */
    equivalenceClass: number | null;
    
    /** Signature for state comparison */
    stateSignature: string | null;
    
    /** Whether this state has been minimized */
    isMinimized: boolean;
    
    /** Custom properties for extended functionality */
    [key: string]: any;
  };

  /**
   * Create a new State instance
   * @param id Unique identifier
   * @param value State value (can be any type)
   */
  constructor(id: string, value: any = null) {
    this._id = id;
    this._value = value;
    this._transitions = new Map();
    this._metadata = {
      equivalenceClass: null,
      stateSignature: null,
      isMinimized: false
    };
  }
 
  


 
  /**
   * Get the state's unique identifier
   */
  get id(): string {
    return this._id;
  }
  /**
   * Set the state's id
   */
  set id(newId: string) {
    this._id = newId;
  }

  
  /**
   * Get the state's value
   */
  get value(): any {
    return this._value;
  }

  /**
   * Set the state's value
   */
  set value(newValue: any) {
    this._value = newValue;
  }

  /**
   * Get all transitions for this state
   */
  get transitions(): Map<string, State> {
    return new Map(this._transitions);
  }

  /**
   * Get the state's metadata
   */
  get metadata(): any {
    return { ...this._metadata };
  }

  /**
   * Set a metadata property
   * @param key Metadata key
   * @param value Metadata value
   */
  setMetadata(key: string, value: any): void {
    this._metadata[key] = value;
  }

  /**
   * Get a metadata property
   * @param key Metadata key
   * @returns The metadata value or undefined
   */
  getMetadata(key: string): any {
    return this._metadata[key];
  }

  /**
   * Get the current state
   */
  get currentState(): State {
    return this;
  }

  /**
   * Set the current state
   * @param state New current state
   */
  set currentState(state: State) {
    this._id = state.id;
    this._value = state.value;
    this._transitions = new Map(state.transitions);
    this._metadata = { ...state.metadata };
  }
  /**
   * Add a transition to another state
   * @param symbol Input symbol triggering the transition
   * @param target Target state
   */
  addTransition(symbol: string, target: State): void {
    this._transitions.set(symbol, target);
  }

  /**
   * Remove a transition
   * @param symbol Input symbol for the transition to remove
   */
  removeTransition(symbol: string): boolean {
    return this._transitions.delete(symbol);
  }

  /**
   * Get the target state for a given input symbol
   * @param symbol Input symbol
   * @returns Target state or undefined if not found
   */
  getNextState(symbol: string): State | undefined {
    return this._transitions.get(symbol);
  }

  /**
   * Check if this state has a transition for a given symbol
   * @param symbol Input symbol
   */
  hasTransition(symbol: string): boolean {
    return this._transitions.has(symbol);
  }

  /**
   * Get all input symbols defined for this state
   */
  getInputSymbols(): string[] {
    return Array.from(this._transitions.keys());
  }

  /**
   * Compute a signature for this state based on its transitions
   * Used for equivalence class computation
   * @param equivalenceClasses Current equivalence classes
   */
  computeStateSignature(equivalenceClasses: Map<number, Set<State>>): string {
    // Start with state properties
    const components = [
      this._id,
      this._metadata.isMinimized ? '1' : '0'
    ];
    
    // Add transition signatures
    const transitionSignatures = Array.from(this._transitions.entries())
      .map(([symbol, targetState]) => {
        const targetClass = this.findEquivalenceClass(targetState, equivalenceClasses);
        return `${symbol}:${targetClass}`;
      })
      .sort();
    
    components.push(transitionSignatures.join('|'));
    
    // Generate and store the signature
    this._metadata.stateSignature = components.join('::');
    return this._metadata.stateSignature;
  }

  /**
   * Find the equivalence class for a state
   * @param state State to find class for
   * @param classes Current equivalence classes
   */
  public findEquivalenceClass(state: State, classes: Map<number, Set<State>>): number {
    // If the state already has an assigned class, use it
    if (state.metadata.equivalenceClass !== null) {
      return state.metadata.equivalenceClass;
    }
    
    // Otherwise search through classes
    for (const [classId, stateSet] of classes.entries()) {
      if (stateSet.has(state)) {
        return classId;
      }
    }
    
    return -1; // Not found in any class
  }

  /**
 * Check if this state is equivalent to another state
 * @param other State to compare with
 * @param alphabet Set of all input symbols
 * @param visited Set of already visited state pairs (prevents infinite recursion)
 */
isEquivalentTo(
  other: State, 
  alphabet: Set<string>,
  visited: Set<string> = new Set()
): boolean {
  // Two states are equivalent if they have the same transitions to equivalent states
  
  // Avoid infinite recursion
  const pairKey = `${this.id},${other.id}`;
  if (visited.has(pairKey)) {
    return true; // Assume equivalent if we're in a cycle
  }
  visited.add(pairKey);
  
  // Check if they have the same input symbols
  const thisSymbols = new Set(this.getInputSymbols());
  const otherSymbols = new Set(other.getInputSymbols());
  
  // Both states should handle the same symbols from the alphabet
  for (const symbol of alphabet) {
    const thisHas = thisSymbols.has(symbol);
    const otherHas = otherSymbols.has(symbol);
    
    if (thisHas !== otherHas) {
      return false; // Different transition structure
    }
    
    if (thisHas && otherHas) {
      const thisNext = this.getNextState(symbol);
      const otherNext = other.getNextState(symbol);
      
      // If transitions go to different states, they're not equivalent
      if (thisNext && otherNext && !thisNext.isEquivalentTo(otherNext, alphabet, visited)) {
        return false;
      }
    }
  }
  
  return true;
} 

  /**
   * Mark this state as part of an equivalence class
   * @param classId Equivalence class identifier
   */
  setEquivalenceClass(classId: number): void {
    this._metadata.equivalenceClass = classId;
  }
  
  /**
   * Clone this state
   */
  clone(): State {
    const clonedState = new State(this._id, this._value);
    clonedState._metadata = { ...this._metadata };
    return clonedState;
  }

  /**
   * Get a state by its ID
   * @param id The unique identifier of the state
   * @returns The state with the given ID, or undefined if not found
   */
  getState(id: string): State | undefined {
    return this.states.get(id);
  }
   
  
  /**
   * Create a string representation of this state
   */
  toString(): string {
    const transitionInfo = Array.from(this._transitions.entries())
      .map(([symbol, target]) => `${symbol} -> ${target.id}`)
      .join(', ');
    
    return `State(${this._id}, transitions: [${transitionInfo}], class: ${this._metadata.equivalenceClass})`;
  }

  /**
   * Export state data to JSON format
   */
  exportToJSON(): any {
    return {
      id: this._id,
      value: this._value,
      transitions: Array.from(this._transitions.entries()).map(([symbol, state]) => ({
        symbol,
        targetId: state.id
      })),
      metadata: this._metadata,
      isAccepting: this.isAccepting,
      equivalenceClass: this.equivalenceClass
    };
  }

  /**
   * Import state data from JSON format
   * @param stateData Parsed JSON state data
   */
  importFromJSON(stateData: any): void {
    if (typeof stateData !== 'object' || !stateData) {
      throw new Error('Invalid state data format');
    }

    this._id = stateData.id;
    this._value = stateData.value;
    this._metadata = stateData.metadata || {
      equivalenceClass: null,
      stateSignature: null,
      isMinimized: false
    };
    this.isAccepting = stateData.isAccepting || false;
    this.equivalenceClass = stateData.equivalenceClass || 0;
    
    // Transitions will need to be relinked externally since we only store IDs
    this._transitions.clear();
  }
}
