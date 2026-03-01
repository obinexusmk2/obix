/**
 * ValidationAdapter.ts
 * 
 * Implementation of the ValidationAdapter class for the OBIX validation system.
 * This class acts as a bridge between functional and OOP paradigms following the
 * DOP (Data-Oriented Programming) Adapter pattern. It integrates with the state
 * minimization technology to ensure optimal performance.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationDataModel } from "./data/ValidationDataModel";
import { ErrorTracker, ValidationErrorTracker } from "./errors/ErrorTracker";
import { ExecutionTrace } from "./errors/ExecutionTrace";
import { ValidationError, ErrorSeverity } from "./errors/ValidationError";
import { ValidationRule } from "./rules/ValidationRule";
import { ImplementationComparisonResult } from "./ImplementationComparisonResult";
import { ValidationBehaviorModel } from "./ValidationBehaviourModel";
import { ValidationResult } from "./ValidationResult";
import { ValidationStateMachine } from "./ValidationStateMachine";




/**
 * Implementation mode for the validation adapter
 */
type ImplementationMode = 'functional' | 'oop';

/**
 * The ValidationAdapter implements the DOP Adapter pattern that bridges between
 * functional and OOP paradigms in the OBIX framework. It ensures equivalence
 * between implementations and leverages the state minimization technology.
 */
export class ValidationAdapter {
  /**
   * Data model for validation data
   */
  public dataModel: ValidationDataModel;
  
  /**
   * Behavior model for validation operations
   */
  public behaviorModel: ValidationBehaviorModel;
  
  /**
   * State machine for validation states
   */
  public stateMachine: ValidationStateMachine;
  
  /**
   * Error tracker for recording validation errors
   */
  public errorTracker: ErrorTracker;
  
  /**
   * Current implementation mode (functional or OOP)
   */
  public implementationMode: ImplementationMode;
  
  /**
   * Creates a new ValidationAdapter instance
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   * @param stateMachine The state machine
   * @param errorTracker The error tracker
   * @param implementationMode The implementation mode
   */
  constructor(
    dataModel: ValidationDataModel,
    behaviorModel: ValidationBehaviorModel,
    stateMachine: ValidationStateMachine,
    errorTracker: ErrorTracker = new ValidationErrorTracker(),
    implementationMode: ImplementationMode = 'functional'
  ) {
    this.dataModel = dataModel;
    this.behaviorModel = behaviorModel;
    this.stateMachine = stateMachine;
    this.errorTracker = errorTracker;
    this.implementationMode = implementationMode;
  }
  
  /**
   * Adapts an input to a validation result
   * 
   * @param input The input to adapt
   * @returns Validation result
   */
  public adapt(input: any): ValidationResult<any> {
    try {
      const node = this.validateNode(input);
      
      // Find applicable rules for this node
      const rules = this.behaviorModel.findApplicableRules(
        node,
        this.dataModel.getRules()
      );
      
      const result = new ValidationResult(true, input);
      
      // Apply each rule and collect results
      for (const rule of rules) {
        // Start execution trace
        const trace = ExecutionTrace.start(rule.id, { node });
        
        try {
          // Apply the rule
          const ruleResult = this.behaviorModel.applyRule(rule, node);
          
          // End the trace with the rule result
          trace.end(ruleResult.toObject());
          
          // Add trace to result
          result.addTrace(trace);
          
          // Add trace to data model
          this.dataModel = this.dataModel.withRuleExecutionTrace(rule.id, trace);
          
          // Merge rule result into the overall result
          if (!ruleResult.isValid) {
            result.merge(ruleResult);
          }
        } catch (error) {
          // Handle rule execution error
          const systemError = this.behaviorModel.handleRuleExecutionError(
            rule,
            error instanceof Error ? error : new Error(String(error))
          );
          
          // Add error to tracker
          this.errorTracker.addError(systemError);
          
          // Add error to data model
          this.dataModel = this.dataModel.withError(systemError);
          
          // Add error to result
          result.addError(new ValidationError(
            'RULE_EXECUTION_ERROR',
            systemError.message,
            'ValidationAdapter',
            this.implementationMode,
            ErrorSeverity.ERROR,
            { originalError: systemError }
          ));
        }
      }
      
      return result;
    } catch (error) {
      // Handle adaptation errors
      const validationError = this.createValidationError(
        error instanceof Error ? error : new Error(String(error))
      );
      
      this.handleValidationError(validationError);
      
      return ValidationResult.createInvalid(validationError, input);
    }
  }
  
  /**
   * Registers a validation rule
   * 
   * @param rule The rule to register
   * @returns This adapter for method chaining
   */
  public registerRule(rule: ValidationRule): ValidationAdapter {
    this.dataModel = this.dataModel.withRule(rule);
    return this;
  }
  
  /**
   * Validates an AST or node
   * 
   * @param ast The AST or node to validate
   * @returns Validation result
   */
  public validate(ast: any): ValidationResult<any> {
    // Reset state machine to initial state
    this.stateMachine.reset();
    
    try {
      // Clone data model to avoid side effects
      const tempDataModel = this.dataModel.clone();
      
      // Start validation from the root node
      return this.validateNodeRecursively(ast, tempDataModel);
    } catch (error) {
      // Handle validation errors
      const validationError = this.createValidationError(
        error instanceof Error ? error : new Error(String(error))
      );
      
      this.handleValidationError(validationError);
      
      return ValidationResult.createInvalid(validationError, ast);
    }
  }
  
  /**
   * Compares implementations across paradigms
   * 
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  public compareImplementations(funcImpl: any, oopImpl: any): ImplementationComparisonResult {
    // Save original mode
    const originalMode = this.implementationMode;
    
    try {
      // Create test data for comparison
      const testData = this.createTestData(funcImpl, oopImpl);
      
      // Validate test data with functional implementation
      this.implementationMode = 'functional';
      const funcResult = this.adapt(testData);

      // Set OOP mode and validate
      this.implementationMode = 'oop';
      const oopResult = this.adapt(oopImpl);
      
      // Compare results
      const comparisonResult = new ImplementationComparisonResult(funcResult.isValid && oopResult.isValid);
      
// If equivalent, return early
if (comparisonResult.equivalent) {
  return comparisonResult;
}

// If not equivalent, create implementation mismatch errors
const errors = comparisonResult.toValidationErrors(
  String(oopImpl.constructor?.name || 'OOPComponent')
);

// Add errors to tracker
for (const error of errors) {
  this.errorTracker.addError(error);
}
      
      return comparisonResult;
    } finally {
      // Restore original mode
      this.implementationMode = originalMode;
    }
  }
  
  /**
   * Creates a validation adapter from a functional configuration
   * 
   * @param config Functional configuration
   * @returns New validation adapter
   */
  public createFromFunctional(config: any): ValidationAdapter {
    // Create a new data model
    const dataModel = new ValidationDataModel();
    
    // Extract rules from config
    const rules = this.extractRulesFromFunctional(config);
    
    // Create a new adapter
    const adapter = new ValidationAdapter(
      dataModel,
      this.behaviorModel,
      this.stateMachine.clone(),
      this.errorTracker,
      'functional'
    );
    
    // Register rules
    for (const rule of rules) {
      adapter.registerRule(rule);
    }
    
    return adapter;
  }
  
  /**
   * Creates a validation adapter from an OOP class
   * 
   * @param validatorClass OOP validator class
   * @returns New validation adapter
   */
  public createFromClass(validatorClass: any): ValidationAdapter {
    // Create a new data model
    const dataModel = new ValidationDataModel();
    
    // Extract rules from class
    const rules = this.extractRulesFromClass(validatorClass);
    
    // Create a new adapter
    const adapter = new ValidationAdapter(
      dataModel,
      this.behaviorModel,
      this.stateMachine.clone(),
      this.errorTracker,
      'oop'
    );
    
    // Register rules
    for (const rule of rules) {
      adapter.registerRule(rule);
    }
    
    return adapter;
  }
  
  /**
   * Handles a validation error
   * 
   * @param error The validation error
   */
  public handleValidationError(error: ValidationError): void {
    // Add error to tracker
    this.errorTracker.addError(error);
    
    // Add error to data model
    this.dataModel = this.dataModel.withError(error);
    
    // Handle error in state machine
    this.stateMachine.handleErrorInState(error);
  }
  
  /**
   * Gets the error tracker
   * 
   * @returns The error tracker
   */
  public getErrorTracker(): ErrorTracker {
    return this.errorTracker;
  }
  
  /**
   * Validates a node
   * 
   * @public
   * @param node The node to validate
   * @returns The validated node
   */
  public validateNode(node: any): any {
    // Check for null or undefined
    if (node === null || node === undefined) {
      throw new Error("Cannot validate null or undefined node");
    }
    
    // Add validation state to data model
    this.dataModel = this.dataModel.withValidationState('currentNode', node);
    
    return node;
  }
  
  /**
   * Validates a node recursively
   * 
   * @public
   * @param node The node to validate
   * @param dataModel The data model
   * @returns Validation result
   */
  public validateNodeRecursively(node: any, dataModel: ValidationDataModel): ValidationResult<any> {
    // Validate current node
    const currentResult = this.validateNodeWithRules(node, dataModel);
    
    // If not valid, return early
    if (!currentResult.isValid) {
      return currentResult;
    }
    
    // Check if node has children
    const children = this.getNodeChildren(node);
    
    // If no children, return current result
    if (!children || children.length === 0) {
      return currentResult;
    }
    
    // Validate each child
    let result = currentResult;
    for (const child of children) {
      const childResult = this.validateNodeRecursively(child, dataModel);
      result = result.merge(childResult);
      
      // If not valid, break early
      if (!result.isValid) {
        break;
      }
    }
    
    return result;
  }
  
  /**
   * Validates a node with rules
   * 
   * @public
   * @param node The node to validate
   * @param dataModel The data model
   * @returns Validation result
   */
  public validateNodeWithRules(node: any, dataModel: ValidationDataModel): ValidationResult<any> {
    // Find applicable rules for this node
    const nodeType = this.getNodeType(node);
    
    // Check if we have optimized rules for this node type
    let rules: ValidationRule[];
    if (dataModel.hasOptimizedRules(nodeType)) {
      rules = dataModel.getOptimizedRules(nodeType);
    } else {
      // Find applicable rules and optimize them
      rules = this.behaviorModel.findApplicableRules(
        node,
        dataModel.getRules()
      );
      
      // Optimize rules for this node type
      const optimizedRules = this.behaviorModel.optimizeRules(rules);
      
      // Store optimized rules in data model
      dataModel.withOptimizedRules(nodeType, optimizedRules.get(nodeType) || []);
    }
    
    const result = new ValidationResult(true, node, [], []);
    
    // Apply each rule and collect results
    for (const rule of rules) {
      // Apply the rule
      const ruleResult = this.behaviorModel.applyRule(rule, node);
      
      // Merge rule result into the overall result
      if (!ruleResult.isValid) {
        result.merge(ruleResult);
      }
    }
    
    return result;
  }
  
  /**
   * Gets the type of a node
   * 
   * @public
   * @param node The node
   * @returns Node type
   */
  public getNodeType(node: any): string {
    if (node === null || node === undefined) {
      return 'null';
    }
    
    // Check for type property
    if (node.type) {
      return node.type;
    }
    
    // Check for nodeType property
    if (node.nodeType) {
      return node.nodeType;
    }
    
    // Fall back to constructor name or typeof
    return node.constructor?.name || typeof node;
  }
  
  /**
   * Gets the children of a node
   * 
   * @public
   * @param node The node
   * @returns Array of child nodes
   */
  public getNodeChildren(node: any): any[] {
    if (node === null || node === undefined) {
      return [];
    }
    
    // Check for children property
    if (Array.isArray(node.children)) {
      return node.children;
    }
    
    // Check for childNodes property
    if (Array.isArray(node.childNodes)) {
      return node.childNodes;
    }
    
    // Check if node is an array
    if (Array.isArray(node)) {
      return node;
    }
    
    return [];
  }
  
  /**
   * Creates a validation error from an exception
   * 
   * @public
   * @param error The exception
   * @returns Validation error
   */
  public createValidationError(error: Error): ValidationError {
    return new ValidationError(
      'VALIDATION_ERROR',
      error.message,
      'ValidationAdapter',
      this.implementationMode,
      ErrorSeverity.ERROR,
      {
        originalError: error,
        stack: error.stack,
        timestamp: Date.now()
      }
    );
  }
  
  /**
   * Extracts rules from a functional configuration
   * 
   * @public
   * @param config The functional configuration
   * @returns Array of validation rules
   */
  public extractRulesFromFunctional(config: any): ValidationRule[] {
    // Implementation would depend on the specific format of functional configuration
    // This is a placeholder that would need to be customized
    const rules: ValidationRule[] = [];
    
    // Example: Extract rules from validate functions
    if (config.validate && typeof config.validate === 'function') {
      // Create a rule from the validate function
      // (implementation would depend on validation rule factory)
    }
    
    return rules;
  }
  
  /**
   * Extracts rules from an OOP class
   * 
   * @public
   * @param validatorClass The OOP validator class
   * @returns Array of validation rules
   */
  public extractRulesFromClass(validatorClass: any): ValidationRule[] {
    // Implementation would depend on the specific format of OOP classes
    // This is a placeholder that would need to be customized
    const rules: ValidationRule[] = [];
    
    // Example: Extract rules from class methods
    const prototype = validatorClass.prototype;
    const methodNames = Object.getOwnPropertyNames(prototype)
      .filter(name => name !== 'constructor' && typeof prototype[name] === 'function');
    
    for (const methodName of methodNames) {
      if (methodName.startsWith('validate')) {
        // Create a rule from the method
        // (implementation would depend on validation rule factory)
      }
    }
    
    return rules;
  }
  
  /**
   * Creates test data for implementation comparison
   * 
   * @public
   * @param funcImpl Functional implementation
   * @param _oopImpl OOP implementation
   * @returns Test data
   */
  public createTestData(funcImpl: any, _oopImpl: any): any {
    // This would be customized based on the specific implementations
    // Create test data using properties from the functional implementation
    return {
      type: typeof funcImpl === 'function' ? 'function' : 'test',
      value: funcImpl?.toString() || 'test value',
      children: []
    };
  }
}