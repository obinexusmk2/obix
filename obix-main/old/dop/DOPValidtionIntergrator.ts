/**
 * DOPValidationIntegrator.ts
 * 
 * Integration class that bridges the DOP pattern with the validation engine,
 * ensuring consistent behavior across functional and OOP implementations
 * while providing early error detection in the development workflow.
 * 
 * This component employs Nnamdi Okpala's automaton state minimization technology
 * to optimize validation operations and ensure perfect 1:1 correspondence
 * between functional and OOP implementations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ErrorHandler, ErrorSeverity } from "../../../src/core/validation/errors/ErrorHandler";
import { ExecutionTrace } from "../../../src/core/validation/errors/ExecutionTrace";
import { ValidationSystemError, ValidationPhase } from "../../../src/core/validation/errors/ValidationError";
import { CSSValidationRule } from "../../../src/core/validation/rules/CSSValidationRule";
import { HTMLValidationRule } from "../../../src/core/validation/rules/HTMLValidationRule";
import { ValidationRule } from "../../../src/core/validation/rules/ValidationRule";
import { DataModel } from "./BaseDataModel";
import { BehaviorChain } from "./BehaviourChain";
import { BehaviorModel } from "./BehaviourModel";
import { DOPAdapter, BaseDOPAdapter } from "./DOPAdapter";
import { ImplementationComparisonResult } from "./ImplementationComparisonResult";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";
import { ValidationBehaviorModelImpl } from "./ValidationBehaviorModelImpl";
import { ValidationResult } from "./ValidationResult";
import { ValidationStateMachine } from "./ValidationStateMachine";
import { ValidationState } from "./ValidationState";


/**
 * Configuration options for the DOPValidationIntegrator
 */
export interface DOPValidationIntegratorOptions {
  /**
   * Enable state minimization for optimized validation
   */
  enableMinimization?: boolean;
  
  /**
   * Enable execution tracing for detailed analysis
   */
  enableTracing?: boolean;
  
  /**
   * Component name for error tracking
   */
  componentName?: string;
  
  /**
   * Maximum number of errors to track
   */
  maxErrorsTracked?: number;
  
  /**
   * Behavior chains to register initially
   */
  behaviorChains?: Record<string, BehaviorChain<any>>;
  
  /**
   * Initial validation rules to register
   */
  validationRules?: ValidationRule[];
  
  /**
   * Custom state machine implementation
   */
  stateMachine?: ValidationStateMachine;
  
  /**
   * Custom error handler implementation
   */
  errorHandler?: ErrorHandler;
}

/**
 * Integration class that bridges the DOP pattern with the validation engine
 */
export class DOPValidationIntegrator {

  /**
   * Registry of behavior chains for different domains
   */
  public behaviorChains: Map<string, BehaviorChain<any>> = new Map();
  
  /**
   * Registry of validation rules
   */
  public validationRules: Map<string, ValidationRule> = new Map();
  
  /**
   * Registry of DOP adapters
   */
  public dopAdapters: Map<string, DOPAdapter<any, any>> = new Map();
  
  /**
   * State machine for validation states
   */
  public stateMachine: ValidationStateMachine;
  
  /**
   * Error handler for validation errors
   */
  public errorHandler: ErrorHandler;
  
  /**
   * Whether state minimization is enabled
   */
  public minimizationEnabled: boolean;
  
  /**
   * Whether execution tracing is enabled
   */
  public tracingEnabled: boolean;
  
  /**
   * Component name for error tracking
   */
  public componentName: string;
  
  /**
   * Cache for validation results
   */
  public validationCache: Map<string, ValidationResult<any>> = new Map();
  
  /**
   * Creates a new DOPValidationIntegrator instance
   * 
   * @param options Configuration options
   */
  constructor(options: DOPValidationIntegratorOptions = {}) {
    this.minimizationEnabled = options.enableMinimization !== false;
    this.tracingEnabled = options.enableTracing === true;
    this.componentName = options.componentName || 'DOPValidator';
    
    // Initialize state machine
    this.stateMachine = options.stateMachine || new ValidationStateMachine();
    this.initializeStateMachine();
    
    // Initialize error handler
    this.errorHandler = options.errorHandler || new ErrorHandler({
      enableMetrics: true,
      enableSourceTracking: true,
      defaultComponent: this.componentName,
      maxErrorsPerComponent: options.maxErrorsTracked || 100,
      stateMachine: this.stateMachine
    });
    
    // Register initial behavior chains
    if (options.behaviorChains) {
      for (const [domain, chain] of Object.entries(options.behaviorChains)) {
        this.registerBehaviorChain(domain, chain);
      }
    }
    
    // Register initial validation rules
    if (options.validationRules) {
      for (const rule of options.validationRules) {
        this.registerValidationRule(rule);
      }
    }
  }

  /**
   * Initializes the validation state machine
   * 
   * @public
   */
  public initializeStateMachine(): void {
    // Create basic states if not already present
    if (this.stateMachine.getAllStates().size === 0) {
      // Initial state
      const initialState = new ValidationState(
        'initial', 
        true, 
        { isInitial: true }
      );
      this.stateMachine.addState(initialState);
      
      // Validating state
      const validatingState = new ValidationState(
        'validating', 
        false, 
        { isValidating: true }
      );
      this.stateMachine.addState(validatingState);
      
      // Validated state
      const validatedState = new ValidationState(
        'validated', 
        false, 
        { isValidated: true }
      );
      this.stateMachine.addState(validatedState);
      
      // Error state
      const errorState = new ValidationState(
        'error', 
        false, 
        { isError: true }
      );
      this.stateMachine.addState(errorState);
      
      // Add transitions
      this.stateMachine.addTransition('initial', 'begin_validation', 'validating');
      this.stateMachine.addTransition('validating', 'validation_complete', 'validated');
      this.stateMachine.addTransition('validating', 'validation_error', 'error');
      this.stateMachine.addTransition('error', 'retry_validation', 'validating');
      this.stateMachine.addTransition('validated', 'reset', 'initial');
      this.stateMachine.addTransition('error', 'reset', 'initial');
    }
  }


  
  /**
   * Registers a behavior chain for a specific domain
   * 
   * @param domain The domain this behavior chain applies to (e.g., "html", "css")
   * @param chain The behavior chain to register
   * @returns This integrator for method chaining
   */
  public registerBehaviorChain(domain: string, chain: BehaviorChain<any>): DOPValidationIntegrator {
    this.behaviorChains.set(domain.toLowerCase(), chain);
    return this;
  }
  
  /**
   * Gets a behavior chain for a specific domain
   * 
   * @param domain The domain to get the behavior chain for
   * @returns The behavior chain or undefined if not found
   */
  public getBehaviorChain(domain: string): BehaviorChain<any> | undefined {
    return this.behaviorChains.get(domain.toLowerCase());
  }
  
  /**
   * Registers a validation rule
   * 
   * @param rule The validation rule to register
   * @returns This integrator for method chaining
   */
  public registerValidationRule(rule: ValidationRule): DOPValidationIntegrator {
    this.validationRules.set(rule.id, rule);
    
    // Add to applicable DOP adapters
    this.updateAdaptersWithRule(rule);
    
    return this;
  }
  
  /**
   * Updates all relevant DOP adapters with a new rule
   * 
   * @public
   * @param rule The rule to add to adapters
   */
  public updateAdaptersWithRule(rule: ValidationRule): void {
    // Determine which domains this rule applies to
    const applicableDomains: string[] = [];
    
    if (rule instanceof HTMLValidationRule) {
      applicableDomains.push('html');
    } else if (rule instanceof CSSValidationRule) {
      applicableDomains.push('css');
    } else {
      // Default to all domains if not a specific rule type
      applicableDomains.push(...this.dopAdapters.keys());
    }
    
    // Update each applicable adapter
    for (const domain of applicableDomains) {
      const adapter = this.dopAdapters.get(domain);
      if (adapter) {
        // If adapter supports rule registration
        if ('registerRule' in adapter) {
          (adapter as any).registerRule(rule);
        }
      }
    }
  }
  
  /**
   * Creates and registers a DOP adapter for a specific domain
   * 
   * @param domain The domain this adapter applies to (e.g., "html", "css")
   * @param dataModel Optional data model to use
   * @param behaviorModel Optional behavior model to use
   * @returns The created DOP adapter
   */
  public createAdapter<T extends ValidationDataModelImpl & DataModel<T>, R>(
    domain: string,
    dataModel?: T,
    behaviorModel?: BehaviorModel<T, R>
  ): DOPAdapter<T, R> {
    // Use provided models or create new ones
    const actualDataModel = dataModel || new ValidationDataModelImpl([]) as unknown as T;
    const actualBehaviorModel = behaviorModel || new ValidationBehaviorModelImpl() as unknown as BehaviorModel<T, R>;
    
    // Create the adapter
    const adapter = new class extends BaseDOPAdapter<T, R> {
      public override clearCache(): void {
        // Implementation provided if needed
      }
    }(actualDataModel, actualBehaviorModel);
    
    // Register the adapter
    this.dopAdapters.set(domain.toLowerCase(), adapter);
    
    return adapter;
  }
  
  /**
   * Gets a DOP adapter for a specific domain
   * 
   * @param domain The domain to get the adapter for
   * @returns The DOP adapter or undefined if not found
   */
  public getAdapter<T extends ValidationDataModelImpl & DataModel<T>, R>(domain: string): DOPAdapter<T, R> | undefined {
    return this.dopAdapters.get(domain.toLowerCase()) as DOPAdapter<T, R> | undefined;
  }
  
  /**
   * Validates a node against registered rules for a specific domain
   * 
   * @param domain The domain to validate against (e.g., "html", "css")
   * @param node The node to validate
   * @returns Validation result
   */
  public validate(domain: string, node: any): ValidationResult<any> {
    const adapter = this.getAdapter(domain);
    if (!adapter) {
      throw new Error(`No adapter registered for domain: ${domain}`);
    }
    
    try {
      // Reset state machine to initial state
      this.stateMachine.reset();
      
      // Transition to validating state
      this.stateMachine.transition('begin_validation');
      
      // Check cache if minimization is enabled
      if (this.minimizationEnabled) {
        const cacheKey = this.generateCacheKey(domain, node);
        const cachedResult = this.validationCache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }
      
      // Create execution trace if tracing is enabled
      let trace: ExecutionTrace | undefined;
      if (this.tracingEnabled) {
        trace = ExecutionTrace.start(`${domain}-validation`, { 
          nodeType: node.type || typeof node,
          domain
        });
      }
      
      // Apply the adapter
      const result = adapter.adapt(node) as ValidationResult<any>;
      
      // Transition to completed state
      this.stateMachine.transition('validation_complete');
      
      // Complete trace if enabled
      if (trace) {
        trace.end({ 
          isValid: result.isValid,
          errorCount: result.errors.length
        });
        result.addTrace(trace);
      }
      
      // Cache the result if minimization is enabled
      if (this.minimizationEnabled) {
        const cacheKey = this.generateCacheKey(domain, node);
        this.validationCache.set(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      // Handle validation errors
      const validationError = new ValidationSystemError(
        'VALIDATION_ERROR',
        error instanceof Error ? error.message : String(error),
        this.componentName,
        ValidationPhase.NODE_TRAVERSAL,
        { domain, nodeType: node?.type || 'unknown' },
        error instanceof Error ? error.stack || '' : '',
        false
      );
      
      // Handle the error
      this.errorHandler.handleError(validationError);
      
      // Transition to error state
      this.stateMachine.transition('validation_error');
      
      // Return an invalid result
      return ValidationResult.createInvalid(validationError, node);
    }
  }
  
  /**
   * Applies a behavior chain to a data model for a specific domain
   * 
   * @param domain The domain to apply the chain for
   * @param data The data to process
   * @returns The processed data
   */
  public applyBehaviorChain<T extends ValidationDataModelImpl>(domain: string, data: T): T {
    const chain = this.getBehaviorChain(domain);
    if (!chain) {
      throw new Error(`No behavior chain registered for domain: ${domain}`);
    }
    
    return chain.process(data);
  }
  

  /**
   * Compares functional and OOP implementations for a specific domain
   * 
   * @param domain The domain to compare implementations for
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  public compareImplementations(
    domain: string,
    funcImpl: any,
    oopImpl: any
  ): ImplementationComparisonResult {
    const adapter = this.getAdapter(domain);
    if (!adapter) {
      throw new Error(`No adapter registered for domain: ${domain}`);
    }
    
    // Create test data based on the inputs
    const testData = this.createTestData(funcImpl, oopImpl);
    
    try {
      // Process test data with the functional implementation
      const funcResult = adapter.adapt(testData) as ValidationResult<any>;
      
      // Process OOP implementation
      const oopResult = adapter.adapt(oopImpl) as ValidationResult<any>;
      
      // Check if adapter has compareWith method
      if ('compareWith' in adapter) {
        return (adapter as any).compareWith(funcResult, oopResult);
      }
      
      // Fallback to using the ValidationResult.compareWith method
      return funcResult.compareWith(oopResult);
    } catch (error) {
      // Handle comparison errors
      const validationError = new ValidationSystemError(
        'IMPLEMENTATION_COMPARISON_ERROR',
        error instanceof Error ? error.message : String(error),
        this.componentName,
        ValidationPhase.RESULT_AGGREGATION,
        {
          domain,
          functionalType: typeof funcImpl,
          oopType: typeof oopImpl
        },
        error instanceof Error ? error.stack || '' : '',
        false
      );
      
      // Handle the error
      this.errorHandler.handleError(validationError);
      
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
   * Creates test data for implementation comparison
   * 
   * @public
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Test data
   */
  public createTestData(funcImpl: any, oopImpl: any): any {
    // Create representative test data for both implementations
    // This should be customized based on the specific domain
    return {
      type: 'test-node',
      children: [],
      properties: {
        functional: typeof funcImpl === 'function' ? funcImpl.name || 'anonymous' : typeof funcImpl,
        oop: typeof oopImpl === 'object' ? oopImpl.constructor?.name || 'anonymous' : typeof oopImpl
      }
    };
  }
  
  /**
   * Generates a cache key for a domain and node
   * 
   * @public
   * @param domain The domain
   * @param node The node
   * @returns Cache key string
   */
  public generateCacheKey(domain: string, node: any): string {
    // Create a unique key based on domain and node properties
    const nodeType = node.type || typeof node;
    const nodeId = node.id || '';
    
    // Use a simple hash function for the node structure
    let nodeHash = '';
    try {
      // Stringify relevant parts of the node, avoiding circular structures
      const nodeStr = JSON.stringify({
        type: nodeType,
        id: nodeId,
        properties: node.properties || {}
      });
      
      // Simple hash calculation
      let hash = 0;
      for (let i = 0; i < nodeStr.length; i++) {
        hash = ((hash << 5) - hash) + nodeStr.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      nodeHash = hash.toString(16);
    } catch (e) {
      // Fallback if JSON stringify fails
      nodeHash = `${nodeType}-${nodeId}-${Date.now()}`;
    }
    
    return `${domain.toLowerCase()}-${nodeType}-${nodeHash}`;
  }
  
  /**
   * Clears all caches
   * 
   * @returns This integrator for method chaining
   */
  public clearCache(): DOPValidationIntegrator {
    this.validationCache.clear();
    
    // Clear adapter caches
    for (const adapter of this.dopAdapters.values()) {
      if ('clearCache' in adapter) {
        adapter.clearCache();
      }
    }
    
    return this;
  }
  
  /**
   * Optimizes the integration components using state minimization
   * 
   * @returns This integrator for method chaining
   */
  public optimize(): DOPValidationIntegrator {
    if (this.minimizationEnabled) {
      // Minimize the state machine
      this.stateMachine.minimize();
      
      // Apply other optimizations
      // ...
    }
    
    return this;
  }
  
  /**
   * Creates a domain-specific DOPValidationIntegrator
   * 
   * @param domain The domain to create an integrator for (e.g., "html", "css")
   * @param options Additional configuration options
   * @returns A new DOPValidationIntegrator instance
   */
  public static createForDomain(domain: string, options: DOPValidationIntegratorOptions = {}): DOPValidationIntegrator {
    const integrator = new DOPValidationIntegrator({
      ...options,
      componentName: options.componentName || `${domain}Validator`
    });
    
    // Create a domain-specific adapter
    integrator.createAdapter(domain);
    
    // Create a domain-specific behavior chain
    integrator.registerBehaviorChain(domain, new BehaviorChain());
    
    return integrator;
  }
}