/**
 * ValidationEngine.ts
 * 
 * Implementation of the ValidationEngine class for the OBIX validation system.
 * This class serves as a unified interface for validation, bridging the DOP Adapter
 * pattern with error handling and validation results, enabling seamless validation
 * across functional and OOP paradigms.
 * 
 * Copyright © 2025 OBINexus Computing
 */
import { DOPAdapter, BaseDOPAdapter, BehaviorModel, ImplementationComparisonResult } from "@/core/dop";
import { ValidationBehaviorModel } from "@/core/dop/ValidationBehaviourModel";
import { ValidationResult } from "@/core/dop/ValidationResult";
import { ValidationState } from "@/core/dop/ValidationState";
import { ValidationStateMachine } from "@/core/dop/ValidationStateMachine";
import { ValidationDataModel } from "../data/ValidationDataModel";
import { ErrorHandler } from "../errors/ErrorHandler";
import { ErrorTracker } from "../errors/ErrorTracker";
import { ExecutionTrace } from "../errors/ExecutionTrace";
import { ValidationError, ValidationSystemError, ValidationPhase, ErrorSeverity } from "../errors/ValidationError";
import { ValidationRule } from "../rules/ValidationRule";
import { OptimizedValidationBehaviorModel } from "@/core/dop/OptimizedValidationBehaviourModel";


/**
 * Configuration options for ValidationEngine
 */
export interface ValidationEngineOptions {
    /**
     * Data model to use
     */
    dataModel?: ValidationDataModel | undefined;
    
    /**
     * Behavior model to use
     */
    behaviorModel?: ValidationBehaviorModel | undefined;
    
    /**
     * Error handler to use
     */
    errorHandler?: ErrorHandler | undefined;
    /**
     * Error handling strategy to use
     */
    errorHandlingStrategy?: string | undefined;
    
    /**
     * Whether to optimize rule execution
     */
    optimizeRuleExecution?: boolean | undefined;
    
    /**
     * Whether to automatically validate implementations
     */
    autoValidateImplementations?: boolean | undefined;
    /**
     * State machine to use
     */
    stateMachine?: ValidationStateMachine | undefined;
    
    /**
     * Whether to enable state minimization
     */
    enableMinimization?: boolean | undefined;
    
    /**
     * Whether to enable execution tracing
     */
    enableTracing?: boolean | undefined;
    
    /**
     * Whether to automatically validate implementations
     */
    autoValidate?: boolean | undefined;
    
    /**
     * Component name for error tracking
     */
    componentName?: string | undefined;
    
    /**
     * Maximum number of rules to apply per node
     */
    maxRulesPerNode?: number | undefined;
  }

/**
 * The ValidationEngine is a unified validation interface that bridges the DOP Adapter
 * pattern with error handling and validation results, enabling seamless validation
 * across functional and OOP paradigms.
 */
export class ValidationEngine {
  /**
   * DOP adapter for data and behavior
   */
  public dataAdapter: DOPAdapter<ValidationDataModel, ValidationResult<any>>;
  
  /**
   * Behavior model for validation operations
   */
  public behaviorModel: ValidationBehaviorModel;
  
  /**
   * Error handler for validation errors
   */
  public errorHandler: ErrorHandler;
  
  /**
   * State machine for validation states
   */
  public stateMachine: ValidationStateMachine;
  
  /**
   * Registry of validation rules
   */
  public ruleRegistry: Map<string, ValidationRule>;
  
  /**
   * Whether to enable state minimization
   */
  public enableMinimization: boolean;
  
  /**
   * Whether to enable execution tracing
   */
  public enableTracing: boolean;
  
  /**
   * Whether to automatically validate implementations
   */
  public autoValidate: boolean;
  
  /**
   * Component name for error tracking
   */
  public componentName: string;
  
  /**
   * Maximum number of rules to apply per node
   */
  public maxRulesPerNode: number;
  isValid: boolean;
  
  /**
   * Create a new ValidationEngine instance
   * 
   * @param options Configuration options
   */
  constructor(options: ValidationEngineOptions = {}) {
    // Initialize data model
    const dataModel = options.dataModel || new ValidationDataModel();
    
    // Initialize behavior model
    this.behaviorModel = options.behaviorModel || new ValidationBehaviorModel();
    
    // Create DOP adapter
    this.dataAdapter = new class extends BaseDOPAdapter<ValidationDataModel, ValidationResult<any>> {
      public cacheEnabled = false;
      public override resultCache = new Map<string, ValidationResult<any>>();

      override generateCacheKey(data: any): string {
        return JSON.stringify(data);
      }
      
      override adapt(data: any): ValidationResult<any> {
        return new ValidationResult<any>(true, data);
      }

    }(dataModel, this.behaviorModel as unknown as BehaviorModel<ValidationDataModel, ValidationResult<any>>);
    
    // Initialize error handler
    this.errorHandler = options.errorHandler || new ErrorHandler({
      enableMetrics: true,
      enableSourceTracking: true
    });
    
    // Initialize state machine
    this.stateMachine = options.stateMachine || new ValidationStateMachine();
    if (!this.stateMachine.getCurrentState()) {
      this.initializeStateMachine();
    }
    
    // Initialize rule registry
    this.ruleRegistry = new Map<string, ValidationRule>();
    
    // Set configuration option
    this.isValid = false;
    this.autoValidate = options.autoValidate !== false;
    this.behaviorModel = options.behaviorModel || new ValidationBehaviorModel();
    this.errorHandler = options.errorHandler || new ErrorHandler();
    this.stateMachine = options.stateMachine || new ValidationStateMachine();
    this.ruleRegistry = new Map<string, ValidationRule>();
    
    this.enableMinimization = options.enableMinimization !== false;
    this.enableTracing = options.enableTracing !== false;
    this.autoValidate = options.autoValidate !== false;
    this.componentName = options.componentName || 'ValidationEngine';
    this.maxRulesPerNode = options.maxRulesPerNode || 100;
  }
  
  generateCacheKey(data: any): string {
    return JSON.stringify(data);
  }
  /**
   * Gets a summary of the validation results
   * 
   * @returns Summary of validation results
   */
  public getSummary(): string {
    const dataModel = this.dataAdapter.getDataModel();
    const summary = {
      isValid: this.isValid,
      errors: dataModel.getErrors(),
      warnings: dataModel.getWarnings(),
      traces: dataModel.getTraces()
    };
    return JSON.stringify(summary, null, 2);
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
      this.errorHandler.handleError(error, this.componentName);
      return 'error';
    });
  }
  
  

/**
 * 
 * @returns The behavior ID
 */
getBehaviorId(): string {
    return 'validation-behavior';
}

/**
 * 
 * @returns Description of the behavior model
 */
getDescription(): string {
    return 'Validation behavior model for processing validation rules';
}


  /**
   * Registers a validation rule with this engine
   * 
   * @param rule The validation rule to register
   * @returns This ValidationEngine instance for chaining
   */
  public registerRule(rule: ValidationRule): ValidationEngine {
    // Add to rule registry
    this.ruleRegistry.set(rule.id, rule);
    
    // Add to data model
    const dataModel = this.dataAdapter.getDataModel();
    const updatedDataModel = dataModel.withRule(rule);
    
    // Update the data adapter with the new data model
    this.dataAdapter = new class extends BaseDOPAdapter<ValidationDataModel, ValidationResult<any>> {
      public cacheEnabled = false;
      public override resultCache = new Map<string, ValidationResult<any>>();


      override adapt(data: any): ValidationResult<any> {
        return new ValidationResult<any>(true, data);
      }
    }(updatedDataModel, this.behaviorModel as unknown as BehaviorModel<ValidationDataModel, ValidationResult<any>>);
    
    return this;
  }
  
  /**
   * Registers multiple validation rules with this engine
   * 
   * @param rules The validation rules to register
   * @returns This ValidationEngine instance for chaining
   */
  public registerRules(rules: ValidationRule[]): ValidationEngine {
    for (const rule of rules) {
      this.registerRule(rule);
    }
    
    return this;
  }

  /**
   * Validates an entire AST by traversing its nodes and applying rules
   * 
   * @param ast The abstract syntax tree to validate
   * @returns Validation result
   */
  public validateAST(ast: any): ValidationResult<any> {
    // Reset state machine to initial state
    this.stateMachine.reset();
    
    // Transition to validating state
    this.stateMachine.transition('begin_validation');
    
    try {
      // Create initial result
      const result = new ValidationResult(true, new ValidationDataModel());
      
      // Traverse and validate the AST
      this.traverseNode(ast, result);
      
      // Transition to validated state
      this.stateMachine.transition('validation_complete');
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      const validationError = new ValidationSystemError(
        'VALIDATION_ENGINE_ERROR',
        error instanceof Error ? error.message : String(error),
        this.componentName,
        ValidationPhase.NODE_TRAVERSAL,
        { astType: ast?.type || 'unknown' },
        error instanceof Error ? error.stack || '' : '',
        false
      );
      
      // Handle the error
      this.handleError(validationError);
      
      // Transition to error state
      this.stateMachine.transition('validation_error');
      
      // Return an invalid result
      return ValidationResult.createInvalid(validationError, new ValidationDataModel());
    }
  }
  

  /**
   * Validates a single node against all applicable rules
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  public validateNode(node: any): ValidationResult<any> {
    // Get applicable rules for this node
    const applicableRules = this.getApplicableRules(node);
    
    // Process the rules
    return this.processRules(node, applicableRules);
  }
  
  /**
   * Validates and compares implementations across paradigms
   * 
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  public validateImplementations(
    funcImpl: any,
    oopImpl: any
  ): ImplementationComparisonResult {
    try {
      // Create test data for comparison from the functional implementation
      const testData = this.createTestData(funcImpl, oopImpl);
      
      // Validate with functional implementation
      const dataModel = this.dataAdapter.getDataModel();
      dataModel.withValidationState('currentImplementation', 'functional');
      const dataAdapterFunctional = new class extends BaseDOPAdapter<ValidationDataModel, ValidationResult<any>> {
         override adapt(data: any): ValidationResult<any> {
          return new ValidationResult<any>(true, data);
        }
      }(dataModel, this.behaviorModel as unknown as BehaviorModel<ValidationDataModel, ValidationResult<any>>);
      dataAdapterFunctional.adapt(testData);
      
      // Validate with OOP implementation
      dataModel.withValidationState('currentImplementation', 'oop');
      const dataAdapterOop = new class extends BaseDOPAdapter<ValidationDataModel, ValidationResult<any>> {
        override adapt(data: any): ValidationResult<any> {
          return new ValidationResult<any>(true, data);
        }
      }(dataModel, this.behaviorModel as unknown as BehaviorModel<ValidationDataModel, ValidationResult<any>>);


      const oopResult = dataAdapterOop.adapt(testData);
      
      // Compare the results
      const comparisonResult = this.compareWith(oopResult);
      
      // If implementations are not equivalent, handle the mismatch errors
      if (!comparisonResult.equivalent) {
        const errors = comparisonResult.toValidationErrors(
          String(oopImpl.constructor?.name || 'OOPComponent')
        );
        
        // Handle each error
        for (const error of errors) {
          this.errorHandler.handleImplementationMismatch(error);
        }
      }
      
      return comparisonResult;
    } catch (error) {
      // Handle unexpected errors
      const validationError = new ValidationSystemError(
        'IMPLEMENTATION_COMPARISON_ERROR',
        error instanceof Error ? error.message : String(error),
        this.componentName,
        ValidationPhase.RESULT_AGGREGATION,
        {
          functional: String(funcImpl.constructor?.name || 'FunctionalComponent'),
          oop: String(oopImpl.constructor?.name || 'OOPComponent')
        },
        error instanceof Error ? error.stack || '' : '',
        false
      );
      
      // Handle the error
      this.handleError(validationError);
      
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
   * Compares this model with another ValidationResult
   * 
   * @param other The other ValidationResult to compare with
   * @returns The result of the comparison
   */
  public compareWith(other: ValidationResult<any>): ImplementationComparisonResult {
    // Implement comparison logic here
    const equivalent = this.isValid === other.isValid && JSON.stringify(this.getDataModel()) === JSON.stringify(other.data);
    return new ImplementationComparisonResult(equivalent, [], {});
  }

  public compareImplementations(funcImpl: any, oopImpl: any): ImplementationComparisonResult {
    const funcResult = this.validateImplementations(funcImpl, oopImpl);
    return funcResult;
  }
 
  /**
   * Gets the data model
   * 
   * @returns The data model
   */
  public getDataModel(): ValidationDataModel {
    return this.dataAdapter.getDataModel();

  }

  
  /**
   * Handles a validation error
   * 
   * @param error The validation error
   */
  public handleError(error: ValidationError): void {
    // Add error to the error handler
    this.errorHandler.handleError(error, this.componentName);
    
    // Handle error in the state machine
    this.stateMachine.handleErrorInState(error);
  }
  
  /**
   * Gets the error tracker
   * 
   * @returns The error tracker
   */
  public getErrorTracker(): ErrorTracker {
    return this.errorHandler.getErrorTracker(this.componentName);
  }
  
  /**
   * Gets the state machine
   * 
   * @returns The validation state machine
   */
  public getStateMachine(): ValidationStateMachine {
    return this.stateMachine;
  }
  
  /**
   * Minimizes the state machine and rule sets for optimal performance
   * 
   * @returns This ValidationEngine instance for chaining
   */
  public minimize(): ValidationEngine {
    if (this.enableMinimization) {
      // Minimize the state machine
      this.stateMachine.minimize();
      
      // Optimize rule sets
      if (this.behaviorModel instanceof OptimizedValidationBehaviorModel) {
        // If we have an optimized behavior model, use it
        const optimizedModel = this.behaviorModel as OptimizedValidationBehaviorModel;
        
        // Clear the cache and rebuild the optimized rule sets
        optimizedModel.clearCache();
        
        // Build the rule dependency graph
        optimizedModel.buildRuleDependencyGraph(Array.from(this.ruleRegistry.values()));
      }
    }
    
    return this;
  }
  

  /**
   * Processes validation data and returns the result
   * 
   * @param data The validation data model
   * @returns Validation result
   */
  public process(data: ValidationDataModel): ValidationResult<any> {
    // Reset state machine to initial state
    this.stateMachine.reset();
    
    // Transition to validating state
    this.stateMachine.transition('begin_validation');
    
    try {
      // Create initial result
      const result = new ValidationResult(true, new ValidationDataModel());
      
      // Validate the data model
      const validationResult = this.dataAdapter.adapt(data);
      
      // Merge validation result
      if (!validationResult.isValid) {
        for (const error of validationResult.errors) {
          result.addError(error);
        }
        
        for (const warning of validationResult.warnings) {
          result.addWarning(warning);
        }
      }
      
      // Transition to validated state
      this.stateMachine.transition('validation_complete');
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      const validationError = new ValidationSystemError(
        'VALIDATION_ENGINE_ERROR',
        error instanceof Error ? error.message : String(error),
        this.componentName,
        ValidationPhase.DATA_PROCESSING,
        { dataModelType: data?.constructor?.name || 'unknown' },
        error instanceof Error ? error.stack || '' : '',
        false
      );
      
      // Handle the error
      this.handleError(validationError);
      
      // Transition to error state
      this.stateMachine.transition('validation_error');
      
      // Return an invalid result
      return ValidationResult.createInvalid(validationError, new ValidationDataModel());
    }
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
    const result = new ValidationResult(true, new ValidationDataModel(), []);
    
    // Apply each rule
    for (const rule of rules) {
      try {
        // Create an execution trace if tracing is enabled
        let trace: ExecutionTrace | undefined;
        if (this.enableTracing) {
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
            result.addError(new ValidationError('RULE_VALIDATION_ERROR', error.message, this.componentName));
          }
          
          for (const warning of ruleResult.warnings) {
            result.addWarning(warning);
          }
        }
      } catch (error) {
        // Handle rule execution errors
        const validationError = new ValidationSystemError(
          'RULE_EXECUTION_ERROR',
          `Error executing rule "${rule.id}": ${error instanceof Error ? error.message : String(error)}`,
          this.componentName,
          ValidationPhase.RULE_APPLICATION,
          { ruleId: rule.id, nodeType: node?.type || 'unknown' },
          error instanceof Error ? error.stack || '' : '',
          false
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
      result.addError(error);
    }
    
    for (const warning of nodeResult.warnings) {
      result.addWarning(warning);
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
    
    // Get node type
    const nodeType = node.type || node.nodeType || node.tagName?.toLowerCase() || typeof node;
    
    // Get optimized rules if available
    const dataModel = this.dataAdapter.getDataModel();
    if (dataModel.hasOptimizedRules(nodeType)) {
      return dataModel.getOptimizedRules(nodeType);
    }
    
    // Use behavior model to find applicable rules
    const allRules = Array.from(this.ruleRegistry.values());
    const applicableRules = this.behaviorModel.findApplicableRules(node, allRules);
    
    // Limit the number of rules to prevent performance issues
    if (applicableRules.length > this.maxRulesPerNode) {
      // Sort by severity (highest first)
      applicableRules.sort((a: ValidationRule, b: ValidationRule) => b.severity - a.severity);
      return applicableRules.slice(0, this.maxRulesPerNode);
    }
    
    return applicableRules;
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
    const trace = new ExecutionTrace(rule.id, Date.now(), 0, undefined, {}, []);
    trace.ruleId = rule.id;
    trace.startTime = Date.now();
    trace.endTime = 0;
    trace.inputSnapshot = { 
        nodeType: node.type || node.nodeType || typeof node,
        nodeId: node.id || '',
        nodeName: node.name || '',
        nodeValue: node.value || '',
        rule: {
          id: rule.id,
          description: rule.description,
          severity: rule.severity
        }
    };
    
    // Add initial step
    trace.addStep(`Validating ${node.type || 'node'} with rule ${rule.id}`);
    
    return trace;
  }
  
  /**
   * Creates test data for implementation comparison
   * 
   * @public
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Test data
   */
  public createTestData(funcImpl: any, oopImpl: any): any {
    // This method creates representative test data for both implementations
    // It should be customized based on the specific domain

    // Basic test data structure
    const testData: {
      type: string;
      children: Array<{ type: string; value: any; metadata: { source: string }; name?: string }>;
      metadata: {
        source: string;
        timestamp: number;
        functionalImpl: string;
        oopImpl: string;
        [key: string]: any;
      };
    } = {
      type: 'root',
      children: [],
      metadata: {
        source: 'validation-engine',
        timestamp: Date.now(),
        functionalImpl: typeof funcImpl === 'function' ? 'function' : typeof funcImpl,
        oopImpl: typeof oopImpl === 'object' ? 'object' : typeof oopImpl,
        // Add additional metadata properties if needed
      }
    };
    
    // Extract properties from functional implementation
    if (typeof funcImpl === 'object') {
      // Add properties from functional implementation
      for (const [key, value] of Object.entries(funcImpl)) {
        if (typeof value !== 'function' && key !== 'children' && key !== 'type') {
          testData.metadata[`func_${key}`] = value;
        }
      }
      
      // Extract initialState if available (common in functional components)
      if ('initialState' in funcImpl) {
        testData.children.push({
          type: 'state',
          value: funcImpl.initialState,
          metadata: { source: 'functional' }
        });
      }
      
      // Extract transitions if available
      if ('transitions' in funcImpl && typeof funcImpl.transitions === 'object') {
        for (const [transitionName, transitionFn] of Object.entries(funcImpl.transitions)) {
          testData.children.push({
            type: 'transition',
            name: transitionName,
            value: typeof transitionFn,
            metadata: { source: 'functional' }
          });
        }
      }
    }
    
    // Extract properties from OOP implementation
    if (typeof oopImpl === 'object') {
      // Get all properties from the OOP implementation
      const prototypeProperties = Object.getOwnPropertyNames(Object.getPrototypeOf(oopImpl) || {});
      
      // Add methods as transitions
      for (const prop of prototypeProperties) {
        if (prop !== 'constructor' && typeof oopImpl[prop] === 'function') {
          testData.children.push({
            type: 'transition',
            name: prop,
            value: typeof oopImpl[prop],
            metadata: { source: 'oop' }
          });
        }
      }
      
      // Add initialState if available
      if ('initialState' in oopImpl) {
        testData.children.push({
          type: 'state',
          value: oopImpl.initialState,
          metadata: { source: 'oop' }
        });
      }
    }
    
    return testData;
  }
  
  /**
   * Creates a specialized ValidationEngine for specific validation tasks
   * 
   * @param options Configuration options
   * @returns A new ValidationEngine instance
   */
  public static createSpecialized(options: {
    type: 'html' | 'css' | 'javascript' | 'typescript' | string;
    rules?: ValidationRule[];
    enableTracing?: boolean;
    enableMinimization?: boolean;
  }): ValidationEngine {
    // Create a base engine
    const engine = new ValidationEngine({
      enableTracing: options.enableTracing,
      enableMinimization: options.enableMinimization,
      componentName: `${String(options.type).toUpperCase()}ValidationEngine`
    }) as ValidationEngine;
    
    // Register rules if provided
    if (options.rules && Array.isArray(options.rules)) {
      for (const rule of options.rules) {
        engine.registerRule(rule);
      }
    }
    
    // Apply domain-specific optimizations based on type
    switch (options.type) {
      case 'html':
        engine.behaviorModel = new OptimizedValidationBehaviorModel();
        break;
      case 'css':
        engine.behaviorModel = new OptimizedValidationBehaviorModel();
        break;
      case 'javascript':
      case 'typescript':
        engine.behaviorModel = new OptimizedValidationBehaviorModel();
        break;
    }
    
    // Minimize the engine if enabled
    if (options.enableMinimization) {
      engine.minimize();
    }
    
    return engine;
  }
}