/**
 * ValidationEngineConfiguration.ts
 * 
 * Configuration class for the ValidationEngine that defines the structure
 * and settings for creating consistent validation engines.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationRule } from "../../rules/ValidationRule";


/**
 * Configuration for creating ValidationEngine instances
 */
export class ValidationEngineConfiguration {
  /**
   * Component name for error tracking
   */
  public readonly componentName: string;
  
  /**
   * Whether to enable state minimization
   */
  public readonly enableMinimization: boolean;
  
  /**
   * Whether to enable execution tracing
   */
  public readonly enableTracing: boolean;
  
  /**
   * Whether to automatically validate implementations
   */
  public readonly autoValidateImplementations: boolean;
  
  /**
   * Error handling strategy
   */
  public readonly errorHandlingStrategy: string;
  
  /**
   * Whether to optimize rule execution
   */
  public readonly optimizeRuleExecution: boolean;
  
  /**
   * Maximum number of rules to apply per node
   */
  public readonly maxRulesPerNode: number;
  
  /**
   * Predefined validation rules
   */
  public readonly rules: ValidationRule[];
  
  /**
   * Creates a new ValidationEngineConfiguration
   */
  constructor(params: {
    componentName?: string;
    enableMinimization?: boolean;
    enableTracing?: boolean;
    autoValidateImplementations?: boolean;
    errorHandlingStrategy?: string;
    optimizeRuleExecution?: boolean;
    maxRulesPerNode?: number;
    rules?: ValidationRule[];
  } = {}) {
    this.componentName = params.componentName || 'ValidationEngine';
    this.enableMinimization = params.enableMinimization !== false;
    this.enableTracing = params.enableTracing === true;
    this.autoValidateImplementations = params.autoValidateImplementations !== false;
    this.errorHandlingStrategy = params.errorHandlingStrategy || 'standard';
    this.optimizeRuleExecution = params.optimizeRuleExecution !== false;
    this.maxRulesPerNode = params.maxRulesPerNode || 100;
    this.rules = params.rules || [];
  }
  
  /**
   * Creates a configuration for HTML validation
   * 
   * @param rules Optional HTML validation rules
   * @returns A new configuration for HTML validation
   */
  public static forHTML(rules: ValidationRule[] = []): ValidationEngineConfiguration {
    return new ValidationEngineConfiguration({
      componentName: 'HTMLValidationEngine',
      enableMinimization: true,
      enableTracing: false,
      autoValidateImplementations: true,
      errorHandlingStrategy: 'standard',
      optimizeRuleExecution: true,
      maxRulesPerNode: 100,
      rules
    });
  }
  
  /**
   * Creates a configuration for CSS validation
   * 
   * @param rules Optional CSS validation rules
   * @returns A new configuration for CSS validation
   */
  public static forCSS(rules: ValidationRule[] = []): ValidationEngineConfiguration {
    return new ValidationEngineConfiguration({
      componentName: 'CSSValidationEngine',
      enableMinimization: true,
      enableTracing: false,
      autoValidateImplementations: true,
      errorHandlingStrategy: 'standard',
      optimizeRuleExecution: true,
      maxRulesPerNode: 100,
      rules
    });
  }
  
  /**
   * Creates a configuration for JavaScript validation
   * 
   * @param rules Optional JavaScript validation rules
   * @returns A new configuration for JavaScript validation
   */
  public static forJavaScript(rules: ValidationRule[] = []): ValidationEngineConfiguration {
    return new ValidationEngineConfiguration({
      componentName: 'JSValidationEngine',
      enableMinimization: true,
      enableTracing: false,
      autoValidateImplementations: true,
      errorHandlingStrategy: 'standard',
      optimizeRuleExecution: true,
      maxRulesPerNode: 100,
      rules
    });
  }
  
  /**
   * Creates a configuration for debugging
   * 
   * @param rules Optional validation rules
   * @returns A new configuration for debugging
   */
  public static forDebugging(rules: ValidationRule[] = []): ValidationEngineConfiguration {
    return new ValidationEngineConfiguration({
      componentName: 'DebugValidationEngine',
      enableMinimization: false,
      enableTracing: true,
      autoValidateImplementations: true,
      errorHandlingStrategy: 'verbose',
      optimizeRuleExecution: false,
      maxRulesPerNode: 100,
      rules
    });
  }
  
  /**
   * Adds rules to the configuration
   * 
   * @param rules The rules to add
   * @returns A new configuration with the added rules
   */
  public withRules(rules: ValidationRule[]): ValidationEngineConfiguration {
    return new ValidationEngineConfiguration({
      componentName: this.componentName,
      enableMinimization: this.enableMinimization,
      enableTracing: this.enableTracing,
      autoValidateImplementations: this.autoValidateImplementations,
      errorHandlingStrategy: this.errorHandlingStrategy,
      optimizeRuleExecution: this.optimizeRuleExecution,
      maxRulesPerNode: this.maxRulesPerNode,
      rules: [...this.rules, ...rules]
    });
  }
}