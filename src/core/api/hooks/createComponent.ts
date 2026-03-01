/**
 * core/api/shared/functional/createComponent.ts
 * 
 * Factory function for creating functional components that are compatible with the
 * OOP implementation through the DOP adapter pattern, leveraging automaton state minimization.
 */

import { ComponentConfig } from "@/core/config/component";
import { TransitionFunction } from "@/core/automaton";
import { DataModel, DOPAdapter, ValidationResult } from "@/core/dop";
import { LifecycleManager } from "../shared/components/ComponentLifeCycle";
import { ComponentStateManager } from "../shared/components/ComponentStateManagement";
import { ComponentTransitionManager } from "../shared/components/ComponentTransitionManager";
import { ComponentValidator } from "../shared/components/ComponentValidator";
import { EventBus } from "../shared/events/EventBus";
import { RenderFunction, RenderOutput } from "../shared/render/RenderTypes";
import { StateListener } from "../shared/state/StateManager";
import { LifecycleHooks, ValidatableComponent } from "../shared/validation/ValidationComponent";
import { FunctionalComponent } from "../functional/FunctionalComponent";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";



/**
 * Configuration options for functional components
 */
export interface ComponentOptions<S, E extends string = string> {
  /**
   * Initial component state
   */
  initialState: S;
  
  /**
   * Component render function
   */
  render: RenderFunction<S>;
  
  /**
   * Map of event names to transition functions
   */
  transitions?: Partial<Record<E, TransitionFunction<S>>>;
  
  /**
   * Lifecycle hooks
   */
  hooks?: Partial<LifecycleHooks>;
  
  /**
   * Validation rules
   */
  rules?: ValidationRule[];
  
  /**
   * Whether to optimize with automaton state minimization
   */
  optimize?: boolean;
}

/**
 * Creates a functional component with full DOP adapter integration
 * 
 * @param options Component configuration options
 * @returns A component instance
 */
export function createComponent<S extends object, E extends string = string>(
  options: ComponentOptions<S, E>
): ValidatableComponent<S, E> {
  // Create core managers
  const stateManager = new ComponentStateManager<S>(options.initialState);
  const transitionManager = new ComponentTransitionManager<S, E>(options.initialState);
  const lifecycleManager = new LifecycleManager(options.hooks || {});
  const eventBus = new EventBus();
  
  // Create component instance
  const component = {
    // public state
    _rootElement: null as HTMLElement | null,
    
    // Component properties
    get state(): S {
      return stateManager.getState();
    },
    
    // Component methods
    trigger(event: E, payload?: any): void {
      const oldState = this.state;
      
      // Execute lifecycle hook
      lifecycleManager.executeHook('onBeforeUpdate', this.state, oldState);
      
      // Execute transition
      const stateUpdate = transitionManager.executeTransition(event, payload);
      
      // Update state
      stateManager.setState(stateUpdate);
      
      // Update transition manager state
      transitionManager.updateState(this.state);
      
      // Execute transition hook
      lifecycleManager.executeHook('onTransition', event, payload, this.state, oldState);
      
      // Execute updated hook
      lifecycleManager.executeHook('onUpdated', this.state, oldState);
      
      // Emit change event
      eventBus.emit('state:change', {
        newState: this.state,
        oldState,
        event,
        payload
      });
      
      // Update component if mounted
      if (this._rootElement) {
        this.update();
      }
    },
    
    subscribe(listener: StateListener<S>): () => void {
      return stateManager.subscribe(listener);
    },
    
    mount(element: HTMLElement): void {
      // Execute beforeMount hook
      lifecycleManager.executeHook('onBeforeMount');
      
      // Store root element
      this._rootElement = element;
      
      // Render component
      const output = this.render();
      
      // Update DOM
      this.updateDOM(output);
      
      // Execute mounted hook
      lifecycleManager.executeHook('onMounted');
      
      // Emit mount event
      eventBus.emit('component:mounted', { element });
    },
    
    unmount(): void {
      if (!this._rootElement) return;
      
      // Execute beforeUnmount hook
      lifecycleManager.executeHook('onBeforeUnmount');
      
      // Clear root element content
      while (this._rootElement.firstChild) {
        this._rootElement.removeChild(this._rootElement.firstChild);
      }
      
      // Clear root element reference
      this._rootElement = null;
      
      // Execute unmounted hook
      lifecycleManager.executeHook('onUnmounted');
      
      // Emit unmount event
      eventBus.emit('component:unmounted', {});
    },
    
    update(): void {
      if (!this._rootElement) return;
      
      const oldState = this.state;
      
      // Execute beforeUpdate hook
      lifecycleManager.executeHook('onBeforeUpdate', this.state, oldState);
      
      // Render component
      const output = this.render();
      
      // Update DOM
      this.updateDOM(output);
      
      // Execute updated hook
      lifecycleManager.executeHook('onUpdated', this.state, oldState);
      
      // Emit update event
      eventBus.emit('component:updated', {
        state: this.state
      });
    },
    
    render(): RenderOutput {
      try {
        return options.render(this.state);
      } catch (error) {
        // Execute error hook
        lifecycleManager.executeHook('onError', error instanceof Error ? error : new Error(String(error)));
        
        // Return empty string on error
        return '';
      }
    },
    
    getLifecycleHooks(): LifecycleHooks {
      return lifecycleManager.getHooks();
    },
    
    // public methods
    updateDOM(output: RenderOutput): void {
      if (!this._rootElement) return;
      
      // Clear current content
      while (this._rootElement.firstChild) {
        this._rootElement.removeChild(this._rootElement.firstChild);
      }
      
      // Handle different output types
      if (output instanceof HTMLElement) {
        this._rootElement.appendChild(output);
      } else if (typeof output === 'string') {
        this._rootElement.innerHTML = output;
      }
    }
  } as ValidatableComponent<S, E>;
  
  // Add validation capabilities
  const validator = new ComponentValidator(component);
  
  // Add validation methods to component
  Object.defineProperties(component, {
    validate: {
      value: function(): ValidationResult<any> {
        return validator.validate();
      }
    },
    getValidationRules: {
      value: function(): ValidationRule[] {
        return validator.getRules();
      }
    },

    addValidationRule: {
      value: function(rule: ValidationRule): void {
        validator.addRule(rule);
      }
    },
    removeValidationRule: {
      value: function(id: string): boolean {
        return validator.removeRule(id);
      }
    },
    compareImplementations: {
      value: function(funcImpl: any, oopImpl: any): boolean {
        const result = validator.compareImplementations(funcImpl, oopImpl);
        return result.equivalent;
      }
    },
    minimize: {
      value: function(): void {
        // Minimize the transition manager
        transitionManager.minimize();
        
        // Optimize validation rules
        validator.optimize();
        
        // Emit optimize event
        eventBus.emit('component:optimized', {
          transitionGraph: transitionManager.exportTransitionGraph()
        });
      }
    }
  });
  
  // Register transitions
  if (options.transitions) {
    for (const [event, transition] of Object.entries(options.transitions)) {
      transitionManager.addTransition(event as E, transition as TransitionFunction<S>);
    }
  }
  
  // Register validation rules
  if (options.rules) {
    for (const rule of options.rules) {
      validator.addRule(rule);
    }
  }
  
  // Optimize with state minimization if requested
  if (options.optimize !== false) {
    component.minimize();
  }
  
  return component;
}

/**
 * Component factory function for creating functional components
 * 
 * This is the main entry point for the functional API. It creates a component
 * using a configuration object that defines the component's state, transitions,
 * render function, and optional lifecycle hooks.
 * 
 * @param config Component configuration
 * @returns Functional component instance
 * @example
 * ```typescript
 * const Counter = component({
 *   initialState: { count: 0 },
 *   transitions: {
 *     increment: (state) => ({ count: state.count + 1 }),
 *     decrement: (state) => ({ count: state.count - 1 })
 *   },
 *   render: (state, trigger) => (
 *     <div>
 *       <button onClick={() => trigger('decrement')}>-</button>
 *       <span>{state.count}</span>
 *       <button onClick={() => trigger('increment')}>+</button>
 *     </div>
 *   )
 * });
 * ```
 */
export function component<S extends DataModel<S>, E extends string>(
  config: ComponentConfig<S, E>
): FunctionalComponent<S, E> {
  const adapter = DOPAdapter.createFromFunctional<S, E>(config as ComponentConfig<S, E>);
  return new FunctionalComponent<S, E>(adapter , config);
}

/**
 * Component factory with hooks API
 * 
 * @param initialState Initial component state
 * @returns Component factory hooks
 */
export function useComponent<S extends object, E extends string = string>(initialState: S) {
  // Component configuration
  const config: ComponentOptions<S, E> = {
    initialState,
    render: () => null,
    transitions: {},
    hooks: {},
    rules: [],
    optimize: true
  };
  
  // Hook API
  return {
    /**
     * Defines the render function
     * 
     * @param renderFn Component render function
     * @returns Component factory hooks
     */
    render(renderFn: RenderFunction<S>) {
      config.render = renderFn;
      return this;
    },
    
    /**
     * Adds a transition handler
     * 
     * @param event Event name
     * @param transitionFn Transition function
     * @returns Component factory hooks
     */
    onTransition(event: E, transitionFn: TransitionFunction<S>) {
      if (!config.transitions) {
        config.transitions = {};
      }
      config.transitions[event] = transitionFn;
      return this;
    },
    
    /**
     * Registers lifecycle hooks
     * 
     * @param hooks Lifecycle hooks
     * @returns Component factory hooks
     */
    useLifecycle(hooks: Partial<LifecycleHooks>) {
      config.hooks = { ...config.hooks, ...hooks };
      return this;
    },
    
    /**
     * Sets validation rules
     * 
     * @param rules Validation rules
     * @returns Component factory hooks
     */
    useValidation(rules: any[]) {
      config.rules = rules;
      return this;
    },
    
    /**
     * Disables automaton state minimization
     * 
     * @returns Component factory hooks
     */
    disableOptimization() {
      config.optimize = false;
      return this;
    },
    
    /**
     * Creates the component
     * 
     * @returns Component instance
     */
    create() {
      return createComponent<S, E>(config);
    }
  };
}