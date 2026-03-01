/**
 * DOP Validation Fixtures
 * 
 * Provides common validation test fixtures for DOP adapter testing.
 * 
 * @module tests/utils/dop/validationFixtures
 */

/**
 * Common validation error fixtures for testing
 */
const validationErrors = {
    implementationMismatch: {
      code: 'IMPLEMENTATION_MISMATCH',
      message: 'Functional and OOP implementations do not match',
      component: 'DOPAdapter',
      details: {
        differences: [
          {
            transition: 'increment',
            functionalResult: { count: 1 },
            oopResult: { count: 2 }
          }
        ]
      }
    },
    missingTransition: {
      code: 'MISSING_TRANSITION',
      message: 'Transition exists in one implementation but not the other',
      component: 'DOPAdapter',
      details: {
        transition: 'reset',
        existsIn: 'functional',
        missingFrom: 'oop'
      }
    },
    invalidState: {
      code: 'INVALID_STATE_TYPE',
      message: 'State does not match expected type',
      component: 'ValidationBehaviourModel',
      details: {
        expected: { count: 'number' },
        received: { count: 'string' }
      }
    },
    behaviorChainError: {
      code: 'BEHAVIOR_CHAIN_ERROR',
      message: 'Error executing behavior chain',
      component: 'BehaviourChain',
      details: {
        step: 'increment',
        error: 'Cannot read property of undefined'
      }
    }
  };
  
  /**
   * Common validation result fixtures for testing
   */
  const validationResults = {
    valid: {
      isValid: true,
      errors: [],
      warnings: [],
      component: 'DOPAdapter',
      timestamp: Date.now()
    },
    invalid: {
      isValid: false,
      errors: [validationErrors.implementationMismatch],
      warnings: [],
      component: 'DOPAdapter',
      timestamp: Date.now()
    },
    warning: {
      isValid: true,
      errors: [],
      warnings: [
        {
          code: 'POSSIBLE_OPTIMIZATION',
          message: 'Transition could be optimized for performance',
          component: 'DOPAdapter',
          details: {
            transition: 'complexCalculation',
            suggestion: 'Consider caching intermediate results'
          }
        }
      ],
      component: 'DOPAdapter',
      timestamp: Date.now()
    },
    empty: {
      isValid: true,
      errors: [],
      warnings: [],
      component: 'DOPAdapter',
      timestamp: Date.now(),
      metadata: {
        isEmpty: true
      }
    }
  };
  
  /**
   * Common implementation comparison fixtures for testing
   */
  const implementationComparisons = {
    equivalent: {
      equivalent: true,
      differences: [],
      traces: []
    },
    different: {
      equivalent: false,
      differences: [
        {
          transition: 'increment',
          functionalResult: { count: 1 },
          oopResult: { count: 2 },
          path: 'count'
        }
      ],
      traces: [
        {
          id: 'functional-execution',
          steps: [
            { name: 'increment', data: { input: { count: 0 }, output: { count: 1 } } }
          ]
        },
        {
          id: 'oop-execution',
          steps: [
            { name: 'increment', data: { input: { count: 0 }, output: { count: 2 } } }
          ]
        }
      ]
    },
    minorDifference: {
      equivalent: false,
      differences: [
        {
          transition: 'toFixed',
          functionalResult: { value: "1.00" },
          oopResult: { value: "1" },
          path: 'value'
        }
      ],
      traces: []
    }
  };
  
  // State type fixtures for validation
  const stateTypes = {
    counter: {
      name: 'Counter',
      fields: {
        count: { type: 'number', required: true }
      }
    },
    user: {
      name: 'User',
      fields: {
        id: { type: 'string', required: true },
        name: { type: 'string', required: true },
        age: { type: 'number', required: false },
        email: { type: 'string', required: false, pattern: '.+@.+\\..+' }
      }
    },
    complex: {
      name: 'Complex',
      fields: {
        id: { type: 'string', required: true },
        data: { 
          type: 'object',
          required: true,
          fields: {
            count: { type: 'number', required: true },
            items: { type: 'array', required: false }
          }
        }
      }
    }
  };
  
  module.exports = {
    errors: validationErrors,
    results: validationResults,
    comparisons: implementationComparisons,
    stateTypes
  };