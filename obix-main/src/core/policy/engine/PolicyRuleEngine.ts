/**
 * src/core/policy/engine/PolicyRuleEngine.ts
 * 
 * Engine for evaluating policy rules against the current execution environment.
 * Supports both class-based and functional programming paradigms through the DOP adapter.
 */

import { EnvironmentType, PolicyRule, PolicyResult } from '../types/PolicyTypes';
import { ValidationResult } from '@core/dop/validation/ValidationResult';
import { ValidationError } from '@core/validation/errors/ValidationError';
import { ErrorSeverity } from '@core/validation/errors/ValidationError';

/**
 * Engine for evaluating policy rules
 */
export class PolicyRuleEngine {
  /**
   * Evaluates a set of policy rules against the current environment
   * 
   * @param rules Policy rules to evaluate
   * @param environment Current execution environment
   * @param context Additional context for rule evaluation
   * @returns Policy evaluation result
   */
  public evaluateRules(
    rules: PolicyRule[],
    environment: EnvironmentType,
    context?: any
  ): PolicyResult {
    // Default to allowing if no rules are specified
    if (rules.length === 0) {
      return { allowed: true };
    }
    
    // Find the first rule that blocks the action
    for (const rule of rules) {
      const conditionMet = this.evaluateRuleCondition(rule, environment, context);
      
      if (!conditionMet) {
        return {
          allowed: false,
          reason: `Rule "${rule.id}" condition not met: ${rule.description}`,
          rule
        };
      }
    }
    
    // All rules passed
    return { allowed: true };
  }
  
  /**
   * Evaluates a single policy rule condition
   * 
   * @param rule Policy rule to evaluate
   * @param environment Current execution environment
   * @param context Additional context for rule evaluation
   * @returns True if the rule condition is met
   */
  private evaluateRuleCondition(
    rule: PolicyRule,
    environment: EnvironmentType,
    context?: any
  ): boolean {
    try {
      return rule.condition(environment, context);
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id}:`, error);
      // Default to blocking on evaluation error
      return false;
    }
  }
  
  /**
   * Creates a ValidationResult from a policy evaluation
   * 
   * @param result Policy evaluation result
   * @param data Data being validated
   * @returns ValidationResult compatible with DOP adapter
   */
  public createValidationResult<T>(
    result: PolicyResult,
    data: T
  ): ValidationResult<T> {
    const validationResult = new ValidationResult<T>(result.allowed, data);
    
    if (!result.allowed && result.reason) {
      validationResult.addError(new ValidationError({
        code: 'POLICY_VIOLATION',
        message: result.reason,
        source: result.rule?.id || 'PolicyEngine',
        severity: ErrorSeverity.ERROR
      }));
    }
    
    return validationResult;
  }
  
  /**
   * Optimizes the rule evaluation order for better performance
   * 
   * @param rules Rules to optimize
   * @returns Optimized rules array
   */
  public optimizeRules(rules: PolicyRule[]): PolicyRule[] {
    // Sort rules by complexity (ascending) to fail fast on simpler rules
    return [...rules].sort((a, b) => {
      // Calculate rule complexity based on condition function size
      const aComplexity = this.calculateRuleComplexity(a);
      const bComplexity = this.calculateRuleComplexity(b);
      
      return aComplexity - bComplexity;
    });
  }
  
  /**
   * Calculates rule complexity based on function size
   * 
   * @param rule Policy rule
   * @returns Complexity score
   */
  private calculateRuleComplexity(rule: PolicyRule): number {
    const fnString = rule.condition.toString();
    return fnString.length;
  }
  
  /**
   * Creates a composite rule from multiple rules
   * 
   * @param rules Rules to combine
   * @param id Composite rule ID
   * @param description Composite rule description
   * @returns Combined policy rule
   */
  public createCompositeRule(
    rules: PolicyRule[],
    id: string,
    description: string
  ): PolicyRule {
    return {
      id,
      description,
      // A composite rule passes only if all constituent rules pass
      condition: (env: EnvironmentType, context?: any) => {
        for (const rule of rules) {
          if (!this.evaluateRuleCondition(rule, env, context)) {
            return false;
          }
        }
        return true;
      },
      // Execute all rule actions in sequence
      action: () => {
        for (const rule of rules) {
          rule.action();
        }
      }
    };
  }
  
  /**
   * Creates an OR composite rule that passes if any constituent rule passes
   * 
   * @param rules Rules to combine with OR logic
   * @param id Composite rule ID
   * @param description Composite rule description
   * @returns OR composite policy rule
   */
  public createOrRule(
    rules: PolicyRule[],
    id: string,
    description: string
  ): PolicyRule {
    return {
      id,
      description,
      // An OR composite rule passes if any constituent rule passes
      condition: (env: EnvironmentType, context?: any) => {
        return rules.some(rule => this.evaluateRuleCondition(rule, env, context));
      },
      // Execute the action of the first passing rule
      action: () => {
        const passingRule = rules.find(rule => this.evaluateRuleCondition(rule, EnvironmentType.DEVELOPMENT));
        if (passingRule) {
          passingRule.action();
        }
      }
    };
  }
  
  /**
   * Validates a component's state transition against a policy
   * 
   * @param currentState Current component state
   * @param newState New state after transition
   * @param rules Policy rules to enforce
   * @param environment Current environment
   * @param context Additional context
   * @returns ValidationResult indicating if the transition is allowed
   */
  public validateStateTransition<S>(
    currentState: S,
    newState: S,
    rules: PolicyRule[],
    environment: EnvironmentType,
    context?: any
  ): ValidationResult<S> {
    const transitionContext = {
      ...context,
      currentState,
      newState,
      transition: {
        from: currentState,
        to: newState
      }
    };
    
    const result = this.evaluateRules(rules, environment, transitionContext);
    return this.createValidationResult(result, newState);
  }
}