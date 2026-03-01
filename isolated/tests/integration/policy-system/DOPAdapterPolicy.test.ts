/**
 * tests/unit/core/policy/integration/DOPAdapterPolicy.test.ts
 * 
 * Integration tests for policy system with DOPAdapter.
 * Verifies policy enforcement for both functional and OOP components.
 */

import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';

// Import core components
import { DOPAdapter } from '@core/dop/adapter/DOPAdapter';
import { DataModel } from '@core/dop/data/BaseDataModel';
import { ValidationResult } from '@core/dop/validation/ValidationResult';
import { Component } from '@core/api/shared/components/ComponentInterface';
import { BaseComponent } from '@core/api/shared/oop/BaseComponent';
import { component } from '@core/api/functional/component';

// Import policy system
import { 
  policy, 
  DEVELOPMENT_ONLY, 
  PRODUCTION_BLOCKED,
  enhanceAdapterWithPolicy,
  EnvironmentManager,
  EnvironmentType,
  PolicyRule
} from '@core/policy';

// Define a simple state model for testing
interface CounterState extends DataModel<CounterState> {
  count: number;
}

// Test implementation of CounterState
class CounterStateImpl implements CounterState {
  count: number;
  
  constructor(count: number = 0) {
    this.count = count;
  }
  
  equals(other: CounterState): boolean {
    return this.count === other.count;
  }
}

describe('Policy Integration with DOP Adapter', () => {
  let envManager: EnvironmentManager;
  let consoleDebugStub: sinon.SinonStub;
  let consoleWarnStub: sinon.SinonStub;
  
  // Setup environment and console stubs
  beforeEach(() => {
    envManager = EnvironmentManager.getInstance();
    // Set development environment by default
    envManager.setEnvironment(EnvironmentType.DEVELOPMENT);
    
    // Stub console methods to verify policy logging
    consoleDebugStub = sinon.stub(console, 'debug');
    consoleWarnStub = sinon.stub(console, 'warn');
  });
  
  afterEach(() => {
    // Restore stubs
    consoleDebugStub.restore();
    consoleWarnStub.restore();
  });
  
  describe('Functional Component with Policy', () => {
    it('should allow operations in development environment', () => {
      // Create a functional counter component with policy
      const Counter = component({
        initialState: new CounterStateImpl(0),
        transitions: {
          increment: (state: CounterState) => new CounterStateImpl(state.count + 1),
          decrement: (state: CounterState) => new CounterStateImpl(state.count - 1)
        }
      });
      
      // Get the adapter directly for testing
      const adapter = (Counter as any).adapter;
      
      // Enhance the adapter with policy
      const policyEnhancedAdapter = enhanceAdapterWithPolicy(
        adapter,
        DEVELOPMENT_ONLY,
        { logViolations: true }
      );
      
      // Trigger a transition in development environment (should succeed)
      policyEnhancedAdapter.applyTransition('increment');
      
      // Verify the state change happened
      expect(policyEnhancedAdapter.getState().count).to.equal(1);
      
      // Verify policy was checked but not blocked
      expect(consoleDebugStub.calledWith(sinon.match(/Allowed execution/))).to.be.true;
      expect(consoleWarnStub.called).to.be.false;
    });
    
    it('should block operations in production environment', () => {
      // Set environment to production
      envManager.setEnvironment(EnvironmentType.PRODUCTION);
      
      // Create a functional counter component
      const Counter = component({
        initialState: new CounterStateImpl(0),
        transitions: {
          increment: (state: CounterState) => new CounterStateImpl(state.count + 1),
          decrement: (state: CounterState) => new CounterStateImpl(state.count - 1)
        }
      });
      
      // Get the adapter directly for testing
      const adapter = (Counter as any).adapter;
      
      // Enhance the adapter with policy
      const policyEnhancedAdapter = enhanceAdapterWithPolicy(
        adapter,
        DEVELOPMENT_ONLY,
        { logViolations: true }
      );
      
      // Trigger a transition in production environment (should be blocked)
      policyEnhancedAdapter.applyTransition('increment');
      
      // Verify the state change was blocked
      expect(policyEnhancedAdapter.getState().count).to.equal(0);
      
      // Verify policy blocked the operation
      expect(consoleDebugStub.calledWith(sinon.match(/Blocked /))).to.be.true;
      expect(consoleWarnStub.called).to.be.true;
      
      // Reset environment
      envManager.setEnvironment(EnvironmentType.DEVELOPMENT);
    });
  });
  
  describe('OOP Component with Policy', () => {
    it('should enforce policy on OOP component methods', () => {
      // Define an OOP component with policy-decorated methods
      class CounterComponent extends BaseComponent<CounterState> {
        initialState = new CounterStateImpl(0);
        
        @policy(DEVELOPMENT_ONLY)
        increment(state: CounterState): CounterState {
          return new CounterStateImpl(state.count + 1);
        }
        
        @policy(PRODUCTION_BLOCKED)
        decrement(state: CounterState): CounterState {
          return new CounterStateImpl(state.count - 1);
        }
        
        render(state: CounterState): string {
          return `Count: ${state.count}`;
        }
      }
      
      // Create the component
      const counter = new CounterComponent();
      
      // Test in development environment (should succeed)
      counter.increment(counter.initialState);
      
      // Verify policy was checked
      expect(consoleDebugStub.calledWith(sinon.match(/Allowed execution/))).to.be.true;
      
      // Change to production environment
      envManager.setEnvironment(EnvironmentType.PRODUCTION);
      
      // Reset console stubs
      consoleDebugStub.reset();
      consoleWarnStub.reset();
      
      // This should be blocked in production
      const result = counter.increment(counter.initialState);
      
      // Verify policy blocked the operation
      expect(consoleDebugStub.calledWith(sinon.match(/Blocked execution/))).to.be.true;
      
      // The method should return undefined when blocked
      expect(result).to.be.undefined;
      
      // Reset environment
      envManager.setEnvironment(EnvironmentType.DEVELOPMENT);
    });
  });
  
  describe('DOPAdapter Validation with Policy', () => {
    it('should integrate policies with validation', () => {
      // Create a DOPAdapter instance
      const adapter = new DOPAdapter<CounterState, string>(
        new CounterStateImpl(0),
        {
          process: (state: CounterState) => `Count: ${state.count}`,
          validate: (state: CounterState) => new ValidationResult<CounterState>(true, state),
          transition: (state: CounterState, event: string) => {
            if (event === 'increment') {
              return new CounterStateImpl(state.count + 1);
            } else if (event === 'decrement') {
              return new CounterStateImpl(state.count - 1);
            }
            return state;
          }
        }
      );
      
      // Create a custom policy rule for validation
      const customRule: PolicyRule = {
        id: 'max-counter-value',
        description: 'Counter value cannot exceed 5',
        condition: (env, context) => {
          if (context && context.state && typeof context.state.count === 'number') {
            return context.state.count <= 5;
          }
          return true;
        },
        action: () => console.debug('[Policy] Max counter value rule enforced')
      };
      
      // Enhance the adapter with the custom policy
      const policyEnhancedAdapter = enhanceAdapterWithPolicy(
        adapter,
        customRule,
        { logViolations: true }
      );
      
      // Initial validation should pass
      let validationResult = policyEnhancedAdapter.validate();
      expect(validationResult.isValid).to.be.true;
      
      // Increment counter to value 5
      for (let i = 0; i < 5; i++) {
        policyEnhancedAdapter.applyTransition('increment');
      }
      
      // Validation should still pass
      validationResult = policyEnhancedAdapter.validate();
      expect(validationResult.isValid).to.be.true;
      
      // Increment one more time to exceed limit
      policyEnhancedAdapter.applyTransition('increment');
      
      // Now validation should fail
      validationResult = policyEnhancedAdapter.validate();
      expect(validationResult.isValid).to.be.false;
      expect(validationResult.errors.length).to.be.greaterThan(0);
      expect(validationResult.errors[0].code).to.equal('POLICY_VIOLATION');
    });
  });
  
  describe('Policy system interaction with DOP pattern', () => {
    it('should maintain 1:1 correspondence between functional and OOP components', () => {
      // Define a custom policy rule
      const customRule: PolicyRule = {
        id: 'test-equivalence',
        description: 'Test rule for checking equivalence',
        condition: (env) => env === EnvironmentType.DEVELOPMENT,
        action: () => {}
      };
      
      // Create a functional component
      const FunctionalCounter = component({
        initialState: new CounterStateImpl(0),
        transitions: {
          increment: (state: CounterState) => new CounterStateImpl(state.count + 1),
          decrement: (state: CounterState) => new CounterStateImpl(state.count - 1)
        }
      });
      
      // Create an OOP component
      class OOPCounter extends BaseComponent<CounterState> {
        initialState = new CounterStateImpl(0);
        
        increment(state: CounterState): CounterState {
          return new CounterStateImpl(state.count + 1);
        }
        
        decrement(state: CounterState): CounterState {
          return new CounterStateImpl(state.count - 1);
        }
      }
      
      const oopCounter = new OOPCounter();
      
      // Get adapters from both components
      const functionalAdapter = (FunctionalCounter as any).adapter;
      const oopAdapter = (oopCounter as any).adapter;
      
      // Enhance both adapters with the same policy
      const enhancedFunctionalAdapter = enhanceAdapterWithPolicy(functionalAdapter, customRule);
      const enhancedOopAdapter = enhanceAdapterWithPolicy(oopAdapter, customRule);
      
      // Apply the same transitions to both components
      enhancedFunctionalAdapter.applyTransition('increment');
      enhancedOopAdapter.applyTransition('increment');
      
      // Both adapters should have the same state
      expect(enhancedFunctionalAdapter.getState().count).to.equal(1);
      expect(enhancedOopAdapter.getState().count).to.equal(1);
      
      // Change environment to production
      envManager.setEnvironment(EnvironmentType.PRODUCTION);
      
      // Apply more transitions (should be blocked for both)
      enhancedFunctionalAdapter.applyTransition('increment');
      enhancedOopAdapter.applyTransition('increment');
      
      // Both adapters should still have the same state
      expect(enhancedFunctionalAdapter.getState().count).to.equal(1);
      expect(enhancedOopAdapter.getState().count).to.equal(1);
      
      // Reset environment
      envManager.setEnvironment(EnvironmentType.DEVELOPMENT);
    });
  });
});