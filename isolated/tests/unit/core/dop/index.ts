/**
 * DOP Module Tests
 * 
 * Test suite for the Data-Oriented Programming implementation.
 */

// Data model tests
export * from './data/DataModel.test';

// Behavior model tests
export * from './behavior/BehaviorModel.test';
export * from './behavior/TestBehaviourModel.test';

// Adapter tests
export * from './adapter/BaseDOPAdapter.test';
export * from './adapter/ValidationDOPAdapter.test';
export * from './adapter/TimedDOPAdapter.test';

// Common tests
export * from './common/ImplementationComparisionResult.test';
