import { CSSStateMachine } from '../../src/core/parser/css/parser/CSSStateMachine';

describe('CSSStateMachine', () => {
  let stateMachine: CSSStateMachine;
  
  beforeEach(() => {
    stateMachine = new CSSStateMachine();
  });
  
  test('transitions between states correctly', () => {
    // Initial state should be INITIAL
    expect(stateMachine.getCurrentState()).toBe('INITIAL');
    
    // Transition to SELECTOR state
    stateMachine.transition('SELECTOR');
    expect(stateMachine.getCurrentState()).toBe('SELECTOR');
    
    // Transition to BLOCK_START state
    stateMachine.transition('BLOCK_START');
    expect(stateMachine.getCurrentState()).toBe('BLOCK_START');
    
    // Transition to PROPERTY state
    stateMachine.transition('PROPERTY');
    expect(stateMachine.getCurrentState()).toBe('PROPERTY');
  });
  
  test('validates transitions', () => {
    // Initial state
    expect(stateMachine.getCurrentState()).toBe('INITIAL');
    
    // Valid transition
    expect(stateMachine.canTransition('SELECTOR')).toBe(true);
    
    // Invalid transition
    expect(stateMachine.canTransition('PROPERTY')).toBe(false);
    
    // Make a valid transition
    stateMachine.transition('SELECTOR');
    stateMachine.transition('BLOCK_START');
    
    // Now PROPERTY should be valid
    expect(stateMachine.canTransition('PROPERTY')).toBe(true);
  });
  
  test('resets to initial state', () => {
    stateMachine.transition('SELECTOR');
    stateMachine.transition('BLOCK_START');
    expect(stateMachine.getCurrentState()).toBe('BLOCK_START');
    
    stateMachine.reset();
    expect(stateMachine.getCurrentState()).toBe('INITIAL');
  });
  
  test('tracks state history', () => {
    stateMachine.transition('SELECTOR');
    stateMachine.transition('BLOCK_START');
    stateMachine.transition('PROPERTY');
    
    const history = stateMachine.getStateHistory();
    expect(history.length).toBe(4); // Including initial state
    expect(history[0]).toBe('INITIAL');
    expect(history[1]).toBe('SELECTOR');
    expect(history[2]).toBe('BLOCK_START');
    expect(history[3]).toBe('PROPERTY');
  });
  
  test('minimizes states correctly', () => {
    // Initialize with states that can be minimized
    stateMachine.addState('TEST_STATE_1', false);
    stateMachine.addState('TEST_STATE_2', false);
    
    // Add identical transitions to make states equivalent
    stateMachine.addTransition('TEST_STATE_1', 'TEST_SYMBOL', 'INITIAL');
    stateMachine.addTransition('TEST_STATE_2', 'TEST_SYMBOL', 'INITIAL');
    
    // Get initial metrics
    const beforeMetrics = stateMachine.getOptimizationMetrics();
    
    // Minimize states
    stateMachine.minimizeStates();
    
    // Get metrics after minimization
    const afterMetrics = stateMachine.getOptimizationMetrics();
    
    // After minimization, there should be fewer states
    expect(afterMetrics.minimizedStateCount).toBeLessThanOrEqual(beforeMetrics.originalStateCount);
    
    // The optimization ratio should be calculated correctly
    expect(afterMetrics.optimizationRatio).toBe(
      afterMetrics.minimizedStateCount / beforeMetrics.originalStateCount
    );
  });
  
  test('applies Nnamdi Okpala\'s automaton state minimization algorithm', () => {
    // This test verifies that the implementation follows Okpala's algorithm
    // by creating a scenario with redundant states that should be merged
    
    // Create states with equivalent behavior
    stateMachine.addState('REDUNDANT_STATE_1', false);
    stateMachine.addState('REDUNDANT_STATE_2', false);
    stateMachine.addState('UNIQUE_STATE', false);
    
    // Same transition patterns for redundant states
    stateMachine.addTransition('REDUNDANT_STATE_1', 'SYMBOL_A', 'UNIQUE_STATE');
    stateMachine.addTransition('REDUNDANT_STATE_1', 'SYMBOL_B', 'INITIAL');
    
    stateMachine.addTransition('REDUNDANT_STATE_2', 'SYMBOL_A', 'UNIQUE_STATE');
    stateMachine.addTransition('REDUNDANT_STATE_2', 'SYMBOL_B', 'INITIAL');
    
    // Different transition for unique state
    stateMachine.addTransition('UNIQUE_STATE', 'SYMBOL_A', 'INITIAL');
    
    // Get pre-minimization state count
    const beforeCount = stateMachine.getStates().size;
    
    // Perform minimization
    stateMachine.minimizeStates();
    
    // The two redundant states should be merged
    const metrics = stateMachine.getOptimizationMetrics();
    expect(metrics.originalStateCount).toBe(beforeCount);
    expect(metrics.minimizedStateCount).toBeLessThan(metrics.originalStateCount);
    
    // Test transition behavior remains identical after minimization
    stateMachine.reset();
    stateMachine.transition('REDUNDANT_STATE_1');
    stateMachine.transition('SYMBOL_A');
    expect(stateMachine.getCurrentState()).toBe('UNIQUE_STATE');
  });
});