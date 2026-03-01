/**
 * DOP Testing Utilities
 * 
 * Provides utilities for testing Data-Oriented Programming components
 * of the OBIX framework. Contains mock factory methods, test helpers,
 * and common test fixtures for DOP modules.
 * 
 * @module tests/utils/dop
 */

const createMockDataModel = require('./mockDataModel');
const createMockBehaviorModel = require('./mockBehaviorModel');
const createMockDOPAdapter = require('./mockDOPAdapter');
const validationFixtures = require('./validationFixtures');

/**
 * Creates a complete test implementation for comparing functional and OOP paradigms
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Complete test implementation with functional, OOP, and expected outputs
 */
function createTestImplementation(options = {}) {
  return {
    functional: {
      initialState: options.initialState || { count: 0 },
      transitions: {
        increment: (state) => ({ count: state.count + 1 }),
        decrement: (state) => ({ count: state.count - 1 }),
        reset: () => ({ count: 0 }),
        ...(options.functionalTransitions || {})
      }
    },
    oop: {
      initialState: options.initialState || { count: 0 },
      increment(state) {
        return { count: state.count + 1 };
      },
      decrement(state) {
        return { count: state.count - 1 };
      },
      reset() {
        return { count: 0 };
      },
      ...(options.oopMethods || {})
    },
    expected: {
      equivalent: options.expectEquivalent !== false,
      transitions: {
        increment: { count: 1 },
        decrement: { count: -1 },
        reset: { count: 0 },
        ...(options.expectedTransitions || {})
      },
      ...(options.expectedResults || {})
    }
  };
}

/**
 * Helper to test DOP adapter behavior with common scenarios
 * 
 * @param {Object} adapter - The adapter to test
 * @param {Object} dataModel - The data model to use
 * @param {Object} behaviorModel - The behavior model to use
 * @returns {Object} Test results containing validation results and adaptation results
 */
function testDOPAdapterBehavior(adapter, dataModel, behaviorModel) {
  // Basic validation check
  const validationResult = adapter.validate();
  
  // Adaptation test
  const adaptResult = adapter.adapt(dataModel);
  
  // Execute transitions if behavior model is provided
  let transitionResults = {};
  if (behaviorModel) {
    // Execute each transition and collect results
    const transitions = Object.keys(behaviorModel.getTransitions());
    transitionResults = transitions.reduce((results, transition) => {
      results[transition] = adapter.executeTransition(transition, { ...dataModel.getData() });
      return results;
    }, {});
  }
  
  return {
    validationResult,
    adaptResult,
    transitionResults
  };
}

/**
 * Creates a test expectation for DOP adapter validation
 * 
 * @param {Object} adapter - The adapter to validate
 * @param {boolean} expectedValid - Whether validation should pass
 * @param {number} expectedErrorCount - Expected number of errors
 * @returns {void}
 */
function expectValidDOPAdapter(adapter, expectedValid = true, expectedErrorCount = 0) {
  const validationResult = adapter.validate();
  expect(validationResult.isValid).toBe(expectedValid);
  expect(validationResult.errors.length).toBe(expectedErrorCount);
}

// Export all DOP testing utilities
module.exports = {
  createMockDataModel,
  createMockBehaviorModel,
  createMockDOPAdapter,
  createTestImplementation,
  testDOPAdapterBehavior,
  expectValidDOPAdapter,
  validationFixtures
};