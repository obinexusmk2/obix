/**
 * Jest setup file for OBIX unit tests
 * 
 * This file configures the test environment, sets up global mocks,
 * and provides utility functions for testing the DOP adapter.
 */

// Increase Jest timeout for complex tests
jest.setTimeout(30000);

// Common mocks for ValidationStateMachine used across multiple tests
jest.mock("../../src/core/dop/validation/ValidationStateMachine", () => {
  return {
    ValidationStateMachine: jest.fn().mockImplementation(() => ({
      reset: jest.fn(),
      transition: jest.fn(),
      getCurrentState: jest.fn().mockReturnValue({ id: 'test-state' }),
      addState: jest.fn(),
      addTransition: jest.fn(),
      minimize: jest.fn(),
      getOptimizationMetrics: jest.fn().mockReturnValue({
        originalStateCount: 10,
        minimizedStateCount: 5,
        optimizationRatio: 0.5
      })
    }))
  };
});

// Create stub for ValidationResults if needed
jest.mock("../../src/core/validation/core/ValidationStateMachine", () => {
  return require("../../src/core/dop/validation/ValidationStateMachine");
}, { virtual: true });

// Mock the global performance API for Node.js environment
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Import test utilities
const { setupCustomMatchers } = require('../utils/testHelpers');

// Setup custom matchers
setupCustomMatchers();

// Global test utilities for DOP adapter testing
global.createTestDOPModel = (data) => {
  return {
    ...data,
    clone: () => ({ ...data }),
    toObject: () => ({ ...data }),
    getMinimizationSignature: () => JSON.stringify(data)
  };
};

// Utility for creating ValidationResults in tests
global.createTestValidationResult = (isValid, data, errors = []) => {
  const result = {
    isValid,
    data,
    errors,
    warnings: [],
    merge: function(other) {
      this.isValid = this.isValid && other.isValid;
      this.errors = [...this.errors, ...other.errors];
      this.warnings = [...this.warnings, ...other.warnings];
      return this;
    },
    addError: function(error) {
      this.errors.push(error);
      this.isValid = false;
      return this;
    },
    addWarning: function(warning) {
      this.warnings.push(warning);
      return this;
    }
  };
  return result;
};

// Clear mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});