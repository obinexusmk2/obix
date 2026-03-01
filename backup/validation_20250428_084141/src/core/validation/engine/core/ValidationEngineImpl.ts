/**
 * ValidationEngineImpl.ts
 * 
 * Implementation of the IValidationEngine interface that integrates
 * the DOP Adapter pattern with the validation system. This class serves
 * as the primary integration point between the two subsystems.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ImplementationComparisonResult } from "@/core/dop";
import { ValidationAdapter } from "@/core/dop/ValidationAdapter";
import { ValidationBehaviorModel } from "@/core/dop/ValidationBehaviourModel";
import { ValidationResult } from "@/core/dop/ValidationResult";
import { ValidationState } from "@/core/dop/ValidationState";
import { ValidationStateMachine } from "@/core/dop/ValidationStateMachine";
import { ErrorHandler } from "../../errors/ErrorHandler";
import { ErrorTracker } from "../../errors/ErrorTracker";
import { ExecutionTrace } from "../../errors/ExecutionTrace";
import { ValidationPhase, ErrorSeverity, ValidationError, ValidationSystemError } from "../../errors/ValidationError";
import { ValidationRule } from "../../rules/ValidationRule";
import { ValidationEngineOptions } from "../ValidationEngine";
import { IValidationEngineWithHooks, ValidationEngineHooks, IValidationEngine } from "./IValidationEngine";




/**
 * Implementation of the ValidationEngine interface
 */
export class ValidationEngineImpl implements IValidationEngineWithHooks {
  /**
   * The DOP adapter integrating data and behavior
   */
  public adapter: ValidationAdapter;
  
  /**
   * Behavior model for validation operations
   */
  public behaviorModel: ValidationBehaviorModel;
  
  /**
   * State machine for validation states
   */
  public stateMachine: ValidationStateMachine;
  
  /**
   * Error handler for validation errors
   */
  public errorHandler: ErrorHandler;
  
  /**
   * Configuration options
   */
  public options: ValidationEngineOptions;
  
  /**
   * Registry of registered rules
   */
  public ruleRegistry: Map<string, ValidationRule> = new Map();
  
  /**
   * Lifecycle hooks
   */
  public hooks: ValidationEngineHooks = {};
  
  /**
   * Creates a new ValidationEngineImpl instance
   * 
   * @param adapter The DOP adapter
   * @param behaviorModel The behavior model
   * @param stateMachine The state machine
   * @param errorHandler The error handler
   * @param options Configuration options
   */
  constructor(
    adapter: ValidationAdapter,
    behaviorModel: ValidationBehaviorModel,
    stateMachine: ValidationStateMachine,
    errorHandler: ErrorHandler,
    options: ValidationEngineOptions = {}
  ) {
    this.adapter = adapter;
    this.behaviorModel = behaviorModel;
    this.stateMachine = stateMachine;
    this.errorHandler = errorHandler;
    this.options = {
      enableMinimization: true,
      enableTracing: false,
      autoValidateImplementations: true,
      componentName: 'ValidationEngine',
      errorHandlingStrategy: 'standard',
      optimizeRuleExecution: true,
      maxRulesPerNode: 100,
      ...options
    };
    
    // Initialize the state machine if needed
    if (!this.stateMachine.getCurrentState()) {
      this.initializeStateMachine();
    }
  }
  
  /**
   * Validates a node against registered rules
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  public validateNode(node: any): ValidationResult<any> {
    // Execute before validation hook if registered
    if (this.hooks.beforeValidation) {
      this.hooks.beforeValidation(node);
    }
    
    try {
      // Get all applicable rules for this node
      const applicableRules = this.getApplicableRules(node);
      
      // Process the rules
      const result = this.processRules(node, applicableRules);
      
      // Execute after validation hook if registered
      if (this.hooks.afterValidation) {
        this.hooks.afterValidation(result);
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      const validationError = this.createSystemError(
        'VALIDATION_NODE_ERROR',
        error instanceof Error ? error.message : String(error),
        ValidationPhase.NODE_TRAVERSAL,
        { nodeType: node?.type || 'unknown' },
        error instanceof Error ? error.stack || '' : ''
      );
      
      // Handle the error
      this.handleError(validationError);
      
      // Execute error hook if registered
      if (this.hooks.onError) {
        this.hooks.onError(validationError);
      }
      
      // Return an invalid result
      return ValidationResult.createInvalid(validationError, node);
    }
  }
  
  /**
   * Validates an entire AST by traversing all nodes
   * 
   * @param ast The abstract syntax tree to validate
   * @returns Validation result
   */
  public validateAST(ast: any): ValidationResult<any> {
    // Execute before validation hook if registered
    if (this.hooks.beforeValidation) {
      this.hooks.beforeValidation(ast);
    }
    
    // Reset state machine to initial state
    this.stateMachine.reset();
    
    // Transition to validating state
    this.stateMachine.transition('begin_validation');
    
    try {
      // Create initial result
      const result = new ValidationResult(true, ast, []);
      
      // Traverse and validate the AST
      this.traverseNode(ast, result);
      
      // Transition to validated state
      this.stateMachine.transition('validation_complete');
      
      // Execute after validation hook if registered
      if (this.hooks.afterValidation) {
        this.hooks.afterValidation(result);
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      const validationError = this.createSystemError(
        'VALIDATION_AST_ERROR',
        error instanceof Error ? error.message : String(error),
        ValidationPhase.NODE_TRAVERSAL,
        { astType: ast?.type || 'unknown' },
        error instanceof Error ? error.stack || '' : ''
      );
      
      // Handle the error
      this.handleError(validationError);
      
      // Execute error hook if registered
      if (this.hooks.onError) {
        this.hooks.onError(validationError);
      }
      
      // Transition to error state
      this.stateMachine.transition('validation_error');
      
      // Return an invalid result
      return ValidationResult.createInvalid(validationError, ast);
    }
  }
  
  /**
   * Registers a validation rule with the engine
   * 
   * @param rule The validation rule to register
   * @returns This engine instance for chaining
   */
  public registerRule(rule: ValidationRule): IValidationEngine {
    // Add to rule registry
    this.ruleRegistry.set(rule.id, rule);
    
    // Register with the adapter
    this.adapter.registerRule(rule);
    
    return this;
  }
  
  /**
   * Registers multiple validation rules with the engine
   * 
   * @param rules The validation rules to register
   * @returns This engine instance for chaining
   */
  public registerRules(rules: ValidationRule[]): IValidationEngineWithHooks {
    for (const rule of rules) {
      this.registerRule(rule);
    }
    
    return this;
  }
  
  /**
   * Compares implementations from different paradigms
   * 
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  public compareImplementations(funcImpl: any, oopImpl: any): ImplementationComparisonResult {
    // Execute before comparison hook if registered
    if (this.hooks.beforeComparison) {
      this.hooks.beforeComparison(funcImpl, oopImpl);
    }
    
    try {
      // Use the adapter to compare implementations
      const result = this.adapter.compareImplementations(funcImpl, oopImpl);
      
      // Execute after comparison hook if registered
      if (this.hooks.afterComparison) {
        this.hooks.afterComparison(result);
      }
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      const validationError = this.createSystemError(
        'IMPLEMENTATION_COMPARISON_ERROR',
        error instanceof Error ? error.message : String(error),
        ValidationPhase.RESULT_AGGREGATION,
        {
          functional: String(funcImpl?.constructor?.name || 'FunctionalComponent'),
          oop: String(oopImpl?.constructor?.name || 'OOPComponent')
        },
        error instanceof Error ? error.stack || '' : ''
      );
      
      // Handle the error
      this.handleError(validationError);
      
      // Execute error hook if registered
      if (this.hooks.onError) {
        this.hooks.onError(validationError);
      }
      
      // Create a comparison result with the error
      return new ImplementationComparisonResult(
        false,
        [
          {
            path: 'comparison',
            expected: 'successful comparison',
            actual: `error: ${validationError.message}`,
            message: validationError.message,
            severity: ErrorSeverity.ERROR
          }
        ],
        {
          error: validationError.toJSON()
        }
      );
    }
  }
  
  /**
   * Handles a validation error
   * 
   * @param error The validation error to handle
   */
  public handleError(error: ValidationError): void {
    // Add error to the error handler
    this.errorHandler.handleError(error, this.options.componentName);
    
    // Handle error in the state machine
    this.stateMachine.handleErrorInState(error);
    
    // Execute error hook if registered
    if (this.hooks.onError) {
      this.hooks.onError(error);
    }
  }
  
  /**
   * Gets the error tracker
   * 
   * @returns The error tracker
   */
  public getErrorTracker(): ErrorTracker {
    return this.errorHandler.getErrorTracker(this.options.componentName || 'ValidationEngine');
  }
  
  /**
   * Gets the current configuration
   * 
   * @returns Current configuration
   */
  public getConfiguration(): ValidationEngineOptions {
    return {
      enableMinimization: this.options.enableMinimization,
      enableTracing: this.options.enableTracing,
      autoValidateImplementations: this.options.autoValidateImplementations,
      componentName: this.options.componentName,
      errorHandlingStrategy: this.options.errorHandlingStrategy,
      optimizeRuleExecution: this.options.optimizeRuleExecution,
      maxRulesPerNode: this.options.maxRulesPerNode
    };
  }
  
  /**
   * Updates the configuration
   * 
   * @param options New configuration options
   * @returns This engine instance for chaining
   */
  public configure(options: Partial<ValidationEngineOptions>): IValidationEngine {
    this.options = {
      ...this.options,
      ...options
    };
    
    return this;
  }
  
  /**
   * Optimizes the engine for improved performance
   * This includes state minimization and rule optimization
   * 
   * @returns This engine instance for chaining
   */
  public optimize(): IValidationEngineWithHooks {
    if (this.options.enableMinimization) {
      // Minimize the state machine
      this.stateMachine.minimize();
    }
    
    // Optimize rule sets if the behavior model supports it
    if (this.behaviorModel.optimizeRules && typeof this.behaviorModel.optimizeRules === 'function') {
      const allRules = Array.from(this.ruleRegistry.values());
      this.behaviorModel.optimizeRules(allRules);
    }
    
    return this;
  }
  
  /**
   * Resets the engine to its initial state
   * 
   * @returns This engine instance for chaining
   */
  public reset(): IValidationEngine {
    // Reset the state machine
    this.stateMachine.reset();
    
    return this;
  }
  
  /**
   * Registers lifecycle hooks
   * 
   * @param hooks The hooks to register
   * @returns This engine instance for chaining
   */
  public registerHooks(hooks: ValidationEngineHooks): IValidationEngineWithHooks {
    this.hooks = {
      ...this.hooks,
      ...hooks
    };
    
    return this;
  }
  
  /**
   * Removes all registered hooks
   * 
   * @returns This engine instance for chaining
   */
  public clearHooks(): IValidationEngineWithHooks {
    this.hooks = {};
    
    return this;
  }
  
  /**
   * Initializes the validation state machine with basic states
   * 
   * @public
   */
  public initializeStateMachine(): void {
    // Create and add initial state
    const initialState = new ValidationState('initial', true, { isInitial: true });
    this.stateMachine.addState(initialState);
    
    // Create and add validating state
    const validatingState = new ValidationState('validating', false, { isValidating: true });
    this.stateMachine.addState(validatingState);
    
    // Create and add validated state
    const validatedState = new ValidationState('validated', false, { isValidated: true });
    this.stateMachine.addState(validatedState);
    
    // Create and add error state
    const errorState = new ValidationState('error', false, { isError: true });
    this.stateMachine.addState(errorState);
    
    // Add transitions
    this.stateMachine.addTransition('initial', 'begin_validation', 'validating');
    this.stateMachine.addTransition('validating', 'validation_complete', 'validated');
    this.stateMachine.addTransition('validating', 'validation_error', 'error');
    this.stateMachine.addTransition('error', 'retry_validation', 'validating');
    this.stateMachine.addTransition('validated', 'reset', 'initial');
    this.stateMachine.addTransition('error', 'reset', 'initial');
    
    // Add error handler for the error state
    this.stateMachine.addErrorHandler('error', (error: ValidationError) => {
      this.errorHandler.handleError(error, this.options.componentName);
      return 'error';
    });
  }
  
  /**
   * Recursively traverses a node and its children, validating each
   * 
   * @public
   * @param node The node to traverse
   * @param result The validation result to update
   */
  public traverseNode(node: any, result: ValidationResult<any>): void {
    if (!node) return;
    
    // Validate the current node
    const nodeResult = this.validateNode(node);
    
    // Merge results
    for (const error of nodeResult.errors) {
      result.errors.push(error);
    }
    
    for (const warning of nodeResult.warnings) {
      result.warnings.push(warning);
    }
    
    for (const trace of nodeResult.traces) {
      result.addTrace(trace);
    }
    
    // Traverse children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseNode(child, result);
      }
    } else if (node.body && Array.isArray(node.body)) {
      // Some ASTs use 'body' instead of 'children'
      for (const child of node.body) {
        this.traverseNode(child, result);
      }
    } else if (node.content && Array.isArray(node.content)) {
      // Some ASTs use 'content' for children
      for (const child of node.content) {
        this.traverseNode(child, result);
      }
    } else if (node.elements && Array.isArray(node.elements)) {
      // Some ASTs use 'elements' for children
      for (const child of node.elements) {
        this.traverseNode(child, result);
      }
    }
  }
  
  /**
   * Gets all rules that are applicable to the given node
   * 
   * @public
   * @param node The node to get applicable rules for
   * @returns Array of applicable rules
   */
  public getApplicableRules(node: any): ValidationRule[] {
    if (!node) {
      return [];
    }
    
    // Use behavior model to find applicable rules
    const allRules = Array.from(this.ruleRegistry.values());
    const applicableRules = this.behaviorModel.findApplicableRules(node, allRules);
    
    // Limit the number of rules to prevent performance issues
    const maxRules = this.options.maxRulesPerNode || 100;
    if (applicableRules.length > maxRules) {
      // Sort by severity (highest first)
      applicableRules.sort((a, b) => b.severity - a.severity);
      return applicableRules.slice(0, maxRules);
    }
    
    return applicableRules;
  }
  
  /**
   * Processes a set of rules against a node
   * 
   * @public
   * @param node The node to validate
   * @param rules The rules to apply
   * @returns Validation result
   */
  public processRules(node: any, rules: ValidationRule[]): ValidationResult<any> {
    // Create a new result
    const result = new ValidationResult<any>(true, node);
    
    // Apply each rule
    for (const rule of rules) {
      try {
        // Create an execution trace if tracing is enabled
        let trace: ExecutionTrace | undefined;
        if (this.options.enableTracing) {
          trace = this.createExecutionTrace(rule, node);
        }
        
        // Apply the rule
        const ruleResult = this.behaviorModel.applyRule(rule, node);
        
        // If tracing is enabled, add trace to result
        if (trace) {
          trace.end(ruleResult.toObject());
          result.addTrace(trace);
        }
        
        // Merge rule result
        if (!ruleResult.isValid) {
          // Add errors and warnings from the rule result
          for (const error of ruleResult.errors) {
            result.addError(error);
          }
          
          for (const warning of ruleResult.warnings) {
            result.addWarning(warning);
          }
        }
      } catch (error) {
        // Handle rule execution errors
        const validationError = this.createSystemError(
          'RULE_EXECUTION_ERROR',
          `Error executing rule "${rule.id}": ${error instanceof Error ? error.message : String(error)}`,
          ValidationPhase.RULE_APPLICATION,
          { ruleId: rule.id, nodeType: node?.type || 'unknown' },
          error instanceof Error ? error.stack || '' : ''
        );
        
        // Add error to result
        result.addError(validationError);
        
        // Handle the error
        this.handleError(validationError);
      }
    }
    
    return result;
  }
  
  /**
   * Creates an execution trace for rule application
   * 
   * @public
   * @param rule The rule being executed
   * @param node The node being validated
   * @returns A new execution trace
   */
  public createExecutionTrace(rule: ValidationRule, node: any): ExecutionTrace {
    // Create a new trace
    const trace = new ExecutionTrace(
      rule.id,
      Date.now(),
      0,
      JSON.stringify({ 
              nodeType: node.type || node.nodeType || typeof node,
              nodeId: parseInt(node.id || '0', 10), // Ensure nodeId is a number
              nodeName: node.name || '',
              nodeValue: node.value || '',
              rule: {
                id: rule.id,
                description: rule.description,
                severity: rule.severity
              }
            })
    );
    
    // Add initial step
    trace.addStep(`Validating ${node.type || 'node'} with rule ${rule.id}`);
    
    return trace;
  }
  
  /**
   * Creates a system error
   * 
   * @public
   * @param code Error code
   * @param message Error message
   * @param phase Validation phase where the error occurred
   * @param context Context information
   * @param stackTrace Stack trace if available
   * @returns A new ValidationSystemError
   */
  public createSystemError(
    code: string,
    message: string,
    phase: ValidationPhase,
    context: Record<string, any> = {},
    stackTrace: string = ''
  ): ValidationSystemError {
    return new ValidationSystemError(
      code,
      message,
      this.options.componentName,
      phase,
      context,
      stackTrace,
      false
    );
  }
}