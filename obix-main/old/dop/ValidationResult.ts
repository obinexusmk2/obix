/**
 * ValidationResult.ts
 * 
 * Implementation of the ValidationResult class for the OBIX validation system.
 * This class represents the outcome of a validation process, storing validation
 * status, errors, warnings, execution traces, and related metadata.
 * 
 * Copyright © 2025 OBINexus Computing
 */
import { ValidationError, ParserError } from '../../../src/core/validation/errors/ValidationError';
import { ExecutionTrace } from '../../../src/core/validation/errors/ExecutionTrace';
import { ImplementationComparisonResult, ImplementationDifference } from './ImplementationComparisonResult';
import { ErrorSeverity } from '../../../src/core/validation/errors/ErrorHandler';

/**
 * Represents the result of a validation operation, including validation status,
 * errors, warnings, execution traces, and associated metadata.
 */
export interface ValidationResult<T> {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ParserError[];
  traces: ExecutionTrace[];
  equivalent: boolean;
  metadata: Record<string, any>;
  data: T;
  severity: 'error' | 'warning' | 'info';
  timestamp: number;
  source: string;
  component: string;
  details: string;
  stackTrace: string;
  isRecoverable: boolean;
  recommendations: string[];
  relatedResults: ValidationResult<any>[];
  debugInfo: Record<string, any>;
}

export class ValidationResult<T> {
  /**
   * Whether the validation was successful (no errors)
   */
  public isValid: boolean;
  
  /**
   * Collection of validation errors detected during validation
   */
  public errors: ValidationError[];
  
  /**
   * Collection of validation warnings detected during validation
   * (issues that don't invalidate the validation but should be addressed)
   */
  
  /**
   * Collection of execution traces recorded during validation
   */
  public traces: ExecutionTrace[];
  public warnings: ParserError[];
  public equivalent: boolean;
  /**
   * Additional metadata about the validation process
   */
  public metadata: Record<string, any>;
  data: T;
  component: string;
  functionalImplementation: string;
  oopImplementation: string;
  
  /**
   * Creates a new ValidationResult instance
   */
  constructor(
    isValid: boolean,
    data: T,
    errors: ValidationError[] = [],
    warnings: ParserError[] = [],
    traces: ExecutionTrace[] = [],
    equivalent: boolean = true,
    component: string = '',
    functionalImplementation: string = '',
    oopImplementation: string = ''
  ) {
    this.isValid = isValid;
    this.data = data;
    this.errors = Array.isArray(errors) ? errors : [];
    this.warnings = Array.isArray(warnings) ? warnings : [];
    this.traces = Array.isArray(traces) ? traces : [];
    this.metadata = {};
    this.equivalent = equivalent;
    this.component = component;
    this.functionalImplementation = functionalImplementation;
    this.oopImplementation = oopImplementation;
  }
  /**
   * Adds an error to the validation result
   * 
   * @param error The validation error to add
   * @returns This ValidationResult instance for chaining
   */
  public addError(error: ValidationError): ValidationResult<T> {
    this.errors.push(error);
    this.isValid = false;
    return this;
  }
  
  /**
   * Adds a warning to the validation result
   * 
   * @param warning The validation warning to add
   * @returns This ValidationResult instance for chaining
   */
  public addWarning(warning: ParserError): ValidationResult<T> {
    this.warnings.push(warning);
    return this;
  }
  
  /**
   * Adds an execution trace to the validation result
   * 
   * @param trace The execution trace to add
   * @returns This ValidationResult instance for chaining
   */
  public addTrace(trace: ExecutionTrace): ValidationResult<T> {
    this.traces.push(trace);
    return this;
  }
  
  /**
   * Adds metadata to the validation result
   * 
   * @param key The metadata key
   * @param value The metadata value
   * @returns This ValidationResult instance for chaining
   */
  public addMetadata(key: string, value: any): ValidationResult<T> {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Adds a related validation result to this result
   * 
   * @param result The related validation result to add
   * @returns This ValidationResult instance for chaining
   */
  public addResult(result: ValidationResult<any>): ValidationResult<T> {
    if (!this.relatedResults) {
      this.relatedResults = [];
    }
    this.relatedResults.push(result);
    return this;
  }
  
  /**
   * Merges another validation result into this one
   * 
   * @param other The other validation result to merge
   * @returns A new ValidationResult containing merged data
   */
  public merge(other: ValidationResult<T>): ValidationResult<T> {
    return new ValidationResult<T>(
      this.isValid && other.isValid,
      this.data,
      [...this.errors, ...other.errors],
      [...this.warnings, ...other.warnings],
      [...this.traces, ...other.traces]
    ).addMetadata('mergedMetadata', { ...this.metadata, ...other.metadata });
  }
  
  /**
   * 
   */

  /**
   * Compares this validation result with another to identify differences
   * 
   * @param other The other validation result to compare against
   * @returns Comparison result with details about differences
   */
  public compareWith(other: ValidationResult<T>): ImplementationComparisonResult {
    // Check for basic property differences
    const divergences: Map<string, [any, any]> = new Map();
    
    if (this.isValid !== other.isValid) {
      divergences.set('isValid', [this.isValid, other.isValid]);
    }
    
    if (this.errors.length !== other.errors.length) {
      divergences.set('errors.length', [this.errors.length, other.errors.length]);
    }
    
    if (this.warnings.length !== other.warnings.length) {
      divergences.set('warnings.length', [this.warnings.length, other.warnings.length]);
    }
    
    if (this.traces.length !== other.traces.length) {
      divergences.set('traces.length', [this.traces.length, other.traces.length]);
    }
    
    // Compare traces in detail
    // Compare traces in detail
    const traceComparisons: Record<string, any>[] = [];
    const minTraces = Math.min(this.traces.length, other.traces.length);
    
    for (let i = 0; i < minTraces; i++) {
      const thisTrace = this.traces[i];
      const otherTrace = other.traces[i];
      if (thisTrace && otherTrace) {
        const traceComparison = thisTrace.compareWith(otherTrace);
        if (!traceComparison.equivalent) {
          traceComparisons.push({
            index: i,
            comparison: traceComparison.toObject()
          });
        }
      }
    }
      
    // If there are trace differences, add them to the divergences
    if (traceComparisons.length > 0) {
      this.metadata['traceComparisons'] = traceComparisons;
    }
    
    // If there are no significant differences, the implementations are equivalent
    const equivalent = divergences.size === 0 && traceComparisons.length === 0;
    
    // If implementations differ, convert divergences to mismatches
    const mismatches: ImplementationDifference[] = [];
    if (!equivalent) {
      // Create implementation mismatch errors for each divergence
      for (const [path, [expected, actual]] of divergences.entries()) {
        mismatches.push({
          path,
          expected,
          actual,
          message: `Expected ${path} to be ${expected}, but got ${actual}`,
          severity: ErrorSeverity.ERROR
        } as unknown as ImplementationDifference);
      }
      
      // Add trace mismatches if any
        mismatches.push({
          path: 'execution_traces',
          expected: 'equivalent execution paths',
          actual: `${traceComparisons.length} trace divergences`,
          message: `Execution traces diverged at ${traceComparisons.length} points`,
          severity: ErrorSeverity.ERROR
        });
        
      }
    
    
    // Branch case: If no traces to compare and no other differences
    if (this.traces.length === 0 && other.traces.length === 0 && divergences.size === 0) {
      const differences = [];
      
      if (this.isValid !== other.isValid) {
        differences.push({
          path: 'validity',
          expected: this.isValid,
          actual: other.isValid,
          message: 'Validation results differ in validity',
          severity: ErrorSeverity.ERROR
        });
      }

      return new ImplementationComparisonResult(
        differences.length === 0,
        differences,
        {
          first: this.toObject(),
          second: other.toObject()
        }
      );
    }
    
    return new ImplementationComparisonResult(
      equivalent,
      mismatches,
      {
        thisResult: this.getSummary(),
        otherResult: other.getSummary(),
        divergences: Object.fromEntries(divergences),
        traceComparisons
      }
    );

  }
  
  /**
   * Checks if there are implementation mismatches between results
   * 
   * @returns True if implementation mismatches were detected
   */
  public hasImplementationMismatches(): boolean {
    // Assume there are mismatches if there are comparison results in metadata
    return this.metadata.hasOwnProperty('implementationMismatches') && 
           Array.isArray(this.metadata['implementationMismatches']) &&
           this.metadata['implementationMismatches'].length > 0;
  }
  
  /**
   * Gets detailed information about implementation mismatches
   * 
   * @returns Array of mismatch details or empty array if none
   */
  public getMismatchDetails(): object[] {
    if (this.hasImplementationMismatches()) {
      return this.metadata['implementationMismatches'] as object[];
    }
    return [];
  }
  
  /**
   * Gets a summary of the validation result
   * 
   * @returns Summary object with key validation metrics
   */
  public getSummary(): object {
    const errorsBySeverity: Record<string, number> = {};
    
    // Count errors by severity
    for (const error of this.errors) {
      const severity = ErrorSeverity[error.severity] || 'UNKNOWN';
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + 1;
    }
    
    return {
      isValid: this.isValid,
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      traceCount: this.traces.length,
      errorsBySeverity
    };
  }
  /**
   * Sets the validation result to invalid
   */
  public setInvalid(): void {
    this.isValid = false;
  }
  /**
   * Creates a valid ValidationResult instance
   * 
   * @returns A new valid ValidationResult
   */
  public static createValid<T>(): ValidationResult<T> {
    return new ValidationResult<T>(true, {} as T);
  }
  
  /**
   * Creates an invalid ValidationResult instance with the specified error
   * 
   * @param error The validation error
   * @returns A new invalid ValidationResult with the error
   */
  public static createInvalid<T>(error: ValidationError, data: T): ValidationResult<T> {
    return new ValidationResult<T>(false, data, [error]);
  }
  
  /**
   * Creates a ValidationResult from a plain object
   * 
   * @param obj The plain object to convert
   * @returns A new ValidationResult instance
   */
  public static fromObject<T>(obj: any): ValidationResult<T> {
    // Convert errors from objects
    const errors: ValidationError[] = [];
    if (Array.isArray(obj.errors)) {
      for (const errorObj of obj.errors) {
        // Import dynamically based on type
        const { ValidationError } = require('./ValidationError');
        errors.push(ValidationError.fromObject(errorObj));
      }
    }
    
    // Convert warnings from objects
    const warnings: ParserError[] = [];
    if (Array.isArray(obj.warnings)) {
      for (const warningObj of obj.warnings) {
        // Import dynamically based on type
        const { ValidationError } = require('./ValidationError');
        warnings.push(ValidationError.fromObject(warningObj));
      }
    }
    
    // Convert traces from objects
    const traces: ExecutionTrace[] = [];
    if (Array.isArray(obj.traces)) {
      for (const traceObj of obj.traces) {
        // Import ExecutionTrace
        const { ExecutionTrace } = require('./ExecutionTrace');
        traces.push(ExecutionTrace.fromObject(traceObj));
      }
    }
    
    return new ValidationResult(
      obj.isValid ?? true,
      obj.data,
      errors,
      warnings,
      traces
    );
  }
  
  /**
   * Converts the validation result to a plain object
   * 
   * @returns A plain object representation of this result
   */
  public toObject(): any {
    return {
      isValid: this.isValid,
      errors: this.errors.map(error => error.toJSON()),
      warnings: this.warnings.map(warning => warning.toJSON()),
      traces: this.traces.map(trace => trace.toObject()),
      metadata: this.metadata
    };
  }
}