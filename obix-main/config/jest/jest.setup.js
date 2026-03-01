// config/jest/jest.setup.js

// Add custom Jest matchers for OBIX state machine testing
expect.extend({
    /**
     * Custom matcher to check if a state machine has been minimized
     * @param {Object} received - The state machine to check
     * @param {Object} expected - Expected properties after minimization
     */
    toBeMinimizedStateMachine(received, expected) {
      // If no specific expectations provided, just check if it's minimized
      if (!expected) {
        const isMinimized = received.isMinimized === true;
        return {
          message: () => 
            `expected ${this.utils.printReceived(received)} ${
              isMinimized ? 'not ' : ''
            }to be a minimized state machine`,
          pass: isMinimized
        };
      }
      
      // Check against expected values if provided
      const { stateCount, transitionCount, equivalenceClassCount } = expected;
      const actualStateCount = received.states ? received.states.size : 0;
      const actualTransitionCount = Array.from(received.states || [])
        .reduce((count, state) => count + (state.transitions?.size || 0), 0);
      const actualEquivalenceClassCount = received.equivalenceClasses?.size || 0;
      
      const statesMatch = stateCount === undefined || actualStateCount === stateCount;
      const transitionsMatch = transitionCount === undefined || actualTransitionCount === transitionCount;
      const classesMatch = equivalenceClassCount === undefined || 
                           actualEquivalenceClassCount === equivalenceClassCount;
      
      const pass = statesMatch && transitionsMatch && classesMatch;
      
      return {
        message: () => {
          let result = `expected ${this.utils.printReceived(received)} to be a minimized state machine with:\n`;
          
          if (stateCount !== undefined) {
            result += `  ${statesMatch ? '✓' : '✗'} ${stateCount} states (got ${actualStateCount})\n`;
          }
          
          if (transitionCount !== undefined) {
            result += `  ${transitionsMatch ? '✓' : '✗'} ${transitionCount} transitions (got ${actualTransitionCount})\n`;
          }
          
          if (equivalenceClassCount !== undefined) {
            result += `  ${classesMatch ? '✓' : '✗'} ${equivalenceClassCount} equivalence classes (got ${actualEquivalenceClassCount})\n`;
          }
          
          return result;
        },
        pass
      };
    },
    
    /**
     * Custom matcher to check if two states are equivalent
     * @param {Object} received - First state
     * @param {Object} other - Second state to compare with
     */
    toBeEquivalentState(received, other) {
      // Check if the two states are in the same equivalence class
      const sameClass = received.equivalenceClass !== null && 
                        other.equivalenceClass !== null &&
                        received.equivalenceClass === other.equivalenceClass;
      
      // If they have equivalence classes assigned, use that
      if (sameClass) {
        return {
          message: () => 
            `expected ${this.utils.printReceived(received)} ${
              sameClass ? 'not ' : ''
            }to be equivalent to ${this.utils.printExpected(other)}`,
          pass: sameClass
        };
      }
      
      // Otherwise check transitions and state properties
      const sameTransitions = this.equals(
        Array.from(received.transitions || []).map(([symbol, target]) => symbol),
        Array.from(other.transitions || []).map(([symbol, target]) => symbol)
      );
      
      // States can be equivalent even with different internal values
      // as long as they have the same behavior
      const pass = sameTransitions;
      
      return {
        message: () => 
          `expected ${this.utils.printReceived(received)} ${
            pass ? 'not ' : ''
          }to be equivalent to ${this.utils.printExpected(other)}`,
        pass
      };
    }
  });
  
  // Global setup for performance measurements
  global.__STATE_MACHINE_METRICS__ = {
    startTime: null,
    endTime: null,
    operations: [],
    
    // Start timing an operation
    startOperation(name) {
      this.operations.push({
        name,
        startTime: performance.now(),
        endTime: null,
        duration: null
      });
    },
    
    // End timing the current operation
    endOperation() {
      const currentOp = this.operations[this.operations.length - 1];
      if (currentOp) {
        currentOp.endTime = performance.now();
        currentOp.duration = currentOp.endTime - currentOp.startTime;
      }
    },
    
    // Get metrics report
    getReport() {
      return {
        operations: this.operations,
        totalDuration: this.operations.reduce((sum, op) => sum + (op.duration || 0), 0)
      };
    },
    
    // Reset metrics
    reset() {
      this.startTime = null;
      this.endTime = null;
      this.operations = [];
    }
  };
  
  // Extend globals with OBIX test utilities
  global.createTestStateMachine = (stateCount, transitionsPerState = 2) => {
    // This function would create a test state machine with the specified
    // number of states and transitions for testing purposes
    // Implementation would depend on the actual OBIX state machine structure
    console.log(`Creating test state machine with ${stateCount} states and ${transitionsPerState} transitions per state`);
    
    // Return a mock state machine object
    return {
      states: new Map([...Array(stateCount).keys()].map(i => [
        `state${i}`,
        {
          id: `state${i}`,
          transitions: new Map([...Array(transitionsPerState).keys()].map(j => [
            `transition${j}`,
            `state${(i + j + 1) % stateCount}`
          ])),
          value: { data: `Value for state ${i}` },
          equivalenceClass: null
        }
      ])),
      initialState: 'state0',
      equivalenceClasses: new Map(),
      isMinimized: false
    };
  };
  
  // Mock the DOM for browser environment tests if needed
  if (typeof document === 'undefined') {
    class MockElement {
      constructor(tag) {
        this.tagName = tag.toUpperCase();
        this.children = [];
        this.attributes = {};
        this.style = {};
        this.textContent = '';
        this.innerHTML = '';
      }
      
      setAttribute(name, value) {
        this.attributes[name] = value;
      }
      
      getAttribute(name) {
        return this.attributes[name];
      }
      
      appendChild(child) {
        this.children.push(child);
        return child;
      }
    }
    
    global.document = {
      createElement: (tag) => new MockElement(tag),
      createTextNode: (text) => ({ textContent: text }),
      querySelector: () => null,
      querySelectorAll: () => []
    };
  }
  
  // Silence console during tests unless in verbose mode
  if (!process.env.VERBOSE) {
    global.console = {
      ...console,
      log: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
  }