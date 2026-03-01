
/**
 * core/api/shared/implementations/ComponentTransitionManager.ts
 * 
 * Implementation of the TransitionManager interface for component state transitions
 * leveraging automaton state minimization.
 */

import { TransitionFunction } from "@/core/automaton";
import { ValidationState } from "@/core/dop/ValidationState";
import { ValidationStateMachine } from "@/core/dop/ValidationStateMachine";
import { TransitionManager } from "../transitions/TransitionManager";



/**
 * Manages component state transitions with automaton minimization
 * 
 * @typeParam S - State type
 * @typeParam E - Event names
 */
export class ComponentTransitionManager<S = any, E extends string = string> implements TransitionManager<S, E> {
  /**
   * The state machine powering transitions
   */
  public stateMachine: ValidationStateMachine;
  
  /**
   * Map of events to transition functions
   */
  public transitions: Map<string, TransitionFunction<S>> = new Map();
  
  /**
   * Current component state
   */
  public currentState: S;
  
  /**
   * Create a new ComponentTransitionManager
   * 
   * @param initialState Initial component state
   * @param stateMachine Optional existing state machine
   */
  constructor(initialState: S, stateMachine?: ValidationStateMachine) {
    this.currentState = initialState;
    this.stateMachine = stateMachine || new ValidationStateMachine();
    
    // Initialize with initial state if state machine is empty
    if (!stateMachine || !this.stateMachine.getCurrentState()) {
      this.initializeStateMachine();
    }
  }
  
  /**
   * Adds a state transition for an event
   * 
   * @param event The event that triggers the transition
   * @param transition The transition function
   */
  public addTransition(event: E, transition: TransitionFunction<S>): void {
    this.transitions.set(event, transition);
    
    // Create a validation state for this transition if it doesn't exist
    const stateId = `state_${event}`;
    if (!this.stateMachine.getState(stateId)) {
      const transitionState = new ValidationState(stateId, false, {
        event,
        transitionFn: String(transition)
      });
      
      this.stateMachine.addState(transitionState);
      
      // Add transition from initial state to this state
      this.stateMachine.addTransition('initial', event, stateId);
      
      // Add transition back to initial state
      this.stateMachine.addTransition(stateId, 'complete', 'initial');
    }
  }
  
  /**
   * Removes a transition for an event
   * 
   * @param event The event to remove transition for
   */
  public removeTransition(event: E): void {
    this.transitions.delete(event);
    
    // Remove state and transitions for this event
    const stateId = `state_${event}`;
    this.stateMachine.removeState(stateId);
  }
  
  /**
   * Executes a transition for an event
   * 
   * @param event The event to trigger
   * @param payload Optional payload for the transition
   * @returns New state after transition
   */
  public executeTransition(event: E, payload?: any): Partial<S> {
    const transition = this.transitions.get(event);
    if (!transition) {
      throw new Error(`No transition registered for event '${event}'`);
    }
    
    // Transition the state machine
    this.stateMachine.transition(event);
    
    // Execute the transition function
    const stateUpdate = transition(this.currentState, payload);
    
    // Update current state
    this.currentState = { ...this.currentState, ...stateUpdate };
    
    // Return state machine to initial state
    this.stateMachine.transition('complete');
    
    return stateUpdate;
  }
  
  /**
   * Gets the underlying state machine
   * 
   * @returns ValidationStateMachine instance
   */
  public getStateMachine(): ValidationStateMachine {
    return this.stateMachine;
  }
  
  /**
   * Optimizes transitions using automaton state minimization
   */
  public minimize(): void {
    this.stateMachine.minimize();
  }
  
  /**
   * Exports the transition graph for visualization
   * 
   * @returns JSON representation of transition graph
   */
  public exportTransitionGraph(): object {
    return this.stateMachine.toObject();
  }
  
  /**
   * Updates the current state
   * 
   * @param state New state
   */
  public updateState(state: S): void {
    this.currentState = state;
  }
  
  /**
   * Initializes the state machine with basic states
   * 
   * @public
   */
  public initializeStateMachine(): void {
    // Create and add initial state
    const initialState = new ValidationState('initial', true, { isInitial: true });
    this.stateMachine.addState(initialState);
  }
}
