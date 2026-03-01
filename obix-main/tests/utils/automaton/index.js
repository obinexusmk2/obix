/**
 * Automaton Testing Utilities
 * 
 * Provides utilities for testing automaton state minimization algorithms.
 * 
 * @module tests/utils/automaton
 */

/**
 * Creates a test automaton for state minimization testing
 * 
 * @param {Object} config - Configuration for the test automaton
 * @returns {Object} Test automaton
 */
function createTestAutomaton(config = {}) {
  // Default configuration
  const defaultConfig = {
    states: ['q0', 'q1', 'q2', 'q3'],
    initialState: 'q0',
    acceptingStates: ['q3'],
    alphabet: ['a', 'b'],
    transitions: {
      'q0:a': 'q1',
      'q0:b': 'q2',
      'q1:a': 'q1',
      'q1:b': 'q3',
      'q2:a': 'q1',
      'q2:b': 'q2',
      'q3:a': 'q1',
      'q3:b': 'q2'
    }
  };
  
  // Merge with provided config
  const mergedConfig = {
    states: config.states || defaultConfig.states,
    initialState: config.initialState || defaultConfig.initialState,
    acceptingStates: config.acceptingStates || defaultConfig.acceptingStates,
    alphabet: config.alphabet || defaultConfig.alphabet,
    transitions: { ...defaultConfig.transitions, ...(config.transitions || {}) }
  };
  
  // Create state objects
  const stateObjects = mergedConfig.states.reduce((acc, stateId) => {
    acc[stateId] = {
      id: stateId,
      isAccepting: mergedConfig.acceptingStates.includes(stateId),
      transitions: new Map()
    };
    return acc;
  }, {});
  
  // Add transitions to state objects
  Object.entries(mergedConfig.transitions).forEach(([key, targetState]) => {
    const [sourceState, symbol] = key.split(':');
    if (stateObjects[sourceState]) {
      stateObjects[sourceState].transitions.set(symbol, stateObjects[targetState]);
    }
  });
  
  // Set up current state
  let currentState = stateObjects[mergedConfig.initialState];
  
  // Create and return automaton object
  return {
    // Basic properties
    states: stateObjects,
    initialState: stateObjects[mergedConfig.initialState],
    acceptingStates: mergedConfig.acceptingStates.map(id => stateObjects[id]),
    alphabet: mergedConfig.alphabet,
    
    // State access
    getStates: () => Object.values(stateObjects),
    getStateById: (id) => stateObjects[id],
    getCurrentState: () => currentState,
    
    // Transition methods
    transition: (symbol) => {
      if (!currentState) {
        throw new Error('No current state');
      }
      
      const nextState = currentState.transitions.get(symbol);
      if (!nextState) {
        throw new Error(`No transition from ${currentState.id} via symbol '${symbol}'`);
      }
      
      currentState = nextState;
      return nextState;
    },
    
    getTransition: (stateId, symbol) => {
      const state = stateObjects[stateId];
      return state ? state.transitions.get(symbol) : undefined;
    },
    
    // Simulation
    run: (input) => {
      let state = stateObjects[mergedConfig.initialState];
      const trace = [state.id];
      
      for (const symbol of input) {
        state = state.transitions.get(symbol);
        if (!state) {
          return { accepted: false, trace };
        }
        trace.push(state.id);
      }
      
      return {
        accepted: state.isAccepting,
        trace,
        finalState: state.id
      };
    },
    
    // Reset
    reset: () => {
      currentState = stateObjects[mergedConfig.initialState];
    },
    
    // State machine minimization
    getMinimizationSignature: () => ({
      states: mergedConfig.states,
      initialState: mergedConfig.initialState,
      acceptingStates: mergedConfig.acceptingStates,
      alphabet: mergedConfig.alphabet,
      transitions: Object.keys(mergedConfig.transitions)
    }),
    
    // For testing equivalence
    isEquivalentTo: (other) => {
      // This is just a simple example - real equivalence would be more complex
      const thisSignature = JSON.stringify(
        mergedConfig.states.sort().map(state => ({
          id: state,
          isAccepting: mergedConfig.acceptingStates.includes(state),
          transitions: mergedConfig.alphabet.map(symbol => 
            ({ symbol, target: mergedConfig.transitions[`${state}:${symbol}`] }))
        }))
      );
      
      const otherSignature = JSON.stringify(
        other.getStates().map(state => ({
          id: state.id,
          isAccepting: other.acceptingStates.some(s => s.id === state.id),
          transitions: mergedConfig.alphabet.map(symbol => 
            ({ symbol, target: other.getTransition(state.id, symbol)?.id }))
        }))
      );
      
      return thisSignature === otherSignature;
    }
  };
}

/**
 * Creates a sample automaton known to benefit from minimization
 * 
 * @returns {Object} Sample automaton with redundant states
 */
function createMinimizableAutomaton() {
  return createTestAutomaton({
    states: ['q0', 'q1', 'q2', 'q3', 'q4', 'q5'],
    initialState: 'q0',
    acceptingStates: ['q2', 'q5'],
    alphabet: ['a', 'b'],
    transitions: {
      'q0:a': 'q1',
      'q0:b': 'q3',
      'q1:a': 'q2',
      'q1:b': 'q4',
      'q2:a': 'q2',
      'q2:b': 'q5',
      'q3:a': 'q4',
      'q3:b': 'q0',
      'q4:a': 'q5',
      'q4:b': 'q1',
      'q5:a': 'q5',
      'q5:b': 'q2'
    }
  });
}

/**
 * Tests if a given state minimization algorithm works correctly
 * 
 * @param {Function} minimizeFunction - The state minimization function to test
 * @returns {Object} Test results
 */
function testStateMinimization(minimizeFunction) {
  // Create test automaton
  const testAutomaton = createMinimizableAutomaton();
  
  // Expected minimal automaton properties
  const expectedStates = 3; // The minimal equivalent has only 3 states
  
  // Apply minimization
  const { minimizedAutomaton, metrics } = minimizeFunction(testAutomaton);
  
  // Verify minimization
  const results = {
    originalStateCount: testAutomaton.getStates().length,
    minimizedStateCount: minimizedAutomaton.getStates().length,
    expectedMinimumStates: expectedStates,
    isOptimal: minimizedAutomaton.getStates().length === expectedStates,
    isCorrect: verifyAutomatonEquivalence(testAutomaton, minimizedAutomaton),
    reductionRatio: minimizedAutomaton.getStates().length / testAutomaton.getStates().length,
    metrics
  };
  
  return results;
}

/**
 * Verifies that two automata are equivalent (accept the same language)
 * 
 * @param {Object} automatonA - First automaton
 * @param {Object} automatonB - Second automaton
 * @returns {boolean} True if the automata are equivalent
 */
function verifyAutomatonEquivalence(automatonA, automatonB) {
  // This is a simplified approach - a real implementation would be more thorough
  
  // Generate test cases
  const testCases = generateTestCases(automatonA.alphabet, 5);
  
  // Run both automata on the test cases
  for (const input of testCases) {
    const resultA = automatonA.run(input);
    const resultB = automatonB.run(input);
    
    if (resultA.accepted !== resultB.accepted) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate test cases for automaton testing
 * 
 * @param {Array<string>} alphabet - Alphabet symbols
 * @param {number} maxLength - Maximum length of test strings
 * @returns {Array<Array<string>>} Array of test inputs
 */
function generateTestCases(alphabet, maxLength) {
  const testCases = [[]]; // Include empty string
  
  // Generate strings up to maxLength
  for (let length = 1; length <= maxLength; length++) {
    const newCases = [];
    
    for (const existingCase of testCases) {
      if (existingCase.length === length - 1) {
        for (const symbol of alphabet) {
          newCases.push([...existingCase, symbol]);
        }
      }
    }
    
    testCases.push(...newCases);
  }
  
  return testCases;
}

module.exports = {
  createTestAutomaton,
  createMinimizableAutomaton,
  testStateMinimization,
  verifyAutomatonEquivalence,
  generateTestCases
};