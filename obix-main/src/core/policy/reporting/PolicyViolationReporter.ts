/**
 * src/core/policy/reporting/PolicyViolationReporter.ts
 * 
 * Centralized reporting mechanism for policy violations.
 * Provides structured logging, analytics, and alerting capabilities.
 */

import { PolicyRule, PolicyResult } from '../types/PolicyTypes';
import { EnvironmentType } from '../types/EnvironmentType';
import { EnvironmentManager } from '../environment/EnvironmentManager';

/**
 * Violation severity levels for reporting
 */
export enum ViolationSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Structure for policy violation events
 */
export interface PolicyViolationEvent {
  /**
   * Timestamp when violation occurred
   */
  timestamp: Date;
  
  /**
   * Environment where violation occurred
   */
  environment: EnvironmentType;
  
  /**
   * Rule that was violated
   */
  rule: PolicyRule;
  
  /**
   * Severity level of violation
   */
  severity: ViolationSeverity;
  
  /**
   * Context of the violation
   */
  context?: any;
  
  /**
   * Component or function where violation occurred
   */
  source?: string | undefined;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Options for violation reporter
 */
export interface ReporterOptions {
  /**
   * Enable console logging
   */
  enableConsoleReporting?: boolean;
  
  /**
   * Enable analytics reporting
   */
  enableAnalyticsReporting?: boolean;
  
  /**
   * Enable alert notifications
   */
  enableAlertNotifications?: boolean;
  
  /**
   * Minimum severity level to report
   */
  minimumSeverity?: ViolationSeverity;
  
  /**
   * Custom reporting endpoint URL
   */
  reportingEndpoint?: string;
  
  /**
   * Custom function for violation handling
   */
  customHandler?: (violation: PolicyViolationEvent) => void;
  
  /**
   * Include stack trace in reports
   */
  includeStackTrace?: boolean;
  
  /**
   * Maximum number of violations to keep in memory
   */
  maxViolationHistory?: number;
  
  /**
   * Throttle reporting to prevent flooding
   */
  throttleReporting?: boolean;
}

/**
 * Central reporter for policy violations
 */
export class PolicyViolationReporter {
  private static instance: PolicyViolationReporter;
  private options: ReporterOptions;
  private environmentManager: EnvironmentManager;
  private violationHistory: PolicyViolationEvent[] = [];
  private throttleMap: Map<string, number> = new Map();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor(options: ReporterOptions = {}) {
    this.options = {
      enableConsoleReporting: true,
      enableAnalyticsReporting: false,
      enableAlertNotifications: false,
      minimumSeverity: ViolationSeverity.WARNING,
      includeStackTrace: false,
      maxViolationHistory: 100,
      throttleReporting: true,
      ...options
    };
    
    this.environmentManager = EnvironmentManager.getInstance();
  }
  
  /**
   * Get the singleton instance
   * 
   * @param options Options for reporter configuration
   * @returns PolicyViolationReporter instance
   */
  public static getInstance(options?: ReporterOptions): PolicyViolationReporter {
    if (!PolicyViolationReporter.instance) {
      PolicyViolationReporter.instance = new PolicyViolationReporter(options);
    } else if (options) {
      // Update options if provided
      PolicyViolationReporter.instance.updateOptions(options);
    }
    
    return PolicyViolationReporter.instance;
  }
  
  /**
   * Update reporter options
   * 
   * @param options New options
   */
  public updateOptions(options: Partial<ReporterOptions>): void {
    this.options = { ...this.options, ...options };
  }
  
  /**
   * Report a policy violation
   * 
   * @param policyResult Policy evaluation result
   * @param context Context of the violation
   * @param severity Severity level
   * @param source Source of the violation
   * @param metadata Additional metadata
   */
  public reportViolation(
    policyResult: PolicyResult,
    context?: any,
    severity: ViolationSeverity = ViolationSeverity.WARNING,
    source?: string,
    metadata?: Record<string, any>
  ): void {
    // Only report actual violations
    if (policyResult.allowed) {
      return;
    }
    
    // Check if violation meets minimum severity
    if (this.severityLevel(severity) < this.severityLevel(this.options.minimumSeverity!)) {
      return;
    }
    
    // Create violation event
    const violation: PolicyViolationEvent = {
      timestamp: new Date(),
      environment: this.environmentManager.getCurrentEnvironment(),
      rule: policyResult.rule!,
      severity,
      context,
      source,
      metadata: {
        ...metadata,
        stack: this.options.includeStackTrace ? new Error().stack : undefined
      }
    };
    
    // Check throttling
    if (this.options.throttleReporting && this.isThrottled(violation)) {
      return;
    }
    
    // Add to history
    this.addToHistory(violation);
    
    // Report to console if enabled
    if (this.options.enableConsoleReporting) {
      this.logToConsole(violation);
    }
    
    // Report to analytics if enabled
    if (this.options.enableAnalyticsReporting) {
      this.reportToAnalytics(violation);
    }
    
    // Send alerts if enabled
    if (this.options.enableAlertNotifications) {
      this.sendAlert(violation);
    }
    
    // Call custom handler if provided
    if (this.options.customHandler) {
      try {
        this.options.customHandler(violation);
      } catch (error) {
        console.error('Error in custom violation handler:', error);
      }
    }
  }
  
  /**
   * Get violation history
   * 
   * @param limit Maximum number of violations to return
   * @returns Recent violation events
   */
  public getViolationHistory(limit?: number): PolicyViolationEvent[] {
    const count = limit || this.violationHistory.length;
    return this.violationHistory.slice(-count);
  }
  
  /**
   * Clear violation history
   */
  public clearHistory(): void {
    this.violationHistory = [];
  }
  
  /**
   * Check if reporting is throttled for this violation
   * 
   * @private
   * @param violation Violation event
   * @returns True if reporting should be throttled
   */
  private isThrottled(violation: PolicyViolationEvent): boolean {
    const key = `${violation.rule.id}:${violation.source || 'unknown'}`;
    const now = Date.now();
    const lastReported = this.throttleMap.get(key) || 0;
    
    // Throttle period (1 minute for warnings, 5 seconds for errors)
    const throttlePeriod = violation.severity === ViolationSeverity.WARNING ? 60000 : 5000;
    
    if (now - lastReported < throttlePeriod) {
      return true;
    }
    
    // Update last reported time
    this.throttleMap.set(key, now);
    return false;
  }
  
  /**
   * Add violation to history
   * 
   * @private
   * @param violation Violation event
   */
  private addToHistory(violation: PolicyViolationEvent): void {
    this.violationHistory.push(violation);
    
    // Trim history if it exceeds the maximum size
    if (this.violationHistory.length > this.options.maxViolationHistory!) {
      this.violationHistory = this.violationHistory.slice(
        -this.options.maxViolationHistory!
      );
    }
  }
  
  /**
   * Log violation to console
   * 
   * @private
   * @param violation Violation event
   */
  private logToConsole(violation: PolicyViolationEvent): void {
    const message = `[OBIX Policy Violation] ${violation.rule.id}: ${violation.rule.description}`;
    const details = {
      timestamp: violation.timestamp,
      environment: violation.environment,
      severity: violation.severity,
      source: violation.source,
      context: violation.context
    };
    
    switch (violation.severity) {
      case ViolationSeverity.DEBUG:
        console.debug(message, details);
        break;
      case ViolationSeverity.INFO:
        console.info(message, details);
        break;
      case ViolationSeverity.WARNING:
        console.warn(message, details);
        break;
      case ViolationSeverity.ERROR:
      case ViolationSeverity.CRITICAL:
        console.error(message, details);
        break;
    }
  }
  
  /**
   * Report violation to analytics service
   * 
   * @private
   * @param violation Violation event
   */
  private reportToAnalytics(violation: PolicyViolationEvent): void {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && 'fetch' in window) {
      const endpoint = this.options.reportingEndpoint || '/api/policy-violations';
      
      // Don't block execution on analytics reporting
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation),
        // Use keepalive to ensure the request completes even if page unloads
        keepalive: true
      }).catch(error => {
        console.error('Failed to report policy violation to analytics:', error);
      });
    }
  }
  
  /**
   * Send alert for critical violations
   * 
   * @private
   * @param violation Violation event
   */
  private sendAlert(violation: PolicyViolationEvent): void {
    // Only send alerts for ERROR and CRITICAL severity
    if (
      violation.severity !== ViolationSeverity.ERROR &&
      violation.severity !== ViolationSeverity.CRITICAL
    ) {
      return;
    }
    
    // Implementation would depend on your alerting system
    // This is a placeholder for integrating with monitoring systems
    console.warn('ALERT: Critical policy violation:', {
      rule: violation.rule.id,
      description: violation.rule.description,
      environment: violation.environment,
      timestamp: violation.timestamp.toISOString(),
      source: violation.source
    });
  }
  
  /**
   * Get numeric level for severity for comparison
   * 
   * @private
   * @param severity Severity level
   * @returns Numeric severity level
   */
  private severityLevel(severity: ViolationSeverity): number {
    switch (severity) {
      case ViolationSeverity.DEBUG:
        return 0;
      case ViolationSeverity.INFO:
        return 1;
      case ViolationSeverity.WARNING:
        return 2;
      case ViolationSeverity.ERROR:
        return 3;
      case ViolationSeverity.CRITICAL:
        return 4;
      default:
        return -1;
    }
  }
  
  /**
   * Create a violation reporter for specific context
   * 
   * @param source Source identifier
   * @returns Object with report methods
   */
  public createContextReporter(source: string): {
    debug: (result: PolicyResult, context?: any, metadata?: Record<string, any>) => void;
    info: (result: PolicyResult, context?: any, metadata?: Record<string, any>) => void;
    warn: (result: PolicyResult, context?: any, metadata?: Record<string, any>) => void;
    error: (result: PolicyResult, context?: any, metadata?: Record<string, any>) => void;
    critical: (result: PolicyResult, context?: any, metadata?: Record<string, any>) => void;
  } {
    return {
      debug: (result, context, metadata) => 
        this.reportViolation(result, context, ViolationSeverity.DEBUG, source, metadata),
      info: (result, context, metadata) => 
        this.reportViolation(result, context, ViolationSeverity.INFO, source, metadata),
      warn: (result, context, metadata) => 
        this.reportViolation(result, context, ViolationSeverity.WARNING, source, metadata),
      error: (result, context, metadata) => 
        this.reportViolation(result, context, ViolationSeverity.ERROR, source, metadata),
      critical: (result, context, metadata) => 
        this.reportViolation(result, context, ViolationSeverity.CRITICAL, source, metadata)
    };
  }
}