import { DOPAdapter } from "@/core/dop";
import { Component, RenderOutput } from "../shared";


/**
 * Base component class for object-oriented programming
 * 
 * This is the base class for creating components using an object-oriented approach.
 * Extend this class to create your own components with type-safe state and events.
 * 
 * @example
 * ```typescript
 * class Counter extends BaseComponent<{ count: number }, 'increment' | 'decrement'> {
 *   initialState = { count: 0 };
 *   
 *   increment(state) {
 *     return { count: state.count + 1 };
 *   }
 *   
 *   decrement(state) {
 *     return { count: state.count - 1 };
 *   }
 *   
 *   render(state) {
 *     return (
 *       <div>
 *         <button onClick={() => this.trigger('decrement')}>-</button>
 *         <span>{state.count}</span>
 *         <button onClick={() => this.trigger('increment')}>+</button>
 *       </div>
 *     );
 *   }
 * }
 * ```
 */
export abstract class Component<S = any, E extends string = string> implements Component<S, E> {
  // The adapter instance
  public adapter: DOPAdapter<S, E> | null = null;
  
  // Should be overridden by subclass
  abstract initialState: S;
  
  /**
   * Create a component instance
   */
  constructor() {
    // Defer adapter creation until after the subclass has initialized
    setTimeout(() => {
      this.createAdapter();
    }, 0);
  }
  
  /**
   * Create the adapter instance
   */
  public createAdapter(): void {
    if (!this.adapter) {
      this.adapter = DOPAdapter.createFromClass<S, E>(this.constructor);
    }
  }
  
  /** Current component state */
  get state(): S {
    if (!this.adapter) {
      return this.initialState;
    }
    return this.adapter.state;
  }
  
  /**
   * Trigger a state transition
   * @param event Event name
   * @param payload Optional event payload
   */
  trigger(event: E, payload?: any): void {
    if (!this.adapter) {
      this.createAdapter();
    }
    this.adapter?.trigger(event, payload);
  }
  
  /**
   * Subscribe to state changes
   * @param listener Function called when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (state: S) => void): () => void {
    if (!this.adapter) {
      this.createAdapter();
    }
    return this.adapter?.subscribe(listener) || (() => {});
  }
  
  /**
   * Mount the component to a DOM element
   * @param element DOM element to mount to
   */
  mount(element: HTMLElement): void {
    if (!this.adapter) {
      this.createAdapter();
    }
    this.adapter?.mount(element);
  }
  
  /**
   * Unmount the component from the DOM
   */
  unmount(): void {
    if (!this.adapter) {
      return;
    }
    this.adapter.unmount();
  }
  
  /**
   * Force a component update
   */
  update(): void {
    if (!this.adapter) {
      return;
    }
    this.adapter.update();
  }
  
  /**
   * Render the component
   * Must be implemented by subclasses
   * @param state Current component state
   * @returns Render output
   */
  abstract render(state: S): RenderOutput;
  
  /**
   * Lifecycle hook: Called when component is mounted
   * Can be overridden by subclasses
   */
  protected _onMount(): void {}
  
  /**
   * Lifecycle hook: Called when component state is updated
   * Can be overridden by subclasses
   * @param prevState Previous component state
   * @param newState New component state
   */
  protected _onUpdate(prevState: S, newState: S): void {}
  
  /**
   * Lifecycle hook: Called when component is unmounted
   * Can be overridden by subclasses
   */
  protected _onUnmount(): void {}
}
