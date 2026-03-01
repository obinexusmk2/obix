/**
 * Data-Oriented Programming (DOP) Module
 * 
 * Core implementation of DOP pattern with automaton state minimization
 * based on Nnamdi Okpala's research.
 */

// Data models
export * from './data/BaseDataModel';
export * from './data/StatefulDataModel';
export * from './data/ValidationDataModelImpl';

// Behavior models
export * from './behavior/BaseBehaviorModel';
export * from './behavior/BehaviourModel';
export * from './behavior/BehaviourChain';
export * from './behavior/BehaviorRegistry';
export * from './behavior/ValidationBehaviourModel';
export * from './behavior/ValidationBehaviorModelImpl';

// Adapters
export * from './adapter/BaseDOPAdapter';
export * from './adapter/DOPAdapter';
export * from './adapter/ValidationDOPAdapter';
export * from './adapter/TimedDOPAdapter';

// Validation
export * from './validation/ValidationResult';
export * from './validation/ValidationStateMachine';
export * from './validation/ValidationState';
export * from './validation/ValidationAdapter';

// Factories
export * from './factory/DataModelFactory';
export * from './factory/DOPAdapterFactory';
export * from './factory/ValidationDOPFactory';

// Common utilities
export * from './common/ExecutionTrace';
export * from './common/ImplementationComparisonResult';
export * from './common/ImplementationMismatchError';

// Optimization
export * from './optimization/OptimizationMetrics';
export * from './optimization/OptimizedResult';
