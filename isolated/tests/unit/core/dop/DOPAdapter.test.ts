// tests/unit/core/dop/DOPAdapter.test.ts

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DOPAdapter } from '../../../../src/core/dop/adapter/DOPAdapter';
import { ValidationErrorHandlingStrategies } from '../../../../src/core/dop/validation/ValidationErrorHandlingStrategies';
import { StateType } from '../../../../src/core/dop/data/StateType';

/**
 * Test suite for the DOP (Data-Oriented Programming) Adapter
 * 
 * This tests the core capabilities that ensure perfect 1:1 correspondence
 * between functional and object-oriented programming paradigms, following
 * Nnamdi Okpala's pattern.
 */
describe('DOP Adapter', () => {
  // Test adapter creation and configuration
  describe('Initialization', () => {
    test('creates a DOP adapter with default configuration', () => {
      const adapter = new DOPAdapter();
      
      expect(adapter).toBeDefined();
      expect(adapter.getMode()).toBe('auto');
      expect(adapter.isValidationEnabled()).toBe(true);
    });
    
    test('creates a DOP adapter with custom configuration', () => {
      const adapter = new DOPAdapter({
        mode: 'functional',
        enableValidation: false,
        strictMode: true
      });
      
      expect(adapter.getMode()).toBe('functional');
      expect(adapter.isValidationEnabled()).toBe(false);
      expect(adapter.isStrictMode()).toBe(true);
    });
    
    test('allows changing configuration after initialization', () => {
      const adapter = new DOPAdapter({ mode: 'oop' });
      expect(adapter.getMode()).toBe('oop');
      
      adapter.setMode('functional');
      expect(adapter.getMode()).toBe('functional');
      
      adapter.setValidationEnabled(false);
      expect(adapter.isValidationEnabled()).toBe(false);
    });
  });
  
  // Test functional to OOP transformation
  describe('Functional to OOP Transformation', () => {
    let adapter: DOPAdapter;
    
    // Sample functional component
    const counterFunctional = {
      initialState: { count: 0 },
      transitions: {
        increment: (state: { count: number }) => ({ count: state.count + 1 }),
        decrement: (state: { count: number }) => ({ count: state.count - 1 })
      },
      render: (state: { count: number }) => `Count: ${state.count}`
    };
    
    beforeEach(() => {
      adapter = new DOPAdapter({ mode: 'auto' });
    });
    
    test('transforms functional component to OOP class', () => {
      // Transform the functional component to OOP
      const CounterClass = adapter.transformToClass(counterFunctional, 'Counter');
      
      // Instantiate the class
      const counterInstance = new CounterClass();
      
      // Verify structure and behavior
      expect(counterInstance.initialState).toEqual({ count: 0 });
      expect(typeof counterInstance.increment).toBe('function');
      expect(typeof counterInstance.decrement).toBe('function');
      expect(typeof counterInstance.render).toBe('function');
      
      // Test behavior
      expect(counterInstance.render()).toBe('Count: 0');
      counterInstance.increment();
      expect(counterInstance.render()).toBe('Count: 1');
      counterInstance.decrement();
      expect(counterInstance.render()).toBe('Count: 0');
    });
    
    test('handles methods with additional arguments', () => {
      // Functional component with method taking additional arguments
      const incrementByFunctional = {
        initialState: { count: 0 },
        transitions: {
          incrementBy: (state: { count: number }, amount: number) => 
            ({ count: state.count + amount })
        },
        render: (state: { count: number }) => `Count: ${state.count}`
      };
      
      // Transform to OOP
      const IncrementByClass = adapter.transformToClass(incrementByFunctional, 'IncrementBy');
      const instance = new IncrementByClass();
      
      // Test method with arguments
      expect(instance.render()).toBe('Count: 0');
      instance.incrementBy(5);
      expect(instance.render()).toBe('Count: 5');
      instance.incrementBy(10);
      expect(instance.render()).toBe('Count: 15');
    });
    
    test('handles nested state correctly', () => {
      // Functional component with nested state
      const nestedStateFunctional = {
        initialState: { 
          user: { 
            name: 'John',
            preferences: {
              theme: 'dark',
              notifications: true
            }
          } 
        },
        transitions: {
          toggleTheme: (state: any) => ({
            ...state,
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                theme: state.user.preferences.theme === 'dark' ? 'light' : 'dark'
              }
            }
          })
        }
      };
      
      // Transform to OOP
      const NestedStateClass = adapter.transformToClass(nestedStateFunctional, 'NestedState');
      const instance = new NestedStateClass();
      
      // Test state mutations maintain immutability
      const initialState = JSON.parse(JSON.stringify(instance.state));
      
      instance.toggleTheme();
      expect(instance.state.user.preferences.theme).toBe('light');
      
      instance.toggleTheme();
      expect(instance.state.user.preferences.theme).toBe('dark');
      
      // Original state should not have been mutated
      expect(initialState).not.toBe(instance.state);
      expect(initialState.user.preferences.theme).toBe('dark');
    });
  });
  
  // Test OOP to functional transformation
  describe('OOP to Functional Transformation', () => {
    let adapter: DOPAdapter;
    
    // Sample OOP class component
    class CounterComponent {
      initialState = { count: 0 };
      state = this.initialState;
      
      increment() {
        this.state = { count: this.state.count + 1 };
        return this.state;
      }
      
      decrement() {
        this.state = { count: this.state.count - 1 };
        return this.state;
      }
      
      render() {
        return `Count: ${this.state.count}`;
      }
    }
    
    beforeEach(() => {
      adapter = new DOPAdapter({ mode: 'auto' });
    });
    
    test('transforms OOP class to functional component', () => {
      // Transform the class to functional
      const counterFunctional = adapter.transformToFunctional(CounterComponent);
      
      // Verify structure
      expect(counterFunctional.initialState).toEqual({ count: 0 });
      expect(typeof counterFunctional.transitions.increment).toBe('function');
      expect(typeof counterFunctional.transitions.decrement).toBe('function');
      expect(typeof counterFunctional.render).toBe('function');
      
      // Create state for testing
      let state = counterFunctional.initialState;
      
      // Test behavior
      expect(counterFunctional.render(state)).toBe('Count: 0');
      
      state = counterFunctional.transitions.increment(state);
      expect(state.count).toBe(1);
      expect(counterFunctional.render(state)).toBe('Count: 1');
      
      state = counterFunctional.transitions.decrement(state);
      expect(state.count).toBe(0);
      expect(counterFunctional.render(state)).toBe('Count: 0');
    });
    
    test('handles methods with additional arguments', () => {
      // OOP class with methods taking additional arguments
      class IncrementByComponent {
        initialState = { count: 0 };
        state = this.initialState;
        
        incrementBy(amount: number) {
          this.state = { count: this.state.count + amount };
          return this.state;
        }
        
        render() {
          return `Count: ${this.state.count}`;
        }
      }
      
      // Transform to functional
      const incrementByFunctional = adapter.transformToFunctional(IncrementByComponent);
      
      // Create state for testing
      let state = incrementByFunctional.initialState;
      
      // Test method with arguments
      expect(incrementByFunctional.render(state)).toBe('Count: 0');
      
      state = incrementByFunctional.transitions.incrementBy(state, 5);
      expect(state.count).toBe(5);
      
      state = incrementByFunctional.transitions.incrementBy(state, 10);
      expect(state.count).toBe(15);
    });
    
    test('transforms private methods correctly', () => {
      // OOP class with private methods
      class ComponentWithPrivate {
        initialState = { count: 0 };
        state = this.initialState;
        
        increment() {
          this.state = { count: this.state.count + 1 };
          return this.state;
        }
        
        // Private method (indicated with _)
        _double() {
          this.state = { count: this.state.count * 2 };
          return this.state;
        }
        
        // Method that uses private method
        incrementAndDouble() {
          this.increment();
          this._double();
          return this.state;
        }
      }
      
      // Transform to functional with preservePrivateMethods option
      const functionalWithPrivate = adapter.transformToFunctional(ComponentWithPrivate, {
        preservePrivateMethods: true
      });
      
      // Create state for testing
      let state = functionalWithPrivate.initialState;
      
      // Test public method that uses private functionality
      state = functionalWithPrivate.transitions.incrementAndDouble(state);
      expect(state.count).toBe(2); // 0 + 1, then * 2
      
      // Private method should also be accessible for testing
      expect(functionalWithPrivate.transitions._double).toBeDefined();
      state = functionalWithPrivate.transitions._double(state);
      expect(state.count).toBe(4); // 2 * 2
    });
  });
  
  // Test validation functionality
  describe('Validation', () => {
    let adapter: DOPAdapter;
    
    // Define a state type for validation
    const counterStateType = new StateType('Counter', {
      count: 'number'
    });
    
    beforeEach(() => {
      adapter = new DOPAdapter({
        enableValidation: true,
        strictMode: true
      });
    });
    
    test('validates state against type definition', () => {
      // Mock console.error to detect validation warnings
      const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create valid state
      const validState = { count: 5 };
      const isValid = adapter.validateState(validState, counterStateType);
      expect(isValid).toBe(true);
      expect(consoleErrorMock).not.toHaveBeenCalled();
      
      // Create invalid state
      const invalidState = { count: '5' }; // string instead of number
      const isInvalid = adapter.validateState(invalidState, counterStateType);
      
      expect(isInvalid).toBe(false);
      expect(consoleErrorMock).toHaveBeenCalled();
      
      // Cleanup
      consoleErrorMock.mockRestore();
    });
    
    test('validates transitions to ensure they produce valid state', () => {
      // Functional component with validation
      const counterFunctional = {
        initialState: { count: 0 },
        stateType: counterStateType,
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 }),
          double: (state: { count: number }) => ({ count: state.count * 2 }),
          // This transition produces invalid state
          makeInvalid: (state: { count: number }) => ({ count: 'invalid' as any })
        }
      };
      
      // Transform to OOP class with validation
      const CounterClass = adapter.transformToClass(counterFunctional, 'Counter');
      const instance = new CounterClass();
      
      // Valid transitions should work
      instance.increment();
      expect(instance.state.count).toBe(1);
      
      instance.double();
      expect(instance.state.count).toBe(2);
      
      // Invalid transition should throw in strict mode
      expect(() => {
        instance.makeInvalid();
      }).toThrow();
    });
    
    test('handles validation errors according to strategy', () => {
      // Create adapters with different validation strategies
      const warnAdapter = new DOPAdapter({
        enableValidation: true,
        strictMode: false,
        validationErrorHandling: ValidationErrorHandlingStrategies.WARN
      });
      
      const ignoreAdapter = new DOPAdapter({
        enableValidation: true,
        strictMode: false,
        validationErrorHandling: ValidationErrorHandlingStrategies.IGNORE
      });
      
      // Mock console.warn to detect validation warnings
      const consoleWarnMock = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      // Test warn strategy
      const invalidState = { count: '5' }; // string instead of number
      const warnResult = warnAdapter.validateState(invalidState, counterStateType);
      
      expect(warnResult).toBe(false);
      expect(consoleWarnMock).toHaveBeenCalled();
      
      // Reset mock
      consoleWarnMock.mockClear();
      
      // Test ignore strategy
      const ignoreResult = ignoreAdapter.validateState(invalidState, counterStateType);
      
      expect(ignoreResult).toBe(false);
      expect(consoleWarnMock).not.toHaveBeenCalled();
      
      // Cleanup
      consoleWarnMock.mockRestore();
    });
  });
  
  // Test paradigm detection and auto mode
  describe('Paradigm Detection', () => {
    let adapter: DOPAdapter;
    
    beforeEach(() => {
      adapter = new DOPAdapter({ mode: 'auto' });
    });
    
    test('detects functional components correctly', () => {
      // Functional component
      const functional = {
        initialState: { count: 0 },
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 })
        }
      };
      
      expect(adapter.isFunctionalComponent(functional)).toBe(true);
      expect(adapter.isClassComponent(functional)).toBe(false);
    });
    
    test('detects class components correctly', () => {
      // Class component
      class Counter {
        initialState = { count: 0 };
        state = this.initialState;
        
        increment() {
          this.state = { count: this.state.count + 1 };
          return this.state;
        }
      }
      
      expect(adapter.isClassComponent(Counter)).toBe(true);
      expect(adapter.isFunctionalComponent(Counter)).toBe(false);
      
      // Instance of class
      const instance = new Counter();
      expect(adapter.isClassComponent(instance)).toBe(true);
      expect(adapter.isFunctionalComponent(instance)).toBe(false);
    });
    
    test('automatically detects and transforms components in auto mode', () => {
      // Functional component
      const functional = {
        initialState: { count: 0 },
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 })
        }
      };
      
      // Class component
      class Counter {
        initialState = { count: 0 };
        state = this.initialState;
        
        increment() {
          this.state = { count: this.state.count + 1 };
          return this.state;
        }
      }
      
      // Transform functional to uniform internal representation
      const functionalTransformed = adapter.createUniformRepresentation(functional);
      expect(functionalTransformed.paradigm).toBe('functional');
      expect(functionalTransformed.component).toBeDefined();
      
      // Transform class to uniform internal representation
      const classTransformed = adapter.createUniformRepresentation(Counter);
      expect(classTransformed.paradigm).toBe('oop');
      expect(classTransformed.component).toBeDefined();
    });
  });
  
  // Test two-way paradigm transformations with equivalence validation
  describe('Two-Way Transformations with Validation', () => {
    let adapter: DOPAdapter;
    
    beforeEach(() => {
      adapter = new DOPAdapter({
        enableValidation: true,
        strictMode: true
      });
    });
    
    test('functional component remains equivalent after round-trip transformation', () => {
      // Original functional component
      const original = {
        initialState: { count: 0 },
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 }),
          decrement: (state: { count: number }) => ({ count: state.count - 1 })
        },
        render: (state: { count: number }) => `Count: ${state.count}`
      };
      
      // Transform to OOP class and back to functional
      const intermediateClass = adapter.transformToClass(original, 'Counter');
      const roundTrip = adapter.transformToFunctional(intermediateClass);
      
      // Test structure
      expect(Object.keys(roundTrip.transitions)).toEqual(Object.keys(original.transitions));
      expect(roundTrip.initialState).toEqual(original.initialState);
      
      // Test behavior with the same inputs should yield same outputs
      const state1 = { count: 0 };
      const state2 = { count: 5 };
      
      // Test increment
      expect(roundTrip.transitions.increment(state1)).toEqual(original.transitions.increment(state1));
      expect(roundTrip.transitions.increment(state2)).toEqual(original.transitions.increment(state2));
      
      // Test decrement
      expect(roundTrip.transitions.decrement(state1)).toEqual(original.transitions.decrement(state1));
      expect(roundTrip.transitions.decrement(state2)).toEqual(original.transitions.decrement(state2));
      
      // Test render
      expect(roundTrip.render(state1)).toEqual(original.render(state1));
      expect(roundTrip.render(state2)).toEqual(original.render(state2));
    });
    
    test('OOP component remains equivalent after round-trip transformation', () => {
      // Original OOP class
      class Original {
        initialState = { count: 0 };
        state = this.initialState;
        
        increment() {
          this.state = { count: this.state.count + 1 };
          return this.state;
        }
        
        decrement() {
          this.state = { count: this.state.count - 1 };
          return this.state;
        }
        
        render() {
          return `Count: ${this.state.count}`;
        }
      }
      
      // Create instance for testing
      const originalInstance = new Original();
      
      // Transform to functional and back to OOP class
      const intermediateFunctional = adapter.transformToFunctional(Original);
      const RoundTrip = adapter.transformToClass(intermediateFunctional, 'RoundTrip');
      
      // Create instance of round-trip class
      const roundTripInstance = new RoundTrip();
      
      // Test initial state
      expect(roundTripInstance.initialState).toEqual(originalInstance.initialState);
      
      // Test behavior step by step
      originalInstance.increment();
      roundTripInstance.increment();
      expect(roundTripInstance.state).toEqual(originalInstance.state);
      
      originalInstance.increment();
      roundTripInstance.increment();
      expect(roundTripInstance.state).toEqual(originalInstance.state);
      
      originalInstance.decrement();
      roundTripInstance.decrement();
      expect(roundTripInstance.state).toEqual(originalInstance.state);
      
      // Test render
      expect(roundTripInstance.render()).toEqual(originalInstance.render());
    });
    
    test('detects and reports implementation divergence', () => {
      // Create a functional component with validation
      const counterFunctional = {
        initialState: { count: 0 },
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 })
        }
      };
      
      // Transform to OOP class
      const CounterClass = adapter.transformToClass(counterFunctional, 'Counter');
      
      // Modify class to cause divergence
      CounterClass.prototype.increment = function() {
        this.state = { count: this.state.count + 2 }; // +2 instead of +1
        return this.state;
      };
      
      // Validate equivalence - should detect the divergence
      const validationResult = adapter.validateEquivalence(
        counterFunctional,
        CounterClass
      );
      
      expect(validationResult.isEquivalent).toBe(false);
      expect(validationResult.divergencePoints.length).toBeGreaterThan(0);
      expect(validationResult.divergencePoints[0].method).toBe('increment');
    });
  });
  
  // Test memory optimization and performance
  describe('Memory Optimization', () => {
    let adapter: DOPAdapter;
    
    beforeEach(() => {
      adapter = new DOPAdapter({
        optimizeMemory: true
      });
    });
    
    test('uses shared internal representation for equivalent components', () => {
      // Create two equivalent functional components
      const component1 = {
        initialState: { count: 0 },
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 })
        }
      };
      
      const component2 = {
        initialState: { count: 0 },
        transitions: {
          increment: (state: { count: number }) => ({ count: state.count + 1 })
        }
      };
      
      // Transform both to uniform representation
      const uniform1 = adapter.createUniformRepresentation(component1);
      const uniform2 = adapter.createUniformRepresentation(component2);
      
      // Access internal state of adapter (for testing purposes)
      const internalCache = (adapter as any)._sharedRepresentationCache;
      
      // Verify cache is used for equivalent components
      expect(internalCache.size).toBeGreaterThan(0);
      
      // Generate signatures to verify they're the same
      const signature1 = (adapter as any)._generateComponentSignature(component1);
      const signature2 = (adapter as any)._generateComponentSignature(component2);
      
      expect(signature1).toBe(signature2);
      expect(internalCache.has(signature1)).toBe(true);
    });
    
    test('memory usage is reduced with optimization enabled', () => {
      // Create adapter without optimization for comparison
      const unoptimizedAdapter = new DOPAdapter({
        optimizeMemory: false
      });
      
      // Create many equivalent components with different structures
      const components = Array.from({ length: 100 }, (_, i) => ({
        initialState: { count: 0 },
        transitions: {
          [`increment${i}`]: (state: { count: number }) => ({ count: state.count + 1 })
        }
      }));
      
      // Function to measure memory usage
      function getMemoryUsage(adapter: DOPAdapter, components: any[]): number {
        // Process all components
        for (const component of components) {
          adapter.createUniformRepresentation(component);
        }
        
        // Access internal state for memory measurement
        const cache = (adapter as any)._sharedRepresentationCache;
        const representations = (adapter as any)._uniformRepresentations;
        
        // For testing purposes, we use object key counts as a proxy for memory usage
        return cache.size + representations.size;
      }
      
      const unoptimizedMemory = getMemoryUsage(unoptimizedAdapter, components);
      const optimizedMemory = getMemoryUsage(adapter, components);
      
      // Optimized should use less memory
      expect(optimizedMemory).toBeLessThan(unoptimizedMemory);
    });
  });
});