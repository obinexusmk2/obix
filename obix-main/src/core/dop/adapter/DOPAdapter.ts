/**
 * DOPAdapter.ts
 * 
<<<<<<< HEAD
 * Implementation of the Dual-Paradigm Adapter pattern for the OBIX framework.
 * This adapter bridges the gap between data-oriented and behavior-oriented 
 * programming models, allowing for state minimization optimization.
 * 
 * @author Nnamdi Okpala
 */

import { StateType } from '../data/StateType';
import { ValidationErrorHandlingStrategies } from '../validation/ValidationErrorHandlingStrategies';
import { BehaviorModel, TransitionFunction } from '../behavior/BehaviorModel';
import { BaseDataModel } from '../data/BaseDataModel';

/**
 * Configuration options for DOPAdapter
 */
export interface DOPAdapterConfig {
  errorHandlingStrategy?: ValidationErrorHandlingStrategies;
  enableStateMinimization?: boolean;
  stateTypes?: StateType[];
  initialStateType?: StateType;
  validateOnTransition?: boolean;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  code: string;
  message: string;
  path?: string;
  details?: any;
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  code: string;
  message: string;
  path?: string;
  details?: any;
}

/**
 * Interface for the DOPAdapter
 * This is the core interface for the Dual-Paradigm Adapter pattern
 */
export interface DOPAdapter<S, E extends string = string> {
  /**
   * Get the current state
   */
  getState(): S;
  
  /**
   * Set the state
   * @param newState The new state
   */
  setState(newState: S): void;
  
  /**
   * Apply a transition to the current state
   * @param event The event triggering the transition
   * @param payload Optional payload data for the transition
   */
  applyTransition(event: E, payload?: any): void;
=======
 * Concrete implementation of the Data-Oriented Programming Adapter.
 * This class serves as a translation layer between functional and OOP programming paradigms
 * and implements Nnamdi Okpala's automaton state minimization technology.
 * 
 * @author Implementation based on Nnamdi Okpala's design
 */

import { DataModel, DataModelImpl } from '../data/DataModel';
import { BehaviorModel, BehaviorModelImpl } from '../behavior/BehaviorModel';
import { ValidationResult } from '../validation/ValidationResult';
import { ExecutionTrace } from '../common/ExecutionTrace';
import { StateMachineMinimizer } from '../automaton/StateMachineMinimizer';

/**
 * Interface for the DOP Adapter
 * 
 * @template T The data model type
 * @template R The result type
 */
export interface DOPAdapter<T extends DataModel<T>, R> {
  /**
   * Gets the data model
   * 
   * @returns The data model
   */
  getDataModel(): T;
  
  /**
   * Gets the behavior model
   * 
   * @returns The behavior model
   */
  getBehaviorModel(): BehaviorModel<T, R>;
  
  /**
   * Applies the behavior to the data model
   * 
   * @param data The data model to process
   * @returns The result of the operation
   */
  adapt(data: T): R;
  
  /**
   * Enables or disables caching
   * 
   * @param enabled Whether to enable caching
   */
  setCachingEnabled(enabled: boolean): void;
  
  /**
   * Clears the result cache
   */
  clearCache(): void;
}

/**
 * Concrete implementation of the DOP Adapter
 * 
 * @template T The data model type
 * @template R The result type
 */
export class DOPAdapterImpl<T extends DataModel<T>, R> implements DOPAdapter<T, R> {
  /**
   * The data model
   */
  protected _dataModel: T;
  
  /**
   * The behavior model
   */
  protected _behaviorModel: BehaviorModel<T, R>;
  
  /**
   * The state machine minimizer
   */
  protected _minimizer: StateMachineMinimizer;
>>>>>>> dev
  
  /**
   * Subscribe to state changes
   * @param listener The listener function
   * @returns A function to unsubscribe
   */
<<<<<<< HEAD
  subscribe(listener: (state: S) => void): () => void;
  
  /**
   * Validate the current state and behavior model
   * @returns Validation result
   */
  validate(): ValidationResult;
  
  /**
   * Get the current state type
   */
  getStateType(): StateType;
  
  /**
   * Set the state type
   * @param stateType The new state type
   */
  setStateType(stateType: StateType): void;
  
  /**
   * Optimize the state machine by minimizing redundant states
   */
  optimize(): void;
}

/**
 * Base implementation of the DOPAdapter
 * This provides the foundation for both OOP and functional implementations
 */
export abstract class BaseDOPAdapter<S, E extends string = string> implements DOPAdapter<S, E> {
  protected dataModel: BaseDataModel<S>;
  protected behaviorModel: BehaviorModel<S, E>;
  protected listeners: Set<(state: S) => void> = new Set();
  protected errorHandlingStrategy: ValidationErrorHandlingStrategies;
  protected stateType: StateType;
  protected enableStateMinimization: boolean;
  protected validateOnTransition: boolean;
  
  /**
   * Create a new BaseDOPAdapter instance
   * @param config Configuration options
   */
  constructor(config: DOPAdapterConfig = {}) {
    this.errorHandlingStrategy = config.errorHandlingStrategy || ValidationErrorHandlingStrategies.THROW;
    this.enableStateMinimization = config.enableStateMinimization !== false;
    this.stateType = config.initialStateType || StateType.INITIAL;
    this.validateOnTransition = config.validateOnTransition !== false;
    
    // Create the data and behavior models
    this.dataModel = this.createDataModel();
    this.behaviorModel = this.createBehaviorModel();
    
    // Apply initial optimization if enabled
    if (this.enableStateMinimization) {
      this.optimize();
    }
  }
  
  /**
   * Create the data model
   * This method should be implemented by subclasses
   */
  protected abstract createDataModel(): BaseDataModel<S>;
  
  /**
   * Create the behavior model
   * This method should be implemented by subclasses
   */
  protected abstract createBehaviorModel(): BehaviorModel<S, E>;
  
  /**
   * Get the current state
   */
  public getState(): S {
    return this.dataModel.getState();
  }
  
  /**
   * Set the state
   * @param newState The new state
   */
  public setState(newState: S): void {
    const oldState = this.dataModel.getState();
    this.dataModel.setState(newState);
    
    // Notify listeners of the state change
    this.notifyListeners(newState, oldState);
  }
  
  /**
   * Apply a transition to the current state
   * @param event The event triggering the transition
   * @param payload Optional payload data for the transition
   */
  public applyTransition(event: E, payload?: any): void {
    // Set the state type to PROCESSING during the transition
    const previousStateType = this.stateType;
    this.setStateType(StateType.PROCESSING);
    
    try {
      // Get the current state
      const currentState = this.getState();
      
      // Validate before transition if enabled
      if (this.validateOnTransition) {
        const validationResult = this.validate();
        if (!validationResult.isValid) {
          this.handleValidationErrors(validationResult.errors);
        }
      }
      
      // Execute the transition
      const updatedState = this.behaviorModel.executeTransition(event, currentState, payload);
      
      // Update the state
      this.setState(updatedState);
      
      // Set the state type back to the previous state or to ACTIVE
      this.setStateType(previousStateType === StateType.INITIAL ? StateType.ACTIVE : previousStateType);
    } catch (error) {
      // Set the state type to ERROR if an exception occurred
      this.setStateType(StateType.ERROR);
      
      // Re-throw the error
      throw error;
    }
  }
  
  /**
   * Subscribe to state changes
   * @param listener The listener function
   * @returns A function to unsubscribe
   */
  public subscribe(listener: (state: S) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  /**
   * Validate the current state and behavior model
   * @returns Validation result
   */
  public validate(): ValidationResult {
    // Validate the data model
    const dataValidation = this.dataModel.validate();
    
    // Validate the behavior model
    const behaviorValidation = this.behaviorModel.validate();
    
    // Combine the validation results
    const isValid = dataValidation.isValid && behaviorValidation.isValid;
    const errors = [
      ...(dataValidation.errors || []),
      ...(behaviorValidation.errors || [])
    ];
    
    const warnings = [
      ...(dataValidation.warnings || []),
      ...(behaviorValidation.warnings || [])
    ];
    
    return { isValid, errors, warnings };
  }
  
  /**
   * Get the current state type
   */
  public getStateType(): StateType {
    return this.stateType;
  }
  
  /**
   * Set the state type
   * @param stateType The new state type
   */
  public setStateType(stateType: StateType): void {
    this.stateType = stateType;
  }
  
  /**
   * Optimize the state machine by minimizing redundant states
   * This is a placeholder - the actual implementation would use the automaton minimization algorithm
   */
  public optimize(): void {
    // In a real implementation, this would use the automaton minimization algorithm
    // For now, it's just a placeholder
    console.log('Optimizing state machine...');
  }
  
  /**
   * Notify listeners of a state change
   * @param newState The new state
   * @param oldState The old state
   */
  protected notifyListeners(newState: S, oldState: S): void {
    for (const listener of this.listeners) {
      try {
        listener(newState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    }
  }
  
  /**
   * Handle validation errors based on the configured strategy
   * @param errors The validation errors
   */
  protected handleValidationErrors(errors: ValidationError[]): void {
    switch (this.errorHandlingStrategy) {
      case ValidationErrorHandlingStrategies.THROW:
        throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
      
      case ValidationErrorHandlingStrategies.LOG:
        console.error('Validation errors:', errors);
        break;
      
      case ValidationErrorHandlingStrategies.REPORT:
        // In a real implementation, this would report to a reporting system
        console.warn('Validation errors reported:', errors);
        break;
      
      case ValidationErrorHandlingStrategies.IGNORE:
        // Do nothing
        break;
      
      case ValidationErrorHandlingStrategies.CUSTOM:
        this.customErrorHandler(errors);
        break;
      
      default:
        console.warn('Unknown error handling strategy:', this.errorHandlingStrategy);
        console.error('Validation errors:', errors);
    }
  }
  
  /**
   * Custom error handler for validation errors
   * This method can be overridden by subclasses
   * @param errors The validation errors
   */
  protected customErrorHandler(errors: ValidationError[]): void {
    // Default implementation does nothing
    // Subclasses can override this to provide custom error handling
  }
}

/**
 * Factory function to create a DOPAdapter
 * @param config The adapter configuration
 * @param dataModel The data model
 * @param behaviorModel The behavior model
 * @returns A new DOPAdapter instance
 */
export function createDOPAdapter<S, E extends string = string>(
  config: DOPAdapterConfig,
  dataModel: BaseDataModel<S>,
  behaviorModel: BehaviorModel<S, E>
): DOPAdapter<S, E> {
  return new ConcreteDOPAdapter(config, dataModel, behaviorModel);
}

/**
 * Concrete implementation of the DOPAdapter
 * This is used by the factory function
 */
class ConcreteDOPAdapter<S, E extends string = string> extends BaseDOPAdapter<S, E> {
  private _dataModel: BaseDataModel<S>;
  private _behaviorModel: BehaviorModel<S, E>;
  
  /**
   * Create a new ConcreteDOPAdapter instance
   * @param config The adapter configuration
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   */
  constructor(
    config: DOPAdapterConfig,
    dataModel: BaseDataModel<S>,
    behaviorModel: BehaviorModel<S, E>
  ) {
    super(config);
    this._dataModel = dataModel;
    this._behaviorModel = behaviorModel;
  }
  
  /**
   * Create the data model
   */
  protected createDataModel(): BaseDataModel<S> {
    return this._dataModel;
  }
  
  /**
   * Create the behavior model
   */
  protected createBehaviorModel(): BehaviorModel<S, E> {
    return this._behaviorModel;
=======
  protected _cachingEnabled: boolean = false;
  
  /**
   * Result cache for optimized processing
   */
  protected _resultCache: Map<string, R> = new Map();
  
  /**
   * Whether execution tracing is enabled
   */
  protected _tracingEnabled: boolean = false;
  
  /**
   * Execution traces for debugging and monitoring
   */
  protected _traces: ExecutionTrace[] = [];
  
  /**
   * Creates a new DOPAdapterImpl instance
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   * @param options Additional options
   */
  constructor(
    dataModel: T,
    behaviorModel: BehaviorModel<T, R>,
    options: {
      cachingEnabled?: boolean;
      tracingEnabled?: boolean;
      minimizer?: StateMachineMinimizer;
    } = {}
  ) {
    this._dataModel = dataModel;
    this._behaviorModel = behaviorModel;
    this._cachingEnabled = options.cachingEnabled || false;
    this._tracingEnabled = options.tracingEnabled || false;
    this._minimizer = options.minimizer || new StateMachineMinimizer();
    
    // Initialize if needed
    this.initialize();
  }
  
  /**
   * Initializes the adapter
   */
  protected initialize(): void {
    // Apply state minimization if we have a real minimizer
    if (this._minimizer && typeof this._minimizer.optimize === 'function') {
      try {
        this._minimizer.optimize(this._behaviorModel);
      } catch (error) {
        console.error('Error during state minimization:', error);
      }
    }
  }
  
  /**
   * Gets the data model
   * 
   * @returns The data model
   */
  public getDataModel(): T {
    return this._dataModel;
  }
  
  /**
   * Gets the behavior model
   * 
   * @returns The behavior model
   */
  public getBehaviorModel(): BehaviorModel<T, R> {
    return this._behaviorModel;
  }
  
  /**
   * Applies the behavior to the data model
   * 
   * @param data The data model to process
   * @returns The result of the operation
   */
  public adapt(data: T): R {
    // Create execution trace if tracing is enabled
    let trace: ExecutionTrace | undefined;
    if (this._tracingEnabled) {
      trace = ExecutionTrace.start('adapt', {
        behaviorId: this._behaviorModel.getBehaviorId(),
        dataSignature: data.getMinimizationSignature()
      });
    }
    
    try {
      // Check cache if enabled
      if (this._cachingEnabled) {
        const cacheKey = this.generateCacheKey(data);
        
        if (this._resultCache.has(cacheKey)) {
          // Complete trace if enabled
          if (trace) {
            trace.end({
              success: true,
              cached: true
            });
            this._traces.push(trace);
          }
          
          return this._resultCache.get(cacheKey)!;
        }
      }
      
      // Apply behavior
      const result = this._behaviorModel.process(data);
      
      // Cache result if enabled
      if (this._cachingEnabled) {
        const cacheKey = this.generateCacheKey(data);
        this._resultCache.set(cacheKey, result);
      }
      
      // Complete trace if enabled
      if (trace) {
        trace.end({
          success: true,
          cached: false
        });
        this._traces.push(trace);
      }
      
      return result;
    } catch (error) {
      // Complete trace with error if enabled
      if (trace) {
        trace.end({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        this._traces.push(trace);
      }
      
      // Rethrow the error
      throw error;
    }
  }
  
  /**
   * Enables or disables caching
   * 
   * @param enabled Whether to enable caching
   */
  public setCachingEnabled(enabled: boolean): void {
    this._cachingEnabled = enabled;
    
    // Clear cache if disabling
    if (!enabled) {
      this.clearCache();
    }
  }
  
  /**
   * Checks if caching is enabled
   * 
   * @returns True if caching is enabled
   */
  public isCachingEnabled(): boolean {
    return this._cachingEnabled;
  }
  
  /**
   * Clears the result cache
   */
  public clearCache(): void {
    this._resultCache.clear();
  }
  
  /**
   * Enables or disables execution tracing
   * 
   * @param enabled Whether to enable tracing
   */
  public setTracingEnabled(enabled: boolean): void {
    this._tracingEnabled = enabled;
    
    // Also enable tracing in the behavior model if it supports it
    if (this._behaviorModel instanceof BehaviorModelImpl) {
      this._behaviorModel.setTracingEnabled(enabled);
    }
  }
  
  /**
   * Checks if execution tracing is enabled
   * 
   * @returns True if tracing is enabled
   */
  public isTracingEnabled(): boolean {
    return this._tracingEnabled;
  }
  
  /**
   * Gets all execution traces
   * 
   * @returns Array of execution traces
   */
  public getTraces(): ExecutionTrace[] {
    return [...this._traces];
  }
  
  /**
   * Clears all execution traces
   */
  public clearTraces(): void {
    this._traces.length = 0;
    
    // Also clear traces in the behavior model if it supports it
    if (this._behaviorModel instanceof BehaviorModelImpl) {
      this._behaviorModel.clearTraces();
    }
  }
  
  /**
   * Generates a cache key for a data model
   * 
   * @param data The data model
   * @returns Cache key
   */
  public generateCacheKey(data: T): string {
    return `${this._behaviorModel.getBehaviorId()}:${data.getMinimizationSignature()}`;
  }
  
  /**
   * Creates a DOP adapter for functional programming
   * 
   * @param dataModel The data model
   * @param transitions Map of transition functions
   * @param options Additional options
   * @returns A new DOPAdapterImpl instance
   */
  public static createFunctional<S, T extends DataModelImpl<S>, R>(
    dataModel: T,
    transitions: Record<string, (state: S, payload?: any) => S>,
    processFunction: (data: T) => R,
    options: {
      behaviorId?: string;
      description?: string;
      cachingEnabled?: boolean;
      tracingEnabled?: boolean;
      minimizer?: StateMachineMinimizer;
    } = {}
  ): DOPAdapterImpl<T, R> {
    const behaviorId = options.behaviorId || 'functional-behavior';
    const description = options.description || 'Functional programming behavior';
    
    // Create behavior model
    const behaviorModel = new BehaviorModelImpl<S, T, R>(
      behaviorId,
      transitions,
      processFunction,
      {
        description,
        tracingEnabled: options.tracingEnabled
      }
    );
    
    // Create adapter
    return new DOPAdapterImpl<T, R>(
      dataModel,
      behaviorModel,
      {
        cachingEnabled: options.cachingEnabled,
        tracingEnabled: options.tracingEnabled,
        minimizer: options.minimizer
      }
    );
  }
  
  /**
   * Creates a DOP adapter for OOP programming
   * 
   * @param component The OOP component
   * @param options Additional options
   * @returns A new DOPAdapterImpl instance
   */
  public static createOOP<T extends DataModel<T>, R>(
    dataModel: T,
    component: any,
    options: {
      behaviorId?: string;
      description?: string;
      cachingEnabled?: boolean;
      tracingEnabled?: boolean;
      minimizer?: StateMachineMinimizer;
    } = {}
  ): DOPAdapterImpl<T, R> {
    const behaviorId = options.behaviorId || 'oop-behavior';
    const description = options.description || 'OOP behavior';
    
    // Extract transitions from the component
    const transitions = new Map<string, (data: any, payload?: any) => any>();
    
    // Get all methods that are not prefixed with _ and are functions
    for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(component))) {
      if (key.startsWith('_')) continue;
      if (key === 'constructor') continue;
      
      const value = component[key];
      if (typeof value === 'function') {
        // Bind the method to the component and add to transitions
        transitions.set(key, value.bind(component));
      }
    }
    
    // Create behavior model
    const behaviorModel = new BehaviorModelImpl<any, T, R>(
      behaviorId,
      transitions,
      (data: T) => {
        // Use process method if available, otherwise just return the data
        if (typeof component.process === 'function') {
          return component.process(data);
        }
        return data as unknown as R;
      },
      {
        description,
        tracingEnabled: options.tracingEnabled
      }
    );
    
    // Create adapter
    return new DOPAdapterImpl<T, R>(
      dataModel,
      behaviorModel,
      {
        cachingEnabled: options.cachingEnabled,
        tracingEnabled: options.tracingEnabled,
        minimizer: options.minimizer
      }
    );
>>>>>>> dev
  }
}