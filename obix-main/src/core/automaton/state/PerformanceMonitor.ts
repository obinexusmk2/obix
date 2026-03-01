/**
 * PerformanceMonitor
 * 
 * Provides performance monitoring and analysis capabilities for state machines.
 * Collects, aggregates, and analyzes performance metrics to identify optimization
 * opportunities and track the effectiveness of Nnamdi Okpala's automaton state
 * minimization technology.
 */

import { OptimizedStateMachine } from './OptimizedStateMachine';

/**
 * Performance event data structure
 */
export interface PerformanceEvent {
  /**
   * Operation type
   */
  operation: string;
  
  /**
   * Timestamp when the event occurred
   */
  timestamp: number;
  
  /**
   * Duration of the operation in milliseconds
   */
  duration: number;
  
  /**
   * Additional data specific to the operation
   */
  metadata?: Record<string, any>;
}

/**
 * Performance metrics aggregation
 */
export interface PerformanceMetrics {
  /**
   * Average operation duration
   */
  averageDuration: number;
  
  /**
   * Maximum operation duration
   */
  maxDuration: number;
  
  /**
   * Minimum operation duration
   */
  minDuration: number;
  
  /**
   * Number of operations
   */
  count: number;
  
  /**
   * Total duration of all operations
   */
  totalDuration: number;
  
  /**
   * 95th percentile duration
   */
  p95Duration: number;
  
  /**
   * 99th percentile duration
   */
  p99Duration: number;
  
  /**
   * Additional metrics specific to the operation
   */
  additionalMetrics?: Record<string, number>;
}

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  /**
   * Whether to enable performance monitoring
   */
  enabled?: boolean;
  
  /**
   * Maximum number of events to keep in memory
   */
  maxEvents?: number;
  
  /**
   * Sample rate (1.0 = 100% of operations, 0.1 = 10% of operations)
   */
  sampleRate?: number;
  
  /**
   * Event retention time in milliseconds
   */
  retentionTime?: number;
  
  /**
   * Whether to log performance warnings automatically
   */
  logWarnings?: boolean;
  
  /**
   * Thresholds for performance warnings
   */
  warningThresholds?: {
    /**
     * Transition duration threshold in milliseconds
     */
    transitionDuration?: number;
    
    /**
     * Cache hit ratio threshold
     */
    cacheHitRatio?: number;
    
    /**
     * Memory usage threshold in bytes
     */
    memoryUsage?: number;
  };
}

/**
 * Performance monitor for state machines
 */
export class PerformanceMonitor {
  /**
   * Configuration
   */
  private config: Required<PerformanceMonitorConfig>;
  
  /**
   * Performance events
   */
  private events: PerformanceEvent[] = [];
  
  /**
   * Metrics by operation type
   */
  private metrics: Map<string, PerformanceMetrics> = new Map();
  
  /**
   * Optimization recommendations
   */
  private recommendations: string[] = [];
  
  /**
   * Performance warnings
   */
  private warnings: string[] = [];
  
  /**
   * Create a new performance monitor
   * 
   * @param config Configuration
   */
  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      enabled: config.enabled !== false,
      maxEvents: config.maxEvents || 10000,
      sampleRate: config.sampleRate || 1.0,
      retentionTime: config.retentionTime || 3600000, // 1 hour
      logWarnings: config.logWarnings !== false,
      warningThresholds: {
        transitionDuration: config.warningThresholds?.transitionDuration ?? 5, // 5ms
        cacheHitRatio: config.warningThresholds?.cacheHitRatio ?? 0.7, // 70%
        memoryUsage: config.warningThresholds?.memoryUsage ?? 100 * 1024 * 1024, // 100MB
      } as Required<NonNullable<PerformanceMonitorConfig['warningThresholds']>>,
    };
    
    // Set up automatic event cleanup
    if (this.config.retentionTime > 0) {
      setInterval(() => {
        this.removeOldEvents();
      }, Math.min(this.config.retentionTime / 10, 60000)); // At most every minute
    }
  }
  
  /**
   * Record a performance event
   * 
   * @param event Performance event to record
   */
  public recordEvent(event: Omit<PerformanceEvent, 'timestamp'>): void {
    if (!this.config.enabled) return;
    
    // Apply sampling
    if (this.config.sampleRate < 1.0 && Math.random() > this.config.sampleRate) {
      return;
    }
    
    const fullEvent: PerformanceEvent = {
      ...event,
      timestamp: Date.now(),
    };
    
    // Add to events list
    this.events.push(fullEvent);
    
    // Limit events list size
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }
    
    // Update metrics
    this.updateMetrics(fullEvent);
    
    // Check for warnings
    this.checkWarnings(fullEvent);
  }
  
  /**
   * Update metrics based on a new event
   * 
   * @param event Performance event
   */
  private updateMetrics(event: PerformanceEvent): void {
    const operation = event.operation;
    
    // Get or create metrics for this operation
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        averageDuration: 0,
        maxDuration: 0,
        minDuration: Infinity,
        count: 0,
        totalDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        additionalMetrics: {},
      });
    }
    
    const metrics = this.metrics.get(operation)!;
    
    // Update simple metrics
    metrics.count++;
    metrics.totalDuration += event.duration;
    metrics.averageDuration = metrics.totalDuration / metrics.count;
    metrics.maxDuration = Math.max(metrics.maxDuration, event.duration);
    metrics.minDuration = Math.min(metrics.minDuration, event.duration);
    
    // Update additional metrics from metadata
    if (event.metadata) {
      for (const [key, value] of Object.entries(event.metadata)) {
        if (typeof value === 'number') {
          if (!metrics.additionalMetrics) {
            metrics.additionalMetrics = {};
          }
          
          const metricKey = `${key}Sum`;
          const countKey = `${key}Count`;
          
          if (!metrics.additionalMetrics) {
            metrics.additionalMetrics = {};
          }
          if (!(metricKey in metrics.additionalMetrics)) {
            metrics.additionalMetrics[metricKey] = 0;
            metrics.additionalMetrics[countKey] = 0;
          }
          
          metrics.additionalMetrics[metricKey] += value;
          metrics.additionalMetrics[countKey]++;
          metrics.additionalMetrics![key] = metrics.additionalMetrics[metricKey] / metrics.additionalMetrics[countKey] || 0;
        }
      }
    }
    
    // Recalculate percentiles (this is a simplified approach)
    this.recalculatePercentiles(operation);
  }
  
  /**
   * Recalculate percentile metrics for an operation
   * 
   * @param operation Operation to recalculate
   */
  private recalculatePercentiles(operation: string): void {
    // Get all events for this operation
    const operationEvents = this.events
      .filter(e => e.operation === operation)
      .map(e => e.duration)
      .sort((a, b) => a - b);
    
    if (operationEvents.length === 0) return;
    
    const metrics = this.metrics.get(operation)!;
    
    // Calculate p95
    const p95Index = Math.floor(operationEvents.length * 0.95);
    metrics.p95Duration = operationEvents[p95Index] || metrics.maxDuration;
    
    // Calculate p99
    const p99Index = Math.floor(operationEvents.length * 0.99);
    metrics.p99Duration = operationEvents[p99Index] || metrics.maxDuration;
  }
  
  /**
   * Remove events older than the retention time
   */
  private removeOldEvents(): void {
    if (this.config.retentionTime <= 0) return;
    
    const cutoffTime = Date.now() - this.config.retentionTime;
    
    // Remove old events
    this.events = this.events.filter(e => e.timestamp >= cutoffTime);
    
    // Recalculate all metrics
    this.recalculateAllMetrics();
  }
  
  /**
   * Recalculate all metrics from scratch
   */
  private recalculateAllMetrics(): void {
    // Clear existing metrics
    this.metrics.clear();
    
    // Recalculate metrics for all events
    for (const event of this.events) {
      this.updateMetrics(event);
    }
  }
  
  /**
   * Check for performance warnings
   * 
   * @param event Performance event
   */
  private checkWarnings(event: PerformanceEvent): void {
    const thresholds = this.config.warningThresholds as Required<NonNullable<PerformanceMonitorConfig['warningThresholds']>>;
    
    // Check transition duration
    if (event.operation.startsWith('transition') && 
        event.duration > thresholds.transitionDuration) {
      const warning = `Slow transition: ${event.duration.toFixed(2)}ms for ${event.operation}`;
      this.addWarning(warning);
    }
    
    // Check cache hit ratio if provided in metadata
    if (event.metadata?.['cacheHitRatio'] !== undefined &&
        event.metadata['cacheHitRatio'] < thresholds.cacheHitRatio) {
      const warning = `Low cache hit ratio: ${(event.metadata['cacheHitRatio'] * 100).toFixed(1)}%`;
      this.addWarning(warning);
    }
    
    // Check memory usage if provided in metadata
    if (event.metadata?.['memoryUsage'] !== undefined &&
        event.metadata['memoryUsage'] > thresholds.memoryUsage) {
      const memoryMB = (event.metadata['memoryUsage'] / (1024 * 1024)).toFixed(1);
      const warning = `High memory usage: ${memoryMB}MB`;
      this.addWarning(warning);
    }
  }
  
  /**
   * Add a warning
   * 
   * @param warning Warning message
   */
  private addWarning(warning: string): void {
    // Don't add duplicate warnings
    if (this.warnings.includes(warning)) return;
    
    this.warnings.push(warning);
    
    // Keep warnings list manageable
    if (this.warnings.length > 100) {
      this.warnings = this.warnings.slice(-50);
    }
    
    // Log warning if configured
    if (this.config.logWarnings) {
      console.warn(`[PerformanceMonitor] ${warning}`);
    }
  }
  
  /**
   * Generate optimization recommendations based on collected metrics
   * 
   * @param stateMachine State machine to analyze
   * @returns Array of optimization recommendations
   */
  public generateRecommendations(stateMachine: OptimizedStateMachine): string[] {
    if (!this.config.enabled || this.events.length === 0) {
      return ['Insufficient performance data collected for recommendations.'];
    }
    
    this.recommendations = [];
    
    // Extract useful metrics
    const transitionMetrics = this.metrics.get('transition-standard');
    const cachingMetrics = this.metrics.get('transition-cached');
    const compiledMetrics = this.metrics.get('transition-compiled');
    
    // Check if standard transitions are slow
    if (transitionMetrics && transitionMetrics.averageDuration > 2) {
      this.recommendations.push('Consider increasing cache size to reduce standard transitions.');
    }
    
    // Check cache hit ratio
    const stats = stateMachine.getCacheStats ? stateMachine.getCacheStats() : null;
    if (stats && stats.hitRatio < 0.8) {
      this.recommendations.push(`Improve cache hit ratio (currently ${(stats.hitRatio * 100).toFixed(1)}%). Consider precomputing common transitions or increasing cache size.`);
    }
    
    // Check if compiled transitions are much faster
    if (compiledMetrics && transitionMetrics && 
        compiledMetrics.averageDuration < transitionMetrics.averageDuration / 2) {
      this.recommendations.push('Compiled transitions are significantly faster. Consider increasing the optimization level to AGGRESSIVE or MAXIMUM.');
    }
    
    // Check state count
    const stateCount = stateMachine.states.size;
    if (stateCount > 100) {
      this.recommendations.push(`Large number of states (${stateCount}). Consider running state minimization more frequently.`);
    }
    
    // Check memory usage
    const memoryMetrics = this.events
      .filter(e => e.metadata?.['memoryUsage'] !== undefined)
      .map(e => e.metadata!['memoryUsage'] as number);
    
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m, 0) / memoryMetrics.length;
      const avgMemoryMB = (avgMemory / (1024 * 1024)).toFixed(1);
      
      if (avgMemory > 50 * 1024 * 1024) {
        this.recommendations.push(`High average memory usage (${avgMemoryMB}MB). Consider memory optimization techniques.`);
      }
    }
    
    // If no specific recommendations, provide general advice
    if (this.recommendations.length === 0) {
      this.recommendations.push('Performance appears good. No specific optimization recommendations at this time.');
    }
    
    return this.recommendations;
  }
  
  /**
   * Get metrics for a specific operation
   * 
   * @param operation Operation name
   * @returns Metrics for the operation, or undefined if not found
   */
  public getMetrics(operation: string): PerformanceMetrics | undefined {
    return this.metrics.get(operation);
  }
  
  /**
   * Get all metrics
   * 
   * @returns Map of all metrics by operation
   */
  public getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }
  
  /**
   * Get recent events
   * 
   * @param limit Maximum number of events to return
   * @returns Most recent events
   */
  public getRecentEvents(limit: number = 100): PerformanceEvent[] {
    return this.events.slice(-limit);
  }
  
  /**
   * Get all warnings
   * 
   * @returns Array of warning messages
   */
  public getWarnings(): string[] {
    return [...this.warnings];
  }
  
  /**
   * Clear all collected performance data
   */
  public clear(): void {
    this.events = [];
    this.metrics.clear();
    this.recommendations = [];
    this.warnings = [];
  }
  
  /**
   * Generate a performance report
   * 
   * @param stateMachine State machine to analyze
   * @returns Performance report as a string
   */
  public generateReport(stateMachine: OptimizedStateMachine): string {
    if (!this.config.enabled || this.events.length === 0) {
      return 'Insufficient performance data collected for reporting.';
    }
    
    let report = 'State Machine Performance Report\n';
    report += '================================\n\n';
    
    // General statistics
    report += 'General Statistics:\n';
    report += `-----------------\n`;
    report += `Total events recorded: ${this.events.length}\n`;
    report += `Unique operation types: ${this.metrics.size}\n`;
    report += `State count: ${stateMachine.states.size}\n`;
    
    // Cache statistics
    const cacheStats = stateMachine.getCacheStats ? stateMachine.getCacheStats() : null;
    if (cacheStats) {
      report += '\nCache Statistics:\n';
      report += `-----------------\n`;
      report += `Hit ratio: ${(cacheStats.hitRatio * 100).toFixed(1)}%\n`;
      report += `Cache size: ${cacheStats.size} entries\n`;
      report += `Cache hits: ${cacheStats.hits}\n`;
      report += `Cache misses: ${cacheStats.misses}\n`;
      report += `Cache evictions: ${cacheStats.evictions}\n`;
    }
    
    // Transition performance
    report += '\nTransition Performance:\n';
    report += `----------------------\n`;
    
    const transitionOps = Array.from(this.metrics.keys())
      .filter(op => op.startsWith('transition'))
      .sort();
    
    for (const op of transitionOps) {
      const metrics = this.metrics.get(op)!;
      report += `${op}:\n`;
      report += `  Average: ${metrics.averageDuration.toFixed(2)}ms\n`;
      report += `  Min: ${metrics.minDuration.toFixed(2)}ms\n`;
      report += `  Max: ${metrics.maxDuration.toFixed(2)}ms\n`;
      report += `  p95: ${metrics.p95Duration.toFixed(2)}ms\n`;
      report += `  Count: ${metrics.count}\n\n`;
    }
    
    // Optimization recommendations
    const recommendations = this.generateRecommendations(stateMachine);
    report += '\nOptimization Recommendations:\n';
    report += `-----------------------------\n`;
    for (const recommendation of recommendations) {
      report += `- ${recommendation}\n`;
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      report += '\nPerformance Warnings:\n';
      report += `--------------------\n`;
      for (const warning of this.warnings) {
        report += `- ${warning}\n`;
      }
    }
    
    return report;
  }
  
  /**
   * Attach to a state machine to automatically record events
   * 
   * @param stateMachine State machine to monitor
   * @returns Function to detach the monitor
   */
  public attachToStateMachine(stateMachine: OptimizedStateMachine): () => void {
    if (!this.config.enabled) return () => {};
    
    // Store the original logPerformanceEvent method
    const originalLogPerformanceEvent = stateMachine.logPerformanceEvent;
    
    // Override the method to capture events
    stateMachine.logPerformanceEvent = (event: any) => {
      // Call the original method
      if (originalLogPerformanceEvent) {
        originalLogPerformanceEvent.call(stateMachine, event);
      }
      
      // Record the event in our monitor
      this.recordEvent({
        operation: event.operation,
        duration: event.duration,
        metadata: {
          stateId: stateMachine.currentState?.id,
          symbol: event.symbol,
          cacheHit: event.cacheHit
        }
      });
    };
    
    // Return a function to restore the original method
    return () => {
      stateMachine.logPerformanceEvent = originalLogPerformanceEvent;
    };
  }
}