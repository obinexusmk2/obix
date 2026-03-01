/**
 * OptimizedStateMachine
 * 
 * A highly optimized implementation of the StateMachine class that incorporates
 * advanced caching, predictive state transitions, and runtime optimization
 * techniques to maximize performance for Nnamdi Okpala's automaton state
 * minimization technology.
 */

import { State } from './State';
import { AdvancedTransitionCache, AdvancedCacheOptions } from './AdvancedTransitionCache';
import { EnhancedCacheableStateMachine, EnhancedCacheableStateMachineOptions } from './EnhancedCachableStateMachine';
import { StateMachineMinimizer } from '../minimizer';
import { AsyncUtils } from '../utils/AsyncUtils';
import { 
  CacheStrategy, 
  OptimizationLevel,
  RuntimeOptimizationOptions 
} from '../types/cache-types';

/**
 * Configuration options for OptimizedStateMachine
 */
export interface CacheStats {
  hitRatio: number;
  size: number;
  hits: number;
  misses: number;
  evictions: number;
}

export interface OptimizedStateMachineOptions extends EnhancedCacheableStateMachineOptions {
  // Advanced caching options
  cacheStrategy?: CacheStrategy;
  multiLevelCache?: boolean;
  predictiveCaching?: boolean;
  
  // Runtime optimization options
  runtimeOptimization?: boolean;
  optimizationLevel?: OptimizationLevel;
  optimizationInterval?: number;
  
  // Memory management options
  memoryConstraints?: {
    maxMemoryUsage?: number;
    compactionThreshold?: number;
  };
  
  // Performance monitoring
  performanceMonitoring?: boolean;
  monitoringOptions?: {
    sampleInterval?: number;
    persistPerformanceData?: boolean;
    performanceThresholds?: {
      transitionLatency?: number;
      memoryUsage?: number;
    };
  };
}

/**
 * Optimized state machine implementation
 */
export class OptimizedStateMachine extends EnhancedCacheableStateMachine {
  // Advanced cache implementation
  private advancedCache: AdvancedTransitionCache;
  
  // Runtime optimization settings
  private runtimeOptimization: boolean;
  private optimizationLevel: OptimizationLevel;
  private optimizationInterval: number;
  private lastOptimizationTime: number = 0;
  private optimizationTimer: NodeJS.Timeout | null = null;
  
  // Memory management
  private maxMemoryUsage: number | null = null;
  private compactionThreshold: number;
  
  // Performance monitoring
  private performanceMonitoring: boolean;
  private performanceSampleInterval: number;
  private performanceDataStore: Array<{
    timestamp: number;
    transitionLatency: number;
    cacheHitRatio: number;
    memoryUsage: number;
    stateCount: number;
    transitionCount: number;
  }> = [];
  
  // Optimization statistics
  private optimizationStats: {
    transitionsProcessed: number;
    minimizationsPerformed: number;
    statesRemoved: number;
    totalOptimizationTime: number;
    lastOptimizationResult: {
      stateReductionPct: number;
      optimizationTimeMs: number;
      memoryReduced: number;
    };
  };
  
  // Runtime state compilation
  private compiledTransitions: Map<string, Function> = new Map();
  
  /**
   * Create a new OptimizedStateMachine
   * 
   * @param initialStateId Initial state ID (optional)
   * @param options Configuration options
   */
  constructor(initialStateId?: string, options: OptimizedStateMachineOptions = {
    enabled: true
  }) {
    // Initialize base class
    super(initialStateId, options);
    
    // Configure advanced cache
    const advancedCacheOptions: AdvancedCacheOptions = {
      maxSize: options.maxSize || 1000,
      ttl: options.ttl,
      strategy: options.cacheStrategy || CacheStrategy.HYBRID,
      adaptiveSize: true,
      predictivePrefetch: options.predictiveCaching !== false,
      enableL2Cache: options.multiLevelCache !== false,
      monitorPerformance: options.performanceMonitoring !== false,
      logHitRatio: options.performanceMonitoring !== false
    };
    
    this.advancedCache = new AdvancedTransitionCache(advancedCacheOptions);
    
    // Configure runtime optimization
    this.runtimeOptimization = options.runtimeOptimization !== false;
    this.optimizationLevel = options.optimizationLevel || OptimizationLevel.STANDARD;
    this.optimizationInterval = options.optimizationInterval || 60000; // Default: 1 minute
    
    // Configure memory management
    this.maxMemoryUsage = options.memoryConstraints?.maxMemoryUsage || null;
    this.compactionThreshold = options.memoryConstraints?.compactionThreshold || 0.8;
    
    // Configure performance monitoring
    this.performanceMonitoring = options.performanceMonitoring !== false;
    this.performanceSampleInterval = options.monitoringOptions?.sampleInterval || 10000; // Default: 10 seconds
    
    // Initialize optimization statistics
    this.optimizationStats = {
      transitionsProcessed: 0,
      minimizationsPerformed: 0,
      statesRemoved: 0,
      totalOptimizationTime: 0,
      lastOptimizationResult: {
        stateReductionPct: 0,
        optimizationTimeMs: 0,
        memoryReduced: 0
      }
    };
    
    // Start optimization timer if enabled
    if (this.runtimeOptimization) {
      this.startOptimizationTimer();
    }
  }
  
  /**
   * Start the periodic optimization timer
   */
  private startOptimizationTimer(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
    }
    
    this.optimizationTimer = setInterval(() => {
      this.performRuntimeOptimization();
    }, this.optimizationInterval);
  }
  
  /**
   * Override the transition method to use advanced cache
   * 
   * @param symbol Input symbol to transition on
   * @returns The resulting state after transition
   */
  override transition(symbol: string): State {
    if (!this._currentState) {
      throw new Error('No current state set.');
    }
    
    // Start performance monitoring
    const startTime = this.performanceMonitoring ? performance.now() : 0;
    
    // Check for a compiled transition function first (fastest path)
    const compiledKey = `${this._currentState.id}:${symbol}`;
    const compiledTransition = this.compiledTransitions.get(compiledKey);
    
    if (compiledTransition) {
      try {
        // Execute the compiled transition function
        const nextState = compiledTransition.call(this);
        
        // Log performance data if enabled
        if (this.performanceMonitoring) {
          this.recordTransitionPerformance(startTime, true, true);
        }
        
        return nextState;
      } catch (error) {
        // If compiled transition fails, fall back to standard path
        console.warn(`Compiled transition failed for ${compiledKey}, falling back to standard path`);
      }
    }
    
    // Check advanced cache second (fast path)
    if (this.cacheEnabled) {
      const cachedState = this.advancedCache.get(this._currentState, symbol);
      if (cachedState) {
        this._currentState = cachedState;
        
        // Log performance data if enabled
        if (this.performanceMonitoring) {
          this.recordTransitionPerformance(startTime, true, false);
        }
        
        // Consider compiling this transition for future use
        if (this.optimizationLevel >= OptimizationLevel.AGGRESSIVE) {
          this.compileTransition(this._currentState.id, symbol);
        }
        
        return cachedState;
      }
    }
    
    // Standard transition (slow path)
    try {
      const nextState = this._currentState.getNextState(symbol);
      if (!nextState) {
        throw new Error(`No transition defined for symbol '${symbol}' from current state '${this._currentState.id}'.`);
      }
      
      // Cache the transition result
      if (this.cacheEnabled) {
        this.advancedCache.set(this._currentState, symbol, nextState);
      }
      
      this._currentState = nextState;
      
      // Log performance data if enabled
      if (this.performanceMonitoring) {
        this.recordTransitionPerformance(startTime, false, false);
      }
      
      // Update optimization statistics
      this.optimizationStats.transitionsProcessed++;
      
      // Consider adaptive optimization
      this.considerAdaptiveOptimization();
      
      return nextState;
    } catch (error) {
      if (this.performanceMonitoring) {
        const endTime = performance.now();
        this.logPerformanceEvent({
          operation: 'transition-error',
          startTime,
          endTime,
          duration: endTime - startTime,
          symbol
        });
      }
      throw error;
    }
  }
  
  /**
   * Record transition performance metrics
   * 
   * @param startTime Start time of the transition
   * @param cacheHit Whether the transition was served from cache
   * @param compiled Whether the transition used a compiled function
   */
  private recordTransitionPerformance(startTime: number, cacheHit: boolean, compiled: boolean): void {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Record the performance event
    this.logPerformanceEvent({
      operation: compiled ? 'transition-compiled' : (cacheHit ? 'transition-cached' : 'transition-standard'),
      startTime,
      endTime,
      duration
    });
    
    // Consider storing detailed performance data
    if (this.shouldSamplePerformance()) {
      const cacheStats = this.advancedCache.getStats();
      
      this.performanceDataStore.push({
        timestamp: Date.now(),
        transitionLatency: duration,
        cacheHitRatio: cacheStats.hitRatio,
        memoryUsage: this.estimateMemoryUsage(),
        stateCount: this.states.size,
        transitionCount: this.countTransitions()
      });
      
      // Limit the size of the performance data store
      if (this.performanceDataStore.length > 1000) {
        this.performanceDataStore = this.performanceDataStore.slice(-500);
      }
    }
  }
  
  /**
   * Check if we should sample performance based on the interval
   * 
   * @returns True if we should sample performance now
   */
  private shouldSamplePerformance(): boolean {
    if (!this.performanceMonitoring) return false;
    
    const lastSample = this.performanceDataStore[this.performanceDataStore.length - 1];
    if (!lastSample) return true;
    
    return Date.now() - lastSample.timestamp >= this.performanceSampleInterval;
  }
  
  /**
   * Consider whether to trigger an adaptive optimization
   * based on recent performance metrics
   */
  private considerAdaptiveOptimization(): void {
    if (!this.runtimeOptimization) return;
    
    const now = Date.now();
    
    // Don't optimize too frequently
    if (now - this.lastOptimizationTime < this.optimizationInterval / 2) return;
    
    // Check if we have enough transitions to warrant optimization
    const transitionsSinceLastOptimization = 
      this.optimizationStats.transitionsProcessed - 
      (this.optimizationStats.lastOptimizationResult.stateReductionPct * this.states.size);
    
    // If we've processed a significant number of transitions, consider optimizing
    if (transitionsSinceLastOptimization > this.states.size * 2) {
      this.performRuntimeOptimization();
    }
    
    // Check memory usage if constraints are set
    if (this.maxMemoryUsage && this.estimateMemoryUsage() > this.maxMemoryUsage * this.compactionThreshold) {
      this.performMemoryCompaction();
    }
  }
  
  /**
   * Perform runtime optimization of the state machine
   */
  private performRuntimeOptimization(): void {
    if (!this.runtimeOptimization) return;
    
    const startTime = performance.now();
    const originalStateCount = this.states.size;
    
    // Perform minimization based on the optimization level
    let statesRemoved = 0;
    
    switch (this.optimizationLevel) {
      case OptimizationLevel.MINIMAL:
        // Just do basic cleanup
        statesRemoved = this.removeUnreachableStates();
        break;
        
      case OptimizationLevel.STANDARD:
        // Perform standard minimization
        statesRemoved = this.minimize();
        break;
        
      case OptimizationLevel.AGGRESSIVE:
        // Perform aggressive minimization and compile common transitions
        statesRemoved = this.minimize();
        this.compileCommonTransitions();
        break;
        
      case OptimizationLevel.MAXIMUM:
        // Perform maximum optimization, including memory compaction
        statesRemoved = this.minimize();
        this.compileCommonTransitions();
        this.performMemoryCompaction();
        break;
    }
    
    // Record optimization results
    const endTime = performance.now();
    const optimizationTime = endTime - startTime;
    
    this.optimizationStats.minimizationsPerformed++;
    this.optimizationStats.statesRemoved += statesRemoved;
    this.optimizationStats.totalOptimizationTime += optimizationTime;
    this.optimizationStats.lastOptimizationResult = {
      stateReductionPct: statesRemoved / originalStateCount,
      optimizationTimeMs: optimizationTime,
      memoryReduced: this.estimateMemoryUsage() // Simplified; would need before/after
    };
    
    this.lastOptimizationTime = Date.now();
    
    // Log the optimization event if performance monitoring is enabled
    if (this.performanceMonitoring) {
      this.logPerformanceEvent({
        operation: 'state-machine-optimization',
        startTime,
        endTime,
        duration: optimizationTime
      });
    }
  }
  
  /**
   * Compile a specific transition to a direct function
   * for maximum performance
   * 
   * @param stateId Source state ID
   * @param symbol Input symbol
   */
  private compileTransition(stateId: string, symbol: string): void {
    try {
      const sourceState = this.getState(stateId);
      const compiledKey = `${stateId}:${symbol}`;
      
      if (!sourceState || this.compiledTransitions.has(compiledKey)) {
        return;
      }
      
      const targetState = sourceState.getNextState(symbol);
      if (!targetState) return;
      
      // Create a compiled function that directly sets the current state
      const compiledFunction = function(this: OptimizedStateMachine) {
        this._currentState = targetState;
        return targetState;
      };
      
      this.compiledTransitions.set(compiledKey, compiledFunction);
    } catch (error) {
      // Silently fail - compilation is an optimization, not required
    }
  }
  
  /**
   * Compile common transitions for improved performance
   */
  private compileCommonTransitions(): void {
    // Clear existing compiled transitions
    this.compiledTransitions.clear();
    
    // Find most frequently accessed states and transitions
    const cacheStats = this.advancedCache.getStats();
    
    // If we have the advanced stats, use them to prioritize compilation
    if (cacheStats.bucketSizes && cacheStats.bucketSizes.frequent > 0) {
      // Compile transitions for states in the frequent access bucket
      // Implementation would depend on access to the bucket data
      // This is a simplified example
      const commonStates = Array.from(this.states.values())
        .slice(0, Math.min(20, this.states.size));
      
      for (const state of commonStates) {
        const transitions = state.transitions;
        for (const [symbol, targetState] of transitions.entries()) {
          this.compileTransition(state.id, symbol);
        }
      }
    } else {
      // Fall back to compiling for all states with a limit
      const maxCompilations = Math.min(100, this.states.size * 2);
      let compilationCount = 0;
      
      for (const state of this.states.values()) {
        const transitions = state.transitions;
        for (const [symbol, _] of transitions.entries()) {
          if (compilationCount >= maxCompilations) break;
          
          this.compileTransition(state.id, symbol);
          compilationCount++;
        }
        
        if (compilationCount >= maxCompilations) break;
      }
    }
  }
  
  /**
   * Perform memory compaction on the state machine
   */
  private performMemoryCompaction(): void {
    // Reuse the StateMachineMinimizer's memory optimization techniques
    StateMachineMinimizer.applyMemoryOptimizations(this);
    
    // Clear all caches if memory usage is still high
    if (this.estimateMemoryUsage() > (this.maxMemoryUsage || Infinity) * 0.9) {
      this.advancedCache.clear();
      this.compiledTransitions.clear();
    }
  }
  
  /**
   * Count the total number of transitions in the state machine
   * 
   * @returns The number of transitions
   */
  private countTransitions(): number {
    let count = 0;
    for (const state of this.states.values()) {
      count += state.transitions.size;
    }
    return count;
  }
  
  /**
   * Estimate the memory usage of the state machine
   * 
   * @returns Estimated memory usage in bytes
   */
  private estimateMemoryUsage(): number {
    // Base size for the state machine object
    let size = 1000; // Base size assumption
    
    // Add size for each state
    size += this.states.size * 200; // Approximation for each state object
    
    // Add size for transitions
    const transitionCount = this.countTransitions();
    size += transitionCount * 100; // Approximation for each transition
    
    // Add size for cache
    const cacheStats = this.advancedCache.getStats();
    size += cacheStats.size * 150; // Approximation for each cached entry
    
    // Add size for compiled functions
    size += this.compiledTransitions.size * 300; // Approximation for each compiled function
    
    // Add size for performance data
    size += this.performanceDataStore.length * 100;
    
    return size;
  }
  
  /**
   * Process a sequence of transitions with optimized batch processing
   * 
   * @param symbols Array of input symbols to process in sequence
   * @returns The final state after processing all transitions
   */
  override processSequence(symbols: string[]): State {
    if (!this._currentState) {
      throw new Error('No current state set.');
    }
    
    // For small sequences, use the standard approach
    if (symbols.length <= 5) {
      return super.processSequence(symbols);
    }
    
    // For larger sequences, use optimized batch processing
    const startTime = this.performanceMonitoring ? performance.now() : 0;
    
    // Try to find a cached path for the entire sequence
    const sequenceKey = `${this._currentState.id}:${symbols.join(',')}`;
    
    // Look for the sequence in memory (could be extended to a dedicated sequence cache)
    // This is a placeholder implementation
    
    // Process the sequence in chunks for better cache utilization
    const chunkSize = 10;
    let currentState = this._currentState;
    
    for (let i = 0; i < symbols.length; i += chunkSize) {
      const chunk = symbols.slice(i, i + chunkSize);
      
      // Process each symbol in the chunk
      for (const symbol of chunk) {
        currentState = this.transition(symbol);
      }
    }
    
    // Log performance if enabled
    if (this.performanceMonitoring) {
      const endTime = performance.now();
      this.logPerformanceEvent({
        operation: 'process-sequence',
        startTime,
        endTime,
        duration: endTime - startTime
      });
    }
    
    return currentState;
  }
  
  /**
   * Get optimization statistics
   * 
   * @returns Optimization statistics
   */
  public getOptimizationStats(): typeof this.optimizationStats {
    return { ...this.optimizationStats };
  }

  /**
   * Get cache statistics
   * @returns Cache statistics including hit ratio, size, hits, misses, and evictions
   */
  public getCacheStats(): CacheStats {
    return this.advancedCache.getStats();
  }
  
  /**
   * Get performance data for analysis
   * 
   * @returns Array of performance data samples
   */
  public getPerformanceData(): typeof this.performanceDataStore {
    return [...this.performanceDataStore];
  }
  
  /**
   * Export the state machine's current state to JSON
   * with optimization data
   * 
   * @returns Serialized state machine data
   */
  override exportToJSON(): string {
    const baseJson = super.exportToJSON();
    const data = JSON.parse(baseJson);
    
    // Add optimization metadata
    data.optimization = {
      stats: this.optimizationStats,
      level: this.optimizationLevel,
      lastOptimized: this.lastOptimizationTime,
      compiledTransitionsCount: this.compiledTransitions.size
    };
    
    // Add performance data summary if available
    if (this.performanceDataStore.length > 0) {
      const avgLatency = this.performanceDataStore.reduce(
        (sum, item) => sum + item.transitionLatency, 0
      ) / this.performanceDataStore.length;
      
      data.performance = {
        averageTransitionLatency: avgLatency,
        sampleCount: this.performanceDataStore.length,
        lastSampleTime: this.performanceDataStore[this.performanceDataStore.length - 1]?.timestamp
      };
    }
    
    return JSON.stringify(data);
  }
  
  /**
   * Clean up resources
   */
  override dispose(): void {
    // Stop the optimization timer
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = null;
    }
    
    // Clear all caches
    this.advancedCache.dispose();
    this.compiledTransitions.clear();
    
    // Call super dispose
    super.dispose();
  }
}