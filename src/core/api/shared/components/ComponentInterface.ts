/**
 * core/api/shared/interfaces/Component.ts
 * 
 * Core component interface that establishes the contract between functional and OOP implementations.
 * This interface is the cornerstone of the OBIX DOP pattern, enabling 1:1 correspondence
 * between paradigms while leveraging automaton state minimization.
 */



/**
 * Primary component interface that enforces the contract for both 
 * functional and OOP implementations.
 * 
 * @typeParam S - State type
 * @typeParam E - Event names (as string literal types)
 */
export interface Component<S = any, E extends string = string> {
  /** Current component state */
  readonly state: S;
  
  /** 
   * Trigger a state transition using the automaton state minimization
   * @param event The event name to trigger
   * @param payload Optional payload data for the transition
   */
  trigger(event: E, payload?: any): void;
  
  /**
   * Subscribe to state changes
   * @param listener Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateListener<S>): () => void;
  
  /**
   * Mount the component to a DOM element
   * @param element DOM element to mount to
   */
  mount(element: HTMLElement): void;
  
  /**
   * Unmount the component from the DOM
   */
  unmount(): void;
  
  /**
   * Force a component update
   */
  update(): void;
  
  /**
   * Render the component to produce output
   * @returns The rendered output
   */
  render(): RenderOutput;
  
  /**
   * Get the component's lifecycle hooks interface
   * @returns Component lifecycle hooks
   */
  getLifecycleHooks(): LifecycleHooks;
  
  /**
   * Validate the component's current state
   * @returns Validation result
   */
  validate(): ValidationResult<any>;
}
