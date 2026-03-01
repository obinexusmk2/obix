/**
 * core/api/shared/implementations/ComponentStateManager.ts
 * 
 * Implementation of the StateManager interface for component state management
 * using immutable update patterns.
 */

import { updateState, deepUpdateState } from "@/api/utils";
import { StateListener, StateManager } from "../state/StateManager";




/**
 * Manages component state with immutable updates
 * 
 * @typeParam S - State type
 */
export class ComponentStateManager<S extends object> implements StateManager<S> {
  /**
   * Initial state used for resets
   */
  public initialState: S;
  
  /**
   * Current state
   */
  public currentState: S;
  
  /**
   * Set of state change listeners
   */
  public listeners: Set<StateListener<S>> = new Set();
  
  /**
   * Creates a new ComponentStateManager
   * 
   * @param initialState Initial component state
   */
  constructor(initialState: S) {
    this.initialState = { ...initialState };
    this.currentState = { ...initialState };
  }
  
  /**
   * Gets the current state
   * 
   * @returns Current state
   */
  public getState(): S {
    return this.currentState;
  }
  
  /**
   * Updates the state with partial changes
   * 
   * @param newState Partial state updates
   */
  public setState(newState: Partial<S>): void {
    const oldState = this.currentState;
    this.currentState = updateState(this.currentState, newState);
    
    // Notify listeners
    this.notifyListeners(this.currentState, oldState);
  }
  
  /**
   * Updates a nested state property
   * 
   * @param path Path to the property to update
   * @param value New value
   */
  public setDeepState(path: string[], value: any): void {
    const oldState = this.currentState;
    this.currentState = deepUpdateState(this.currentState, path, value);
    
    // Notify listeners
    this.notifyListeners(this.currentState, oldState);
  }
  
  /**
   * Resets state to initial values
   */
  public resetState(): void {
    const oldState = this.currentState;
    this.currentState = { ...this.initialState };
    
    // Notify listeners
    this.notifyListeners(this.currentState, oldState);
  }
  
  /**
   * Subscribe to state changes
   * 
   * @param listener Function called when state changes
   * @returns Unsubscribe function
   */
  public subscribe(listener: StateListener<S>): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Creates a state snapshot for debugging or serialization
   * 
   * @returns Serializable state snapshot
   */
  public createSnapshot(): object {
    return JSON.parse(JSON.stringify(this.currentState));
  }
  
  /**
   * Updates the initial state
   * Useful for persisting state between sessions
   * 
   * @param newInitialState New initial state
   */
  public updateInitialState(newInitialState: S): void {
    this.initialState = { ...newInitialState };
  }
  
  /**
   * Notifies all listeners of a state change
   * 
   * @public
   * @param newState New state
   * @param oldState Old state
   */
  public notifyListeners(newState: S, oldState: S): void {
    for (const listener of this.listeners) {
      try {
        listener(newState, oldState);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    }
  }
}
