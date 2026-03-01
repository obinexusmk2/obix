/**
 * @file BehaviorModel.test.ts
 * @description Unit tests for the BehaviorModel class
 * @author Nnamdi Okpala
 */

import { BehaviorModel } from '@core/dop/behavior/BehaviorModel';

describe('BehaviorModel', () => {
  let behaviorModel: BehaviorModel<{ count: number }, 'increment' | 'decrement'>;
  
  beforeEach(() => {
    behaviorModel = new BehaviorModel({
      increment: (state, step = 1) => ({ count: state.count + step }),
      decrement: (state, step = 1) => ({ count: state.count - step })
    });
  });
  
  test('should get transition functions', () => {
    const incrementFn = behaviorModel.getTransition('increment');
    const decrementFn = behaviorModel.getTransition('decrement');
    
    expect(incrementFn).toBeDefined();
    expect(decrementFn).toBeDefined();
    expect(typeof incrementFn).toBe('function');
    expect(typeof decrementFn).toBe('function');
  });
  
  test('should execute transitions correctly', () => {
    const state = { count: 5 };
    
    const updatedState1 = behaviorModel.executeTransition('increment', state);
    expect(updatedState1.count).toBe(6);
    
    const updatedState2 = behaviorModel.executeTransition('decrement', state);
    expect(updatedState2.count).toBe(4);
    
    const updatedState3 = behaviorModel.executeTransition('increment', state, 3);
    expect(updatedState3.count).toBe(8);
  });
  
  test('should validate transitions are functions', () => {
    const result = behaviorModel.validate();
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
});
