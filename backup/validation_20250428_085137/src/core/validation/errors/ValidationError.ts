/**
 * ValidationError.ts
 * 
 * Implementation of validation error handling for the OBIX framework.
 * 
 * @author Nnamdi Okpala
 */

import { StateType } from '../model/StateType';

/**
 * Error severity levels for validation errors
 */
export enum ErrorSeverity {
  INFO = 0,
  WARNING = 1,
  ERROR = 2,
  MEDIUM = 3,
  LOW = 4,
  CRITICAL = 5
}

/**
 * Validation phases where errors can occur
 */
export enum ValidationPhase {
  INITIALIZATION = 'INITIALIZATION',
  RULE_REGISTRATION = 'RULE_REGISTRATION',
  NODE_TRAVERSAL = 'NODE_TRAVERSAL',
  RULE_APPLICATION = 'RULE_APPLICATION',
  STATE_MACHINE_TRANSITION = 'STATE_MACHINE_TRANSITION',
  RESULT_AGGREGATION = 'RESULT_AGGREGATION',
  DATA_PROCESSING = "DATA_PROCESSING"
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
  metadata?: Record<string, any>;
}

/**
 * Interface representing validation error details
 */
export interface ValidationError {
  message: string;
  code: string;
  path?: string;
  severity?: ValidationSeverity;
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
 * Validation severity enum
 */
export enum ValidationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  // State validation errors
  INVALID_STATE = 'INVALID_STATE',
  MISSING_REQUIRED_PROPERTY = 'MISSING_REQUIRED_PROPERTY',
  INVALID_PROPERTY_TYPE = 'INVALID_PROPERTY_TYPE',
  INVALID_PROPERTY_VALUE = 'INVALID_PROPERTY_VALUE',
  
  // Transition validation errors
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  TRANSITION_NOT_FUNCTION = 'TRANSITION_NOT_FUNCTION',
  MISSING_TRANSITION = 'MISSING_TRANSITION',
  
  // Behavior validation errors
  INVALID_BEHAVIOR = 'INVALID_BEHAVIOR',
  INCONSISTENT_BEHAVIOR = 'INCONSISTENT_BEHAVIOR',
  
  // State machine validation errors
  UNREACHABLE_STATE = 'UNREACHABLE_STATE',
  INVALID_STATE_MACHINE = 'INVALID_STATE_MACHINE',
  
  // Runtime validation errors
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  STATE_TYPE_ERROR = 'STATE_TYPE_ERROR',
  
  // Other errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Position in a source file
 */
export class Position {
  /**
   * Line number (1-based)
   */
  public line: number;
  
  /**
   * Column number (1-based)
   */
  public column: number;
  
  /**
   * Absolute start position (0-based)
   */
  public start: number;
  
  /**
   * Absolute end position (0-based)
   */
  public end: number;
  
  constructor(line: number = 1, column: number = 1, start: number = 0, end: number = 0) {
    this.line = line;
    this.column = column;
    this.start = start;
    this.end = end;
  }
  
  /**
   * Creates a string representation of the position
   */
  public toString(): string {
    return `line ${this.line}, column ${this.column}`;
  }
  
  /**
   * Creates a Position from a plain object
   */
  public static fromObject(obj: any): Position {
    return new Position(
      obj.line || 1,
      obj.column || 1,
      obj.start || 0,
      obj.end || 0
    );
  }
}

/**
 * Create a validation error
 * @param code Error code
 * @param message Error message
 * @param path Optional property path
 * @param details Optional error details
 * @param severity Error severity (default: ERROR)
 * @returns Validation error object
 */
export function createValidationError(
  code: ValidationErrorCode | string,
  message: string,
  path?: string,
  details?: any,
  severity: ValidationSeverity = ValidationSeverity.ERROR
): ValidationError {
  return {
    code,
    message,
    path,
    severity,
    details
  };
}

/**
 * Create a validation warning
 * @param code Warning code
 * @param message Warning message
 * @param path Optional property path
 * @param details Optional warning details
 * @returns Validation warning object
 */
export function createValidationWarning(
  code: string,
  message: string,
  path?: string,
  details?: any
): ValidationWarning {
  return {
    code,
    message,
    path,
    details
  };
}

/**
 * Create a successful validation result
 * @param warnings Optional warnings
 * @param metadata Optional metadata
 * @returns Validation result object
 */
export function createSuccessValidationResult(
  warnings: ValidationWarning[] = [],
  metadata?: Record<string, any>
): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings,
    metadata
  };
}

/**
 * Create a failed validation result
 * @param errors Validation errors
 * @param warnings Optional warnings
 * @param metadata Optional metadata
 * @returns Validation result object
 */
export function createFailedValidationResult(
  errors: ValidationError[],
  warnings: ValidationWarning[] = [],
  metadata?: Record<string, any>
): ValidationResult {
  return {
    isValid: false,
    errors,
    warnings,
    metadata
  };
}

/**
 * Merge multiple validation results
 * @param results Validation results to merge
 * @returns Merged validation result
 */
export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  // Check if any results are invalid
  const isValid = results.every(result => result.isValid);
  
  // Merge errors and warnings
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  for (const result of results) {
    if (result.errors) {
      errors.push(...result.errors);
    }
    
    if (result.warnings) {
      warnings.push(...result.warnings);
    }
  }
  
  // Merge metadata
  const metadata: Record<string, any> = {};
  
  for (const result of results) {
    if (result.metadata) {
      Object.assign(metadata, result.metadata);
    }
  }
  
  return {
    isValid,
    errors,
    warnings,
    metadata
  };
}

/**
 * Base class for validation errors
 */
export class ValidationErrorClass {
  /**
   * Unique error code
   */
  public errorCode: string;
  
  /**
   * Human-readable error message
   */
  public message: string;
  
  /**
   * Component where the error occurred
   */
  public component: string;
  
  /**
   * Source of the error (functional or OOP)
   */
  public source: string;
  
  /**
   * Severity level of the error
   */
  public severity: ErrorSeverity;
  
  /**
   * Additional metadata for the error
   */
  public metadata: Record<string, unknown>;
  
  /**
   * Trace of locations where the error passed through
   */
  public trace: string[];
  
  /**
   * Creates a new ValidationErrorClass instance
   * 
   * @param errorCode Unique error code
   * @param message Human-readable error message
   * @param component Component where the error occurred
   * @param source Source of the error (functional or OOP)
   * @param severity Severity level of the error
   * @param metadata Additional metadata for the error
   * @param trace Trace of locations where the error passed through
   */
  constructor(
    errorCode: string,
    message: string,
    component: string,
    source: string = 'unknown',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    metadata: Record<string, unknown> = {},
    trace: string[] = []
  ) {
    this.errorCode = errorCode;
    this.message = message;
    this.component = component;
    this.source = source;
    this.severity = severity;
    this.metadata = { ...metadata };
    this.trace = [...trace];
  }
  
  /**
   * Adds a trace entry
   * 
   * @param entry Trace entry
   * @returns This error for method chaining
   */
  public addTrace(entry: string): ValidationErrorClass {
    this.trace.push(entry);
    return this;
  }
  
  /**
   * Converts the error to a string
   * 
   * @returns String representation of the error
   */
  public toString(): string {
    const severityName = ErrorSeverity[this.severity] || 'UNKNOWN';
    return `[${severityName}] ${this.errorCode}: ${this.message} (in ${this.component})`;
  }
  
  /**
   * Converts the error to a JSON object
   * 
   * @returns JSON representation of the error
   */
  public toJSON(): Record<string, unknown> {
    return {
      errorCode: this.errorCode,
      message: this.message,
      component: this.component,
      source: this.source,
      severity: this.severity,
      metadata: this.metadata,
      trace: this.trace
    };
  }
  
  /**
   * Adds metadata to the error
   * 
   * @param metadata Additional metadata
   * @returns A new error with the added metadata
   */
  public withMetadata(metadata: Record<string, unknown>): ValidationErrorClass {
    const newError = new ValidationErrorClass(
      this.errorCode,
      this.message,
      this.component,
      this.source,
      this.severity,
      { ...this.metadata, ...metadata },
      [...this.trace]
    );
    
    return newError;
  }
  
  /**
   * Creates a ValidationErrorClass from a plain object
   * 
   * @param obj The plain object
   * @returns A new ValidationErrorClass instance
   */
  public static fromObject(obj: unknown): ValidationErrorClass {
    const errorObj = obj as { 
      errorCode?: string;
      message?: string;
      component?: string;
      source?: string;
      severity?: ErrorSeverity;
      metadata?: Record<string, unknown>;
      trace?: string[];
    };
    return new ValidationErrorClass(
      errorObj.errorCode || 'UNKNOWN_ERROR',
      errorObj.message || 'Unknown error',
      errorObj.component || 'unknown',
      errorObj.source || 'unknown',
      errorObj.severity !== undefined ? errorObj.severity : ErrorSeverity.ERROR,
      errorObj.metadata || {},
      errorObj.trace || []
    );
  }
  
  /**
   * Converts the error to a plain object representation
   * This is useful for serialization and data transfer
   * 
   * @returns A plain object representing the validation error
   */
  public toObject(): {
    errorCode: string;
    message: string;
    component: string;
    source: string;
    severity: ErrorSeverity;
    metadata: Record<string, unknown>;
    trace: string[];
  } {
    return {
      errorCode: this.errorCode,
      message: this.message,
      component: this.component,
      source: this.source,
      severity: this.severity,
      metadata: { ...this.metadata },
      trace: [...this.trace]
    };
  }
}

/**
 * Error representing a problem with the validation system itself
 */
export class ValidationSystemError extends ValidationErrorClass {
  /**
   * Phase where the error occurred
   */
  public phase: ValidationPhase;
  
  /**
   * Context information about the error
   */
  public context: Record<string, unknown>;
  
  /**
   * Stack trace from the original error
   */
  public stackTrace: string;
  
  /**
   * Whether the error is recoverable
   */
  public recoverable: boolean;
  
  /**
   * Recovery function if the error is recoverable
   */
  public recoveryFunction: Function | null;
  
  /**
   * Creates a new ValidationSystemError instance
   * 
   * @param errorCode Unique error code
   * @param message Human-readable error message
   * @param component Component where the error occurred
   * @param phase Phase where the error occurred
   * @param context Context information about the error
   * @param stackTrace Stack trace from the original error
   * @param recoverable Whether the error is recoverable
   * @param recoveryFunction Recovery function if the error is recoverable
   * @param metadata Additional metadata for the error
   * @param trace Trace of locations where the error passed through
   */
  constructor(
    errorCode: string,
    message: string,
    component: string,
    phase: ValidationPhase,
    context: Record<string, unknown> = {},
    stackTrace: string = '',
    recoverable: boolean = false,
    recoveryFunction: Function | null = null,
    metadata: Record<string, unknown> = {},
    trace: string[] = []
  ) {
    super(errorCode, message, component, 'system', ErrorSeverity.ERROR, metadata, trace);
    
    this.phase = phase;
    this.context = { ...context };
    this.stackTrace = stackTrace;
    this.recoverable = recoverable;
    this.recoveryFunction = recoveryFunction;
  }
  
  /**
   * Attempts to recover from the error
   * 
   * @param args Arguments to pass to the recovery function
   * @returns Result of the recovery function, or null if not recoverable
   */
  public recovery(...args: unknown[]): unknown {
    if (this.recoverable && this.recoveryFunction) {
      return this.recoveryFunction(...args);
    }
    return null;
  }
  
  /**
   * Converts the error to a JSON object
   * 
   * @returns JSON representation of the error
   */
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      phase: this.phase,
      context: this.context,
      stackTrace: this.stackTrace,
      recoverable: this.recoverable
      // Note: recoveryFunction can't be serialized
    };
  }
  
  /**
   * Creates a ValidationSystemError from a plain object
   * 
   * @param obj The plain object
   * @returns A new ValidationSystemError instance
   */
  public static override fromObject(obj: unknown): ValidationSystemError {
    const errorObj = obj as {
      errorCode?: string;
      message?: string;
      component?: string;
      phase?: ValidationPhase;
      context?: Record<string, unknown>;
      stackTrace?: string;
      recoverable?: boolean;
      metadata?: Record<string, unknown>;
      trace?: string[];
    };
    return new ValidationSystemError(
      errorObj.errorCode || 'SYSTEM_ERROR',
      errorObj.message || 'System error',
      errorObj.component || 'unknown',
      errorObj.phase || ValidationPhase.INITIALIZATION,
      errorObj.context || {},
      errorObj.stackTrace || '',
      errorObj.recoverable || false,
      null, // Recovery function can't be deserialized
      errorObj.metadata || {},
      errorObj.trace || []
    );
  }
}

/**
 * Error representing a parser-related issue
 */
export class ParserError extends ValidationErrorClass {
  /**
   * Position where the error occurred
   */
  public position: Position;
  
  /**
   * Context around the error (e.g., snippet of code)
   */
  public context: string;
  
  /**
   * Creates a new ParserError instance
   * 
   * @param errorCode Unique error code
   * @param message Human-readable error message
   * @param component Component where the error occurred
   * @param position Position where the error occurred
   * @param context Context around the error
   * @param metadata Additional metadata for the error
   * @param trace Trace of locations where the error passed through
   */
  constructor(
    errorCode: string,
    message: string,
    component: string,
    position: Position,
    context: string = '',
    metadata: Record<string, unknown> = {},
    trace: string[] = []
  ) {
    super(errorCode, message, component, 'parser', ErrorSeverity.ERROR, metadata, trace);
    
    this.position = position;
    this.context = context;
  }
  
  /**
   * Converts the error to a string
   * 
   * @returns String representation of the error
   */
  public override toString(): string {
    return `${super.toString()} at ${this.position.toString()}`;
  }
  
  /**
   * Converts the error to a JSON object
   * 
   * @returns JSON representation of the error
   */
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      position: {
        line: this.position.line,
        column: this.position.column,
        start: this.position.start,
        end: this.position.end
      },
      context: this.context
    };
  }
  
  /**
   * Creates a ParserError from a plain object
   * 
   * @param obj The plain object
   * @returns A new ParserError instance
   */
  public static override fromObject(obj: unknown): ParserError {
    const errorObj = obj as {
      errorCode?: string;
      message?: string;
      component?: string;
      position?: unknown;
      context?: string;
      metadata?: Record<string, unknown>;
      trace?: string[];
    };
    return new ParserError(
      errorObj.errorCode || 'PARSER_ERROR',
      errorObj.message || 'Parser error',
      errorObj.component || 'unknown',
      Position.fromObject(errorObj.position || {}),
      errorObj.context || '',
      errorObj.metadata || {},
      errorObj.trace || []
    );
  }
}

/**
 * Class for tracking execution trace for validation errors
 */
export class ExecutionTraceDetail {
  private steps: { action: string; state: any; timestamp: number }[] = [];
  
  /**
   * Add a step to the execution trace
   * @param action Action that was executed
   * @param state State after the action
   */
  addStep(action: string, state: any): void {
    this.steps.push({
      action,
      state: JSON.parse(JSON.stringify(state)), // Deep clone the state
      timestamp: Date.now()
    });
  }
  
  /**
   * Get the execution trace
   * @returns The execution trace steps
   */
  getSteps(): { action: string; state: any; timestamp: number }[] {
    return [...this.steps]; // Return a copy to prevent external modification
  }
  
  /**
   * Clear the execution trace
   */
  clear(): void {
    this.steps = [];
  }
  
  /**
   * Get the last step in the execution trace
   * @returns The last step or undefined if no steps exist
   */
  getLastStep(): { action: string; state: any; timestamp: number } | undefined {
    return this.steps.length > 0 ? this.steps[this.steps.length - 1] : undefined;
  }
  
  /**
   * Convert the execution trace to a string representation
   * @returns String representation of the execution trace
   */
  toString(): string {
    return this.steps.map(step => 
      `${new Date(step.timestamp).toISOString()} - ${step.action}: ${JSON.stringify(step.state)}`
    ).join('\n');
  }
}

/**
 * Implementation mismatch error between functional and OOP implementations
 */
export class ImplementationMismatchError extends ValidationErrorClass {
  /**
   * Functional implementation details
   */
  public functionalImplementation: unknown;
  
  /**
   * OOP implementation details
   */
  public oopImplementation: unknown;
  
  /**
   * Creates a new ImplementationMismatchError instance
   * 
   * @param errorCode Unique error code
   * @param message Human-readable error message
   * @param component Component where the error occurred
   * @param functionalImplementation Functional implementation details
   * @param oopImplementation OOP implementation details
   * @param metadata Additional metadata for the error
   * @param trace Trace of locations where the error passed through
   */
  constructor(
    errorCode: string,
    message: string,
    component: string,
    functionalImplementation: unknown,
    oopImplementation: unknown,
    metadata: Record<string, unknown> = {},
    trace: string[] = []
  ) {
    super(errorCode, message, component, 'implementation', ErrorSeverity.ERROR, metadata, trace);
    
    this.functionalImplementation = functionalImplementation;
    this.oopImplementation = oopImplementation;
  }
  
  /**
   * Identifies the discrepancy between implementations
   * 
   * @returns Description of the discrepancy
   */
  public identifyDiscrepancy(): string {
    // Simple implementation - would be more sophisticated in production
    return `Implementation mismatch: ${this.message}`;
  }
  
  /**
   * Suggests a fix for the implementation mismatch
   * 
   * @returns Suggested fix
   */
  public suggestFix(): string {
    // Simple implementation - would be more sophisticated in production
    return `Review both implementations and align their behavior`;
  }
  
  /**
   * Converts the error to a JSON object
   * 
   * @returns JSON representation of the error
   */
  public override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      functionalImplementation: this.functionalImplementation,
      oopImplementation: this.oopImplementation
    };
  }
  
  /**
   * Creates an ImplementationMismatchError from a plain object
   * 
   * @param obj The plain object
   * @returns A new ImplementationMismatchError instance
   */
  public static override fromObject(obj: unknown): ImplementationMismatchError {
    const errorObj = obj as {
      errorCode?: string;
      message?: string;
      component?: string;
      functionalImplementation?: unknown;
      oopImplementation?: unknown;
      metadata?: Record<string, unknown>;
      trace?: string[];
    };
    return new ImplementationMismatchError(
      errorObj.errorCode || 'IMPLEMENTATION_MISMATCH',
      errorObj.message || 'Implementation mismatch between functional and OOP code',
      errorObj.component || 'unknown',
      errorObj.functionalImplementation,
      errorObj.oopImplementation,
      errorObj.metadata || {},
      errorObj.trace || []
    );
  }
}
