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
