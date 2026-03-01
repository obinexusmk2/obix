/**
 * ValidationDOPAdapter.ts
 * 
 * Concrete implementation of the DOP (Data-Oriented Programming) Adapter pattern
 * for validation operations in the OBIX framework. This component implements the 
 * DOPAdapter interface to provide validation capabilities across both functional 
 * and object-oriented programming paradigms.
 * 
 * This implementation focuses on the state minimization technology developed by 
 * Nnamdi Okpala to optimize validation operations and ensure perfect 1:1 correspondence
 * between functional and OOP implementations.
 * 
 * Copyright © 2025 OBINexus Computing
 */
import { ExecutionTrace } from "../validation/errors/ExecutionTrace";
import { ValidationRule } from "../validation/rules/ValidationRule";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";
import { ValidationBehaviorModelImpl } from "./ValidationBehaviorModelImpl";
import { ValidationResult } from "./ValidationResult";
import { ValidationStateMachine } from "./ValidationStateMachine";


/**
 * Concrete implementation of the DOPAdapter for validation operations
 */
export class ValidationDOPAdapter extends BaseDOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>> {
  /**
   * Whether validation is running
   */
  public validating: boolean = false;
  
  /**
   * Whether to enable tracing
   */
  public tracingEnabled: boolean = false;
  
  /**
   * Creates a new ValidationDOPAdapter
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   * @param tracingEnabled Whether to enable tracing
   */
  constructor(
    dataModel: ValidationDataModelImpl = new ValidationDataModelImpl([]),
    behaviorModel: ValidationBehaviorModelImpl = new ValidationBehaviorModelImpl(), // Ensure this class is correctly imported or defined
    tracingEnabled: boolean = false
  ) {
    super(dataModel, behaviorModel);
    this.tracingEnabled = tracingEnabled;
  }
  
  /**
   * Applies validation behavior to the data model
   * 
   * @param data The data model to validate
   * @returns Validation result
   */
  public override adapt(data: ValidationDataModelImpl): ValidationResult<ValidationDataModelImpl> {
    try {
      // Set validating flag
      this.validating = true;
      
      // Start trace if enabled
      let trace: ExecutionTrace | undefined;
      if (this.tracingEnabled) {
        trace = ExecutionTrace.start('validation-adapter', { 
          dataModelRules: data.getRules().length,
          dataModelErrors: data.getErrors().length
        });
      }
      
      // Check cache if enabled
      if (this.isCachingEnabled) {
        const cacheKey = this.generateCacheKey(data);
        
        if (this.resultCache.has(cacheKey)) {
          return this.resultCache.get(cacheKey) as ValidationResult<ValidationDataModelImpl>;
        }
      }
      
      // Apply behavior
      const result = this.behaviorModel.process(data);
      
      // Cache result if enabled
      if (this.isCachingEnabled) {
        const cacheKey = this.generateCacheKey(data);
        this.resultCache.set(cacheKey, result);
      }
      
      // Complete trace if enabled
      if (trace) {
        trace.end({ 
          isValid: result.isValid,
          errors: result.errors.length
        });
        
        // Add trace to result
        result.addTrace(trace);
      }
      
      return result;
    } finally {
      // Clear validating flag
      this.validating = false;
    }
  }
  
  /**
   * Registers a validation rule
   * 
   * @param rule The rule to register
   * @returns This adapter for method chaining
   */
  public registerRule(rule: ValidationRule): ValidationDOPAdapter {
    // Add rule to data model
    const updatedDataModel = this.dataModel.addRule(rule);
    this.dataModel = updatedDataModel;
    return this;
  }
  
  /**
   * Enables or disables tracing
   * 
   * @param enabled Whether tracing should be enabled
   * @returns This adapter for method chaining
   */
  public setTracingEnabled(enabled: boolean): ValidationDOPAdapter {
    this.tracingEnabled = enabled;
    return this;
  }
  
  /**
   * Checks if tracing is enabled
   * 
   * @returns True if tracing is enabled
   */
  public isTracingEnabled(): boolean {
    return this.tracingEnabled;
  }
  
  /**
   * Checks if validation is currently running
   * 
   * @returns True if validation is running
   */
  public isValidating(): boolean {
    return this.validating;
  }
  
  /**
   * Clears the result cache
   */
  public override clearCache(): void {
    this.resultCache.clear();
  }
  
  /**
   * Override cache key generation to include rule information
   * 
   * @param data The data model to generate a key for
   * @returns Cache key
   */
  public override generateCacheKey(data: ValidationDataModelImpl): string {
    // Include rule IDs in the cache key
    const ruleIds = data.getRules().map(rule => rule.id).sort().join(',');
    const baseSignature = data.getMinimizationSignature();
    
    return `${baseSignature}|rules:${ruleIds}`;
  }
  
  /**
   * Factory method to create a validation DOP adapter for functional programming
   * 
   * @param rules Initial validation rules
   * @param minimizationEnabled Whether to enable state minimization
   * @param tracingEnabled Whether to enable tracing
   * @returns A new ValidationDOPAdapter instance
   */
  public static createFunctional(
    rules: ValidationRule[] = [],
    minimizationEnabled: boolean = true,
    tracingEnabled: boolean = false
  ): ValidationDOPAdapter {
    const dataModel = new ValidationDataModelImpl(rules);
    const behaviorModel = new ValidationBehaviorModelImpl(
      new ValidationStateMachine(),
      'functional-validation-behavior',
      'Functional validation behavior model for the OBIX framework',
      minimizationEnabled
    );
    
    return new ValidationDOPAdapter(dataModel, behaviorModel, tracingEnabled);
  }
  
  /**
   * Factory method to create a validation DOP adapter for OOP
   * 
   * @param rules Initial validation rules
   * @param minimizationEnabled Whether to enable state minimization
   * @param tracingEnabled Whether to enable tracing
   * @returns A new ValidationDOPAdapter instance
   */
  public static createOOP(
    rules: ValidationRule[] = [],
    minimizationEnabled: boolean = true,
    tracingEnabled: boolean = false
  ): ValidationDOPAdapter {
    const dataModel = new ValidationDataModelImpl(rules);
    const behaviorModel = new ValidationBehaviorModelImpl(
      new ValidationStateMachine(),
      'oop-validation-behavior',
      'OOP validation behavior model for the OBIX framework',
      minimizationEnabled
    );
    
    return new ValidationDOPAdapter(dataModel, behaviorModel, tracingEnabled);
  }
}

/**
 * Factory for creating validation DOP adapters
 */
export class ValidationDOPAdapterFactory {
  /**
   * Creates a validation DOP adapter for functional programming
   * 
   * @param rules Initial validation rules
   * @param minimizationEnabled Whether to enable state minimization
   * @param tracingEnabled Whether to enable tracing
   * @returns A new ValidationDOPAdapter instance
   */
  public static createFunctional(
    rules: ValidationRule[] = [],
    minimizationEnabled: boolean = true,
    tracingEnabled: boolean = false
  ): DOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>> {
    return ValidationDOPAdapter.createFunctional(rules, minimizationEnabled, tracingEnabled);
  }
  
  /**
   * Creates a validation DOP adapter for OOP
   * 
   * @param rules Initial validation rules
   * @param minimizationEnabled Whether to enable state minimization
   * @param tracingEnabled Whether to enable tracing
   * @returns A new ValidationDOPAdapter instance
   */
  public static createOOP(
    rules: ValidationRule[] = [],
    minimizationEnabled: boolean = true,
    tracingEnabled: boolean = false
  ): DOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>> {
    return ValidationDOPAdapter.createOOP(rules, minimizationEnabled, tracingEnabled);
  }
  
  /**
   * Creates a validation DOP adapter factory that can create adapters for both paradigms
   * 
   * @returns A new DualParadigmValidationAdapterFactory instance
   */
  public static createFactory(): DualParadigmValidationAdapterFactory {
    return new DualParadigmValidationAdapterFactory();
  }
}

/**
 * Dual-paradigm factory for validation DOP adapters
 */
export class DualParadigmValidationAdapterFactory extends DualParadigmAdapterFactory<
  ValidationDataModelImpl,
  ValidationResult<ValidationDataModelImpl>
> {
  /**
   * Creates an adapter from a functional configuration
   * 
   * @param config The functional configuration
   * @returns A validation DOP adapter
   */
  public override createFromFunctional(config: Record<string, any>): DOPAdapter<
    ValidationDataModelImpl,
    ValidationResult<ValidationDataModelImpl>
  > {
    // Extract configuration
    const rules = config['rules'] || [];
    const minimizationEnabled = config['minimizationEnabled'] !== false;
    const tracingEnabled = config['tracingEnabled'] === true;
    
    return ValidationDOPAdapter.createFunctional(rules, minimizationEnabled, tracingEnabled);
  }
  
  /**
   * Creates an adapter from an OOP component
   * 
   * @param component The OOP component
   * @returns A validation DOP adapter
   */
  public override createFromOOP(component: any): DOPAdapter<
    ValidationDataModelImpl,
    ValidationResult<ValidationDataModelImpl>
  > {
    // Extract configuration from the component
    const rules = component.rules || [];
    const minimizationEnabled = component.minimizationEnabled !== false;
    const tracingEnabled = component.tracingEnabled === true;
    
    return ValidationDOPAdapter.createOOP(rules, minimizationEnabled, tracingEnabled);
  }
}