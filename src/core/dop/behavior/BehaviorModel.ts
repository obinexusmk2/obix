/**
 * BehaviorModel.ts
 * 
 * Concrete implementation of the Behavior Model in the DOP pattern.
 * Implements transitions and operations on data models.
 * 
 * @author Implementation based on Nnamdi Okpala's design
 */

import { DataModel, DataModelImpl } from '../data/DataModel';
import { ValidationResult } from '../validation/ValidationResult';
import { ExecutionTrace } from '../common/ExecutionTrace';
import { ImplementationComparisonResult, ErrorSeverity } from '../common/ImplementationComparisonResult';

/**
 * Type for a transition function that transforms state
 */
export type TransitionFunction<S> = (state: S, payload?: any) => S;

/**
 * Interface for all behavior models used with the DOP Adapter pattern
 */
export interface BehaviorModel<T extends DataModel<T>, R = T> {
  /**
   * Applies behavior to the data model
   * 
   * @param data The data model to operate on
   * @returns The result of the operation
   */
  process(data: T): R;
  
  /**
   * Gets a unique identifier for this behavior
   */
  getBehaviorId(): string;
  
  /**
   * Gets a description of this behavior
   */
  getDescription(): string;
  
  /**
   * Compares this behavior with another implementation
   * 
   * @param other The other implementation result to compare with
   */
  compareWith(other: ValidationResult<any>): ImplementationComparisonResult;
  
  /**
   * Validates the data model
   * 
   * @param data The data model to validate
   */
  validate(data: T): ValidationResult<T>;
}

/**
 * Concrete implementation of BehaviorModel
 * 
 * @template S The state type
 * @template T The data model type
 * @template R The result type
 */
export class BehaviorModelImpl<S, T extends DataModel<T>, R = T> implements BehaviorModel<T, R> {
  /**
   * Unique identifier for this behavior
   */
  private readonly _id: string;
  
  /**
   * Description of this behavior
   */
  private readonly _description: string;
  
  /**
   * Map of transition names to transition functions
   */
  private readonly _transitions: Map<string, TransitionFunction<S>>;
  
  /**
   * Execution traces for debugging and monitoring
   */
  private readonly _traces: ExecutionTrace[] = [];
  
  /**
   * Whether to enable transition tracing
   */
  private _tracingEnabled: boolean;
  
  /**
   * Process function that applies the behavior to the data model
   */
  private readonly _processFunction: (data: T) => R;
  
  /**
   * Creates a new BehaviorModelImpl instance
   * 
   * @param id Unique identifier
   * @param transitions Map of transition names to transition functions
   * @param processFunction Custom process function
   * @param options Additional options
   */
  constructor(
    id: string,
    transitions: Record<string, TransitionFunction<S>> | Map<string, TransitionFunction<S>>,
    processFunction: (data: T) => R,
    options: {
      description?: string;
      tracingEnabled?: boolean;
    } = {}
  ) {
    this._id = id;
    this._description = options.description || `Behavior model ${id}`;
    this._tracingEnabled = options.tracingEnabled || false;
    this._processFunction = processFunction;
    
    // Convert transitions to Map if needed
    if (transitions instanceof Map) {
      this._transitions = transitions;
    } else {
      this._transitions = new Map();
      for (const [name, fn] of Object.entries(transitions)) {
        this._transitions.set(name, fn);
      }
    }
  }
  
  /**
   * Gets a transition function by name
   * 
   * @param name The name of the transition
   * @returns The transition function
   * @throws Error if the transition doesn't exist
   */
  public getTransition(name: string): TransitionFunction<S> {
    const transition = this._transitions.get(name);
    if (!transition) {
      throw new Error(`Transition "${name}" not found in behavior "${this._id}"`);
    }
    return transition;
  }
  
  /**
   * Gets all transition names
   * 
   * @returns Array of transition names
   */
  public getTransitionNames(): string[] {
    return Array.from(this._transitions.keys());
  }
  
  /**
   * Gets all transitions
   * 
   * @returns Map of transition names to transition functions
   */
  public getTransitions(): Map<string, TransitionFunction<S>> {
    return new Map(this._transitions);
  }
  
  /**
   * Applies a transition to a state
   * 
   * @param name The name of the transition
   * @param state The state to transform
   * @param payload Optional payload for the transition
   * @returns The transformed state
   */
  public applyTransition(name: string, state: S, payload?: any): S {
    const transition = this.getTransition(name);
    
    // Create execution trace if tracing is enabled
    let trace: ExecutionTrace | undefined;
    if (this._tracingEnabled) {
      trace = ExecutionTrace.start(`transition:${name}`, {
        behaviorId: this._id,
        transition: name,
        hasPayload: payload !== undefined,
      });
    }
    
    try {
      // Apply the transition
      const result = transition(state, payload);
      
      // Complete trace if enabled
      if (trace) {
        trace.end({ success: true });
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
   * Applies behavior to the data model
   * 
   * @param data The data model to operate on
   * @returns The result of the operation
   */
  public process(data: T): R {
    // Create execution trace if tracing is enabled
    let trace: ExecutionTrace | undefined;
    if (this._tracingEnabled) {
      trace = ExecutionTrace.start(`process:${this._id}`, {
        behaviorId: this._id,
        dataSignature: data.getMinimizationSignature()
      });
    }
    
    try {
      // Apply the process function
      const result = this._processFunction(data);
      
      // Complete trace if enabled
      if (trace) {
        trace.end({ success: true });
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
   * Gets the unique identifier for this behavior
   * 
   * @returns Behavior identifier
   */
  public getBehaviorId(): string {
    return this._id;
  }
  
  /**
   * Gets the description of this behavior
   * 
   * @returns Behavior description
   */
  public getDescription(): string {
    return this._description;
  }
  
  /**
   * Sets whether transition tracing is enabled
   * 
   * @param enabled Whether to enable tracing
   */
  public setTracingEnabled(enabled: boolean): void {
    this._tracingEnabled = enabled;
  }
  
  /**
   * Checks if tracing is enabled
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
  }
  
  /**
   * Compares this behavior with another implementation
   * 
   * @param other The other implementation result to compare with
   * @returns Implementation comparison result
   */
  public compareWith(other: ValidationResult<any>): ImplementationComparisonResult {
    // This is a simplified implementation - a real implementation would compare
    // trace execution paths, outputs, and state transformations
    
    const result = this.validate(other.data as T);
    const isEquivalent = result.isValid === other.isValid;
    
    const differences = [];
    if (result.isValid !== other.isValid) {
      differences.push({
        path: 'isValid',
        expected: result.isValid,
        actual: other.isValid,
        message: `Validation result mismatch: expected ${result.isValid}, got ${other.isValid}`,
        severity: ErrorSeverity.HIGH
      });
    }
    
    // Compare error counts
    if (result.errors.length !== other.errors.length) {
      differences.push({
        path: 'errors.length',
        expected: result.errors.length,
        actual: other.errors.length,
        message: `Error count mismatch: expected ${result.errors.length}, got ${other.errors.length}`,
        severity: ErrorSeverity.MEDIUM
      });
    }
    
    return new ImplementationComparisonResult(
      isEquivalent,
      differences,
      {
        behaviorId: this._id,
        traceCount: this._traces.length
      }
    );
  }
  
  /**
   * Validates the data model
   * 
   * @param data The data model to validate
   * @returns Validation result
   */
  public validate(data: T): ValidationResult<T> {
    // This is a simplified implementation - a real implementation would
    // validate the data model against a schema or rules
    
    // Create a basic validation result
    const result = new ValidationResult<T>(true, data);
    
    // Add the data model
    result.data = data;
    
    return result;
  }
  
  /**
   * Creates a new behavior model for validation
   * 
   * @param id Unique identifier
   * @param validateFn Validation function
   * @param options Additional options
   * @returns A new ValidationBehaviorModel instance
   */
  public static createValidation<T extends DataModel<T>>(
    id: string,
    validateFn: (data: T) => ValidationResult<T>,
    options: {
      description?: string;
      tracingEnabled?: boolean;
    } = {}
  ): BehaviorModelImpl<any, T, ValidationResult<T>> {
    return new BehaviorModelImpl<any, T, ValidationResult<T>>(
      id,
      new Map(),
      validateFn,
      options
    );
  }
  
  /**
   * Creates a new behavior model with state transitions
   * 
   * @param id Unique identifier
   * @param transitions Map of transition functions
   * @param options Additional options
   * @returns A new BehaviorModelImpl instance
   */
  public static createTransitions<S, T extends DataModelImpl<S>>(
    id: string,
    transitions: Record<string, TransitionFunction<S>>,
    options: {
      description?: string;
      tracingEnabled?: boolean;
    } = {}
  ): BehaviorModelImpl<S, T, T> {
    return new BehaviorModelImpl<S, T, T>(
      id,
      transitions,
      (data: T) => {
        return data;
      },
      options
    );
  }
}