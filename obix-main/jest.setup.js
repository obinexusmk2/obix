/**
 * Jest setup file for OBIX framework testing
 * 
 * This file configures the test environment, sets up global mocks,
 * and provides utility functions for testing the state minimization
 * and AST optimization features.
 */

// Increase Jest timeout for complex tests related to state machine minimization
jest.setTimeout(30000);

// Mock the global performance API if not available (Node.js environment)
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  };
}

// Set up custom matchers for OBIX-specific testing
expect.extend({
  // Matcher for validation results
  toBeValidResult(received) {
    const pass = received.isValid === true && received.errors.length === 0;
    return {
      pass,
      message: () => 
        pass ? 'Expected result to not be valid' : 'Expected result to be valid'
    };
  },
  
  // Matcher for invalid validation results
  toBeInvalidResult(received) {
    const pass = received.isValid === false && received.errors.length > 0;
    return {
      pass,
      message: () => 
        pass ? 'Expected result to not be invalid' : 'Expected result to be invalid'
    };
  },
  
  // Matcher for validation result details
  toMatchValidationResult(received, expected) {
    const isValid = received.isValid === expected.isValid;
    const errorCount = (received.errors?.length || 0) === (expected.errors?.length || 0);
    
    return {
      pass: isValid && errorCount,
      message: () => `Expected validation ${isValid ? 'success' : 'failure'} with ${expected.errors?.length || 0} errors`
    };
  },
  
  // Matcher for state equivalence
  toHaveEquivalentState(received, expected) {
    // Convert both states to JSON strings for deep comparison
    const receivedJson = JSON.stringify(received);
    const expectedJson = JSON.stringify(expected);
    const pass = receivedJson === expectedJson;
    
    return {
      pass,
      message: () => 
        pass ? 
          `Expected states to not be equivalent:\n${receivedJson}\nand\n${expectedJson}` : 
          `Expected states to be equivalent:\n${receivedJson}\nand\n${expectedJson}`
    };
  },
  
  // Matcher for state machines
  toHaveMinimizedStates(received, expectedReduction) {
    const metrics = received.minimize();
    const actual = metrics.originalStateCount > 0 ? 
      metrics.minimizedStateCount / metrics.originalStateCount : 
      1;
    
    const pass = actual <= expectedReduction;
    
    return {
      pass,
      message: () => 
        pass ? 
          `Expected state reduction not to be ${expectedReduction} or less, but got ${actual}` : 
          `Expected state reduction to be ${expectedReduction} or less, but got ${actual}`
    };
  }
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock any global objects needed for tests
global.createTestDOPModel = (data) => {
  return {
    ...data,
    clone: () => ({ ...data }),
    toObject: () => ({ ...data }),
    getMinimizationSignature: () => JSON.stringify(data)
  };
};

// Handle uncaught promise rejections during tests
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION IN TEST:', reason);
});