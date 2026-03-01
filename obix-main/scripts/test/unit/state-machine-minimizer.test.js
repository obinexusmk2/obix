// tests/unit/core/automaton/state-machine-minimizer.test.ts
import { StateMachineMinimizer } from '../../../../src/core/automaton/state/state-machine-minimizer';
import { State } from '../../../../src/core/automaton/state/state-class';
import { StateMachine } from '../../../../src/core/automaton/state/state-machine-class';

describe('StateMachineMinimizer', () => {
  // Metrics tracking setup for performance tests
  beforeEach(() => {
    // Reset metrics for new test
    global.__STATE_MACHINE_METRICS__.reset();
  });
  
  // Actual test cases
  describe('minimize', () => {
    it('should correctly minimize a simple state machine with 4 states', () => {
      // Test setup - create a simple state machine with redundant states
      const machine = new StateMachine();
      
      // Create states
      const state1 = new State('state1', { value: 'a' });
      const state2 = new State('state2', { value: 'b' });
      const state3 = new State('state3', { value: 'a' }); // Equivalent to state1
      const state4 = new State('state4', { value: 'b' }); // Equivalent to state2
      
      // Add states to machine
      machine.addState(state1);
      machine.addState(state2);
      machine.addState(state3);
      machine.addState(state4);
      
      // Add transitions - state1 and state3 have identical transitions
      state1.addTransition('input1', state2);
      state1.addTransition('input2', state1);
      
      state3.addTransition('input1', state4); // Leads to state equivalent to state2
      state3.addTransition('input2', state3); // Self-loop like state1
      
      // State2 and state4 also have identical transitions
      state2.addTransition('input1', state1);
      state2.addTransition('input2', state2);
      
      state4.addTransition('input1', state3); // Leads to state equivalent to state1
      state4.addTransition('input2', state4); // Self-loop like state2
      
      // Set initial state
      machine.setInitialState('state1');
      
      // Create the minimizer
      const minimizer = new StateMachineMinimizer();
      
      // Start measurement
      global.__STATE_MACHINE_METRICS__.startOperation('minimizeStateMachine');
      
      // Perform minimization
      const minimizedMachine = minimizer.minimize(machine);
      
      // End measurement
      global.__STATE_MACHINE_METRICS__.endOperation();
      
      // Assertions about the minimized machine
      expect(minimizedMachine.states.size).toBe(2); // Should reduce to 2 states
      expect(minimizedMachine).toBeMinimizedStateMachine({
        stateCount: 2,
        transitionCount: 4, // 2 states * 2 transitions each
        equivalenceClassCount: 2
      });
      
      // Verify transitions are preserved
      const minimizedStates = Array.from(minimizedMachine.states.values());
      
      // Check that transitions work correctly in minimized machine
      const stateA = minimizedStates.find(s => s.value.value === 'a');
      const stateB = minimizedStates.find(s => s.value.value === 'b');
      
      expect(stateA).toBeTruthy();
      expect(stateB).toBeTruthy();
      
      expect(stateA?.getNextState('input1')).toBe(stateB);
      expect(stateA?.getNextState('input2')).toBe(stateA);
      
      expect(stateB?.getNextState('input1')).toBe(stateA);
      expect(stateB?.getNextState('input2')).toBe(stateB);
    });
    
    it('should handle a complex state machine with 50 states', () => {
      // Create a large test state machine
      const machine = createTestStateMachine(50, 3);
      
      // Create the minimizer
      const minimizer = new StateMachineMinimizer();
      
      // Start measurement
      global.__STATE_MACHINE_METRICS__.startOperation('minimizeStateMachine');
      
      // Sub-measurement: equivalence class computation
      global.__STATE_MACHINE_METRICS__.startOperation('computeEquivalenceClasses');
      const equivalenceClasses = minimizer.computeEquivalenceClasses(machine);
      global.__STATE_MACHINE_METRICS__.endOperation();
      
      // Sub-measurement: transition optimization
      global.__STATE_MACHINE_METRICS__.startOperation('optimizeTransitions');
      const minimizedMachine = minimizer.createMinimizedMachine(machine, equivalenceClasses);
      global.__STATE_MACHINE_METRICS__.endOperation();
      
      // End overall measurement
      global.__STATE_MACHINE_METRICS__.endOperation();
      
      // We don't know exact reduction, but it should be less than the original
      expect(minimizedMachine.states.size).toBeLessThan(50);
      expect(minimizedMachine).toBeMinimizedStateMachine();
      
      // Verify some optimization metrics were collected
      const metrics = global.__STATE_MACHINE_METRICS__.getReport();
      expect(metrics.operations.length).toBe(4); // Should have 4 operations
      
      // Check that the measurements exist
      const minimizationOp = metrics.operations.find(op => op.name === 'minimizeStateMachine');
      const equivalenceClassOp = metrics.operations.find(op => op.name === 'computeEquivalenceClasses');
      const transitionOp = metrics.operations.find(op => op.name === 'optimizeTransitions');
      
      expect(minimizationOp).toBeTruthy();
      expect(equivalenceClassOp).toBeTruthy();
      expect(transitionOp).toBeTruthy();
      
      // Verify the measurements make sense
      expect(minimizationOp?.duration).toBeGreaterThan(0);
      expect(equivalenceClassOp?.duration).toBeGreaterThan(0);
      expect(transitionOp?.duration).toBeGreaterThan(0);
      
      // The overall duration should be greater than or equal to the sum of the sub-operations
      expect(minimizationOp?.duration).toBeGreaterThanOrEqual(
        equivalenceClassOp?.duration + transitionOp?.duration
      );
    });
    
    // Performance test for large state machines
    it('should efficiently minimize a large state machine with 500 states', () => {
      // Create a very large test state machine
      const machine = createTestStateMachine(500, 5);
      
      // Create the minimizer
      const minimizer = new StateMachineMinimizer();
      
      // Start measurement
      global.__STATE_MACHINE_METRICS__.startOperation('minimizeStateMachine');
      
      // Perform minimization
      const minimizedMachine = minimizer.minimize(machine);
      
      // End measurement
      global.__STATE_MACHINE_METRICS__.endOperation();
      
      // Verify performance metrics
      const metrics = global.__STATE_MACHINE_METRICS__.getReport();
      const minimizationOp = metrics.operations.find(op => op.name === 'minimizeStateMachine');
      
      // Add performance assertions - this will vary by environment
      // but gives us a baseline to detect performance regressions
      // The actual values would be calibrated based on observed performance
      expect(minimizationOp?.duration).toBeLessThan(5000); // Should complete in under 5 seconds
      
      // Verify optimization results
      const reductionRatio = 1 - (minimizedMachine.states.size / 500);
      console.log(`Reduction ratio: ${reductionRatio}`);
      
      // We expect at least some measurable reduction
      expect(reductionRatio).toBeGreaterThan(0);
    });
  });
  
  describe('findEquivalentState', () => {
    it('should correctly identify equivalent states', () => {
      // Create two equivalent states
      const state1 = new State('state1', { value: 'a' });
      const state2 = new State('state2', { value: 'b' });
      
      state1.addTransition('input1', state2);
      state1.addTransition('input2', state1);
      
      // Create an equivalent state to state1
      const state3 = new State('state3', { value: 'c' });
      state3.addTransition('input1', state2);
      state3.addTransition('input2', state3);
      
      // Create a non-equivalent state
      const state4 = new State('state4', { value: 'd' });
      state4.addTransition('input1', state4); // Different transition
      state4.addTransition('input2', state2);
      
      const minimizer = new StateMachineMinimizer();
      
      // State3 should be equivalent to state1
      expect(minimizer.areStatesEquivalent(state1, state3)).toBe(true);
      
      // State4 should not be equivalent to state1
      expect(minimizer.areStatesEquivalent(state1, state4)).toBe(false);
      
      // Test the custom matcher
      expect(state1).toBeEquivalentState(state3);
      expect(state1).not.toBeEquivalentState(state4);
    });
  });
  
  describe('computeEquivalenceClasses', () => {
    it('should partition states into correct equivalence classes', () => {
      // Create a state machine with some equivalences
      const machine = new StateMachine();
      
      // Create states with different "values" but equivalent behavior
      const states = Array.from({ length: 10 }, (_, i) => 
        new State(`state${i + 1}`, { value: `value${(i % 3) + 1}` })
      );
      
      // Add all states to the machine
      states.forEach(state => machine.addState(state));
      
      // Add transitions that make states 0, 3, 6, 9 equivalent
      // Add transitions that make states 1, 4, 7 equivalent
      // Add transitions that make states 2, 5, 8 equivalent
      for (let i = 0; i < states.length; i++) {
        // All states with same i % 3 should have equivalent transitions
        states[i].addTransition('a', states[(i + 1) % 10]);
        states[i].addTransition('b', states[(i + 2) % 10]);
      }
      
      // Start measurement
      global.__STATE_MACHINE_METRICS__.startOperation('computeEquivalenceClasses');
      
      // Compute equivalence classes
      const minimizer = new StateMachineMinimizer();
      const classes = minimizer.computeEquivalenceClasses(machine);
      
      // End measurement
      global.__STATE_MACHINE_METRICS__.endOperation();
      
      // Should identify 3 equivalence classes
      expect(classes.size).toBe(3);
      
      // Check that the right states are grouped together
      for (const [classId, stateSet] of classes.entries()) {
        // All states in the same class should have the same value % 3
        const firstState = Array.from(stateSet)[0];
        const valueIndex = parseInt(firstState.value.value.slice(5)) - 1;
        
        for (const state of stateSet) {
          const stateValueIndex = parseInt(state.value.value.slice(5)) - 1;
          expect(stateValueIndex % 3).toBe(valueIndex % 3);
        }
      }
    });
  });
});