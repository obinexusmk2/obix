/**
 * core/api/shared/interfaces/TransitionManager.ts
 * 
 * Interface for managing component state transitions
 */

import { ValidationStateMachine } from "@/core/dop/ValidationStateMachine";





/**
 * Function signature for state transition functions
 */
export type TransitionFunction<S = any, P = any> = (state: S, payload?: P) => Partial<S>;

/**
 * TransitionManager interface for handling state transitions
 * with automaton state minimization
 * 
 * @typeParam S - State type
 * @typeParam E - Event names
 */
export interface TransitionManager<S = any, E extends string = string> {
  /**
   * Adds a state transition for an event
   * @param event The event that triggers the transition
   * @param transition The transition function
   */
  addTransition(event: E, transition: TransitionFunction<S>): void;
  
  /**
   * Removes a transition for an event
   * @param event The event to remove transition for
   */
  removeTransition(event: E): void;
  
  /**
   * Executes a transition for an event
   * @param event The event to trigger
   * @param payload Optional payload for the transition
   * @returns New state after transition
   */
  executeTransition(event: E, payload?: any): Partial<S>;
  
  /**
   * Gets the underlying state machine
   * @returns ValidationStateMachine instance
   */
  getStateMachine(): ValidationStateMachine;
  
  /**
   * Optimizes transitions using automaton state minimization
   */
  minimize(): void;
  
  /**
   * Exports the transition graph for visualization
   * @returns JSON representation of transition graph
   */
  exportTransitionGraph(): object;
}
