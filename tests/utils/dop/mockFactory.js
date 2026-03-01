/**
 * Mock Factory for OBIX Testing
 * 
 * Centralized factory for creating mock objects used in OBIX framework testing.
 * 
 * @module tests/utils/mockFactory
 */

// Import specific mock factories
const { createMockDataModel, createMockBehaviorModel, createMockDOPAdapter } = require('./dop');

/**
 * Creates a mock validation result
 * 
 * @param {boolean} isValid - Whether the validation passed
 * @param {Array} errors - Validation errors
 * @param {Array} warnings - Validation warnings
 * @param {Object} options - Additional options
 * @returns {Object} Mock validation result
 */
function createMockValidationResult(isValid = true, errors = [], warnings = [], options = {}) {
  return {
    isValid,
    errors: [...errors],
    warnings: [...warnings],
    component: options.component || 'Test',
    data: options.data || null,
    timestamp: options.timestamp || Date.now(),
    metadata: options.metadata || {},
    
    // Methods
    merge: jest.fn(function(other) {
      this.isValid = this.isValid && other.isValid;
      this.errors = [...this.errors, ...other.errors];
      this.warnings = [...this.warnings, ...other.warnings];
      return this;
    }),
    
    addError: jest.fn(function(error) {
      this.errors.push(error);
      this.isValid = false;
      return this;
    }),
    
    addWarning: jest.fn(function(warning) {
      this.warnings.push(warning);
      return this;
    })
  };
}

/**
 * Creates a mock validation rule
 * 
 * @param {string} id - Rule identifier
 * @param {number} severity - Rule severity (1-3)
 * @param {boolean} isValid - Whether validation should pass
 * @param {Object} options - Additional options
 * @returns {Object} Mock validation rule
 */
function createMockValidationRule(id, severity = 1, isValid = true, options = {}) {
  return {
    id,
    severity,
    description: options.description || `Rule ${id}`,
    validate: jest.fn(() => ({
      isValid,
      errors: isValid ? [] : [{ code: `RULE_${id}_VIOLATION`, message: `Rule ${id} violation` }],
      warnings: options.warnings || []
    })),
    
    // Required interface methods
    isCompatibleWith: jest.fn(() => true),
    getDependencies: jest.fn(() => options.dependencies || [])
  };
}

/**
 * Creates a mock state machine for testing
 * 
 * @param {Object} states - Map of state IDs to state objects
 * @param {Object} transitions - Map of [fromState, event] to toState
 * @param {Object} options - Additional options
 * @returns {Object} Mock state machine
 */
function createMockStateMachine(states = {}, transitions = {}, options = {}) {
  // Default initial state
  const initialState = options.initialState || Object.keys(states)[0] || 'initial';
  let currentState = initialState;
  
  // Transition history for verification
  const transitionHistory = [];
  
  return {
    // State management
    getCurrentState: jest.fn(() => states[currentState] || { id: currentState }),
    getState: jest.fn(id => states[id] || { id }),
    addState: jest.fn((id, stateObj) => {
      states[id] = { id, ...stateObj };
      return states[id];
    }),
    
    // Transition management
    transition: jest.fn((event) => {
      const key = `${currentState}:${event}`;
      const nextState = transitions[key] || currentState;
      
      // Record transition for history
      transitionHistory.push({
        from: currentState,
        event,
        to: nextState,
        timestamp: Date.now()
      });
      
      // Update current state
      currentState = nextState;
      
      return states[nextState] || { id: nextState };
    }),
    addTransition: jest.fn((fromState, event, toState) => {
      transitions[`${fromState}:${event}`] = toState;
    }),
    
    // State machine operations
    reset: jest.fn(() => {
      currentState = initialState;
      transitionHistory.length = 0;
    }),
    minimize: jest.fn(() => {
      return {
        originalStateCount: Object.keys(states).length,
        minimizedStateCount: options.minimizedStateCount || Math.ceil(Object.keys(states).length / 2),
        optimizationRatio: options.optimizationRatio || 0.5
      };
    }),
    
    // History and debugging
    getTransitionHistory: jest.fn(() => [...transitionHistory]),
    getStates: jest.fn(() => ({ ...states })),
    getTransitions: jest.fn(() => ({ ...transitions })),
    
    // Custom methods
    ...(options.customMethods || {})
  };
}

// Export all factory functions
module.exports = {
  // Re-export specific factories
  createMockDataModel,
  createMockBehaviorModel,
  createMockDOPAdapter,
  
  // General mock factories
  createMockValidationResult,
  createMockValidationRule,
  createMockStateMachine
};