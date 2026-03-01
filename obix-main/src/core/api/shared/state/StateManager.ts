

/**
 * StateManager interface for handling component state
 * 
 * @typeParam S - State type
 */
export interface StateManager<S = any> {
  /**
   * Gets the current state
   * @returns Current state
   */
  getState(): S;
  
  /**
   * Updates the state with partial changes using immutable pattern
   * @param newState Partial state updates
   */
  setState(newState: Partial<S>): void;
  
  /**
   * Resets state to initial values
   */
  resetState(): void;
  
  /**
   * Subscribe to state changes
   * @param listener Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateListener<S>): () => void;
  
  /**
   * Creates a state snapshot for debugging or serialization
   * @returns Serializable state snapshot
   */
  createSnapshot(): object;
}



/**
 * Function signature for state change listeners
 */
export type StateListener<S = any> = (newState: S, oldState: S) => void;


