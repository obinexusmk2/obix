/**
 * src/core/policy/decorators/PolicyDecorator.ts
 * 
 * Implements policy decorators for method-level security enforcement
 * with support for both OOP class methods and functional components.
 * Integrates with the OBIX DOP adapter pattern for paradigm-neutral policy enforcement.
 */

import {  PolicyRule, PolicyOptions, ComponentType } from '../types/PolicyTypes';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { PolicyRuleEngine } from '../engine/PolicyRuleEngine';

/**
 * Method decorator for enforcing policies on class methods
 * 
 * @param rules Single policy rule or array of rules to enforce
 * @param options Additional policy enforcement options
 * @returns Method decorator function
 * 
 * @example
 * ```typescript
 * class SensitiveComponent extends BaseComponent {
 *   initialState = { userData: null };
 *   
 *   @policy(DEVELOPMENT_ONLY)
 *   loadDevData() {
 *     // Development-only operation
 *   }
 *   
 *   @policy([PII_PROTECTION, LOG_ACCESS])
 *   accessUserData(userId: string) {
 *     // Sensitive operation
 *   }
 * }
 * ```
 */
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
      const result = ruleEngine.evaluateRules(ruleList, currentEnv, {
        instance: this,
        method: propertyKey,
        arguments: args
      });
      
      if (result.allowed) {
        // Policy passed, execute original method
        console.debug(`[OBIX Policy] Allowed execution of ${propertyKey} in ${currentEnv} environment`);
        return originalMethod.apply(this, args);
      } else {
        // Policy blocked, handle according to options
        console.debug(`[OBIX Policy] Blocked execution of ${propertyKey} in ${currentEnv} environment: ${result.reason}`);
        
        if (options.logViolations) {
          console.warn(`[OBIX Policy Violation] ${result.reason}`);
        }
        
        if (options.throwOnViolation) {
          throw new Error(`Policy violation: ${result.reason}`);
        }
        
        // Return a safe default value based on method return type
        return options.fallbackValue !== undefined ? options.fallbackValue : undefined;
      }
    };
    
    return descriptor;
  };
}

/**
 * HOC (Higher-Order Component) for wrapping functional components with policy enforcement
 * 
 * @param Component The component to wrap
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Wrapped component with policy enforcement
 * 
 * @example
 * ```typescript
 * const ProtectedCounter = withPolicy(Counter, PRODUCTION_BLOCKED);
 * ```
 */
export function withPolicy<P, S>(
  Component: ComponentType<P>,
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): ComponentType<P> {
  const ProtectedComponent = function(props: P) {
    const ruleEngine = new PolicyRuleEngine();
    const envManager = EnvironmentManager.getInstance();
    const currentEnv = options.customEnvironment || envManager.getCurrentEnvironment();
    
    // Convert single rule to array for unified processing
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    // Evaluate policy rules
    const result = ruleEngine.evaluateRules(ruleList, currentEnv, {
      component: Component.name || 'FunctionalComponent',
      props
    });
    
    if (result.allowed) {
      // Policy passed, render original component
      console.debug(`[OBIX Policy] Allowed rendering of component in ${currentEnv} environment`);
      return new Component(props);
    } else {
      // Policy blocked, handle according to options
      console.debug(`[OBIX Policy] Blocked rendering of component in ${currentEnv} environment: ${result.reason}`);
      
      if (options.logViolations) {
        console.warn(`[OBIX Policy Violation] ${result.reason}`);
      }
      
      if (options.throwOnViolation) {
        throw new Error(`Policy violation: ${result.reason}`);
      }
      
      // Return fallback or null
      return options.fallbackComponent ? 
        options.fallbackComponent : 
        null;
    }
  };
  
  return ProtectedComponent as unknown as ComponentType<P>;
}

/**
 * Function wrapper for applying policies to regular functions
 * 
 * @param fn Function to wrap with policy
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Function wrapped with policy enforcement
 * 
 * @example
 * ```typescript
 * const safeDelete = applyPolicy(deleteResource, ADMIN_ONLY);
 * ```
 */
export function applyPolicy<T extends (...args: any[]) => any>(
  fn: T,
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): T {
  return function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const ruleEngine = new PolicyRuleEngine();
    const envManager = EnvironmentManager.getInstance();
    const currentEnv = options.customEnvironment || envManager.getCurrentEnvironment();
    
    // Convert single rule to array for unified processing
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    // Evaluate policy rules
    const result = ruleEngine.evaluateRules(ruleList, currentEnv, {
      function: fn.name || 'anonymous',
      arguments: args
    });
    
    if (result.allowed) {
      // Policy passed, execute original function
      console.debug(`[OBIX Policy] Allowed execution of function in ${currentEnv} environment`);
      return fn.apply(this, args);
    } else {
      // Policy blocked, handle according to options
      console.debug(`[OBIX Policy] Blocked execution of function in ${currentEnv} environment: ${result.reason}`);
      
      if (options.logViolations) {
        console.warn(`[OBIX Policy Violation] ${result.reason}`);
      }
      
      if (options.throwOnViolation) {
        throw new Error(`Policy violation: ${result.reason}`);
      }
      
      // Return a safe default value
      return options.fallbackValue as ReturnType<T>;
    }
  } as T;
}

/**
 * DOP adapter integration for policy enforcement
 * This allows policy enforcement at the adapter level for both functional and OOP components
 * 
 * @param adapter DOP adapter instance
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Enhanced adapter with policy enforcement
 */
export function enhanceAdapterWithPolicy<S, E extends string>(
  adapter: any, // Should be DOPAdapter<S, E> but keeping as any for flexibility
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): any {
  const originalApplyTransition = adapter.applyTransition;
  const originalValidate = adapter.validate;
  
  // Wrap the applyTransition method with policy enforcement
  adapter.applyTransition = function(event: E, payload?: any) {
    const ruleEngine = new PolicyRuleEngine();
    const envManager = EnvironmentManager.getInstance();
    const currentEnv = options.customEnvironment || envManager.getCurrentEnvironment();
    
    // Convert single rule to array for unified processing
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    // Evaluate policy rules
    const result = ruleEngine.evaluateRules(ruleList, currentEnv, {
      adapter: adapter,
      event: event,
      payload: payload,
      state: adapter.getState()
    });
    
    if (result.allowed) {
      // Policy passed, execute original transition
      return originalApplyTransition.call(adapter, event, payload);
    } else {
      // Policy blocked, handle according to options
      console.debug(`[OBIX Policy] Blocked transition ${String(event)} in ${currentEnv} environment: ${result.reason}`);
      
      if (options.logViolations) {
        console.warn(`[OBIX Policy Violation] ${result.reason}`);
      }
      
      if (options.throwOnViolation) {
        throw new Error(`Policy violation: ${result.reason}`);
      }
      
      // Do not execute the transition
      return adapter.getState();
    }
  };
  
  // Enhance validation to include policy checks
  adapter.validate = function() {
    // First, run the original validation
    const originalResult = originalValidate.call(adapter);
    
    // Then check the policy
    const ruleEngine = new PolicyRuleEngine();
    const envManager = EnvironmentManager.getInstance();
    const currentEnv = options.customEnvironment || envManager.getCurrentEnvironment();
    
    // Convert single rule to array for unified processing
    const ruleList = Array.isArray(rules) ? rules : [rules];
    
    // Evaluate policy rules for the current state
    const policyResult = ruleEngine.evaluateRules(ruleList, currentEnv, {
      adapter: adapter,
      state: adapter.getState()
    });
    
    // Merge validation results
    if (!policyResult.allowed) {
      originalResult.isValid = false;
      originalResult.errors.push({
        code: 'POLICY_VIOLATION',
        message: policyResult.reason || 'Policy violation',
        source: 'PolicyEnforcement'
      });
    }
    
    return originalResult;
  };
  
  return adapter;
}