// src/core/dop/PolicyAwareDOPAdapter.ts

import { DOPAdapter } from './DOPAdapter';
import { DataModel } from './BaseDataModel';
import { BehaviorModel } from './BehaviourModel';
import { enhanceAdapterWithPolicy } from '../policy/PolicyAdapter';
import { ValidationResult } from './ValidationResult';
import { ValidationErrorHandlingStrategy } from '../validation/errors/ValidationErrorHandlingStrategies';

/**
 * Policy configuration interface
 */
export interface PolicyConfig {
  [methodName: string]: {
    [environment: string]: {
      prevent?: boolean;
      log?: boolean;
      audit?: boolean;
      validateBefore?: boolean;
      validateAfter?: boolean;
    }
  }
}

/**
 * Creates a DOP Adapter with policy and validation awareness
 * 
 * @template T The data model type
 * @template R The result type
 */
export class PolicyAwareDOPAdapter<T extends DataModel<T>, R> extends DOPAdapter<T, R> {
  private policies: PolicyConfig;
  private validationStrategy: ValidationErrorHandlingStrategy;
  
  /**
   * Creates a new policy-aware DOP adapter
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   * @param policies Policy configuration
   * @param validationStrategy Strategy for handling validation errors
   */
  constructor(
    dataModel: T,
    behaviorModel: BehaviorModel<T, R>,
    policies: PolicyConfig = {},
    validationStrategy: ValidationErrorHandlingStrategy = ValidationErrorHandlingStrategy.THROW_ERROR
  ) {
    super(dataModel, behaviorModel);
    this.policies = policies;
    this.validationStrategy = validationStrategy;
    
    // Enhance this adapter with policies
    return enhanceAdapterWithPolicy(this, policies) as PolicyAwareDOPAdapter<T, R>;
  }
  
  /**
   * Override adapt method to add validation before and after
   * 
   * @param data The data to adapt
   * @returns Adaptation result
   */
  public override adapt(data: T): R {
    // Pre-validation if enabled in policy
    if (this.shouldValidate('adapt', 'before')) {
      const validationResult = this.validateData(data);
      if (!validationResult.isValid) {
        this.handleValidationError(validationResult);
      }
    }
    
    // Perform adaptation
    const result = super.adapt(data);
    
    // Post-validation if enabled in policy
    if (this.shouldValidate('adapt', 'after')) {
      const validationResult = this.validateResult(result);
      if (!validationResult.isValid) {
        this.handleValidationError(validationResult);
      }
    }
    
    return result;
  }
  
  /**
   * Check if validation should be performed
   * 
   * @param methodName Method being called
   * @param phase 'before' or 'after'
   * @returns Whether validation should be performed
   */
  private shouldValidate(methodName: string, phase: 'before' | 'after'): boolean {
    const env = process.env.NODE_ENV || 'development';
    const methodPolicy = this.policies[methodName];
    
    if (!methodPolicy || !methodPolicy[env]) {
      return false;
    }
    
    return phase === 'before' 
      ? !!methodPolicy[env].validateBefore
      : !!methodPolicy[env].validateAfter;
  }
  
  /**
   * Validate input data
   * 
   * @param data Data to validate
   * @returns Validation result
   */
  private validateData(data: T): ValidationResult<T> {
    // Implementation depends on your validation system
    // This is a placeholder
    return new ValidationResult<T>(true, data);
  }
  
  /**
   * Validate output result
   * 
   * @param result Result to validate
   * @returns Validation result
   */
  private validateResult(result: R): ValidationResult<R> {
    // Implementation depends on your validation system
    // This is a placeholder
    return new ValidationResult<R>(true, result);
  }
  
  /**
   * Handle validation errors according to strategy
   * 
   * @param validationResult Validation result
   */
  private handleValidationError<V>(validationResult: ValidationResult<V>): void {
    switch (this.validationStrategy) {
      case ValidationErrorHandlingStrategy.THROW_ERROR:
        throw new Error(`Validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`);
      
      case ValidationErrorHandlingStrategy.LOG_ERROR:
        console.error('Validation errors:', validationResult.errors);
        break;
        
      case ValidationErrorHandlingStrategy.SILENT:
        // Do nothing
        break;
    }
  }
}