```ts
import { State } from "./state-class";
import { StateMachineTransitionCache } from "./state-machine-cache";
import { StateMachine } from "./state-machine-class";

/**
 * Cache configuration options
 */
export interface StateMachineCacheOptions {
  enabled?: boolean;
  maxSize?: number;
  ttl?: number;
  persistToStorage?: boolean;
  storageOptions?: {
    cacheDir?: string;
    maxSize?: number;
    ttl?: number;
  };
  memoryMonitoring?: boolean;
  monitoringInterval?: number;
  memoryThreshold?: number;
  precompute?: {
    enabled?: boolean;
    commonTransitionsOnly?: boolean;
    sampleSize?: number;
  };
  monitoring?: {
    collectMetrics?: boolean;
    logThreshold?: number;
    alertThreshold?: number;
  };
}

/**
 * Transition metrics for performance monitoring
 */
interface TransitionMetrics {
  totalTime: number;
  count: number;
  cached: number;
  uncached: number;
}

// Extend the existing StateMachine implementation
export class CacheableStateMachine extends StateMachine {
  // Add transition cache
  public transitionCache: StateMachineTransitionCache;
  
  // Cache configuration
  public cacheEnabled: boolean;
  public cacheOptions: StateMachineCacheOptions;
  
  // Performance monitoring
  public metrics: Map<string, TransitionMetrics>;
  public metricsEnabled: boolean;
  public logThreshold: number;
  public alertThreshold: number;
  
  /**
   * Create a cacheable state machine
   * 
   * @param initialStateId Optional initial state ID
   * @param cacheOptions Caching configuration options
   */
  constructor(initialStateId?: string, cacheOptions: StateMachineCacheOptions = {}) {
    super(initialStateId);
    
   this.cacheOptions = {
     enabled: true,
     maxSize: 10000,
     ttl: 3600000, // 1 hour
     persistToStorage: false,
     memoryMonitoring: true,
     monitoringInterval: 60000, // 1 minute
     memoryThreshold: 0.8,
     precompute: {
       enabled: true,
       commonTransitionsOnly: true,
       sampleSize: 500
     },
     monitoring: {
       collectMetrics: true,
       logThreshold: 0.7, // Log warning when hit ratio falls below 70%
       alertThreshold: 0.5 // Alert when hit ratio falls below 50%
     },
     ...cacheOptions
   };
   
   this.cacheEnabled = this.cacheOptions.enabled !== false;
   this.metricsEnabled = this.cacheOptions.monitoring?.collectMetrics !== false;
   this.logThreshold = this.cacheOptions.monitoring?.logThreshold || 0.7;
   this.alertThreshold = this.cacheOptions.monitoring?.alertThreshold || 0.5;
   
   // Initialize metrics tracking
   this.metrics = new Map();
   
   // Initialize cache if enabled
   if (this.cacheEnabled) {
     this.transitionCache = new StateMachineTransitionCache({
       maxSize: this.cacheOptions.maxSize,
       ttl: this.cacheOptions.ttl,
       persistToStorage: this.cacheOptions.persistToStorage,
       storageOptions: this.cacheOptions.storageOptions,
       memoryMonitoring: this.cacheOptions.memoryMonitoring,
       monitoringInterval: this.cacheOptions.monitoringInterval,
       memoryThreshold: this.cacheOptions.memoryThreshold
     });
     
     // Perform initial cache warmup if configured
     if (this.cacheOptions.precompute?.enabled) {
       setTimeout(() => {
         this.warmupCache(this.cacheOptions.precompute?.sampleSize);
       }, 100); // Delay slightly to allow initialization to complete
     }
   }
 }
 
 /**
  * Override the transition method to use cache
  * 
  * @param symbol Input symbol
  * @returns Next state after transition
  */
 override transition(symbol: string): State {
   if (!this._currentState) {
     throw new Error('No current state set.');
   }
   
   // Start timing the transition
   const startTime = performance.now();
   let isCached = false;
   
   // Check cache if enabled
   if (this.cacheEnabled) {
     const cachedState = this.transitionCache.get(this._currentState, symbol);
     if (cachedState) {
       this._currentState = cachedState;
       isCached = true;
       
       // Record metrics
       if (this.metricsEnabled) {
         const endTime = performance.now();
         this.recordTransitionMetrics(symbol, endTime - startTime, true);
       }
       
       return cachedState;
     }
   }
   
   // Fall back to standard transition
   const nextState = this._currentState.getNextState(symbol);
   if (!nextState) {
     throw new Error(`No transition defined for symbol '${symbol}' from current state '${this._currentState.id}'.`);
   }
   
   // Record execution time
   const endTime = performance.now();
   const executionTime = endTime - startTime;
   
   // Cache the transition result with execution time
   if (this.cacheEnabled) {
     this.transitionCache.set(this._currentState, symbol, nextState, executionTime);
   }
   
   // Record metrics
   if (this.metricsEnabled) {
     this.recordTransitionMetrics(symbol, executionTime, false);
   }
   
   this._currentState = nextState;
   return nextState;
 }
 
 /**
  * Record metrics for a transition
  * 
  * @param symbol Input symbol
  * @param time Execution time in milliseconds
  * @param cached Whether the transition was cached
  */
 public recordTransitionMetrics(symbol: string, time: number, cached: boolean): void {
   if (!this.metrics.has(symbol)) {
     this.metrics.set(symbol, {
       totalTime: 0,
       count: 0,
       cached: 0,
       uncached: 0
     });
   }
   
   const metrics = this.metrics.get(symbol)!;
   metrics.totalTime += time;
   metrics.count++;
   
   if (cached) {
     metrics.cached++;
   } else {
     metrics.uncached++;
   }
   
   // Check cache performance against thresholds
   this.checkCachePerformance();
 }
 
 /**
  * Check cache performance against thresholds
  */
 public checkCachePerformance(): void {
   if (!this.cacheEnabled || !this.metricsEnabled) return;
   
   const stats = this.transitionCache.getStats();
   
   // Alert if hit ratio falls below threshold
   if (stats.hitRatio < this.alertThreshold) {
     console.error(`[OBIX Cache Alert] Cache hit ratio (${(stats.hitRatio * 100).toFixed(1)}%) below alert threshold (${(this.alertThreshold * 100).toFixed(1)}%)`);
     console.error(`[OBIX Cache Alert] Cache stats: ${JSON.stringify(stats)}`);
   } 
   // Log warning if hit ratio falls below log threshold
   else if (stats.hitRatio < this.logThreshold) {
     console.warn(`[OBIX Cache Warning] Cache hit ratio (${(stats.hitRatio * 100).toFixed(1)}%) below log threshold (${(this.logThreshold * 100).toFixed(1)}%)`);
     console.warn(`[OBIX Cache Warning] Consider adjusting cache size or precomputation`);
   }
 }
 
 /**
  * Helper method to precompute common transitions
  * 
  * @param symbols Optional specific symbols to precompute, or all if not specified
  */
 precomputeCommonTransitions(symbols?: string[]): void {
   if (this.cacheEnabled) {
     this.transitionCache.precomputeTransitions(this, symbols);
   }
 }
 
 /**
  * Precompute transitions for specific state patterns
  * 
  * @param patterns Array of state patterns with associated transition symbols
  */
 precomputeTransitionsForPatterns(patterns: Array<{
   statePattern: any;
   symbols: string[];
 }>): void {
   if (this.cacheEnabled) {
     this.transitionCache.precomputeForPatterns(this, patterns);
   }
 }
 
 /**
  * Get detailed cache statistics
  * 
  * @param includeAnalysis Whether to include transition pattern analysis
  * @returns Cache statistics and optional analysis
  */
 getCacheStats(includeAnalysis: boolean = false): any {
   if (!this.cacheEnabled) {
     return { enabled: false };
   }
   
   const stats = this.transitionCache.getStats();
   
   if (includeAnalysis) {
     return {
       ...stats,
       analysis: this.transitionCache.analyzeTransitionPatterns(this),
       transitionMetrics: this.getTransitionMetrics()
     };
   }
   
   return stats;
 }
 
 /**
  * Get metrics for all transitions
  * 
  * @returns Transition performance metrics
  */
 getTransitionMetrics(): any {
   if (!this.metricsEnabled) {
     return { enabled: false };
   }
   
   const result: Record<string, {
     avgTime: number;
     cachedTime: number;
     uncachedTime: number;
     cacheRate: number;
     count: number;
   }> = {};
   
   for (const [symbol, metrics] of this.metrics.entries()) {
     const cachedAvg = metrics.cached > 0 ? 
       metrics.totalTime / metrics.count : 0;
     
     const uncachedAvg = metrics.uncached > 0 ? 
       metrics.totalTime / metrics.count : 0;
     
     result[symbol] = {
       avgTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
       cachedTime: cachedAvg,
       uncachedTime: uncachedAvg,
       cacheRate: metrics.count > 0 ? metrics.cached / metrics.count : 0,
       count: metrics.count
     };
   }
   
   return result;
 }
 
 /**
  * Clear the transition cache
  */
 clearCache(): void {
   if (this.cacheEnabled) {
     this.transitionCache.clear();
   }
 }
 
 /**
  * Reset metrics tracking
  */
 resetMetrics(): void {
   this.metrics.clear();
 }
 
 /**
  * Warm up the cache with common transitions
  * 
  * @param sampleSize Number of transitions to analyze for frequency
  */
 warmupCache(sampleSize?: number): void {
   if (this.cacheEnabled) {
     this.transitionCache.warmupCache(this, sampleSize || this.cacheOptions.precompute?.sampleSize || 500);
   }
 }
 
 /**
  * Configure caching options dynamically
  * 
  * @param options New cache configuration options
  */
 configureCaching(options: StateMachineCacheOptions): void {
   // Update options
   this.cacheOptions = {
     ...this.cacheOptions,
     ...options
   };
   
   // Update flags
   this.cacheEnabled = this.cacheOptions.enabled !== false;
   this.metricsEnabled = this.cacheOptions.monitoring?.collectMetrics !== false;
   this.logThreshold = this.cacheOptions.monitoring?.logThreshold || 0.7;
   this.alertThreshold = this.cacheOptions.monitoring?.alertThreshold || 0.5;
   
   // Reinitialize cache if enabled
   if (this.cacheEnabled) {
     // Dispose of existing cache if any
     if (this.transitionCache) {
       this.transitionCache.dispose();
     }
     
     // Create new cache with updated options
     this.transitionCache = new StateMachineTransitionCache({
       maxSize: this.cacheOptions.maxSize,
       ttl: this.cacheOptions.ttl,
       persistToStorage: this.cacheOptions.persistToStorage,
       storageOptions: this.cacheOptions.storageOptions,
       memoryMonitoring: this.cacheOptions.memoryMonitoring,
       monitoringInterval: this.cacheOptions.monitoringInterval,
       memoryThreshold: this.cacheOptions.memoryThreshold
     });
     
     // Perform initial cache warmup if configured
     if (this.cacheOptions.precompute?.enabled) {
       setTimeout(() => {
         this.warmupCache(this.cacheOptions.precompute?.sampleSize);
       }, 100);
     }
   }
 }
 
 /**
  * Override dispose to clean up cache resources
  */
 override dispose(): void {
   if (this.cacheEnabled && this.transitionCache) {
     this.transitionCache.dispose();
   }
   
   // Clear metrics
   this.metrics.clear();
 }
}
```