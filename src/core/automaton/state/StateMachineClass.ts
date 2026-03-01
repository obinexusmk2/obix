import { State } from "./State.js";

/** 
 * Represents a finite state machine/automaton
 * Core component for state transition management
 */
export class StateMachine {

  /** All states in the machine */
  protected _statesMap: Map<string, State> = new Map();
  
  /** Initial state */
  public _initialState: State | null;
  
  /** Current state */
  protected _currentState: State | null = null;  
  /** Complete alphabet (all input symbols) */
  public _alphabet: Set<string>;
  
  /** Whether this is a minimized machine */
  public _isMinimized: boolean;
  _states: Map<any, any>;

  /**
   * Create a new state machine
   * @param initialStateId Optional ID for the initial state
   */
  constructor(initialStateId?: string) {
    this._states = new Map();
    this._initialState = null;
    this._currentState = null;
    this._alphabet = new Set();
    this._isMinimized = false;
    
    if (initialStateId) {
      this.addState(initialStateId);
      this.setInitialState(initialStateId);
    }
  }

  /**
   * Add a new state to the machine
   * @param id State identifier
   * @param value Optional state value
   * @returns The newly created state
   */
  addState(id: string, value: any = null): State {
    if (this._states.has(id)) {
      throw new Error(`State with ID '${id}' already exists.`);
    }
    
    const state = new State(id, value);
    this._states.set(id, state);
    
    if (!this._initialState) {
      this._initialState = state;
      this._currentState = state;
    }
    
    return state;
  }

    /**
   * Get a single state by its ID
   * @param id State identifier
   * @returns The state with the given ID or undefined if not found
   */
    getState(id: string): State | undefined {
      return this._states.get(id);
    }
    
  /**
   * Set the current state
   */
  set currentState(state: State | null) {
    this._currentState = state;
  }

  /**
   * Set the initial state
   * Throws error if trying to set initial state when other states exist
   */
  set initialState(state: State | null) {
    if (state && this._states.size > 1) {
      throw new Error('Cannot set initial state when other states exist');
    }
    this._initialState = state;
  }
  
  /**
   *  Set the states of the machine
   * @param states
   * @param newStates 
   */
  protected setStates(newStates: Map<string, State>): void {
    this._statesMap.clear();
    newStates.forEach((state, id) => {
      this._statesMap.set(id, state);
    });
  }

protected setCurrentState(state: State | null): State | null {
  this._currentState = state;
  return state;
  }

  protected getCurrentState(): State | null {
  return this._currentState;
  }

  /**
   * Set the minimized state flag
   * @param value Whether the machine is minimized
   *  */
  setMinimized(value: boolean): void {
    this._isMinimized = value;
  }


/**
 * 
 * @param currentState 
 *
 */
  resetToState(currentState: string): void {
    const state = this._states.get(currentState);
    if (!state) {
      throw new Error(`State with ID '${currentState}' not found.`);
    }
    this._currentState = state;
  }

  /**
   * Get a state by its ID
   * @param id State identifier
   */
  getStates(id: string): State | undefined {
    return this._states.get(id);
  }

  /**
   * Set the initial state of the machine
   * @param stateId ID of the initial state
   */
  setInitialState(stateId: string): void {
    const state = this._states.get(stateId);
    if (!state) {
      throw new Error(`State with ID '${stateId}' not found.`);
    }
    
    this._initialState = state;
    this._currentState = state;
  }

  /**
   * Add a transition between states
   * @param fromStateId Source state ID
   * @param symbol Input symbol
   * @param toStateId Target state ID
   */
  addTransition(fromStateId: string, symbol: string, toStateId: string): void {
    const fromState = this._states.get(fromStateId);
    const toState = this._states.get(toStateId);
    
    if (!fromState) {
      throw new Error(`Source state '${fromStateId}' not found.`);
    }
    
    if (!toState) {
      throw new Error(`Target state '${toStateId}' not found.`);
    }
    
    // Add the symbol to the alphabet
    this._alphabet.add(symbol);
    
    // Add the transition
    fromState.addTransition(symbol, toState);
  }

  /**
   * Process an input symbol and transition to the next state
   * @param symbol Input symbol
   * @returns The new current state
   */
  transition(symbol: string): State {
    if (!this._currentState) {
      throw new Error('No current state set.');
    }
    
    const nextState = this._currentState.getNextState(symbol);
    if (!nextState) {
      throw new Error(`No transition defined for symbol '${symbol}' from current state '${this._currentState.id}'.`);
    }
    
    this._currentState = nextState;
    return nextState;
  }

  /**
   * Reset the machine to its initial state
   */
  reset(): void {
    this._currentState = this._initialState;
  }

  /**
   * Get the current state
   */
  get currentState(): State | null {
    return this._currentState;
  }

  /**
   * Get the initial state
   */
  get initialState(): State | null {
    return this._initialState;
  }

  /**
   * Get all states in the machine
   */
  get states(): Map<string, State> {
    return new Map(this._states);
  }

  /**
   * Get the complete alphabet (all input symbols)
   */
  get alphabet(): Set<string> {
    return new Set(this._alphabet);
  }

  /**
   * Check if the machine is minimized
   */
  get isMinimized(): boolean {
    return this._isMinimized;
  }

  /**
   * Process a sequence of input symbols
   * @param symbols Array of input symbols
   * @returns The final state after processing all symbols
   */
  processSequence(symbols: string[]): State {
    this.reset();
    
    for (const symbol of symbols) {
      this.transition(symbol);
    }
    
    return this._currentState!;
  }

  /**
   * Check if a sequence of input symbols leads to an accepting state
   * @param symbols Array of input symbols
   * @returns True if the final state is an accepting state
   */
  accepts(symbols: string[]): boolean {
    try {
      const finalState = this.processSequence(symbols);
      // A state is accepting if it has the 'accepting' metadata set to true
      return finalState.getMetadata('accepting') === true;
    } catch (error) {
      return false; // If there's an error in processing, the sequence is not accepted
    }
  }

  /**
   * Get the set of states reachable from the initial state
   */
  getReachableStates(): Set<State> {
    const reachable = new Set<State>();
    const queue: State[] = [];
    
    if (this._initialState) {
      queue.push(this._initialState);
      reachable.add(this._initialState);
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      for (const symbol of this._alphabet) {
        const nextState = current.getNextState(symbol);
        
        if (nextState && !reachable.has(nextState)) {
          reachable.add(nextState);
          queue.push(nextState);
        }
      }
    }
    
    return reachable;
  }

  /**
   * Remove unreachable states
   * @returns The number of states removed
   */
  removeUnreachableStates(): number {
    const reachable = this.getReachableStates();
    const initial = this._states.size;
    
    // Remove states that aren't reachable
    for (const [id, state] of this._states.entries()) {
      if (!reachable.has(state)) {
        this._states.delete(id);
      }
    }
    
    return initial - this._states.size;
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    this._states.clear();
    this._initialState = null;
    this._currentState = null;
    this._alphabet.clear();
  }

  /**
   * Create a string representation of this state machine
   */
  toString(): string {
    const statesStr = Array.from(this._states.values())
      .map(state => state.toString())
      .join('\n');
    
    return `StateMachine(${this._isMinimized ? 'minimized' : 'non-minimized'})\n${statesStr}`;
  }
}
