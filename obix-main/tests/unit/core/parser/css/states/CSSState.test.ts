import { CSSStateUtils, State } from '../../src/core/parser/css/utils/CSSStateUtils';

describe('CSSStateUtils', () => {
  test('merges equivalent states correctly', () => {
    const states: State[] = [
      { id: 1, signature: 'A', transitions: new Map([['a', 2]]) },
      { id: 2, signature: 'B', transitions: new Map([['b', 3]]) },
      { id: 3, signature: 'B', transitions: new Map([['b', 4]]) }, // Same signature as state 2
      { id: 4, signature: 'C', transitions: new Map() }
    ];
    
    const minimized = CSSStateUtils.minimizeStates(states);
    
    // States 2 and 3 should be merged
    expect(minimized.length).toBe(3);
    
    // Verify the mapping maintains correct transitions
    const mapping = minimized.stateMapping;
    expect(mapping.get(3)).toBe(2); // State 3 should map to state 2
  });
  
  test('preserves original behavior after minimization', () => {
    // Create a simple state machine
    const states: State[] = [
      { id: 1, signature: 'A', transitions: new Map([['a', 2]]) },
      { id: 2, signature: 'B', transitions: new Map([['b', 3]]) },
      { id: 3, signature: 'C', transitions: new Map([['c', 4]]) },
      { id: 4, signature: 'D', transitions: new Map() }
    ];
    
    const minimized = CSSStateUtils.minimizeStates(states);
    
    // Run a sample input through both machines and compare results
    const input = ['a', 'b', 'c'];
    
    // Original machine traversal
    let currentState = 1;
    for (const symbol of input) {
      const state = states.find(s => s.id === currentState);
      if (state) {
        const nextState = state.transitions.get(symbol);
        if (nextState !== undefined) {
          currentState = nextState;
        }
      }
    }
    
    // Minimized machine traversal
    let minState = 1;
    for (const symbol of input) {
      const state = minimized.states.find(s => s.id === minState);
      if (state) {
        const nextState = state.transitions.get(symbol);
        if (nextState !== undefined) {
          minState = nextState;
        }
      }
    }
    
    // Final states should be equivalent
    expect(minState).toBe(currentState === 4 ? 4 : minimized.stateMapping.get(currentState) || currentState);
  });
  
  test('correctly computes state signatures', () => {
    // States with different accepting status should have different signatures
    const state1: State = { 
      id: 1, 
      isAccepting: true, 
      transitions: new Map([['a', 2]]) 
    };
    
    const state2: State = { 
      id: 2, 
      isAccepting: false, 
      transitions: new Map([['a', 2]]) 
    };
    
    const sig1 = CSSStateUtils.computeStateSignature(state1);
    const sig2 = CSSStateUtils.computeStateSignature(state2);
    
    expect(sig1).not.toBe(sig2);
    
    // States with same accepting status and transitions should have the same signature
    const state3: State = { 
      id: 3, 
      isAccepting: true, 
      transitions: new Map([['a', 2]]) 
    };
    
    const sig3 = CSSStateUtils.computeStateSignature(state3);
    expect(sig1).toBe(sig3);
  });
  
  test('executes state machine correctly', () => {
    const states: State[] = [
      { id: 1, transitions: new Map([['a', 2]]) },
      { id: 2, transitions: new Map([['b', 3]]) },
      { id: 3, transitions: new Map([['c', 4]]) },
      { id: 4, transitions: new Map() }
    ];
    
    // Test traversal with valid input
    const finalState1 = CSSStateUtils.executeStateMachine(states, 1, ['a', 'b', 'c']);
    expect(finalState1).toBe(4);
    
    // Test traversal with partial input
    const finalState2 = CSSStateUtils.executeStateMachine(states, 1, ['a']);
    expect(finalState2).toBe(2);
    
    // Test traversal with invalid input
    const finalState3 = CSSStateUtils.executeStateMachine(states, 1, ['a', 'x', 'c']);
    expect(finalState3).toBe(2); // Should stay at state 2 since 'x' isn't a valid transition
  });
  
  test('areStatesEquivalent identifies equivalent states', () => {
    // Equivalent states
    const state1: State = { 
      id: 1, 
      isAccepting: true, 
      transitions: new Map([['a', 2], ['b', 3]]) 
    };
    
    const state2: State = { 
      id: 2, 
      isAccepting: true, 
      transitions: new Map([['a', 2], ['b', 3]]) 
    };
    
    expect(CSSStateUtils.areStatesEquivalent(state1, state2)).toBe(true);
    
    // Non-equivalent states (different accepting status)
    const state3: State = { 
      id: 3, 
      isAccepting: false, 
      transitions: new Map([['a', 2], ['b', 3]]) 
    };
    
    expect(CSSStateUtils.areStatesEquivalent(state1, state3)).toBe(false);
    
    // Non-equivalent states (different transitions)
    const state4: State = { 
      id: 4, 
      isAccepting: true, 
      transitions: new Map([['a', 2], ['c', 3]]) 
    };
    
    expect(CSSStateUtils.areStatesEquivalent(state1, state4)).toBe(false);
  });
  
  test('cloneStates creates deep copies', () => {
    const states: State[] = [
      { id: 1, transitions: new Map([['a', 2]]) },
      { id: 2, transitions: new Map([['b', 3]]) }
    ];
    
    const cloned = CSSStateUtils.cloneStates(states);
    
    // Modify the original
    states[0].id = 10;
    states[0].transitions.set('x', 5);
    
    // Cloned should be unchanged
    expect(cloned[0].id).toBe(1);
    expect(cloned[0].transitions.has('x')).toBe(false);
    expect(cloned[0].transitions.get('a')).toBe(2);
  });
});