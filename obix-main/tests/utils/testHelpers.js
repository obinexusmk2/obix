/**
 * Test Helper Utilities for OBIX Testing
 * 
 * Provides common utilities for test customization and setup.
 */

/**
 * Configure Jest specifically for OBIX
 */
function configureJestForOBIX() {
  // Set default timeout to 10 seconds
  jest.setTimeout(10000);
  
  // Set silent console during tests
  global.console = {
    ...console,
    // Uncomment to disable console.log during tests
    // log: jest.fn(),
    error: jest.spyOn(console, 'error').mockImplementation(),
    warn: jest.spyOn(console, 'warn').mockImplementation(),
  };
}

/**
 * Setup custom Jest matchers for OBIX tests
 */
function setupCustomMatchers() {
  expect.extend({
    toMatchDOP(received, expected) {
      const pass = this.equals(received, expected);
      if (pass) {
        return {
          message: () => `Expected ${received} not to match DOP pattern ${expected}`,
          pass: true
        };
      } else {
        return {
          message: () => `Expected ${received} to match DOP pattern ${expected}`,
          pass: false
        };
      }
    },
    
    toBeValidDOPModel(received) {
      const pass = typeof received === 'object' && 
                  received !== null && 
                  typeof received.validate === 'function';
      
      if (pass) {
        return {
          message: () => `Expected ${received} not to be a valid DOP model`,
          pass: true
        };
      } else {
        return {
          message: () => `Expected ${received} to be a valid DOP model`,
          pass: false
        };
      }
    }
  });
}

module.exports = {
  configureJestForOBIX,
  setupCustomMatchers
};
