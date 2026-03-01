/**
 * CacheableStateMachine
 * 
 * Extends the base StateMachine class with caching capabilities to optimize
 * state transitions based on the automaton state minimization technology.
 * This implementation leverages the StateMachineTransitionCache for efficient
 * storage and retrieval of common transitions.
 */
import { State } from './State';
import { StateMachine } from './StateMachineClass';
import { StateMachineTransitionCache } from '../transition/StateMachineTransitionCache';

export class CacheableStateMachine extends StateMachine {
  // Transition cache for optimized state transitions
  public transitionCache: StateMachineTransitionCache;
  
  // Cache configuration
  public cacheEnabled: boolean;
  
  /**
   * Create a new CacheableStateMachine
   * 
   * @param initialStateId Initial state ID (optional)
   * @param cacheOptions Caching configuration options
   */
  constructor(initialStateId?: string, cacheOptions: {
    enabled?: boolean;
    maxSize?: number;
    ttl?: number;
    persistToStorage?: boolean;
  } = {}) {
    super(initialStateId);
    
    this.cacheEnabled = cacheOptions.enabled !== false;
    
    // Initialize cache if enabled
    if (this.cacheEnabled) {
      this.transitionCache = new StateMachineTransitionCache(cacheOptions);
    } else {
      // Create a dummy cache for type consistency
      this.transitionCache = new StateMachineTransitionCache({ maxSize: 0 });
    }
  }


  /**
   * Override the transition method to use cache
   * 
   * @param symbol Input symbol to transition on
   * @returns The resulting state after transition
   */
  override transition(symbol: string): State {
    const currentState = this.getCurrentState();
    if (!currentState) {
      throw new Error('No current state set.');
    }
    
    // Check cache if enabled
    if (this.cacheEnabled) {
      const cachedState = this.transitionCache.get(currentState, symbol);
      if (cachedState) {
        this.setCurrentState(cachedState);
        return cachedState;
      }
    }
    
    // Fall back to standard transition
    const nextState = super.transition(symbol);
    
    // Cache the transition result
    if (this.cacheEnabled) {
      this.transitionCache.set(currentState, symbol, nextState);
    }
    
    return nextState;
  }



  /**
   * Set the cache enabled state
   * 
   * @param enabled Whether caching should be enabled
   */
  setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
  }
  
  /**
   * Helper method to precompute common transitions
   * 
   * @param symbols Symbols to precompute transitions for (optional)
   */
  precomputeCommonTransitions(symbols?: string[]): void {
    if (this.cacheEnabled) {
      this.transitionCache.precomputeTransitions(this, symbols);
    }
  }
  
  /**
   * Warm up the cache with common transitions
   * 
   * @param sampleSize Number of transitions to simulate for frequency analysis
   */
  warmupCache(sampleSize?: number): void {
    if (this.cacheEnabled) {
      this.transitionCache.warmupCache(this, sampleSize);
    }
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics object
   */
  getCacheStats(): { enabled: boolean } & (
    { hits: number; misses: number; evictions: number; size: number; hitRatio: number }
  ) {
    if (this.cacheEnabled) {
      return {
        enabled: true,
        ...this.transitionCache.getStats()
      };
    }
    return { enabled: false, hits: 0, misses: 0, evictions: 0, size: 0, hitRatio: 0 };
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
   * Override dispose to clean up cache resources
   */
  override dispose(): void {
    this.transitionCache.dispose();
    super.dispose();
  }
}