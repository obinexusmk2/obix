/**
 * StateMachineTransitionCache
 * 
 * Provides optimized caching for state transitions to improve performance
 * and reduce memory consumption in the OBIX state minimization system.
 * Implements an LRU (Least Recently Used) cache strategy for efficient
 * state transition storage and retrieval.
 */


import { State } from "../state/State";
import { StateMachine } from "../state/StateMachineClass";

// Export core transition types and interfaces
export interface TransitionOptions {
  strict?: boolean;
  optimize?: boolean;
  validateStates?: boolean;
}

export interface TransitionResult<T = any> {
  nextState: T;
  isValid: boolean;
  metadata?: Record<string, any>;
}

// Export base transition types
export type TransitionFunction<S = any, P = any> = (state: S, payload?: P) => S;

export type TransitionMap<S = any, E extends string = string> = {
  [K in E]: TransitionFunction<S>;
};

// Common transition utility types
export type TransitionKey = string | symbol;

export interface TransitionDescriptor<S = any, P = any> {
  name: TransitionKey;
  fn: TransitionFunction<S, P>;
  metadata?: Record<string, any>;
}

export class StateMachineTransitionCache<S = any> {
  // Maximum number of transitions to cache
  public readonly maxSize: number;
  
  // LRU cache for transitions: sourceStateId:inputSymbol -> resultState
  public transitionCache: Map<string, State>;
  
  // Usage tracking for LRU eviction
  public usageQueue: string[];
  
  // Statistics for performance monitoring
  public stats: {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
  };
  
  // Cache invalidation strategy
  public invalidationTimer: NodeJS.Timeout | null = null;
  
  /**
   * Create a new StateMachineTransitionCache
   * 
   * @param options Configuration options for the cache
   */
  constructor(options: {
    maxSize?: number;
    ttl?: number;
    persistToStorage?: boolean;
  } = {}) {
    this.maxSize = options.maxSize || 1000;
    this.transitionCache = new Map();
    this.usageQueue = [];
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0
    };
    
    // Set up cache invalidation timer if TTL is provided
    if (options.ttl && options.ttl > 0) {
      this.startInvalidationTimer(options.ttl);
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
    return `${stateId}:${inputSymbol}`;
  }

  /**
   * Get cached transition result
   * 
   * @param sourceState Source state
   * @param inputSymbol Transition input symbol
   * @returns Target state if found in cache, undefined otherwise
   */
  get(sourceState: State, inputSymbol: string): State | undefined {
    const key = this.generateKey(sourceState.id, inputSymbol);
    
    // Check in-memory cache
    if (this.transitionCache.has(key)) {
      // Update usage for LRU tracking
      this.updateUsage(key);
      
      this.stats.hits++;
      return this.transitionCache.get(key);
    }
    
    this.stats.misses++;
    return undefined;
  }
  
  /**
   * Store transition result in cache
   * 
   * @param sourceState Source state
   * @param inputSymbol Transition input symbol
   * @param targetState Resulting state after transition
   */
  set(sourceState: State, inputSymbol: string, targetState: State): void {
    const key = this.generateKey(sourceState.id, inputSymbol);
    
    // If cache is at capacity, evict least recently used entry
    if (this.transitionCache.size >= this.maxSize && !this.transitionCache.has(key)) {
      this.evictLRU();
    }
    
    // Add to in-memory cache
    this.transitionCache.set(key, targetState);
    this.updateUsage(key);
    this.stats.size = this.transitionCache.size;
  }
  
  /**
   * Update usage tracking for LRU algorithm
   * 
   * @param key Cache key that was accessed
   */
  public updateUsage(key: string): void {
    // Remove from current position
    const index = this.usageQueue.indexOf(key);
    if (index !== -1) {
      this.usageQueue.splice(index, 1);
    }
    
    // Add to end (most recently used)
    this.usageQueue.push(key);
  }
  
  /**
   * Evict least recently used cache entry
   */
  public evictLRU(): void {
    if (this.usageQueue.length === 0) return;
    
    // Get and remove least recently used key
    const keyToEvict = this.usageQueue.shift();
    if (keyToEvict && this.transitionCache.has(keyToEvict)) {
      this.transitionCache.delete(keyToEvict);
      this.stats.evictions++;
      this.stats.size = this.transitionCache.size;
    }
  }
  
  /**
   * Set up cache invalidation timer
   * 
   * @param ttl Time-to-live in milliseconds
   */
  public startInvalidationTimer(ttl: number): void {
    this.invalidationTimer = setInterval(() => {
      // Simple invalidation strategy: clear the entire cache periodically
      this.clear();
    }, ttl);
  }
  
  /**
   * Precompute and cache common transitions for a state machine
   * 
   * @param stateMachine State machine to precompute transitions for
   * @param transitionSymbols Symbols to precompute (or all if not specified)
   */
  precomputeTransitions(stateMachine: StateMachine, transitionSymbols?: string[]): void {
    const states = Array.from(stateMachine.states.values());
    const symbols = transitionSymbols || Array.from(stateMachine.alphabet);
    
    // For each state, precompute transitions for specified symbols
    for (const state of states) {
      for (const symbol of symbols) {
        try {
          // Only cache if transition exists and isn't already cached
          if (state.hasTransition(symbol)) {
            const targetState = state.getNextState(symbol);
            if (targetState && !this.get(state, symbol)) {
              this.set(state, symbol, targetState);
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
   * 
   * @param stateMachine State machine to analyze for common patterns
   * @param sampleSize Number of transitions to analyze for frequency
   */
  warmupCache(stateMachine: StateMachine, sampleSize: number = 100): void {
    // Track transition frequency in a map
    const frequency = new Map<string, number>();
    const currentState = stateMachine.currentState;
    
    // Reset to initial state for simulation
    stateMachine.reset();
    
    // Simulate transitions to identify common patterns
    for (let i = 0; i < sampleSize; i++) {
      const availableSymbols = Array.from(stateMachine.alphabet);
      if (availableSymbols.length === 0) break;
      
      // Select random symbol
      const symbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
      
      try {
        const sourceState = stateMachine.getState(stateMachine.currentState?.id || '');
        
        if (sourceState?.id && sourceState.id && sourceState.hasTransition(symbol as string)) {
          // Update frequency map
    
          if (sourceState.id) {
            const key = this.generateKey(sourceState.id, symbol as string);
            frequency.set(key, (frequency.get(key) || 0) + 1);
          }
          
          // Perform transition
          if (symbol) {
            stateMachine.transition(symbol);
          }
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
      const state = stateId ? stateMachine.getState(stateId) : undefined;
      if (state instanceof State && symbol && state.hasTransition(symbol)) {
        const targetState = state.getNextState(symbol);
        if (targetState) {
          this.set(state, symbol, targetState);
        }
      }
    }
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  getStats(): { hits: number; misses: number; evictions: number; size: number; hitRatio: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRatio = total > 0 ? this.stats.hits / total : 0;
    
    return {
      ...this.stats,
      hitRatio
    };
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.transitionCache.clear();
    this.usageQueue = [];
    this.stats.size = 0;
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.invalidationTimer) {
      clearInterval(this.invalidationTimer);
      this.invalidationTimer = null;
    }
    
    this.clear();
  }
}

