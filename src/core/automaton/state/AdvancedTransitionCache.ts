/**
 * AdvancedTransitionCache
 * 
 * Advanced implementation of the StateMachineTransitionCache with enhanced
 * caching strategies, adaptive sizing, and predictive prefetching capabilities.
 * This implementation further optimizes Nnamdi Okpala's automaton state 
 * minimization technology with multi-level caching and frequency-based retention.
 */

import { State } from './State';
import { StateMachine } from './StateMachineClass';
import { CacheStrategy } from '../types/cache-types';
import { 
  DEFAULT_CACHE_SIZE, 
  DEFAULT_CACHE_TTL, 
  HIGH_WATER_MARK, 
  LOW_WATER_MARK, 
  HIT_RATIO_THRESHOLD 
} from '../constants/cache-constants';
import { internString } from '../utils/StringUtils';

/**
 * Configuration options for AdvancedTransitionCache
 */
export interface AdvancedCacheOptions {
  // Basic cache settings
  maxSize?: number;
  ttl?: number;
  
  // Advanced cache settings
  strategy?: CacheStrategy;
  adaptiveSize?: boolean;
  predictivePrefetch?: boolean;
  frequencyThreshold?: number;
  
  // Multi-level cache settings
  enableL2Cache?: boolean;
  l2CacheSize?: number;
  
  // Performance settings
  monitorPerformance?: boolean;
  logHitRatio?: boolean;
}

/**
 * Cache entry metadata
 */
interface CacheEntryMetadata {
  frequency: number;
  lastAccessed: number;
  createdAt: number;
  expiresAt?: number;
  cost: number;
}

/**
 * Cache bucket for advanced indexing
 */
interface CacheBucket {
  entries: Map<string, State>;
  metadata: Map<string, CacheEntryMetadata>;
}

/**
 * Advanced transition cache with multiple eviction strategies
 */
export class AdvancedTransitionCache {
  // Cache configuration
  private maxSize: number;
  private ttl: number | null;
  private strategy: CacheStrategy;
  private adaptiveSize: boolean;
  private predictivePrefetch: boolean;
  private frequencyThreshold: number;
  
  // Multi-level caching
  private enableL2Cache: boolean;
  private l2CacheSize: number;
  
  // Primary (L1) cache
  private primaryCache: Map<string, State>;
  private metadataMap: Map<string, CacheEntryMetadata>;
  
  // Secondary (L2) cache for items evicted from primary
  private secondaryCache: Map<string, State>;
  private secondaryMetadata: Map<string, CacheEntryMetadata>;
  
  // Frequency buckets for segmenting cache by access patterns
  private frequentAccess: CacheBucket;
  private moderateAccess: CacheBucket;
  private rareAccess: CacheBucket;
  
  // Performance monitoring
  private monitorPerformance: boolean;
  private logHitRatio: boolean;
  
  // Cache usage tracking
  private accessQueue: string[]; // For LRU
  private frequencyMap: Map<string, number>; // For LFU
  
  // Invalidation timer
  private invalidationTimer: NodeJS.Timeout | null = null;
  
  // Prediction data
  private transitionPredictions: Map<string, Set<string>>;
  
  // Statistics
  private stats: {
    hits: number;
    misses: number;
    l1Hits: number;
    l2Hits: number;
    evictions: number;
    size: number;
    predictiveHits: number;
    adaptiveSizeAdjustments: number;
  };
  
  /**
   * Create a new AdvancedTransitionCache
   * 
   * @param options Configuration options
   */
  constructor(options: AdvancedCacheOptions = {}) {
    // Configure settings
    this.maxSize = options.maxSize || DEFAULT_CACHE_SIZE;
    this.ttl = options.ttl || DEFAULT_CACHE_TTL;
    this.strategy = options.strategy || CacheStrategy.LRU;
    this.adaptiveSize = options.adaptiveSize !== false;
    this.predictivePrefetch = options.predictivePrefetch !== false;
    this.frequencyThreshold = options.frequencyThreshold || 3;
    
    // Multi-level cache settings
    this.enableL2Cache = options.enableL2Cache !== false;
    this.l2CacheSize = options.l2CacheSize || Math.floor(this.maxSize * 0.5);
    
    // Performance monitoring
    this.monitorPerformance = options.monitorPerformance || false;
    this.logHitRatio = options.logHitRatio || false;
    
    // Initialize primary cache
    this.primaryCache = new Map<string, State>();
    this.metadataMap = new Map<string, CacheEntryMetadata>();
    
    // Initialize secondary cache if enabled
    this.secondaryCache = new Map<string, State>();
    this.secondaryMetadata = new Map<string, CacheEntryMetadata>();
    
    // Initialize frequency buckets
    this.frequentAccess = { 
      entries: new Map<string, State>(), 
      metadata: new Map<string, CacheEntryMetadata>() 
    };
    this.moderateAccess = { 
      entries: new Map<string, State>(), 
      metadata: new Map<string, CacheEntryMetadata>() 
    };
    this.rareAccess = { 
      entries: new Map<string, State>(), 
      metadata: new Map<string, CacheEntryMetadata>() 
    };
    
    // Initialize tracking structures
    this.accessQueue = [];
    this.frequencyMap = new Map<string, number>();
    this.transitionPredictions = new Map<string, Set<string>>();
    
    // Initialize statistics
    this.stats = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0,
      evictions: 0,
      size: 0,
      predictiveHits: 0,
      adaptiveSizeAdjustments: 0
    };
    
    // Set up cache invalidation timer if TTL is provided
    if (this.ttl && this.ttl > 0) {
      this.startInvalidationTimer(this.ttl);
    }
  }
  
  /**
   * Generate a cache key from state ID and input symbol
   * 
   * @param stateId Source state identifier
   * @param inputSymbol Transition input symbol
   * @returns Cache key string
   */
  public generateKey(stateId: string, inputSymbol: string): string {
    // Use string interning for memory efficiency
    return internString(`${stateId}:${inputSymbol}`);
  }
  
  /**
   * Get cached transition result with enhanced lookup strategy
   * 
   * @param sourceState Source state
   * @param inputSymbol Transition input symbol
   * @returns Target state if found in cache, undefined otherwise
   */
  get(sourceState: State, inputSymbol: string): State | undefined {
    const key = this.generateKey(sourceState.id, inputSymbol);
    const now = Date.now();
    
    // First check primary cache (L1)
    if (this.primaryCache.has(key)) {
      // Update metadata
      this.updateCacheMetadata(key, now);
      
      // Move to frequent access bucket if accessed often
      this.updateFrequencyBucket(key);
      
      this.stats.hits++;
      this.stats.l1Hits++;
      
      // Trigger prefetch if enabled
      if (this.predictivePrefetch) {
        this.triggerPrefetch(sourceState, inputSymbol);
      }
      
      return this.primaryCache.get(key);
    }
    
    // Then check secondary cache (L2) if enabled
    if (this.enableL2Cache && this.secondaryCache.has(key)) {
      const state = this.secondaryCache.get(key);
      
      // Promote to primary cache
      this.secondaryCache.delete(key);
      this.primaryCache.set(key, state!);
      
      // Move metadata
      const metadata = this.secondaryMetadata.get(key)!;
      this.secondaryMetadata.delete(key);
      this.metadataMap.set(key, {
        ...metadata,
        lastAccessed: now
      });
      
      this.stats.hits++;
      this.stats.l2Hits++;
      
      // Update usage tracking
      this.updateUsage(key);
      
      return state;
    }
    
    // Check if this was predicted but not yet cached
    if (this.predictivePrefetch && this.isPredicted(sourceState.id, inputSymbol)) {
      // Record the miss for a predicted transition (helps tune predictions)
      this.updatePredictionAccuracy(sourceState.id, inputSymbol, false);
    }
    
    this.stats.misses++;
    return undefined;
  }
  
  /**
   * Store transition result in cache with advanced metadata
   * 
   * @param sourceState Source state
   * @param inputSymbol Transition input symbol
   * @param targetState Resulting state after transition
   */
  set(sourceState: State, inputSymbol: string, targetState: State): void {
    const key = this.generateKey(sourceState.id, inputSymbol);
    const now = Date.now();
    
    // If already in cache, just update metadata
    if (this.primaryCache.has(key)) {
      this.primaryCache.set(key, targetState);
      this.updateCacheMetadata(key, now);
      return;
    }
    
    // If primary cache is at capacity, manage according to strategy
    if (this.primaryCache.size >= this.maxSize) {
      this.evictFromPrimaryCache();
    }
    
    // Add to primary cache
    this.primaryCache.set(key, targetState);
    
    // Set initial metadata
    this.metadataMap.set(key, {
      frequency: 1,
      lastAccessed: now,
      createdAt: now,
      expiresAt: this.ttl ? now + this.ttl : undefined,
      cost: this.calculateEntryCost(targetState)
    });
    
    // Add to rare access bucket initially
    this.rareAccess.entries.set(key, targetState);
    this.rareAccess.metadata.set(key, this.metadataMap.get(key)!);
    
    // Update usage tracking
    this.updateUsage(key);
    
    // Update size statistic
    this.stats.size = this.primaryCache.size;
    
    // Update prediction data
    if (this.predictivePrefetch) {
      this.updatePredictions(sourceState.id, inputSymbol);
    }
  }
  
  /**
   * Calculate the memory cost of a cache entry
   * 
   * @param state State to evaluate
   * @returns Estimated memory cost
   */
  private calculateEntryCost(state: State): number {
    // Base cost for the state object
    let cost = 1;
    
    // Add cost for transitions (references to other states)
    cost += state.transitions.size;
    
    // Add cost for metadata
    cost += Object.keys(state.metadata).length;
    
    // Add cost for state value if it's a string
    if (typeof state.value === 'string') {
      cost += Math.ceil(state.value.length / 100); // Rough estimate
    }
    
    return cost;
  }
  
  /**
   * Update usage tracking based on the selected strategy
   * 
   * @param key Cache key that was accessed
   */
  private updateUsage(key: string): void {
    // Update LRU queue
    if (this.strategy === CacheStrategy.LRU || 
        this.strategy === CacheStrategy.HYBRID) {
      // Remove from current position
      const index = this.accessQueue.indexOf(key);
      if (index !== -1) {
        this.accessQueue.splice(index, 1);
      }
      
      // Add to end (most recently used)
      this.accessQueue.push(key);
    }
    
    // Update frequency counter
    if (this.strategy === CacheStrategy.LFU || 
        this.strategy === CacheStrategy.HYBRID) {
      this.frequencyMap.set(key, (this.frequencyMap.get(key) || 0) + 1);
    }
  }
  
  /**
   * Update cache metadata for a key
   * 
   * @param key Cache key
   * @param timestamp Access timestamp
   */
  private updateCacheMetadata(key: string, timestamp: number): void {
    const metadata = this.metadataMap.get(key);
    
    if (metadata) {
      metadata.lastAccessed = timestamp;
      metadata.frequency += 1;
      
      // Update expiration if TTL is used
      if (this.ttl) {
        metadata.expiresAt = timestamp + this.ttl;
      }
    }
  }
  
  /**
   * Update frequency bucket for a key based on access pattern
   * 
   * @param key Cache key
   */
  private updateFrequencyBucket(key: string): void {
    const metadata = this.metadataMap.get(key);
    if (!metadata) return;
    
    const state = this.primaryCache.get(key);
    if (!state) return;
    
    // Determine appropriate bucket
    if (metadata.frequency >= this.frequencyThreshold * 2) {
      // Move to frequent access bucket
      this.moveToFrequentBucket(key, state, metadata);
    } else if (metadata.frequency >= this.frequencyThreshold) {
      // Move to moderate access bucket
      this.moveToModerateBucket(key, state, metadata);
    } else {
      // Move to rare access bucket
      this.moveToRareBucket(key, state, metadata);
    }
  }
  
  /**
   * Move a cache entry to the frequent access bucket
   * 
   * @param key Cache key
   * @param state State object
   * @param metadata Cache metadata
   */
  private moveToFrequentBucket(key: string, state: State, metadata: CacheEntryMetadata): void {
    // Remove from other buckets
    this.rareAccess.entries.delete(key);
    this.rareAccess.metadata.delete(key);
    this.moderateAccess.entries.delete(key);
    this.moderateAccess.metadata.delete(key);
    
    // Add to frequent bucket
    this.frequentAccess.entries.set(key, state);
    this.frequentAccess.metadata.set(key, metadata);
  }
  
  /**
   * Move a cache entry to the moderate access bucket
   * 
   * @param key Cache key
   * @param state State object
   * @param metadata Cache metadata
   */
  private moveToModerateBucket(key: string, state: State, metadata: CacheEntryMetadata): void {
    // Remove from other buckets
    this.rareAccess.entries.delete(key);
    this.rareAccess.metadata.delete(key);
    this.frequentAccess.entries.delete(key);
    this.frequentAccess.metadata.delete(key);
    
    // Add to moderate bucket
    this.moderateAccess.entries.set(key, state);
    this.moderateAccess.metadata.set(key, metadata);
  }
  
  /**
   * Move a cache entry to the rare access bucket
   * 
   * @param key Cache key
   * @param state State object
   * @param metadata Cache metadata
   */
  private moveToRareBucket(key: string, state: State, metadata: CacheEntryMetadata): void {
    // Remove from other buckets
    this.moderateAccess.entries.delete(key);
    this.moderateAccess.metadata.delete(key);
    this.frequentAccess.entries.delete(key);
    this.frequentAccess.metadata.delete(key);
    
    // Add to rare bucket
    this.rareAccess.entries.set(key, state);
    this.rareAccess.metadata.set(key, metadata);
  }
  
  /**
   * Evict an item from primary cache based on the current strategy
   */
  private evictFromPrimaryCache(): void {
    switch (this.strategy) {
      case CacheStrategy.LRU:
        this.evictLRU();
        break;
      case CacheStrategy.LFU:
        this.evictLFU();
        break;
      case CacheStrategy.HYBRID:
        // For hybrid, alternate between LRU and LFU
        if (this.stats.evictions % 2 === 0) {
          this.evictLRU();
        } else {
          this.evictLFU();
        }
        break;
      default:
        this.evictLRU(); // Default to LRU
    }
    
    // If adaptive sizing is enabled, adjust cache size based on hit ratio
    if (this.adaptiveSize) {
      this.adjustCacheSize();
    }
  }
  
  /**
   * Evict least recently used cache entry
   */
  private evictLRU(): void {
    // Try to evict from rare access bucket first
    if (this.rareAccess.entries.size > 0) {
      this.evictLRUFromBucket(this.rareAccess);
      return;
    }
    
    // Then try moderate access bucket
    if (this.moderateAccess.entries.size > 0) {
      this.evictLRUFromBucket(this.moderateAccess);
      return;
    }
    
    // Finally, evict from frequent access bucket
    if (this.frequentAccess.entries.size > 0) {
      this.evictLRUFromBucket(this.frequentAccess);
      return;
    }
    
    // Fallback: evict from the global LRU queue
    if (this.accessQueue.length === 0) return;
    
    const keyToEvict = this.accessQueue.shift();
    if (keyToEvict && this.primaryCache.has(keyToEvict)) {
      this.evictKey(keyToEvict);
    }
  }
  
  /**
   * Evict least frequently used cache entry
   */
  private evictLFU(): void {
    // Build a list of entries sorted by frequency
    const entries = Array.from(this.metadataMap.entries())
      .sort((a, b) => a[1].frequency - b[1].frequency);
    
    if (entries.length === 0) return;
    
    // Get the least frequently used key
    const keyToEvict = entries[0][0];
    if (this.primaryCache.has(keyToEvict)) {
      this.evictKey(keyToEvict);
    }
  }
  
  /**
   * Evict LRU entry from a specific bucket
   * 
   * @param bucket Cache bucket to evict from
   */
  private evictLRUFromBucket(bucket: CacheBucket): void {
    // Find the least recently accessed entry in the bucket
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    
    for (const [key, metadata] of bucket.metadata.entries()) {
      if (metadata.lastAccessed < oldestTime) {
        oldestTime = metadata.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey && this.primaryCache.has(oldestKey)) {
      this.evictKey(oldestKey);
    }
  }
  
  /**
   * Evict a specific key from the cache
   * 
   * @param key Key to evict
   */
  private evictKey(key: string): void {
    // Get the state before removing it
    const state = this.primaryCache.get(key);
    const metadata = this.metadataMap.get(key);
    
    if (!state || !metadata) return;
    
    // Remove from primary cache and tracking structures
    this.primaryCache.delete(key);
    
    // Remove from frequency buckets
    this.frequentAccess.entries.delete(key);
    this.frequentAccess.metadata.delete(key);
    this.moderateAccess.entries.delete(key);
    this.moderateAccess.metadata.delete(key);
    this.rareAccess.entries.delete(key);
    this.rareAccess.metadata.delete(key);
    
    // If L2 cache is enabled, move to secondary cache
    if (this.enableL2Cache) {
      // If secondary cache is full, remove least valuable entry
      if (this.secondaryCache.size >= this.l2CacheSize) {
        this.evictFromSecondaryCache();
      }
      
      // Add to secondary cache
      this.secondaryCache.set(key, state);
      this.secondaryMetadata.set(key, metadata);
    } else {
      // Otherwise, remove metadata completely
      this.metadataMap.delete(key);
    }
    
    this.stats.evictions++;
    this.stats.size = this.primaryCache.size;
  }
  
  /**
   * Evict an item from secondary cache
   */
  private evictFromSecondaryCache(): void {
    // Find the least valuable entry in secondary cache
    // (oldest and least frequently accessed)
    let leastValuableKey: string | null = null;
    let lowestValue = Infinity;
    
    for (const [key, metadata] of this.secondaryMetadata.entries()) {
      // Calculate value based on recency and frequency
      const recencyValue = (Date.now() - metadata.lastAccessed) / 1000;
      const frequencyValue = metadata.frequency;
      const value = frequencyValue / (recencyValue + 1);
      
      if (value < lowestValue) {
        lowestValue = value;
        leastValuableKey = key;
      }
    }
    
    if (leastValuableKey) {
      this.secondaryCache.delete(leastValuableKey);
      this.secondaryMetadata.delete(leastValuableKey);
    }
  }
  
  /**
   * Adjust cache size based on hit ratio
   */
  private adjustCacheSize(): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    if (totalRequests < 100) return; // Wait for sufficient data
    
    const hitRatio = this.stats.hits / totalRequests;
    
    if (hitRatio > HIT_RATIO_THRESHOLD && this.maxSize < 10000) {
      // Hit ratio is good, we could benefit from a larger cache
      this.maxSize = Math.min(10000, Math.floor(this.maxSize * 1.2));
      this.stats.adaptiveSizeAdjustments++;
    } else if (hitRatio < HIT_RATIO_THRESHOLD * 0.7 && this.maxSize > 100) {
      // Hit ratio is poor, reduce cache size to avoid wasting memory
      this.maxSize = Math.max(100, Math.floor(this.maxSize * 0.8));
      this.stats.adaptiveSizeAdjustments++;
    }
    
    // Adjust L2 cache size proportionally
    if (this.enableL2Cache) {
      this.l2CacheSize = Math.floor(this.maxSize * 0.5);
    }
    
    // Log adjustment if enabled
    if (this.logHitRatio) {
      console.log(`Cache size adjusted to ${this.maxSize} based on hit ratio ${hitRatio.toFixed(2)}`);
    }
  }
  
  /**
   * Set up cache invalidation timer
   * 
   * @param ttl Time-to-live in milliseconds
   */
  private startInvalidationTimer(ttl: number): void {
    this.invalidationTimer = setInterval(() => {
      this.invalidateExpiredEntries();
    }, Math.min(ttl / 4, 60000)); // Check at most every minute
  }
  
  /**
   * Invalidate expired cache entries
   */
  private invalidateExpiredEntries(): void {
    const now = Date.now();
    
    // Check primary cache
    for (const [key, metadata] of this.metadataMap.entries()) {
      if (metadata.expiresAt && metadata.expiresAt < now) {
        // Remove from primary cache
        this.primaryCache.delete(key);
        this.metadataMap.delete(key);
        
        // Remove from frequency buckets
        this.frequentAccess.entries.delete(key);
        this.frequentAccess.metadata.delete(key);
        this.moderateAccess.entries.delete(key);
        this.moderateAccess.metadata.delete(key);
        this.rareAccess.entries.delete(key);
        this.rareAccess.metadata.delete(key);
      }
    }
    
    // Check secondary cache
    if (this.enableL2Cache) {
      for (const [key, metadata] of this.secondaryMetadata.entries()) {
        if (metadata.expiresAt && metadata.expiresAt < now) {
          this.secondaryCache.delete(key);
          this.secondaryMetadata.delete(key);
        }
      }
    }
    
    // Update cache size
    this.stats.size = this.primaryCache.size;
  }
  
  /**
   * Update transition predictions based on observed patterns
   * 
   * @param stateId Source state ID
   * @param inputSymbol Input symbol
   */
  private updatePredictions(stateId: string, inputSymbol: string): void {
    // Create a transition path key
    const transitionKey = `${stateId}:previous`;
    
    // Get or create the set of predicted symbols
    if (!this.transitionPredictions.has(transitionKey)) {
      this.transitionPredictions.set(transitionKey, new Set<string>());
    }
    
    // Add this symbol to the predictions for the previous state
    const predictions = this.transitionPredictions.get(transitionKey);
    if (predictions) {
      predictions.add(inputSymbol);
    }
  }
  
  /**
   * Check if a transition was predicted
   * 
   * @param stateId Source state ID
   * @param inputSymbol Input symbol
   * @returns True if the transition was predicted
   */
  private isPredicted(stateId: string, inputSymbol: string): boolean {
    const transitionKey = `${stateId}:previous`;
    const predictions = this.transitionPredictions.get(transitionKey);
    
    return !!predictions && predictions.has(inputSymbol);
  }
  
  /**
   * Update prediction accuracy statistics
   * 
   * @param stateId Source state ID
   * @param inputSymbol Input symbol
   * @param wasHit Whether the prediction resulted in a cache hit
   */
  private updatePredictionAccuracy(stateId: string, inputSymbol: string, wasHit: boolean): void {
    if (wasHit) {
      this.stats.predictiveHits++;
    }
  }
  
  /**
   * Trigger prefetch for likely next transitions
   * 
   * @param sourceState Current state
   * @param inputSymbol Current input symbol
   */
  private triggerPrefetch(sourceState: State, inputSymbol: string): void {
    // This would be implemented to predict and prefetch likely next transitions
    // For example, if state A often transitions to B and then to C,
    // when we see a transition from A to B, we could prefetch the B to C transition
    
    // To be implemented based on application-specific transition patterns
  }
  
  /**
   * Precompute and cache common transitions for a state machine
   * 
   * @param stateMachine State machine to precompute transitions for
   * @param transitionSymbols Symbols to precompute (or all if not specified)
   */
  public precomputeTransitions(stateMachine: StateMachine, transitionSymbols?: string[]): void {
    const states = Array.from(stateMachine.states.values());
    const symbols = transitionSymbols || Array.from(stateMachine.alphabet);
    
    // For each state, precompute transitions for specified symbols
    for (const state of states) {
      for (const symbol of symbols) {
        try {
          // Only cache if transition exists and isn't already cached
          if (state.hasTransition(symbol as string)) {
            const targetState = state.getNextState(symbol as string);
            if (targetState && !this.get(state, symbol as string)) {
              this.set(state, symbol as string, targetState);
            }
          }
        } catch (error) {
          // Skip invalid transitions
          continue;
        }
      }
    }
  }
  
  /**
   * Warm up cache with common state machine transitions
   * Using advanced pattern analysis for transition frequency
   * 
   * @param stateMachine State machine to analyze for common patterns
   * @param sampleSize Number of transitions to analyze for frequency
   */
  public warmupCache(stateMachine: StateMachine, sampleSize: number = 100): void {
    // Track transition frequency and patterns
    const frequency = new Map<string, number>();
    const patterns = new Map<string, Set<string>>();
    const currentState = stateMachine.getCurrentState();
    
    // Reset to initial state for simulation
    stateMachine.reset();
    
    // Track the previous state for pattern recognition
    let prevStateId: string | null = null;
    
    // Simulate transitions to identify common patterns
    for (let i = 0; i < sampleSize; i++) {
      const availableSymbols = Array.from(stateMachine.alphabet);
      if (availableSymbols.length === 0) break;
      
      // Select random symbol
      const symbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
      
      try {
        const sourceState = stateMachine.getCurrentState();
        if (sourceState && sourceState.hasTransition(symbol as string)) {
          const key = this.generateKey(sourceState.id, symbol as string);
          
          // Update frequency
          frequency.set(key, (frequency.get(key) || 0) + 1);
          
          // Update pattern recognition
          if (prevStateId) {
            const patternKey = `${prevStateId}:next`;
            if (!patterns.has(patternKey)) {
              patterns.set(patternKey, new Set<string>());
            }
            patterns.get(patternKey)?.add(sourceState.id);
          }
          
          // Remember this state for next iteration
          prevStateId = sourceState.id;
          
          // Perform transition
          stateMachine.transition(symbol as string);
        }
      } catch (error) {
        continue;
      }
    }
    
    // Restore original state
    if (currentState) {
      stateMachine.resetToState(currentState.id);
    }
    
    // Precompute most frequent transitions
    const sortedTransitions = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.min(this.maxSize, frequency.size));
    
    for (const [key, _] of sortedTransitions) {
      const [stateId, symbol] = key.split(':');
      const state = stateMachine.getState(stateId as string);
      if (state && symbol && state.hasTransition(symbol)) {
        const targetState = state.getNextState(symbol);
        if (targetState) {
          this.set(state, symbol, targetState);
          
          // Store pattern information for predictive prefetching
          if (this.predictivePrefetch) {
            this.transitionPredictions.set(`${stateId}:previous`, new Set([symbol]));
          }
        }
      }
    }
    
    // Import pattern data for predictive prefetching
    if (this.predictivePrefetch) {
      for (const [patternKey, stateSet] of patterns.entries()) {
        const [stateId, _] = patternKey.split(':');
        this.transitionPredictions.set(`${stateId}:previous`, stateSet);
      }
    }
  }
  
  /**
   * Get cache statistics with enhanced metrics
   * 
   * @returns Detailed cache statistics
   */
  public getStats(): {
    hits: number;
    misses: number;
    l1Hits: number;
    l2Hits: number;
    evictions: number;
    size: number;
    hitRatio: number;
    l1HitRatio: number;
    l2HitRatio: number;
    predictiveHitRatio: number;
    frequentItemsRatio: number;
    adaptiveSizeAdjustments: number;
    bucketSizes: {
      frequent: number;
      moderate: number;
      rare: number;
    };
  } {
    const totalRequests = this.stats.hits + this.stats.misses;
    const totalHits = this.stats.l1Hits + this.stats.l2Hits;
    
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      l1Hits: this.stats.l1Hits,
      l2Hits: this.stats.l2Hits,
      evictions: this.stats.evictions,
      size: this.stats.size,
      hitRatio: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      l1HitRatio: totalHits > 0 ? this.stats.l1Hits / totalHits : 0,
      l2HitRatio: totalHits > 0 ? this.stats.l2Hits / totalHits : 0,
      predictiveHitRatio: this.stats.hits > 0 ? this.stats.predictiveHits / this.stats.hits : 0,
      frequentItemsRatio: this.primaryCache.size > 0 ? this.frequentAccess.entries.size / this.primaryCache.size : 0,
      adaptiveSizeAdjustments: this.stats.adaptiveSizeAdjustments,
      bucketSizes: {
        frequent: this.frequentAccess.entries.size,
        moderate: this.moderateAccess.entries.size,
        rare: this.rareAccess.entries.size
      }
    };
  }
  
  /**
   * Clear the cache
   */
  public clear(): void {
    // Clear primary cache
    this.primaryCache.clear();
    this.metadataMap.clear();
    
    // Clear secondary cache
    this.secondaryCache.clear();
    this.secondaryMetadata.clear();
    
    // Clear frequency buckets
    this.frequentAccess.entries.clear();
    this.frequentAccess.metadata.clear();
    this.moderateAccess.entries.clear();
    this.moderateAccess.metadata.clear();
    this.rareAccess.entries.clear();
    this.rareAccess.metadata.clear();
    
    // Clear tracking structures
    this.accessQueue = [];
    this.frequencyMap.clear();
    this.transitionPredictions.clear();
    
    // Reset stats (except for adaptiveSizeAdjustments)
    const adaptiveSizeAdjustments = this.stats.adaptiveSizeAdjustments;
    this.stats = {
      hits: 0,
      misses: 0,
      l1Hits: 0,
      l2Hits: 0,
      evictions: 0,
      size: 0,
      predictiveHits: 0,
      adaptiveSizeAdjustments
    };
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    if (this.invalidationTimer) {
      clearInterval(this.invalidationTimer);
      this.invalidationTimer = null;
    }
    
    this.clear();
  }
}