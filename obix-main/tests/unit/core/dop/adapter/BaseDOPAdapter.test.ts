/**
 * @file BaseDOPAdapter.test.ts
 * @description Unit tests for the BaseDOPAdapter class
 * @author Nnamdi Okpala
 */

import { BaseDOPAdapter } from '@core/dop/adapter/BaseDOPAdapter';
import { StateType } from '@core/dop/data/StateType';
import { ValidationErrorHandlingStrategies } from '@core/dop/validation/ValidationErrorHandlingStrategies';

// Mock dependencies
jest.mock('@core/dop/data/BaseDataModel', () => ({
  BaseDataModel: jest.fn().mockImplementation(() => ({
    getState: jest.fn(),
    setState: jest.fn(),
    validate: jest.fn().mockReturnValue({ isValid: true, errors: [] })
  }))
}));

jest.mock('@core/dop/behavior/BehaviorModel', () => ({
  BehaviorModel: jest.fn().mockImplementation(() => ({
    getTransition: jest.fn(),
    executeTransition: jest.fn(),
    validate: jest.fn().mockReturnValue({ isValid: true, errors: [] })
  }))
}));

// Test implementation of BaseDOPAdapter for testing
class TestBaseDOPAdapter extends BaseDOPAdapter<any, string> {
  // Implement abstract methods for testing
  protected createDataModel() {
    return {
      getState: jest.fn(),
      setState: jest.fn(),
      validate: jest.fn().mockReturnValue({ isValid: true, errors: [] })
    };
  }

  protected createBehaviorModel() {
    return {
      getTransition: jest.fn(),
      executeTransition: jest.fn(),
      validate: jest.fn().mockReturnValue({ isValid: true, errors: [] })
    };
  }
}

describe('BaseDOPAdapter', () => {
  let adapter: TestBaseDOPAdapter;

  beforeEach(() => {
    adapter = new TestBaseDOPAdapter({
      errorHandlingStrategy: ValidationErrorHandlingStrategies.LOG
    });
  });

  test('should initialize correctly', () => {
    expect(adapter).toBeDefined();
  });

  test('should get state', () => {
    const mockState = { test: 'state' };
    jest.spyOn(adapter['dataModel'], 'getState').mockReturnValue(mockState);
    
    expect(adapter.getState()).toEqual(mockState);
    expect(adapter['dataModel'].getState).toHaveBeenCalled();
  });

  test('should set state', () => {
    const newState = { test: 'newState' };
    adapter.setState(newState);
    
    expect(adapter['dataModel'].setState).toHaveBeenCalledWith(newState);
  });

  test('should subscribe and notify listeners', () => {
    const listener = jest.fn();
    const unsubscribe = adapter.subscribe(listener);
    
    // Manually trigger notification
    adapter['notifyListeners']({ test: 'newState' }, { test: 'oldState' });
    
    expect(listener).toHaveBeenCalledWith({ test: 'newState' });
    
    // Test unsubscribe
    unsubscribe();
    adapter['notifyListeners']({ test: 'anotherState' }, { test: 'newState' });
    
    // Listener should have been called only once
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
