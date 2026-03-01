/**
 * @file DataModel.test.ts
 * @description Unit tests for the DataModel class
 * @author Nnamdi Okpala
 */

import { BaseDataModel } from '@core/dop/data/BaseDataModel';

// Test implementation of DataModel for testing BaseDOPAdapter
class TestDataModel extends BaseDataModel<{ count: number }> {
  constructor(initialState: { count: number } = { count: 0 }) {
    super(initialState);
  }
}

describe('DataModel', () => {
  let dataModel: TestDataModel;
  
  beforeEach(() => {
    dataModel = new TestDataModel({ count: 5 });
  });
  
  test('should initialize with state', () => {
    expect(dataModel.getState()).toEqual({ count: 5 });
  });
  
  test('should update state', () => {
    dataModel.setState({ count: 10 });
    expect(dataModel.getState()).toEqual({ count: 10 });
  });
  
  test('should validate state structure', () => {
    const result = dataModel.validate();
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  test('should deep clone state when getting it', () => {
    const state = dataModel.getState();
    state.count = 100;
    
    // Original state should remain unchanged
    expect(dataModel.getState()).toEqual({ count: 5 });
  });
});
