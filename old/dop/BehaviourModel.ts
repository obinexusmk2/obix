/**
 * BehaviourModel.ts
 * 
 * Core BehaviorModel interface and implementations for the DOP (Data-Oriented Programming) pattern
 * in the OBIX framework. This component defines behavior operations that can be
 * performed on pure data models, maintaining separation of data and behavior.
 * 
 * The implementation leverages Nnamdi Okpala's automaton state minimization technology
 * to ensure optimal performance and perfect 1:1 correspondence between functional and OOP
 * implementations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { BaseBehaviorModel } from "./BaseBehaviorModel";
import { DataModel } from "./BaseDataModel";
import { ImplementationComparisonResult } from "./ImplementationComparisonResult";
import { OptimizationResult } from "./OptimizedResult";
import { ValidationResult } from "./ValidationResult";
import { ExecutionTrace } from "../../../src/core/validation/errors/ExecutionTrace";
import { ValidationError } from "../../../src/core/validation/errors/ValidationError";
import { ErrorSeverity } from "../../../src/core/validation/errors/ErrorHandler";

/**
 * Result of a behavior operation
 * 
 * @template T The data model type
 */
export interface BehaviorResult<T> {
  /**
   * The original data model
   */
  original: T;
  
  /**
   * The result of the operation
   */
  result: T;
}

/**
 * Base interface for all behavior models in the DOP pattern
 * Represents operations that can be performed on data models
 * 
 * @template T The type of data model this behavior operates on
 * @template R The return type for operations (often the same as T)
 */
export interface BehaviorModel<T extends DataModel<T>, R = T> {
  /**
   * Performs operations on the provided data model
   * 
   * @param data The data model to operate on
   * @returns Result of the operation (typically a new data model)
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
   * Compares this behavior model's result with another validation result
   * 
   * @param oopResult The validation result to compare with
   * @returns Implementation comparison result
   */
  compareWith(oopResult: ValidationResult<any>): ImplementationComparisonResult;

  /**
   * Validates the data model
   * 
   * @param dataModel The data model to validate
   * @returns Validation result
   */
  validate(dataModel: T): ValidationResult<T>;
}

/**
 * Abstract base implementation of BehaviorModel with common functionality
 * 
 * @template T The data model type
 * @template R The result type
 */
export abstract class AbstractBehaviorModel<T extends DataModel<T>, R = T> implements BehaviorModel<T, R> {
  /**
   * Unique identifier for this behavior
   */
  protected id: string;
  
  /**
   * Description of what this behavior does
   */
  protected description: string;
  
  /**
   * Whether to trace execution for debugging and comparison
   */
  protected tracingEnabled: boolean;
  
  /**
   * Constructor
   * 
   * @param id Unique identifier
   * @param description Behavior description
   * @param tracingEnabled Whether to enable execution tracing
   */
  constructor(id: string, description: string, tracingEnabled: boolean = false) {
    this.id = id;
    this.description = description;
    this.tracingEnabled = tracingEnabled;
  }
  
  /**
   * Abstract method to be implemented by subclasses
   */
  public abstract process(data: T): R;
  
  /**
   * Gets the unique identifier for this behavior
   * 
   * @returns Behavior identifier
   */
  public getBehaviorId(): string {
    return this.id;
  }
  
  /**
   * Gets the description of this behavior
   * 
   * @returns Behavior description
   */
  public getDescription(): string {
    return this.description;
  }
  
  /**
   * Enables or disables execution tracing
   * 
   * @param enabled Whether to enable tracing
   * @returns This behavior model for method chaining
   */
  public setTracingEnabled(enabled: boolean): AbstractBehaviorModel<T, R> {
    this.tracingEnabled = enabled;
    return this;
  }
  
  /**
   * Checks if execution tracing is enabled
   * 
   * @returns True if tracing is enabled
   */
  public isTracingEnabled(): boolean {
    return this.tracingEnabled;
  }
  
  /**
   * Validates the data model
   * 
   * @param dataModel The data model to validate
   * @returns Validation result
   */
  public validate(dataModel: T): ValidationResult<T> {
    // Create execution trace if tracing is enabled
    let trace: ExecutionTrace | undefined;
    if (this.tracingEnabled) {
      trace = ExecutionTrace.start(`validate-${this.id}`, {
        behaviorId: this.id,
        validationStart: true,
        dataSignature: dataModel.getMinimizationSignature()
      });
    }
    
    try {
      // Perform validation
      const result = this.validateInternal(dataModel);
      
      // Complete trace if enabled
      if (trace) {
        trace.end({
          isValid: result.isValid,
          errorCount: result.errors.length,
          validationComplete: true
        });
        
        // Add trace to result
        result.addTrace(trace);
      }
      
      return result;
    } catch (error) {
      // Handle validation errors
      const validationError = new ValidationError(
        'VALIDATION_ERROR',
        `Error validating with behavior "${this.id}": ${error instanceof Error ? error.message : String(error)}`,
        'AbstractBehaviorModel',
        'behavior',
        ErrorSeverity.ERROR,
        { behaviorId: this.id }
      );
      
      // Complete trace with error if enabled
      if (trace) {
        trace.end({
          success: false,
          error: validationError.message
        });
      }
      
      // Return invalid result
      return ValidationResult.createInvalid(validationError, dataModel);
    }
  }
  
  /**
   * Internal validation implementation
   * 
   * @param dataModel The data model to validate
   * @returns Validation result
   */
  protected validateInternal(dataModel: T): ValidationResult<T> {
    // Default implementation checks for null or undefined
    if (!dataModel) {
      return ValidationResult.createInvalid(
        new ValidationError(
          'NULL_DATA_MODEL',
          'Data model cannot be null or undefined',
          'AbstractBehaviorModel',
          'behavior',
          ErrorSeverity.ERROR
        ),
        dataModel as T
      );
    }
    
    const result = ValidationResult.createValid<T>();
    result.data = dataModel;
    return result;
  }
  
  /**
   * Compares this behavior model's result with another validation result
   * 
   * @param oopResult The validation result to compare with
   * @returns Implementation comparison result
   */
  public compareWith(oopResult: ValidationResult<any>): ImplementationComparisonResult {
    try {
      // Validate the same data with this behavior model
      const funcResult = this.validate(oopResult.data as T);
      
      // Check for validity differences
      const divergences: Map<string, [any, any]> = new Map();
      
      if (funcResult.isValid !== oopResult.isValid) {
        divergences.set('isValid', [funcResult.isValid, oopResult.isValid]);
      }
      
      // Compare errors
      if (funcResult.errors.length !== oopResult.errors.length) {
        divergences.set('errors.length', [funcResult.errors.length, oopResult.errors.length]);
      }
      
      // Compare errors in detail (simplified for basic comparison)
      const minErrors = Math.min(funcResult.errors.length, oopResult.errors.length);
      for (let i = 0; i < minErrors; i++) {
        const funcError = funcResult.errors[i];
        const oopError = oopResult.errors[i];
        
        if (funcError && oopError && funcError.message !== oopError.message) {
          divergences.set(`errors[${i}].message`, [funcError.message, oopError.message]);
        }
      }
      
      // Compare execution traces if available
      const traceComparisons: Record<string, any>[] = [];
      const funcTraces = funcResult.traces || [];
      const oopTraces = oopResult.traces || [];
      
      const minTraces = Math.min(funcTraces.length, oopTraces.length);
      for (let i = 0; i < minTraces; i++) {
        const funcTrace = funcTraces[i];
        const oopTrace = oopTraces[i];
        
        if (funcTrace && oopTrace) {
          const traceComparison = funcTrace.compareWith(oopTrace);
          
          if (!traceComparison.equivalent) {
            traceComparisons.push({
              index: i,
              comparison: traceComparison.toObject()
            });
          }
        }
      }
      
      // Determine if implementations are equivalent
      const equivalent = divergences.size === 0 && traceComparisons.length === 0;
      
      // Create mismatches if not equivalent
      const mismatches: any[] = [];
      if (!equivalent) {
        for (const [path, [expected, actual]] of divergences.entries()) {
          mismatches.push({
            path,
            expected,
            actual,
            message: `Expected ${path} to be ${expected}, but got ${actual}`,
            severity: ErrorSeverity.MEDIUM
          });
        }
        
        // Add trace mismatches if any
        if (traceComparisons.length > 0) {
          mismatches.push({
            path: 'execution_traces',
            expected: 'equivalent execution paths',
            actual: `${traceComparisons.length} trace divergences`,
            message: `Execution traces diverged at ${traceComparisons.length} points`,
            severity: ErrorSeverity.MEDIUM
          });
        }
      }
      
      return new ImplementationComparisonResult(
        equivalent,
        mismatches,
        {
          thisResult: funcResult.getSummary(),
          otherResult: oopResult.getSummary(),
          divergences: Object.fromEntries(divergences),
          traceComparisons
        }
      );
    } catch (error) {
      // Handle comparison errors
      const message = error instanceof Error ? error.message : String(error);
      
      return new ImplementationComparisonResult(
        false,
        [{
          path: 'comparison',
          expected: 'successful comparison',
          actual: `error: ${message}`,
          message: `Error during implementation comparison: ${message}`,
          severity: ErrorSeverity.ERROR
        }],
        {
          error: message
        }
      );
    }
  }
  
  /**
   * Creates an execution trace for this behavior
   * 
   * @param operation The operation being performed
   * @param input Input data for the operation
   * @returns A new execution trace
   */
  protected createTrace(operation: string, input: any): ExecutionTrace {
    return ExecutionTrace.start(`${this.id}.${operation}`, {
      behaviorId: this.id,
      operation,
      inputSignature: typeof input === 'object' && input !== null && 'getMinimizationSignature' in input ? input.getMinimizationSignature() : typeof input
    });
  }
}

/**
 * A behavior model that validates a data model
 * 
 * @template T The data model type
 */
export abstract class ValidationBehavior<T extends DataModel<T>> extends BaseBehaviorModel<T, ValidationResult<T>> {
  /**
   * Creates a new validation behavior
   * 
   * @param id Unique identifier
   * @param description Behavior description
   */
  constructor(id: string, description: string) {
    super(id, description);
  }
  
  /**
   * Validates a data model
   * 
   * @param data The data model to validate
   * @returns Validation result
   */
  abstract override process(data: T): ValidationResult<T>;
}

/**
 * A behavior model that transforms one data model to another
 * 
 * @template T The source data model type
 * @template R The target data model type
 */
export abstract class TransformBehavior<T extends DataModel<T>, R extends DataModel<R>> extends AbstractBehaviorModel<T, R> {
  /**
   * Creates a new transform behavior
   * 
   * @param id Unique identifier
   * @param description Behavior description
   */
  constructor(id: string, description: string) {
    super(id, description);
  }
  
  /**
   * Transforms a source data model to a target data model
   * 
   * @param data The source data model
   * @returns The transformed target data model
   */
  abstract override process(data: T): R;
}

/**
 * A behavior model that optimizes a data model
 * 
 * @template T The data model type
 */
export abstract class OptimizationBehavior<T extends DataModel<T>> extends AbstractBehaviorModel<T, OptimizationResult<T>> {
  /**
   * Creates a new optimization behavior
   * 
   * @param id Unique identifier
   * @param description Behavior description
   */
  constructor(id: string, description: string) {
    super(id, description);
  }
  
  /**
   * Optimizes a data model
   * 
   * @param data The data model to optimize
   * @returns Optimization result
   */
  abstract override process(data: T): OptimizationResult<T>;
}

/**
 * A behavior model with no side effects that performs a pure operation
 * 
 * @template T The data model type
 * @template R The result type
 */
export abstract class PureBehavior<T extends DataModel<T>, R> extends AbstractBehaviorModel<T, R> {
  /**
   * Creates a new pure behavior
   * 
   * @param id Unique identifier
   * @param description Behavior description
   */
  constructor(id: string, description: string) {
    super(id, description);
  }
  
  /**
   * Performs a pure operation on the data model
   * 
   * @param data The data model to operate on
   * @returns Result of the operation
   */
  abstract override process(data: T): R;
}

/**
 * A composite behavior model that chains multiple behaviors together
 * 
 * @template T The data model type
 */
export class CompositeBehavior<T extends DataModel<T>> extends AbstractBehaviorModel<T, T> {
  /**
   * The behaviors to apply in sequence
   */
  private behaviors: BehaviorModel<T, T>[];
  
  /**
   * Creates a new composite behavior
   * 
   * @param id Unique identifier
   * @param description Behavior description
   * @param behaviors The behaviors to apply in sequence
   */
  constructor(id: string, description: string, behaviors: BehaviorModel<T, T>[] = []) {
    super(id, description);
    this.behaviors = [...behaviors];
  }
  
  /**
   * Adds a behavior to the composite
   * 
   * @param behavior The behavior to add
   * @returns This composite behavior for method chaining
   */
  public addBehavior(behavior: BehaviorModel<T, T>): CompositeBehavior<T> {
    this.behaviors.push(behavior);
    return this;
  }
  
  /**
   * Gets the behaviors in this composite
   * 
   * @returns Array of behaviors
   */
  public getBehaviors(): BehaviorModel<T, T>[] {
    return [...this.behaviors];
  }
  
  /**
   * Applies all behaviors in sequence
   * 
   * @param data The data model to process
   * @returns The processed data model
   */
  public override process(data: T): T {
    // Create execution trace if tracing is enabled
    let trace: ExecutionTrace | undefined;
    if (this.tracingEnabled) {
      trace = this.createTrace('process', data);
    }
    
    try {
      // Apply each behavior in sequence
      let result = data;
      
      for (const behavior of this.behaviors) {
        result = behavior.process(result);
      }
      
      // Complete trace if enabled
      if (trace) {
        trace.end({
          success: true,
          behaviorCount: this.behaviors.length,
          resultSignature: result.getMinimizationSignature()
        });
      }
      
      return result;
    } catch (error) {
      // Handle processing errors
      // Complete trace with error if enabled
      if (trace) {
        trace.end({
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // Rethrow to propagate the error
      throw error;
    }
  }
  
  /**
   * Clones this composite behavior
   * 
   * @returns A new composite behavior with the same configuration
   */
  public clone(): CompositeBehavior<T> {
    return new CompositeBehavior<T>(this.id, this.description, [...this.behaviors]);
  }
}