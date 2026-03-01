import { StateMachineMinimizer } from "../minimizer";
import { PersistableCacheStore } from "./PersistanceCacheStore";
import { State } from "./State";
import { StateMachine } from "./StateMachineClass";


/**
 * Options for the EnhancedStateMachineTransitionCache
 */
export interface EnhancedCacheOptions {
    // Memory cache options
    maxSize?: number;
    ttl?: number;
    
    // Persistence options
    persistToStorage?: boolean;
    storageOptions?: {
      cacheDir?: string;
      maxSize?: number;
      ttl?: number;
      pruneInterval?: number;
    };
    
    // Automaton optimization options
    precomputeEquivalenceClasses?: boolean;
    optimizeFrequentPaths?: boolean;
  }

/**
 * EnhancedStateMachineTransitionCache
 * 
 * An enhanced version of the StateMachineTransitionCache that integrates with
 * the PersistableCacheStore to provide persistent caching of state transitions.
 * This implementation supports both memory caching for runtime performance and
 * disk-based persistence for preserving optimizations across application restarts.
 */

  /**
   * Enhanced transition cache with persistence support
   */
  export class EnhancedStateMachineTransitionCache<S = any> {
    // Memory cache
    public maxSize: number;
    public transitionCache: Map<string, State>;
    public usageQueue: string[];
    
    // Persistent storage
    public persistentCache: PersistableCacheStore | null = null;
    public persistenceEnabled: boolean;
    
    // Optional state machine minimizer
    public minimizer: StateMachineMinimizer | null = null;
    
    // Cache invalidation
    public invalidationTimer: NodeJS.Timeout | null = null;
    
    // Statistics
    public stats: {
      hits: number;
      misses: number;
      evictions: number;
      size: number;
      persistentHits: number;
      persistentMisses: number;
    };
    
    /**
     * Create a new EnhancedStateMachineTransitionCache
     * 
     * @param options Configuration options
     */
    constructor(options: EnhancedCacheOptions = {}) {
      this.maxSize = options.maxSize || 1000;
      this.transitionCache = new Map();
      this.usageQueue = [];
      this.persistenceEnabled = options.persistToStorage || false;
      
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        size: 0,
        persistentHits: 0,
        persistentMisses: 0
      };
      
      // Initialize persistent cache if enabled
      if (this.persistenceEnabled) {
        this.persistentCache = new PersistableCacheStore(options.storageOptions);
      }
      
      // Initialize state machine minimizer if optimization is enabled
      if (options.precomputeEquivalenceClasses) {
        this.minimizer = new StateMachineMinimizer();
      }
      
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
      
      // Check in-memory cache first
      if (this.transitionCache.has(key)) {
        // Update usage for LRU tracking
        this.updateUsage(key);
        
        this.stats.hits++;
        return this.transitionCache.get(key);
      }
      
      // Check persistent cache if enabled
      if (this.persistenceEnabled && this.persistentCache) {
        const cachedTransition = this.persistentCache.getTransition(sourceState.id, inputSymbol);
        
        if (cachedTransition && cachedTransition.targetStateId) {
          // We need to reconstruct the State object from the cached data
          const cachedState = this.persistentCache.getState(cachedTransition.targetStateId);
          
          if (cachedState) {
            // Create a new State instance from cached data with metadata and equivalence class
            const targetState = new State(cachedState.stateId, {
              metadata: cachedState.metadata || {},
              equivalenceClass: cachedState.equivalenceClass ?? 0
            });
            targetState.isAccepting = cachedState.isAccepting;
            
            // Add to in-memory cache
            this.transitionCache.set(key, targetState);
            this.updateUsage(key);
            
            this.stats.persistentHits++;
            return targetState;
          }
        }
        
        this.stats.persistentMisses++;
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
      
      // Add to persistent cache if enabled
      if (this.persistenceEnabled && this.persistentCache) {
        // Store the states
        this.persistentCache.setState(sourceState);
        this.persistentCache.setState(targetState);
        
        // Store the transition
        this.persistentCache.setTransition(
          sourceState.id,
          inputSymbol,
          targetState.id,
          {
            // Add metadata to help with cache management
            sourceEquivalenceClass: sourceState.equivalenceClass,
            targetEquivalenceClass: targetState.equivalenceClass,
            sourceIsAccepting: sourceState.isAccepting,
            targetIsAccepting: targetState.isAccepting
          }
        );
      }
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
        // Only invalidate memory cache, persistent cache handles its own invalidation
        this.transitionCache.clear();
        this.usageQueue = [];
        this.stats.size = 0;
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
      
      // Precompute equivalence classes if minimizer is available
      if (this.minimizer) {
        StateMachineMinimizer.computeEquivalenceClasses(states);
      }
      
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
     * @param preferEquivalenceClasses Whether to prioritize transitions between different equivalence classes
     */
    warmupCache(
      stateMachine: StateMachine, 
      sampleSize: number = 100,
      preferEquivalenceClasses: boolean = true
    ): void {
      // Track transition frequency in a map
      const frequency = new Map<string, number>();
      const currentState = stateMachine.getCurrentState();
      
      // Reset to initial state for simulation
      stateMachine.reset();
      
      // Simulate transitions to identify common patterns
      for (let i = 0; i < sampleSize; i++) {
        const availableSymbols = Array.from(stateMachine.alphabet) as string[];
        if (availableSymbols.length === 0) break;
        
        // Select random symbol
        const symbol = availableSymbols[Math.floor(Math.random() * availableSymbols.length)];
        
        try {
          const sourceState = stateMachine.getCurrentState();
          if (sourceState && sourceState.hasTransition(symbol)) {
            const key = this.generateKey(sourceState.id, symbol as string);
            
            // Compute next state without changing current state
            const targetState = sourceState.getNextState(symbol);
            
            // Weight transitions between different equivalence classes higher
            let weight = 1;
            if (preferEquivalenceClasses && 
                targetState && 
                sourceState.equivalenceClass !== undefined &&
                targetState.equivalenceClass !== undefined && 
                sourceState.equivalenceClass !== targetState.equivalenceClass) {
              weight = 3; // Prioritize transitions between different equivalence classes
            }
            
            frequency.set(key, (frequency.get(key) || 0) + weight);
            
            // Perform transition
            stateMachine.transition(symbol);
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
        const state = stateMachine.getState(stateId as string) as State;
        if (state instanceof State && symbol && state.hasTransition(symbol)) {
          const targetState = state.getNextState(symbol);
          if (targetState) {
            this.set(state, symbol, targetState);
          }
        }
      }
    }
    
    /**
     * Import state machine structure into cache
     * 
     * @param stateMachine State machine to import
     */
    importStateMachine(stateMachine: StateMachine): void {
      const states = Array.from(stateMachine.getStates().values());
      const alphabet = Array.from(stateMachine.alphabet());
      
      // Cache all states first
      if (this.persistenceEnabled && this.persistentCache) {
        for (const state of states) {
          this.persistentCache.setState(state);
        }
      }
      
      // Cache all transitions
      for (const state of states) {
        for (const symbol of alphabet) {
          if (state.hasTransition(symbol)) {
            try {
              // Only cache if transition exists and isn't already cached
              if (state.hasTransition(symbol)) {
                const targetState = state.getNextState(symbol);
                if (targetState instanceof State && !this.get(state, symbol)) {
                  this.set(state, symbol, targetState);
                }
              }
            } catch (error) {
              // Skip invalid transitions
            }
          }
        }
      }
    }
    
    /**
     * Export cached transitions to reconstitute a state machine
     * 
     * @param initialStateId Initial state ID
     * @returns A map of states and their transitions
     */
    
    exportCachedTransitions(initialStateId: string): {
      states: Map<string, State>;
      transitions: Map<string, Map<string, string>>;
    } {
      const states = new Map<string, State>();
      const transitions = new Map<string, Map<string, string>>();
      
      // Collect all states and transitions from memory cache
      for (const [key, targetState] of this.transitionCache.entries()) {
        const parts = key.split(':');
        if (parts.length !== 2) continue;
        
        const [sourceStateId, symbol] = parts;
        
        // Add states to map
        if (sourceStateId && !states.has(sourceStateId)) {
          // We need to get the source state
          if (this.persistenceEnabled && this.persistentCache) {
            const cachedState = this.persistentCache.getState(sourceStateId);
            if (cachedState) {
              const state = new State(sourceStateId);
              state.isAccepting = cachedState.isAccepting;
              state.setMetadata('metadata', cachedState.metadata || {});
              state.equivalenceClass = cachedState.equivalenceClass || 0;
              states.set(sourceStateId, state);
            }
          }
        }
        
        if (!states.has(targetState.id)) {
          states.set(targetState.id, targetState);
        }
        
        // Add transition
        if (!transitions.has(sourceStateId)) {
          transitions.set(sourceStateId, new Map());
        }
        const stateTransitions = transitions.get(sourceStateId);
        if (stateTransitions && symbol) {
          stateTransitions.set(symbol, targetState.id);
        }
      }
      
      // If persistence is enabled, add any additional states and transitions from persistent cache
      if (this.persistenceEnabled && this.persistentCache) {
        // This would require enumerating all cached transitions and states
        // Implementation would depend on the specific capabilities of the persistent cache
      }
      
      return { states, transitions };
    }
    
    /**
     * Get cache statistics
     * 
     * @returns Cache statistics
     */
    getStats(): {
      hits: number;
      misses: number;
      evictions: number;
      size: number;
      hitRatio: number;
      persistentHits: number;
      persistentMisses: number;
      persistentHitRatio: number;
      totalHitRatio: number;
      persistentStats?: any;
    } {
      const memoryTotal = this.stats.hits + this.stats.misses;
      const persistentTotal = this.stats.persistentHits + this.stats.persistentMisses;
      const totalRequests = memoryTotal + this.stats.persistentMisses; // Only count persistent misses to avoid double counting
      
      const result = {
        hits: this.stats.hits,
        misses: this.stats.misses,
        evictions: this.stats.evictions,
        size: this.stats.size,
        hitRatio: memoryTotal > 0 ? this.stats.hits / memoryTotal : 0,
        persistentHits: this.stats.persistentHits,
        persistentMisses: this.stats.persistentMisses,
        persistentHitRatio: persistentTotal > 0 ? this.stats.persistentHits / persistentTotal : 0,
        totalHitRatio: totalRequests > 0 ? (this.stats.hits + this.stats.persistentHits) / totalRequests : 0
      };
      
      // Add persistent cache stats if available
      if (this.persistenceEnabled && this.persistentCache) {
        return {
          ...result,
          persistentStats: this.persistentCache.getStats()
        };
      }
      
      return result;
    }
    
    /**
     * Clear the cache
     */
    clear(): void {
      this.transitionCache.clear();
      this.usageQueue = [];
      this.stats.size = 0;
      
      if (this.persistenceEnabled && this.persistentCache) {
        this.persistentCache.clear();
      }
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
      
      if (this.persistenceEnabled && this.persistentCache) {
        this.persistentCache.dispose();
      }
    }
  }