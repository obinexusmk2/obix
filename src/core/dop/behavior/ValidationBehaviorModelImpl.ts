/**
 * ValidationBehaviorModelImpl.ts
 * 
 * Concrete implementation of the behavior model for validation operations
 * in the OBIX framework. This component implements the core validation behavior
 * and leverages Nnamdi Okpala's automaton state minimization technology to
 * optimize validation operations.
 * 
 * This implementation ensures perfect 1:1 correspondence between functional
 * and OOP implementations via the DOP Adapter pattern.
 * 
 * @author OBINexus Computing  Nnamdi Okpala
 * @copyright 2025 Your Company
 */

import { ValidationError } from "../validation/errors/ValidationError";
import { ValidationRule } from "../validation/rules/ValidationRule";
import { BaseBehaviorModel } from "./BaseBehaviorModel";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";
import { ValidationResult } from "./ValidationResult";
import { ValidationState } from "./ValidationState";
import { ValidationStateMachine } from "./ValidationStateMachine";

/**
 * Concrete implementation of the behavior model for validation operations
 * that leverages Nnamdi Okpala's automaton state minimization technology
 */
export class ValidationBehaviorModelImpl extends BaseBehaviorModel<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>> {
  /**
   * State machine for managing validation states and transitions
   */
  private stateMachine: ValidationStateMachine;
  
  /**
   * Whether to apply state machine minimization
   */
  private minimizationEnabled: boolean;
  
  /**
   * Rule cache for optimizing rule application
   */
  private ruleCache: Map<string, Map<string, ValidationResult<ValidationDataModelImpl>>>;
  
  /**
   * Rule dependency graph for optimized rule execution
   */
  private ruleDependencyGraph: Map<string, Set<string>>;

  /**
   * Creates a new ValidationBehaviorModelImpl instance
   * 
   * @param stateMachine Optional state machine for validation states
   * @param id Behavior identifier
   * @param description Behavior description
   * @param minimizationEnabled Whether to enable state minimization
   */
  constructor(
    stateMachine?: ValidationStateMachine,
    id: string = 'validation-behavior',
    description: string = 'Validation behavior model for the OBIX framework',
    minimizationEnabled: boolean = true
  ) {
    super(id, description);
    this.stateMachine = stateMachine || new ValidationStateMachine();
    this.minimizationEnabled = minimizationEnabled;
    this.ruleCache = new Map();
    this.ruleDependencyGraph = new Map();
    
    // Initialize state machine if empty
    if (this.stateMachine && !this.stateMachine.getCurrentState()) {
      this.initializeStateMachine();
    }
  }
  
  /**
   * Initializes the state machine with basic validation states
   * 
   * @private
   */
  private initializeStateMachine(): void {
    // Skip if the state machine isn't properly initialized or lacks necessary methods
    if (!this.stateMachine || typeof this.stateMachine.addState !== 'function') {
      return;
    }
    
    // Define and add basic validation states
    try {
      // Create and add initial state
      const initialState: ValidationState = {
        stateId: 'initial',
        active: true,
        metadata: { isInitial: true },
        transitions: new Map(),
        equivalenceClass: null,
        getId: () => 'initial',
        isActive: () => true,
        getMetadata: () => ({ isInitial: true }),
        setEquivalenceClass: (equivalenceClass) => { this.equivalenceClass = equivalenceClass; },
        getAllTransitions: () => new Map(),
        addTransition: (event, targetState) => { this.transitions.set(event, targetState); },
        clone: function() { return { ...this }; },
        getErrorRecoveryAction: () => null,
        getAllErrorRecoveryActions: () => new Map(),
        getRules: () => [],
        containsRule: (ruleId) => false,
        addRule: (rule) => {},
        toObject: () => ({})
      };
      
      this.stateMachine.addState(initialState);
      
      // Create and add validating state
      const validatingState = {
        getId: () => 'validating',
        isActive: () => false,
        getMetadata: () => ({ isValidating: true }),
        setEquivalenceClass: () => {},
        getAllTransitions: () => new Map(),
        addTransition: () => {},
        clone: function() { return this; },
        getErrorRecoveryAction: () => null,
        getAllErrorRecoveryActions: () => new Map(),
        getRules: () => [],
        containsRule: () => false,
        addRule: () => {},
        toObject: () => ({})
      };
      
      this.stateMachine.addState(validatingState);
      
      // Create and add validated state
      const validatedState = {
        getId: () => 'validated',
        isActive: () => false,
        getMetadata: () => ({ isValidated: true }),
        setEquivalenceClass: () => {},
        getAllTransitions: () => new Map(),
        addTransition: () => {},
        clone: function() { return this; },
        getErrorRecoveryAction: () => null,
        getAllErrorRecoveryActions: () => new Map(),
        getRules: () => [],
        containsRule: () => false,
        addRule: () => {},
        toObject: () => ({})
      };
      
      this.stateMachine.addState(validatedState);
      
      // Create and add error state
      const errorState = {
        getId: () => 'error',
        isActive: () => false,
        getMetadata: () => ({ isError: true }),
        setEquivalenceClass: () => {},
        getAllTransitions: () => new Map(),
        addTransition: () => {},
        clone: function() { return this; },
        getErrorRecoveryAction: () => null,
        getAllErrorRecoveryActions: () => new Map(),
        getRules: () => [],
        containsRule: () => false,
        addRule: () => {},
        toObject: () => ({})
      };
      
      this.stateMachine.addState(errorState);
      
      // Add transitions between states
      this.stateMachine.addTransition('initial', 'begin_validation', 'validating');
      this.stateMachine.addTransition('validating', 'validation_complete', 'validated');
      this.stateMachine.addTransition('validating', 'validation_error', 'error');
      this.stateMachine.addTransition('error', 'retry_validation', 'validating');
      this.stateMachine.addTransition('validated', 'reset', 'initial');
      this.stateMachine.addTransition('error', 'reset', 'initial');
    } catch (error) {
      // Silently handle initialization errors
      console.error('Error initializing state machine:', error);
    }
  }
  
  
  /**
   * Processes a validation data model using Nnamdi Okpala's
   * automaton state minimization technology
   * 
   * @param data The data model to process
   * @returns Validation result
   */
  public process(data: ValidationDataModelImpl): ValidationResult<ValidationDataModelImpl> {
    // Apply state minimization if enabled
    if (this.minimizationEnabled && typeof this.stateMachine.minimize === 'function') {
      this.stateMachine.minimize();
    }
    
    // Create initial result
    const result = new ValidationResult<ValidationDataModelImpl>(true, data);
    
    try {
      // Reset state machine to initial state
      if (typeof this.stateMachine.reset === 'function') {
        this.stateMachine.reset();
      }
      
      // Transition to validating state
      if (typeof this.stateMachine.transition === 'function') {
        this.stateMachine.transition('begin_validation');
      }
      
      // Get rules from data model
      const rules = data.getRules();
      
      // If we have no rules, return valid resultS
        if (!rules || rules.length === 0) {
            return result;
        }

        // Apply each rule
        for (const rule of rules) {
            // Check if rule is cached
            const ruleCacheKey = rule.getId();
            const ruleResult = this.ruleCache.get(ruleCacheKey);

            if (ruleResult) {
                // Apply cached result
                result.merge(ruleResult);
            } else {
                // Apply rule
                const ruleResult = rule.apply(data);

                // Cache result
                this.ruleCache.set(ruleCacheKey, ruleResult);

                // Add to result
                result.merge(ruleResult);
            }
        }

        // Transition to validated state
        if (typeof this.stateMachine.transition === 'function') {
            this.stateMachine.transition('validation_complete');
        }
    } catch (error) {
        // Transition to error state
        if (typeof this.stateMachine.transition === 'function') {
            this.stateMachine.transition('validation_error');
        }

        // Add error to result
        if (error instanceof ValidationError) {
            result.addError(error);
        } else {
            console.error('Unexpected error type:', error);
        }
    }

    return result;
    }

    /**
     * Registers a validation rule with the behavior model
     * 
     * @param rule The rule to register
     */
    public registerRule(rule: ValidationRule): void {
        // Skip if rule is invalid
        if (!rule || !rule.getId) {
            return;
        }

        // Get rule ID
        const ruleId = rule.getId();

        // Check if rule is already registered
        if (this.ruleDependencyGraph.has(ruleId)) {
            return;
        }

        // Get rule dependencies
        const dependencies = rule.getDependencies();

        // Add rule to dependency graph
        this.ruleDependencyGraph.set(ruleId, new Set(dependencies));

        // Add rule to state machine
        if (this.stateMachine && typeof this.stateMachine.addRule === 'function') {
            this.stateMachine.addRule(rule);
        }

        // Invalidate rule cache
        this.ruleCache.clear();

        // Invalidate state machine
        if (typeof this.stateMachine.invalidate === 'function') {
            this.stateMachine.invalidate();
        }

        // Update state machine
        if (typeof this.stateMachine.update === 'function') {
            this.stateMachine.update();
        }

        // Update state machine transitions
        if (typeof this.stateMachine.updateTransitions === 'function') {
            this.stateMachine.updateTransitions();
        }
    }
}
