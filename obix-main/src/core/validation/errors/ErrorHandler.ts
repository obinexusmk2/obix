/**
 * ErrorHandler.ts
 * 
 * Implementation of the ErrorHandler class for the OBIX validation system.
 * This component manages validation errors across different components and implementation modes,
 * providing specialized handling for implementation mismatches between functional and OOP paradigms.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationError } from './ValidationError';
import { ErrorTracker, ValidationErrorTracker, MetricsEnabledErrorTracker } from './ErrorTracker';
import { ImplementationMismatchError } from '@/core/dop';
import { ValidationStateMachine } from '@/core/dop/ValidationStateMachine';


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
 * Configuration options for ErrorHandler
 */
export interface ErrorHandlerOptions {
  /**
   * Enable metrics collection
   */
  enableMetrics?: boolean;
  
  /**
   * Enable source tracking (functional vs OOP)
   */
  enableSourceTracking?: boolean;
  
  /**
   * Default component name if not specified
   */
  defaultComponent?: string;
  
  /**
   * Maximum number of errors to store per component
   */
  maxErrorsPerComponent?: number;
  
  /**
   * Validation state machine for error state transitions
   */
  stateMachine?: ValidationStateMachine;
  
  /**
   * Whether to log errors to console
   */
  logToConsole?: boolean;
}

/**
 * Manages errors across different components and implementation modes
 */
export class ErrorHandler {
  /**
   * Error trackers for each component
   */
  public errorTrackers: Map<string, ErrorTracker>;
  
  /**
   * Whether to track implementation mode source (functional vs OOP)
   */
  public implementationModeTracking: boolean;
  
  /**
   * Default component name if not specified
   */
  public defaultComponent: string;
  
  /**
   * Maximum number of errors to store per component
   */
  public maxErrorsPerComponent: number;
  
  /**
   * Validation state machine for error state transitions
   */
  public stateMachine: ValidationStateMachine | null;
  
  /**
   * Whether to log errors to console
   */
  public logToConsole: boolean;
  
  /**
   * Statistics about error handling
   */
  public stats: {
    totalErrors: number;
    functionalErrors: number;
    oopErrors: number;
    implementationMismatches: number;
    criticalErrors: number;
    recoveredErrors: number;
  };
  
  /**
   * Creates a new ErrorHandler instance
   * 
   * @param options Configuration options
   */
  constructor(options: ErrorHandlerOptions = {}) {
    this.errorTrackers = new Map<string, ErrorTracker>();
    this.implementationModeTracking = options.enableSourceTracking !== false;
    this.defaultComponent = options.defaultComponent || 'unknown';
    this.maxErrorsPerComponent = options.maxErrorsPerComponent || 100;
    this.stateMachine = options.stateMachine || null;
    this.logToConsole = options.logToConsole !== false;
    
    this.stats = {
      totalErrors: 0,
      functionalErrors: 0,
      oopErrors: 0,
      implementationMismatches: 0,
      criticalErrors: 0,
      recoveredErrors: 0
    };
    
    // Initialize default tracker
    this.errorTrackers.set(this.defaultComponent, 
      options.enableMetrics 
        ? new MetricsEnabledErrorTracker() 
        : new ValidationErrorTracker()
    );
  }
  
  /**
   * Handles a validation error
   * 
   * @param error The validation error to handle
   * @param component Component where the error occurred (optional)
   */
  public handleError(error: ValidationError, component?: string): void {
    const comp = component || error.component || this.defaultComponent;
    
    // Get tracker for this component
    const tracker = this.getErrorTracker(comp);
    
    // Add error to tracker
    tracker.addError(error);
    
    // Update statistics
    this.stats.totalErrors++;
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.stats.criticalErrors++;
    }
    
    // Track implementation mode source if enabled
    if (this.implementationModeTracking) {
      if (error.source === 'functional') {
        this.stats.functionalErrors++;
      } else if (error.source === 'oop') {
        this.stats.oopErrors++;
      }
    }
    
    // Handle implementation mismatch errors specially
    if (error instanceof ImplementationMismatchError) {
      this.handleImplementationMismatch(error);
    }
    
    // Log to console if enabled
    if (this.logToConsole) {
      if (error.severity >= ErrorSeverity.ERROR) {
        console.error(`[${comp}] ${error.toString()}`);
      } else if (error.severity === ErrorSeverity.WARNING) {
        console.warn(`[${comp}] ${error.toString()}`);
      } else {
        console.info(`[${comp}] ${error.toString()}`);
      }
    }
    
    // Update state machine if provided
    if (this.stateMachine) {
      this.stateMachine.handleErrorInState(error);
    }
  }
  
  /**
   * Handles an implementation mismatch error
   * 
   * @param error The implementation mismatch error
   */
  public handleImplementationMismatch(error: ImplementationMismatchError): void {
    // Update statistics
    this.stats.implementationMismatches++;
    
    // Perform specialized processing for implementation mismatches
    // 1. Log detailed information about the mismatch
    if (this.logToConsole) {
      console.error(`Implementation mismatch detected between functional and OOP implementations:`);
      console.error(`- Functional: ${error.functionalImplementation}`);
      console.error(`- OOP: ${error.oopImplementation}`);
      console.error(`- Discrepancy: ${error.identifyDiscrepancy()}`);
      console.error(`- Suggestion: ${error.suggestFix()}`);
    }
    
    // 2. Add detailed metadata to the error
    error.metadata['handledAt'] = new Date().toISOString();
    error.metadata['analyzedDiscrepancy'] = error.identifyDiscrepancy();
    error.metadata['suggestedFix'] = error.suggestFix();
    
    // 3. Track in special components tracker for implementation mismatches
    const mismatchTracker = this.getErrorTracker('implementation-mismatches');
    mismatchTracker.addError(error);
  }
  
  /**
   * Gets all errors grouped by source
   * 
   * @returns Map of source names to arrays of errors
   */
  public getErrorsBySource(): Map<string, ValidationError[]> {
    const result = new Map<string, ValidationError[]>();
    
    // Collect errors from all trackers
    for (const [_, tracker] of this.errorTrackers.entries()) {
      const errors = tracker.getErrors();
      
      // Group by source
      for (const error of errors) {
        const source = error.source || 'unknown';
        if (!result.has(source)) {
          result.set(source, []);
        }
        result.get(source)!.push(error);
      }
    }
    
    return result;
  }
  
  /**
   * Gets the error tracker for a component
   * 
   * @param component Component name
   * @returns The error tracker for the component
   */
  public getErrorTracker(component: string): ErrorTracker {
    // Create tracker if it doesn't exist
    if (!this.errorTrackers.has(component)) {
      this.errorTrackers.set(
        component,
        new ValidationErrorTracker()
      );
    }
    
    return this.errorTrackers.get(component)!;
  }
  
  /**
   * Enables source tracking (functional vs OOP)
   */
  public enableSourceTracking(): void {
    this.implementationModeTracking = true;
  }
  
  /**
   * Disables source tracking
   */
  public disableSourceTracking(): void {
    this.implementationModeTracking = false;
  }
  
  /**
   * Gets errors by component
   * 
   * @returns Map of component names to arrays of errors
   */
  public getErrorsByComponent(): Map<string, ValidationError[]> {
    const result = new Map<string, ValidationError[]>();
    
    for (const [component, tracker] of this.errorTrackers.entries()) {
      result.set(component, tracker.getErrors());
    }
    
    return result;
  }
  
  /**
   * Gets errors of a specific severity
   * 
   * @param severity The severity level
   * @returns Array of errors with the specified severity
   */
  public getErrorsBySeverity(severity: ErrorSeverity): ValidationError[] {
    const result: ValidationError[] = [];
    
    for (const tracker of this.errorTrackers.values()) {
      if ('getErrorsBySeverity' in tracker) {
        // If tracker supports filtering by severity
        const trackerWithSeverity = tracker as unknown as { 
          getErrorsBySeverity(severity: ErrorSeverity): ValidationError[] 
        };
        result.push(...trackerWithSeverity.getErrorsBySeverity(severity));
      } else {
        // Fallback to manual filtering
        result.push(...tracker.getErrors().filter(e => e.severity === severity));
      }
    }
    
    return result;
  }
  
  /**
   * Gets implementation mismatch errors
   * 
   * @returns Array of implementation mismatch errors
   */
  public getImplementationMismatches(): ImplementationMismatchError[] {
    const result: ImplementationMismatchError[] = [];
    
    for (const tracker of this.errorTrackers.values()) {
      for (const error of tracker.getErrors()) {
        if (error instanceof ImplementationMismatchError) {
          result.push(error);
        }
      }
    }
    
    return result;
  }
  
  /**
   * Gets statistics about error handling
   * 
   * @returns Error statistics
   */
  public getStats(): {
    totalErrors: number;
    functionalErrors: number;
    oopErrors: number;
    implementationMismatches: number;
    criticalErrors: number;
    recoveredErrors: number;
    componentCounts: Record<string, number>;
    severityCounts: Record<string, number>;
  } {
    // Count errors by component
    const componentCounts: Record<string, number> = {};
    for (const [component, tracker] of this.errorTrackers.entries()) {
      componentCounts[component] = tracker.getErrors().length;
    }
    
    // Count errors by severity
    const severityCounts: Record<string, number> = {};
    for (const severity of Object.keys(ErrorSeverity).filter(key => isNaN(Number(key)))) {
      const severityValue = ErrorSeverity[severity as keyof typeof ErrorSeverity];
      severityCounts[severity] = this.getErrorsBySeverity(severityValue).length;
    }
    
    return {
      ...this.stats,
      componentCounts,
      severityCounts
    };
  }
  
  /**
   * Clears all errors
   */
  public clearAllErrors(): void {
    for (const tracker of this.errorTrackers.values()) {
      // Assuming all trackers have a clear method
      if ('clear' in tracker) {
        (tracker as unknown as { clear(): void }).clear();
      }
    }
    
    // Reset statistics
    this.stats = {
      totalErrors: 0,
      functionalErrors: 0,
      oopErrors: 0,
      implementationMismatches: 0,
      criticalErrors: 0,
      recoveredErrors: 0
    };
  }
  
  /**
   * Generates a summary of all errors
   * 
   * @returns Summary string
   */
  public generateSummary(): string {
    const stats = this.getStats();
    
    const parts: string[] = [
      "Error Handler Summary:",
      `Total errors: ${stats.totalErrors}`,
      `Critical errors: ${stats.criticalErrors}`,
      `Implementation mismatches: ${stats.implementationMismatches}`,
      ""
    ];
    
    if (this.implementationModeTracking) {
      parts.push(`Functional implementation errors: ${stats.functionalErrors}`);
      parts.push(`OOP implementation errors: ${stats.oopErrors}`);
      parts.push("");
    }
    
    // Add component breakdowns
    parts.push("Errors by component:");
    for (const [component, count] of Object.entries(stats.componentCounts)) {
      if (count > 0) {
        parts.push(`  - ${component}: ${count}`);
      }
    }
    parts.push("");
    
    // Add severity breakdowns
    parts.push("Errors by severity:");
    for (const [severity, count] of Object.entries(stats.severityCounts)) {
      if (count > 0) {
        parts.push(`  - ${severity}: ${count}`);
      }
    }
    
    // Add specific tracker summaries
    parts.push("");
    parts.push("Component summaries:");
    for (const [component, tracker] of this.errorTrackers.entries()) {
      if (tracker.hasErrors()) {
        parts.push(`\n-- ${component} --`);
        parts.push(tracker.generateSummary());
      }
    }
    
    return parts.join("\n");
  }
  
  /**
   * Creates an enhanced error handler with metrics tracking
   * 
   * @param options Configuration options
   * @returns A new ErrorHandler with metrics tracking enabled
   */
  public static createWithMetrics(options: ErrorHandlerOptions = {}): ErrorHandler {
    return new ErrorHandler({
      ...options,
      enableMetrics: true
    });
  }
}