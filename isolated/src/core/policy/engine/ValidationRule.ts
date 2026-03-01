/**
 * src/core/policy/engine/ValidationRule.ts
 * 
 * Adapter for policy rules to integrate with the OBIX validation system.
 * Allows policy rules to be used as validation rules in the DOP adapter.
 */

import { ValidationRule as BaseValidationRule } from '@core/validation/rules/ValidationRule';
import { ValidationResult } from '@core/dop/validation/ValidationResult';
import { ErrorSeverity } from '@core/validation/errors/ValidationError';
import { ValidationError } from '@core/validation/errors/ValidationError';
import { PolicyRule } from '../types/PolicyTypes';
import { EnvironmentManager } from '../environment/EnvironmentManager';

/**
 * Adapter for policy rules to be used as validation rules
 */
export class PolicyValidationRule implements BaseValidationRule {
  /**
   * Rule ID
   */
  public readonly id: string;
  
  /**
   * Rule description
   */
  public readonly description: string;
  
  /**
   * Error severity for validation failures
   */
  public readonly severity: ErrorSeverity;
  
  /**
   * Compatibility markers for rule compatibility checking
   */
  public readonly compatibilityMarkers: string[];
  
  /**
   * Rule dependencies
   */
  public readonly dependencies: string[];
  
  /**
   * Original policy rule
   */
  private policyRule: PolicyRule;
  
  /**
   * Environment manager instance
   */
  private environmentManager: EnvironmentManager;
  
  /**
   * Creates a new policy validation rule
   * 
   * @param policyRule Original policy rule
   * @param severity Error severity for validation failures
   * @param compatibilityMarkers Compatibility markers for rule compatibility
   * @param dependencies Rule dependencies
   */
  constructor(
    policyRule: PolicyRule,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = ['policy'],
    dependencies: string[] = []
  ) {
    this.policyRule = policyRule;
    this.id = `policy:${policyRule.id}`;
    this.description = policyRule.description;
    this.severity = severity;
    this.compatibilityMarkers = compatibilityMarkers;
    this.dependencies = dependencies;
    this.environmentManager = EnvironmentManager.getInstance();
  }
  
  /**
   * Gets the rule ID
   * 
   * @returns Rule ID
   */
  public getId(): string {
    return this.id;
  }
  
  /**
   * Gets rule dependencies
   * 
   * @returns Array of dependency rule IDs
   */
  public getDependencies(): string[] {
    return this.dependencies;
    }

    /**
     * Gets the rule description
     * 
     * @returns Rule description
     **/
    public getDescription(): string {
      return this.description;
    }
  
    /**
     * Validates data against the policy rule
     * 
     * @param data Data to validate
     * @returns ValidationResult indicating if the data meets policy requirements
     */
    public validate<T>(data: T): ValidationResult<T> {
      const ruleEngine = new PolicyRuleEngine();
      const currentEnv = this.environmentManager.getCurrentEnvironment();
      
      const result = ruleEngine.evaluateRules([this.policyRule], currentEnv, { data });
      return ruleEngine.createValidationResult(result, data);
    }
}

