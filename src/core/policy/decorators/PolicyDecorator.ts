// src/core/policy/decorators/PolicyDecorator.ts
import { EnvironmentType, PolicyRule, PolicyOptions, PolicyResult } from '../types/PolicyTypes';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { PolicyRuleEngine } from '../engine/PolicyRuleEngine';

export function policy(rules: PolicyRule[] | PolicyRule, options: PolicyOptions = {}) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const ruleEngine = new PolicyRuleEngine();
      const envManager = EnvironmentManager.getInstance();
      const currentEnv = options.customEnvironment || envManager.getCurrentEnvironment();
      
      // Convert single rule to array for unified processing
      const ruleList = Array.isArray(rules) ? rules : [rules];
      
      // Evaluate policy rules
      const result = ruleEngine.evaluateRules(ruleList, currentEnv, this);
      
      if (result.allowed) {
        // Policy passed, execute original method
        console.log(`[OBIX Policy] Allowed execution of ${propertyKey} in ${currentEnv} environment`);
        return originalMethod.apply(this, args);
      } else {
        // Policy blocked, handle according to options
        console.log(`[OBIX Policy] Blocked execution of ${propertyKey} in ${currentEnv} environment: ${result.reason}`);
        
        if (options.logViolations) {
          console.warn(`[OBIX Policy Violation] ${result.reason}`);
        }
        
        if (options.throwOnViolation) {
          throw new Error(`Policy violation: ${result.reason}`);
        }
        
        // Return a no-op function or default value depending on context
        return undefined;
      }
    };
    
    return descriptor;
  };
}

// Function version for use with regular functions
export function policyFn(fn: Function, rules: PolicyRule[] | PolicyRule, options: PolicyOptions = {}) {
  return function(...args: any[]) {
    const ruleEngine = new PolicyRuleEngine();
    const envManager = EnvironmentManager.getInstance();
    const currentEnv = options.customEnvironment || envManager.getCurrentEnvironment();
    
    // Convert single rule to array for unified processing
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    // Evaluate policy rules
    const result = ruleEngine.evaluateRules(ruleList, currentEnv);
    
    if (result.allowed) {
      // Policy passed, execute original function
      console.log(`[OBIX Policy] Allowed execution of function in ${currentEnv} environment`);
      return fn(...args);
    } else {
      // Policy blocked, handle according to options
      console.log(`[OBIX Policy] Blocked execution of function in ${currentEnv} environment: ${result.reason}`);
      
      if (options.logViolations) {
        console.warn(`[OBIX Policy Violation] ${result.reason}`);
      }
      
      if (options.throwOnViolation) {
        throw new Error(`Policy violation: ${result.reason}`);
      }
      
      // Return a no-op function or default value
      return undefined;
    }
  };
}