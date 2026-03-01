/**
 * ComponentFactory.ts
 * 
 * Unified factory for creating components in both functional and OOP paradigms
 * with guaranteed 1:1 correspondence using the DOP Adapter pattern.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { DataModel, DOPAdapter } from '@/core/dop';
import { Component } from '@/core/api/shared';
import { FunctionalComponent } from '@/core/api/functional/FunctionalComponent';
import { BaseComponent } from '@/core/api/shared/base/BaseComponent';
import { ValidationStateMachine } from '@/core/dop/validation/ValidationStateMachine';
import { RenderOutput } from '@/core/api/shared/render/RenderTypes';
import { LifecycleHooks } from '@/core/api/shared/validation/ValidationComponent';

/**
 * Configuration interface for component creation
 */
export interface ComponentConfig<S extends DataModel<S>, E extends string = string> {
  /**
   * Initial component state
   */
  initialState: S;
  
  /**
   * Transition functions mapping events to state transformations
   */
  transitions: {
    [key in E]?: (state: S, payload?: any) => S;
  };
  
  /**
   * Optional lifecycle hooks
   */
  lifecycle?: Partial<LifecycleHooks>;
  
  /**
   * Optional render function (for functional components)
   */
  render?: (state: S, trigger: (event: E, payload?: any) => void) => RenderOutput;
  
  /**
   * Optional validation rules
   */
  validationRules?: any[];
  
  /**
   * Enable state minimization optimization (default: true)
   */
  enableStateMinimization?: boolean;
}

/**
 * Factory for creating components with paradigm neutrality
 */
export class ComponentFactory {
  /**
   * Creates a functional component
   * 
   * @param config Component configuration
   * @returns A functional component instance
   */
  public static createFunctional<S extends DataModel<S>, E extends string = string>(
    config: ComponentConfig<S, E>
  ): FunctionalComponent<S, E> {
    // Create the behavior model
    const behaviorModel = BehaviorModelFactory.createBehaviorModel<S, RenderOutput>(
      config.transitions,
      config.validationRules || []
    );
    
    // Create state machine for transition optimization
    const stateMachine = new ValidationStateMachine();
    
    // Apply state minimization if enabled
    if (config.enableStateMinimization !== false) {
      this.initializeStateMinimization(
        stateMachine,
        config.initialState,
        config.transitions
      );
    }
    
    // Create the adapter
    const adapter = new DOPAdapter<S, RenderOutput>(
      config.initialState,
      behaviorModel
    );
    
    // Create the functional component
    return new FunctionalComponent<S, E>(
      adapter as DOPAdapter<S, E>,
      {
        initialState: config.initialState,
        transitions: config.transitions,
        render: config.render || (() => null),
        lifecycle: config.lifecycle
      }
    );
  }
  
  /**
   * Creates an OOP component class
   * 
   * @param config Component configuration
   * @returns A class that can be extended for OOP components
   */
  public static createOOPBaseClass<S extends DataModel<S>, E extends string = string>(
    config: ComponentConfig<S, E>
  ): typeof BaseComponent {
    // Create the behavior model
    const behaviorModel = BehaviorModelFactory.createBehaviorModel<S, RenderOutput>(
      config.transitions,
      config.validationRules || []
    );
    
    // Create state machine for transition optimization
    const stateMachine = new ValidationStateMachine();
    
    // Apply state minimization if enabled
    if (config.enableStateMinimization !== false) {
      this.initializeStateMinimization(
        stateMachine,
        config.initialState,
        config.transitions
      );
    }
    
    // Create a class that extends BaseComponent
    return class OBIXComponent extends BaseComponent<S, E> {
      // Provide the initial state
      public initialState: S = config.initialState;
      
      // Add transitions from config
      constructor() {
        super();
        
        // Register transitions from config
        if (config.transitions) {
          for (const [event, transition] of Object.entries(config.transitions)) {
            if (transition) {
              this.registerTransition(event as E, transition as any);
            }
          }
        }
        
        // Apply lifecycle hooks
        if (config.lifecycle) {
          this.registerLifecycleHooks(config.lifecycle);
        }
      }
      
      // Register lifecycle hooks
      private registerLifecycleHooks(hooks: Partial<LifecycleHooks>): void {
        if (hooks.onBeforeMount) {
          this.onBeforeMount = hooks.onBeforeMount;
        }
        
        if (hooks.onMounted) {
          this.onMounted = hooks.onMounted;
        }
        
        if (hooks.onBeforeUpdate) {
          this.onBeforeUpdate = hooks.onBeforeUpdate;
        }
        
        if (hooks.onUpdated) {
          this.onUpdated = hooks.onUpdated;
        }
        
        if (hooks.onBeforeUnmount) {
          this.onBeforeUnmount = hooks.onBeforeUnmount;
        }
        
        if (hooks.onUnmounted) {
          this.onUnmounted = hooks.onUnmounted;
        }
        
        if (hooks.onError) {
          this.onError = hooks.onError;
        }
      }
      
      // Lifecycle hook methods
      protected onBeforeMount(): void {}
      protected onMounted(): void {}
      protected onBeforeUpdate(newState: S, oldState: S): void {}
      protected onUpdated(newState: S, oldState: S): void {}
      protected onBeforeUnmount(): void {}
      protected onUnmounted(): void {}
      protected onError(error: Error): void {}
      
      // Default render implementation
      render(state: S): RenderOutput {
        if (config.render) {
          return config.render(state, this.trigger.bind(this));
        }
        return null;
      }
    };
  }
  
  /**
   * Creates a specific OOP component instance
   * 
   * @param componentClass The component class
   * @returns Component instance
   */
  public static createOOPInstance<T extends Component>(
    componentClass: new () => T
  ): T {
    return new componentClass();
  }
  
  /**
   * Verifies that functional and OOP implementations are equivalent
   * 
   * @param functionalComponent Functional component
   * @param oopComponent OOP component
   * @returns True if the implementations are equivalent
   */
  public static verifyEquivalence<S extends DataModel<S>, E extends string>(
    functionalComponent: FunctionalComponent<S, E>,
    oopComponent: Component<S, E>
  ): boolean {
    // Get adapters
    const functionalAdapter = functionalComponent.adapter;
    const oopAdapter = (oopComponent as any).adapter;
    
    if (!functionalAdapter || !oopAdapter) {
      console.error('Cannot verify equivalence: adapters not available');
      return false;
    }
    
    // Compare initial states
    const functionalState = functionalAdapter.getState();
    const oopState = oopAdapter.getState();
    
    if (!functionalState.equals(oopState as any)) {
      console.error('Initial states are not equivalent');
      return false;
    }
    
    // Compare validation results
    const functionalValidation = functionalAdapter.validate();
    const oopValidation = oopAdapter.validate();
    
    if (functionalValidation.isValid !== oopValidation.isValid) {
      console.error('Validation results are not equivalent');
      return false;
    }
    
    return true;
  }
  
  /**
   * Initializes state minimization for a component
   * 
   * @param stateMachine The state machine to initialize
   * @param initialState Initial component state
   * @param transitions Transition functions
   */
  private static initializeStateMinimization<S extends DataModel<S>, E extends string>(
    stateMachine: ValidationStateMachine,
    initialState: S,
    transitions: {
      [key in E]?: (state: S, payload?: any) => S;
    }
  ): void {
    // Create initial state
    const initialStateNode = stateMachine.createState('initial', true);
    stateMachine.setInitialState(initialStateNode);
    
    // Create states for each transition
    if (transitions) {
      for (const [event, transition] of Object.entries(transitions)) {
        if (transition) {
          // Create state for this transition
          const transitionState = stateMachine.createState(`event_${event}`, false);
          
          // Add metadata
          transitionState.setMetadata({
            event,
            transitionFn: String(transition)
          });
          
          // Add transitions
          stateMachine.addTransition('initial', event, `event_${event}`);
          stateMachine.addTransition(`event_${event}`, 'complete', 'initial');
        }
      }
    }
    
    // Apply state minimization
    stateMachine.minimize();
  }
}