/**
 * FunctionalComponent.ts
 *
 * Implementation of the FunctionalComponent class that leverages the DOP Adapter
 * pattern to create components using a functional programming style. This class
 * implements the Component interface and utilizes Nnamdi Okpala's automaton state
 * minimization technology for optimized state transitions.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ComponentConfig } from "@/core/config/component";
import { DataModel, DOPAdapter, ValidationResult } from "@/core/dop";
import { Component } from "../shared";
import { RenderOutput } from "../shared/render/RenderTypes";
import { StateListener } from "../shared/state/StateManager";
import { LifecycleHooks } from "../shared/validation/ValidationComponent";

/**
 * Configuration options for a functional component
 */
export interface FunctionalConfig<S extends DataModel<S>, E extends string> extends ComponentConfig<S, E> {
  lifecycle?: {
    onBeforeMount?: () => void;
    onMounted?: () => void;
    onBeforeUnmount?: () => void;
    onUnmounted?: () => void;
    onBeforeUpdate?: () => void;
    onUpdated?: () => void;
  };
  /**
   * Render function that produces output based on current state
   */
  render: (state: S, trigger: (event: E, payload?: any) => void) => RenderOutput;
}

/**
 * FunctionalComponent implements the Component interface using a functional programming style.
 * It uses the DOP (Data-Oriented Programming) adapter pattern to provide a clean separation
 * between data and behavior while leveraging automaton state minimization for optimized
 * performance.
 */
export class FunctionalComponent<S extends DataModel<S>, E extends string> implements Component<S, E> {
  /**
   * Internal DOP adapter instance
   */
  public adapter: DOPAdapter<S, E>;
  
  /**
   * Component configuration
   */
  public config: FunctionalConfig<S, E>;
  
  /**
   * The root DOM element where the component is mounted
   */
  public rootElement: HTMLElement | null = null;
  
  /**
   * Constructor for creating a functional component
   * @param adapter The DOP adapter instance
   * @param config The component configuration
   */
  constructor(adapter: DOPAdapter<S, E>, config: FunctionalConfig<S, E>) {
    this.adapter = adapter;
    this.config = config;
  }
  
  /**
   * Access the current component state
   */
  get state(): S {
    return this.adapter.getState();
  }
  
  /**
   * Get the lifecycle hooks for this component
   */
  getLifecycleHooks(): LifecycleHooks {
    return {
      onMount: this.config.lifecycle?.onMounted || (() => {}),
      onUnmount: this.config.lifecycle?.onUnmounted || (() => {}),
      onUpdate: this.config.lifecycle?.onUpdated || (() => {})
    };
  }
  
  /**
   * Subscribe to state changes
   * @param listener Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: StateListener<S>): () => void {
    // Add the listener to the adapter's subscription system
    const unsubscribe = this.adapter.subscribe(listener);
    
    // Immediately notify listener of current state
    listener(this.getState());
    
    // Return unsubscribe function
    return unsubscribe;
  }
  
  /**
   * Mount the component to a DOM element
   * @param element The DOM element to mount to
   */
  mount(element: HTMLElement): void {
    // Store the root element
    this.rootElement = element;
    
    // Call the before mount lifecycle hook
    if (this.config.lifecycle?.onBeforeMount) {
      this.config.lifecycle.onBeforeMount();
    }
    
    // Render the component output
    this.update();
    
    // Call the mounted lifecycle hook
    if (this.config.lifecycle?.onMounted) {
      this.config.lifecycle.onMounted();
    }
  }
  
  /**
   * Unmount the component
   */
  unmount(): void {
    if (!this.rootElement) return;
    
    // Call the before unmount lifecycle hook
    if (this.config.lifecycle?.onBeforeUnmount) {
      this.config.lifecycle.onBeforeUnmount();
    }
    
    // Clear the element
    this.rootElement.innerHTML = '';
    this.rootElement = null;
    
    // Call the unmounted lifecycle hook
    if (this.config.lifecycle?.onUnmounted) {
      this.config.lifecycle.onUnmounted();
    }
  }
  
  /**
   * Update the component
   */
  update(): void {
    if (!this.rootElement) return;
    
    // Call the before update lifecycle hook
    if (this.config.lifecycle?.onBeforeUpdate) {
      this.config.lifecycle.onBeforeUpdate();
    }
    
    // Render the component output
    const output = this.render();
    
    // If the output is a string, set it as innerHTML
    if (typeof output === 'string') {
      this.rootElement.innerHTML = output;
    } 
    // If the output is a DOM element, replace the contents
    else if (output instanceof Node) {
      this.rootElement.innerHTML = '';
      this.rootElement.appendChild(output);
    } 
    // For other types of output, handle appropriately
    else if (output !== null && output !== undefined) {
      this.rootElement.textContent = String(output);
    }
    
    // Call the updated lifecycle hook
    if (this.config.lifecycle?.onUpdated) {
      this.config.lifecycle.onUpdated();
    }
  }
  
  /**
   * Static factory method to create a functional component
   * @param config The component configuration
   * @returns A new functional component instance
   */
  static create<S extends DataModel<S>, E extends string>(config: FunctionalConfig<S, E>): FunctionalComponent<S, E> {
    const adapter = DOPAdapter.createFromFunctional<S, E>(config);
    return new FunctionalComponent<S, E>(adapter, config);
  }
  
  /**
   * Trigger an event to update component state
   * @param event The event name
   * @param payload Optional data associated with the event
   */
  trigger(event: E, payload?: any): void {
    this.adapter.applyTransition(event, payload);
    
    // Update the view automatically after state change
    this.update();
  }
  
  /**
   * Get the current component state
   * @returns The current state
   */
  getState(): S {
    return this.adapter.getState();
  }
  
  /**
   * Set the component state
   * @param newState The new state
   */
  setState(newState: S): void {
    this.adapter.setState(newState);
    
    // Update the view automatically after state change
    this.update();
  }
  
  /**
   * Validate the component state
   * @returns Validation result
   */
  validate(): ValidationResult<S> {
    return this.adapter.validate();
  }
  
  /**
   * Render the component based on current state
   * @returns The rendered output
   */
  render(): RenderOutput {
    if (typeof this.config.render === 'function') {
      return this.config.render(
        this.getState(),
        this.trigger.bind(this)
      );
    }
    return null;
  }
}