import { ValidationRule } from "@/core/validation/rules/ValidationRule";
import { LifecycleManager } from "../components/ComponentLifeCycle";
import { ComponentStateManager } from "../components/ComponentStateManagement";
import { ComponentTransitionManager } from "../components/ComponentTransitionManager";
import { ComponentValidator } from "../components/ComponentValidator";
import { EventBus } from "../events/EventBus";
import { RenderOutput } from "../render/RenderTypes";
import { StateListener } from "../state/StateManager";
import { ValidatableComponent, LifecycleHooks } from "../validation/ValidationComponent";
import { ValidationResult } from "@/core/dop/ValidationResult";

/**
 * Abstract base component implementation that integrates all shared interfaces
 * and implements automaton state minimization.
 * 
 * @typeParam S - State type
 * @typeParam E - Event names as string literals
 */
export abstract class Component<S extends object = any, E extends string = string>  implements ValidatableComponent  {
  /**
   * Component state manager
   */
  protected stateManager: ComponentStateManager<S>;
  
  /**
   * Component transition manager with state minimization
   */
  protected transitionManager: ComponentTransitionManager<S, E>;
  
  /**
   * Component lifecycle manager
   */
  protected lifecycleManager: LifecycleManager;
  
  /**
   * Component validator
   */
  protected validator: ComponentValidator;
  
  /**
   * Event bus for component events
   */
  protected eventBus: EventBus = new EventBus();
  
  /**
   * Root DOM element for the component
   */
  protected rootElement: HTMLElement | null = null;
  
  /**
   * Creates a new BaseComponent
   * 
   * @param initialState Initial component state
   * @param hooks Optional lifecycle hooks
   */
  constructor(initialState: S, hooks: Partial<LifecycleHooks> = {}) {
    // Initialize state manager
    this.stateManager = new ComponentStateManager<S>(initialState);
    
    // Initialize transition manager
    this.transitionManager = new ComponentTransitionManager<S, E>(initialState);
    
    // Initialize lifecycle manager
    this.lifecycleManager = new LifecycleManager(hooks);
    
    // Initialize validator
    this.validator = new ComponentValidator(this);
    
    // Register default transitions
    this.registerDefaultTransitions();
    
    // Optimize with state minimization
    if (this.shouldMinimizeAutomatically()) {
      this.minimize();
    }
  }
  _rootElement: any;
  
  /**
   * Gets the current component state
   */
  public get state(): S {
    return this.stateManager.getState();
  }
  
  /**
   * Triggers a state transition
   * 
   * @param event Event to trigger
   * @param payload Optional payload
   */
  public trigger(event: E, payload?: any): void {
    const oldState = this.state;
    
    // Execute lifecycle hook
    this.lifecycleManager.executeHook('onBeforeUpdate', this.state, oldState);
    
    // Execute transition
    const stateUpdate = this.transitionManager.executeTransition(event, payload);
    
    // Update state
    this.stateManager.setState(stateUpdate);
    
    // Update transition manager state
    this.transitionManager.updateState(this.state);
    
    // Execute transition hook
    this.lifecycleManager.executeHook('onTransition', event, payload, this.state, oldState);
    
    // Execute updated hook
    this.lifecycleManager.executeHook('onUpdated', this.state, oldState);
    
    // Emit change event
    this.eventBus.emit('state:change', {
      newState: this.state,
      oldState,
      event,
      payload
    });
  }
  
  /**
   * Subscribes to state changes
   * 
   * @param listener State change listener
   * @returns Unsubscribe function
   */
  public subscribe(listener: StateListener<S>): () => void {
    return this.stateManager.subscribe(listener);
  }
  
  /**
   * Mounts the component to a DOM element
   * 
   * @param element DOM element to mount to
   */
  public mount(element: HTMLElement): void {
    // Execute beforeMount hook
    this.lifecycleManager.executeHook('onBeforeMount');
    
    // Store root element
    this.rootElement = element;
    
    // Render component
    const output = this.render();
    
    // Update DOM
    this.updateDOM(output);
    
    // Execute mounted hook
    this.lifecycleManager.executeHook('onMounted');
    
    // Emit mount event
    this.eventBus.emit('component:mounted', { element });
  }
  
  /**
   * Unmounts the component
   */
  public unmount(): void {
    if (!this.rootElement) return;
    
    // Execute beforeUnmount hook
    this.lifecycleManager.executeHook('onBeforeUnmount');
    
    // Clear root element content
    while (this.rootElement.firstChild) {
      this.rootElement.removeChild(this.rootElement.firstChild);
    }
    
    // Clear root element reference
    this.rootElement = null;
    
    // Execute unmounted hook
    this.lifecycleManager.executeHook('onUnmounted');
    
    // Emit unmount event
    this.eventBus.emit('component:unmounted', {});
  }
  
  /**
   * Forces a component update
   */
  public update(): void {
    if (!this.rootElement) return;
    
    const oldState = this.state;
    
    // Execute beforeUpdate hook
    this.lifecycleManager.executeHook('onBeforeUpdate', this.state, oldState);
    
    // Render component
    const output = this.render();
    
    // Update DOM
    this.updateDOM(output);
    
    // Execute updated hook
    this.lifecycleManager.executeHook('onUpdated', this.state, oldState);
    
    // Emit update event
    this.eventBus.emit('component:updated', {
      state: this.state
    });
  }
  
  /**
   * Abstract render method to be implemented by subclasses
   */
  public abstract render(): RenderOutput;
  
  /**
   * Gets the component's lifecycle hooks
   * 
   * @returns Component lifecycle hooks
   */
  public getLifecycleHooks(): LifecycleHooks {
    return this.lifecycleManager.getHooks();
  }
  
  /**
   * Validates the component
   * 
   * @returns Validation result
   */
  public validate(): ValidationResult<any> {
    return this.validator.validate();
  }
  
  /**
   * Gets all validation rules
   * 
   * @returns Array of validation rules
   */
  public getValidationRules(): ValidationRule[] {
    return this.validator.getRules();
  }
  
  /**
   * Adds a validation rule
   * 
   * @param rule Validation rule to add
   */
  public addValidationRule(rule: ValidationRule): void {
    this.validator.addRule(rule);
  }
  
  /**
   * Removes a validation rule
   * 
   * @param id ID of the rule to remove
   * @returns True if the rule was removed
   */
  public removeValidationRule(id: string): boolean {
    return this.validator.removeRule(id);
  }
  
  /**
   * Compares functional and OOP implementations
   * 
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  public compareImplementations(funcImpl: any, oopImpl: any): boolean {
    const result = this.validator.compareImplementations(funcImpl, oopImpl);
    return result.equivalent;
  }
  
  /**
   * Optimizes the component using automaton state minimization
   */
  public minimize(): void {
    // Minimize the transition manager
    this.transitionManager.minimize();
    
    // Optimize validation rules
    this.validator.optimize();
    
    // Emit optimize event
    this.eventBus.emit('component:optimized', {
      transitionGraph: this.transitionManager.exportTransitionGraph()
    });
  }
  
  /**
   * Registers a state transition
   * 
   * @param event Event name
   * @param transitionFn Transition function
   */
  protected registerTransition(event: E, transitionFn: (state: S, payload?: any) => Partial<S>): void {
    // Convert partial state update function to full state update function
    const fullStateTransitionFn = (state: S, payload?: any): S => {
      const partialUpdate = transitionFn(state, payload);
      return { ...state, ...partialUpdate };
    };
    
    this.transitionManager.addTransition(event, fullStateTransitionFn);
  }
  
  /**
   * Updates the DOM with rendered output
   * 
   * @public
   * @param output Rendered output
   */
  public updateDOM(output: RenderOutput): void {
    if (!this.rootElement) return;
    
    // Clear current content
    while (this.rootElement.firstChild) {
      this.rootElement.removeChild(this.rootElement.firstChild);
    }
    
    // Handle different output types
    if (output instanceof HTMLElement) {
      this.rootElement.appendChild(output);
    } else if (typeof output === 'string') {
      this.rootElement.innerHTML = output;
    }
  }
  
  /**
   * Determines if the component should be minimized automatically
   * 
   * @protected
   * @returns True if the component should be minimized
   */
  protected shouldMinimizeAutomatically(): boolean {
    return true;
  }
  
  /**
   * Registers default transitions
   * 
   * @protected
   */
  protected registerDefaultTransitions(): void {
    // Override in subclasses
  }
}