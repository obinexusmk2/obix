/**
 * src/core/policy/decorators/FunctionWrapper.ts
 * 
 * Specialized wrappers for applying policies to functions and components
 * with support for the DOP adapter pattern.
 */

import { PolicyRule, PolicyOptions } from '../types/PolicyTypes';
import { applyPolicy } from './PolicyDecorator';
import { Component } from '@core/api/shared/components/ComponentInterface';
import { DOPAdapter } from '@core/dop/adapter/DOPAdapter';

/**
 * Wraps a component method with policy enforcement
 * 
 * @param component Component instance
 * @param methodName Method name to apply policy to
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Component with protected method
 */
export function protectComponentMethod<C extends Component>(
  component: C,
  methodName: keyof C & string,
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): C {
  const originalMethod = component[methodName] as Function;
  
  if (typeof originalMethod !== 'function') {
    throw new Error(`Method ${methodName} is not a function on component`);
  }
  
  // Apply policy to the method
  (component[methodName] as any) = applyPolicy(
    originalMethod.bind(component),
    rules,
    options
  );
  
  return component;
}

/**
 * Creates a component factory that applies policies to all components created
 * 
 * @param componentFactory Original component factory function
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Enhanced component factory with policy enforcement
 */
export function createPolicyEnforcedFactory<T extends (...args: any[]) => Component>(
  componentFactory: T,
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    // Create the component using the original factory
    const component = componentFactory(...args);
    
    // Apply policy to the component's trigger method
    if (component.trigger) {
      component.trigger = applyPolicy(
        component.trigger.bind(component),
        rules,
        options
      );
    }
    
    // Apply policy to the component's update method
    if (component.update) {
      component.update = applyPolicy(
        component.update.bind(component),
        rules,
        options
      );
    }
    
    return component;
  }) as T;
}

/**
 * Creates a component adapter factory with policy enforcement
 * 
 * @param adapterFactory Original adapter factory function
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Enhanced adapter factory with policy enforcement
 */
export function createPolicyEnforcedAdapterFactory<T extends (...args: any[]) => DOPAdapter<any, any>>(
  adapterFactory: T,
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    // Create the adapter using the original factory
    const adapter = adapterFactory(...args);
    
    // Wrap the adapter's applyTransition method
    const originalApplyTransition = adapter.applyTransition;
    adapter.applyTransition = applyPolicy(
      originalApplyTransition.bind(adapter),
      rules,
      options
    );
    
    return adapter;
  }) as T;
}

/**
 * Creates a policy enforced transition function for components
 * 
 * @param transitionFn Original transition function
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Policy enforced transition function
 */
export function createPolicyEnforcedTransition<S, P = any>(
  transitionFn: (state: S, payload?: P) => S,
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): (state: S, payload?: P) => S {
  return applyPolicy(transitionFn, rules, options);
}

/**
 * HOC for applying policies to functional components with DOP adapter integration
 * 
 * @param Component Original component
 * @param rules Policy rules to enforce
 * @param options Additional policy options
 * @returns Enhanced component with policy enforcement
 */
export function withDOPPolicy<C extends Component>(
  Component: { new (...args: any[]): C },
  rules: PolicyRule[] | PolicyRule,
  options: PolicyOptions = {}
): typeof Component {
  return class PolicyEnforcedComponent extends Component {
    constructor(...args: any[]) {
      super(...args);
      
      // Enhance the adapter if it exists
      if ((this as any).adapter) {
        const adapter = (this as any).adapter;
        const originalApplyTransition = adapter.applyTransition;
        
        adapter.applyTransition = applyPolicy(
          originalApplyTransition.bind(adapter),
          rules,
          options
        );
      }
      
      // Apply policy to the trigger method
      if (this.trigger) {
        const originalTrigger = this.trigger;
        this.trigger = applyPolicy(
          originalTrigger.bind(this),
          rules,
          options
        );
      }
    }
  };
}