/**
 * ErrorTracker.ts
 * 
 * Implementation of the ErrorTracker interface for the OBIX validation system.
 * This component manages validation errors and provides utilities for error analysis
 * and reporting.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationError, ErrorSeverity } from './ValidationError';

/**
 * Interface defining the error tracking capabilities
 */
export interface ErrorTracker {
  /**
   * Collection of tracked validation errors
   */
  errors: ValidationError[];
  
  /**
   * Adds an error to the tracker
   * 
   * @param error The validation error to add
   */
  addError(error: ValidationError): void;
  
  /**
   * Gets all tracked errors
   * 
   * @returns Array of validation errors
   */
  getErrors(): ValidationError[];
  
  /**
   * Checks if there are any errors
   * 
   * @returns True if there are errors
   */
  hasErrors(): boolean;
  
  /**
   * Counts errors by type
   * 
   * @returns Map of error types to counts
   */
  getErrorTypeCounts(): Map<string, number>;
  
  /**
   * Generates a summary of tracked errors
   * 
   * @returns Summary string
   */
  generateSummary(): string;
  
  /**
   * Filters errors by component
   * 
   * @param component The component to filter by
   * @returns Filtered errors
   */
  filterByComponent(component: string): ValidationError[];
  
  /**
   * Filters errors by error code
   * 
   * @param code The error code to filter by
   * @returns Filtered errors
   */
  filterByErrorCode(code: string): ValidationError[];
  
  /**
   * Groups errors by component
   * 
   * @returns Map of components to errors
   */
  groupByComponent(): Map<string, ValidationError[]>;
}

/**
 * Implementation of the ErrorTracker interface
 */
export class ValidationErrorTracker implements ErrorTracker {
  /**
   * Collection of tracked validation errors
   */
  public errors: ValidationError[];
  
  /**
   * Creates a new ValidationErrorTracker instance
   */
  constructor() {
    this.errors = [];
  }
  
  /**
   * Adds an error to the tracker
   * 
   * @param error The validation error to add
   */
  public addError(error: ValidationError): void {
    this.errors.push(error);
  }
  
  /**
   * Gets all tracked errors
   * 
   * @returns Array of validation errors
   */
  public getErrors(): ValidationError[] {
    return [...this.errors];
  }
  
  /**
   * Checks if there are any errors
   * 
   * @returns True if there are errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
  
  /**
   * Gets errors of a specific severity
   * 
   * @param severity The severity level to filter by
   * @returns Filtered errors
   */
  public getErrorsBySeverity(severity: ErrorSeverity): ValidationError[] {
    return this.errors.filter(error => error.severity === severity);
  }
  
  /**
   * Counts errors by type (based on constructor name)
   * 
   * @returns Map of error types to counts
   */
  public getErrorTypeCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const error of this.errors) {
      const typeName = error.constructor.name;
      const currentCount = counts.get(typeName) || 0;
      counts.set(typeName, currentCount + 1);
    }
    
    return counts;
  }
  
  /**
   * Generates a summary of tracked errors
   * 
   * @returns Summary string
   */
  public generateSummary(): string {
    if (this.errors.length === 0) {
      return "No validation errors detected.";
    }
    
    // Count errors by severity
    const severityCounts = new Map<ErrorSeverity, number>();
    for (const error of this.errors) {
      const currentCount = severityCounts.get(error.severity) || 0;
      severityCounts.set(error.severity, currentCount + 1);
    }
    
    // Count errors by component
    const componentCounts = new Map<string, number>();
    for (const error of this.errors) {
      const currentCount = componentCounts.get(error.component) || 0;
      componentCounts.set(error.component, currentCount + 1);
    }
    
    // Generate summary text
    const parts: string[] = [
      `Found ${this.errors.length} validation error(s):`
    ];
    
    // Add severity breakdown
    parts.push("Error severity breakdown:");
    for (const [severity, count] of severityCounts.entries()) {
      parts.push(`  - ${severity}: ${count}`);
    }
    
    // Add component breakdown
    parts.push("Error component breakdown:");
    for (const [component, count] of componentCounts.entries()) {
      parts.push(`  - ${component}: ${count}`);
    }
    
    // Add first few error messages as examples
    const maxExamples = Math.min(3, this.errors.length);
    if (maxExamples > 0) {
      parts.push("Example errors:");
      for (let i = 0; i < maxExamples; i++) {
        parts.push(`  - ${this.errors[i]!.toString()}`);
      }
      
      if (this.errors.length > maxExamples) {
        parts.push(`  (plus ${this.errors.length - maxExamples} more...)`);
      }
    }
    
    return parts.join("\n");
  }
  
  /**
   * Filters errors by component
   * 
   * @param component The component to filter by
   * @returns Filtered errors
   */
  public filterByComponent(component: string): ValidationError[] {
    return this.errors.filter(error => error.component === component);
  }
  
  /**
   * Filters errors by error code
   * 
   * @param code The error code to filter by
   * @returns Filtered errors
   */
  public filterByErrorCode(code: string): ValidationError[] {
    return this.errors.filter(error => error.errorCode === code);
  }
  
  /**
   * Groups errors by component
   * 
   * @returns Map of components to errors
   */
  public groupByComponent(): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();
    
    for (const error of this.errors) {
      const component = error.component;
      if (!grouped.has(component)) {
        grouped.set(component, []);
      }
      
      grouped.get(component)!.push(error);
    }
    
    return grouped;
  }
  
  /**
   * Filters errors by source
   * 
   * @param source The source to filter by (e.g., "functional", "oop")
   * @returns Filtered errors
   */
  public filterBySource(source: string): ValidationError[] {
    return this.errors.filter(error => error.source === source);
  }
  
  /**
   * Groups errors by source
   * 
   * @returns Map of sources to errors
   */
  public groupBySource(): Map<string, ValidationError[]> {
    const grouped = new Map<string, ValidationError[]>();
    
    for (const error of this.errors) {
      const source = error.source || "unknown";
      if (!grouped.has(source)) {
        grouped.set(source, []);
      }
      
      grouped.get(source)!.push(error);
    }
    
    return grouped;
  }
  
  /**
   * Gets errors that occurred in a specific time range
   * 
   * @param startTime Start timestamp
   * @param endTime End timestamp
   * @returns Filtered errors
   */
  public getErrorsInTimeRange(startTime: number, endTime: number): ValidationError[] {
    return this.errors.filter(error => {
      const timestamp = error.metadata['timestamp'];
      return typeof timestamp === 'number' && 
             timestamp >= startTime && 
             timestamp <= endTime;
    });
  }
  
  /**
   * Creates a deep copy of this error tracker
   * 
   * @returns A new ValidationErrorTracker with the same errors
   */
  public clone(): ValidationErrorTracker {
    const cloned = new ValidationErrorTracker();
    
    // We can't simply push all errors because they need to be deep-cloned
    // This assumes ValidationError has a proper toJSON and fromObject implementation
    for (const error of this.errors) {
      const errorType = error.constructor as any;
      if (typeof errorType.fromObject === 'function') {
        const errorObj = error.toJSON();
        cloned.addError(errorType.fromObject(errorObj));
      } else {
        // Fallback to shallow copy if proper cloning isn't available
        cloned.addError(error);
      }
    }
    
    return cloned;
  }
  
  /**
   * Creates a ValidationErrorTracker from a plain object
   * 
   * @param obj The plain object to convert
   * @returns A new ValidationErrorTracker instance
   */
  public static fromObject(obj: any): ValidationErrorTracker {
    const tracker = new ValidationErrorTracker();
    
    if (Array.isArray(obj.errors)) {
      for (const errorObj of obj.errors) {
        // Determine error type from the object and use appropriate constructor
        const errorType = errorObj.type || 'ValidationError';
        
        // Import dynamically based on type
        let error: ValidationError;
        switch (errorType) {
          case 'ImplementationMismatchError':
            const { ImplementationMismatchError } = require('./ValidationError');
            error = ImplementationMismatchError.fromObject(errorObj);
            break;
          case 'ValidationSystemError':
            const { ValidationSystemError } = require('./ValidationError');
            error = ValidationSystemError.fromObject(errorObj);
            break;
          case 'ParserError':
            const { ParserError } = require('./ValidationError');
            error = ParserError.fromObject(errorObj);
            break;
          default:
            const { ValidationError } = require('./ValidationError');
            error = ValidationError.fromObject(errorObj);
        }
        
        tracker.addError(error);
      }
    }
    
    return tracker;
  }
  
  /**
   * Converts the error tracker to a plain object
   * 
   * @returns A plain object representation of this tracker
   */
  public toObject(): any {
    return {
      errors: this.errors.map(error => ({
        ...error.toJSON(),
        type: error.constructor.name
      }))
    };
  }
}

/**
 * Enhanced error tracker with additional metrics and analysis capabilities
 */
export class MetricsEnabledErrorTracker extends ValidationErrorTracker {
  /**
   * Error rate metrics (errors per time period)
   */
  public errorRates: Map<string, number>;
  
  /**
   * Last error timestamp
   */
  public lastErrorTimestamp: number;
  
  /**
   * Error type distribution
   */
  public errorTypeDistribution: Map<string, number>;
  
  constructor() {
    super();
    this.errorRates = new Map<string, number>();
    this.lastErrorTimestamp = 0;
    this.errorTypeDistribution = new Map<string, number>();
  }
  
  /**
   * Adds an error and updates metrics
   * 
   * @param error The validation error to add
   */
  public override addError(error: ValidationError): void {
    super.addError(error);
    
    // Update metrics
    const now = Date.now();
    const errorType = error.constructor.name;
    
    // Update timestamp
    this.lastErrorTimestamp = now;
    
    // Update error type distribution
    const typeCount = this.errorTypeDistribution.get(errorType) || 0;
    this.errorTypeDistribution.set(errorType, typeCount + 1);
    
    // Update error rate (grouped by minute)
    const timeKey = this.getTimeKey(now);
    const rateCount = this.errorRates.get(timeKey) || 0;
    this.errorRates.set(timeKey, rateCount + 1);
  }
  
  /**
   * Gets a time key for the given timestamp (rounded to the minute)
   * 
   * @public
   * @param timestamp The timestamp to get a key for
   * @returns Time key string (ISO format down to the minute)
   */
  public getTimeKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  
  /**
   * Gets the error rate for a specific time period
   * 
   * @param timeKey The time key to get the rate for
   * @returns Number of errors in that time period
   */
  public getErrorRateForPeriod(timeKey: string): number {
    return this.errorRates.get(timeKey) || 0;
  }
  
  /**
   * Gets error rates for all time periods
   * 
   * @returns Map of time keys to error counts
   */
  public getErrorRates(): Map<string, number> {
    return new Map(this.errorRates);
  }
  
  /**
   * Gets the error type distribution
   * 
   * @returns Map of error types to counts
   */
  public getErrorTypeDistribution(): Map<string, number> {
    return new Map(this.errorTypeDistribution);
  }
  
  /**
   * Gets the time since the last error
   * 
   * @returns Time in milliseconds since the last error, or -1 if no errors
   */
  public getTimeSinceLastError(): number {
    if (this.lastErrorTimestamp === 0) {
      return -1;
    }
    
    return Date.now() - this.lastErrorTimestamp;
  }
  
  /**
   * Generates an enhanced summary with metrics
   * 
   * @returns Enhanced summary string
   */
  public override generateSummary(): string {
    const basicSummary = super.generateSummary();
    
    if (this.errors.length === 0) {
      return basicSummary;
    }
    
    const metricParts: string[] = [
      "",
      "Error Metrics:",
      `  - Time since last error: ${this.formatTimeDuration(this.getTimeSinceLastError())}`,
      "  - Error type distribution:"
    ];
    
    for (const [type, count] of this.errorTypeDistribution.entries()) {
      const percentage = (count / this.errors.length * 100).toFixed(1);
      metricParts.push(`    - ${type}: ${count} (${percentage}%)`);
    }
    
    // Add error rate information
    metricParts.push("  - Recent error rates:");
    
    // Sort time keys in descending order to show most recent first
    const sortedTimeKeys = Array.from(this.errorRates.keys()).sort().reverse();
    const maxRateEntries = Math.min(5, sortedTimeKeys.length);
    
    for (let i = 0; i < maxRateEntries; i++) {
      const timeKey = sortedTimeKeys[i];
      const count = this.errorRates.get(timeKey as string) || 0;
      metricParts.push(`    - ${timeKey}: ${count} errors`);
    }
    
    return `${basicSummary}\n${metricParts.join("\n")}`;
  }
  
  /**
   * Formats a time duration into a human-readable string
   * 
   * @public
   * @param milliseconds Time duration in milliseconds
   * @returns Formatted duration string
   */
  public formatTimeDuration(milliseconds: number): string {
    if (milliseconds < 0) {
      return "No errors recorded";
    }
    
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
  }
  
  /**
   * Converts the metrics-enabled error tracker to a plain object
   * 
   * @returns A plain object representation of this tracker
   */
  public override toObject(): any {
    return {
      ...super.toObject(),
      errorRates: Object.fromEntries(this.errorRates),
      lastErrorTimestamp: this.lastErrorTimestamp,
      errorTypeDistribution: Object.fromEntries(this.errorTypeDistribution)
    };
  }
  
  /**
   * Creates a MetricsEnabledErrorTracker from a plain object
   * 
   * @param obj The plain object to convert
   * @returns A new MetricsEnabledErrorTracker instance
   */
  public static override fromObject(obj: any): MetricsEnabledErrorTracker {
    const tracker = new MetricsEnabledErrorTracker();
    
    // Load basic error tracker data
    const baseTracker = ValidationErrorTracker.fromObject(obj);
    for (const error of baseTracker.getErrors()) {
      tracker.addError(error);
    }
    
    // Load metrics data if available
    if (obj.errorRates && typeof obj.errorRates === 'object') {
      tracker.errorRates = new Map(Object.entries(obj.errorRates));
    }
    
    if (typeof obj.lastErrorTimestamp === 'number') {
      tracker.lastErrorTimestamp = obj.lastErrorTimestamp;
    }
    
    if (obj.errorTypeDistribution && typeof obj.errorTypeDistribution === 'object') {
      tracker.errorTypeDistribution = new Map(Object.entries(obj.errorTypeDistribution));
    }
    
    return tracker;
  }
}