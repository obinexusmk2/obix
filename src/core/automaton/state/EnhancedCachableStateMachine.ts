/**
 * EnhancedCacheableStateMachine
 * 
 * An advanced implementation of the StateMachine class that leverages both
 * in-memory caching and persistent storage to optimize state transitions.
 * This implementation is designed for OBIX's automaton state minimization
 * technology, providing superior performance for complex component state
 * transitions.
 */

import { StateMachineMinimizer, EquivalenceClassComputer } from "../minimizer";
import { EnhancedCacheOptions, EnhancedStateMachineTransitionCache } from "./EnhancedStateMachineTransitionCache";
import { State } from "./State";
import { StateMachine } from "./StateMachineClass";


/**
 * Configuration options for EnhancedCacheableStateMachine
 */
export interface EnhancedCacheableStateMachineOptions extends EnhancedCacheOptions {
  enabled: boolean;
  autoMinimize?: boolean;
  syncToDisk?: boolean;
  syncInterval?: number;
  prefetchPaths?: boolean;
  logPerformance?: boolean;
}

/**
 * Enhanced cacheable state machine with persistence support
 */
export class EnhancedCacheableStateMachine extends StateMachine {
  // Current state reference
  protected override _currentState: State | null = null;

  // Enhanced transition cache
  public transitionCache: EnhancedStateMachineTransitionCache;
  
  // State machine minimizer
  public minimizer: StateMachineMinimizer | null = null;
  
  // Configuration
  public cacheEnabled: boolean;
  public autoMinimize: boolean;
  public syncToDisk: boolean;
  public syncInterval: number;
  public prefetchPaths: boolean;
  public logPerformance: boolean;
  
  // Sync timer
  public syncTimer: NodeJS.Timeout | null = null;
  
  // Performance monitoring
  public performanceLog: Array<{
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    cacheHit?: boolean;
    symbol?: string;
  }> = [];
  
  /**
   * Create a new EnhancedCacheableStateMachine
   * 
   * @param initialStateId Initial state ID (optional)
   * @param options Configuration options
   */
  constructor(initialStateId?: string, options: EnhancedCacheableStateMachineOptions = {
    enabled: false
  }) {
    super(initialStateId);
    
    // Configure options
    this.cacheEnabled = options.enabled !== false;
    this.autoMinimize = options.autoMinimize || false;
    this.syncToDisk = options.syncToDisk || false;
    this.syncInterval = options.syncInterval || (5 * 60 * 1000); // 5 minutes default
    this.prefetchPaths = options.prefetchPaths || false;
    this.logPerformance = options.logPerformance || false;
    
    // Initialize cache
    this.transitionCache = new EnhancedStateMachineTransitionCache(options);
    
    // Initialize minimizer if auto-minimize is enabled
    if (this.autoMinimize) {
      this.minimizer = new StateMachineMinimizer();
    }
    
    // Start sync timer if needed
    if (this.syncToDisk) {
      this.startSyncTimer();
    }
  }
  
  /**
   * Start the sync timer for periodic state persistence
   */
  public startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.syncToPersistentStorage();
    }, this.syncInterval);
  }
  
  /**
   * Sync the current state machine to persistent storage
   */
  public syncToPersistentStorage(): void {
    if (this.logPerformance) {
      const startTime = performance.now();
      
      this.transitionCache.importStateMachine(this);
      
      const endTime = performance.now();
      this.logPerformanceEvent({
        operation: 'syncToPersistentStorage',
        startTime,
        endTime,
        duration: endTime - startTime
      });
    } else {
      this.transitionCache.importStateMachine(this);
    }
  }
  
  /**
   * Log a performance event
   * 
   * @param event Performance event data
   */
  public logPerformanceEvent(event: {
    operation: string;
    startTime: number;
    endTime: number;
    duration: number;
    cacheHit?: boolean;
    symbol?: string;
  }): void {
    if (this.logPerformance) {
      this.performanceLog.push(event);
      
      // Keep log at a reasonable size
      if (this.performanceLog.length > 1000) {
        this.performanceLog = this.performanceLog.slice(-500);
      }
    }
  }
  
  /**
   * Override the transition method to use enhanced cache
   * 
   * @param symbol Input symbol to transition on
   * @returns The resulting state after transition
   */
  override transition(symbol: string): State {
    if (!this._currentState) {
      throw new Error('No current state set.');
    }
    
    let startTime = 0;
    if (this.logPerformance) {
      startTime = performance.now();
    }
    
    // Check cache if enabled
    if (this.cacheEnabled) {
      const cachedState = this.transitionCache.get(this._currentState, symbol);
      if (cachedState) {
        this._currentState = cachedState;
        
        if (this.logPerformance) {
          const endTime = performance.now();
          this.logPerformanceEvent({
            operation: 'transition',
            startTime,
            endTime,
            duration: endTime - startTime,
            cacheHit: true,
            symbol
          });
        }
        
        // Prefetch potential next transitions if enabled
        if (this.prefetchPaths) {
          this.prefetchNextTransitions(cachedState);
        }
        
        return cachedState;
      }
    }
    
    // Fall back to standard transition
    try {
      const nextState = this._currentState.getNextState(symbol);
      if (!nextState) {
        throw new Error(`No transition defined for symbol '${symbol}' from current state '${this._currentState.id}'.`);
      }
      
      // Cache the transition result
      if (this.cacheEnabled) {
        this.transitionCache.set(this._currentState, symbol, nextState);
      }
      
      this._currentState = nextState;
      
      if (this.logPerformance) {
        const endTime = performance.now();
        this.logPerformanceEvent({
          operation: 'transition',
          startTime,
          endTime,
          duration: endTime - startTime,
          cacheHit: false,
          symbol
        });
      }
      
      // Prefetch potential next transitions if enabled
      if (this.prefetchPaths) {
        this.prefetchNextTransitions(nextState);
      }
      
      return nextState;
    } catch (error) {
      if (this.logPerformance) {
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
   * Asynchronously prefetch likely next transitions
   * 
   * @param state The state to prefetch transitions for
   */
  public prefetchNextTransitions(state: State): void {
    // Use setTimeout to make this non-blocking
    setTimeout(() => {
        const alphabet = Array.from(this.alphabet) as string[];
        
        // Only prefetch up to 5 transitions to avoid excessive computation
        const prefetchLimit = Math.min(5, alphabet.length);
        for (let i = 0; i < prefetchLimit; i++) {
          const symbol = alphabet[i] as string;
          
          try {
            if (state.hasTransition(symbol)) {
              const nextState = state.getNextState(symbol);
              if (nextState && this.cacheEnabled) {
                this.transitionCache.set(state, symbol, nextState);
              }
            }
        } catch (error) {
          // Ignore errors during prefetching
        }
      }
    }, 0);
  }
  
  /**
   * Process a sequence of transitions
   * 
   * @param symbols Array of input symbols to process in sequence
   * @returns The final state after processing all transitions
   */
  override processSequence(symbols: string[]): State {
    if (!this._currentState) {
      throw new Error('No current state set.');
    }
    
    let currentState = this._currentState;
    
    for (const symbol of symbols) {
      currentState = this.transition(symbol);
    }
    
    return currentState;
  }
  /**
   * Import a state machine from JSON data
   * 
   * @param data Serialized state machine data
   * @returns The imported state machine
   */
   

  /**
   * Minimize the state machine to optimize memory usage and performance
   * 
   * @returns The number of states removed during minimization
   */
  minimize(): number {
    if (!this.minimizer) {
      this.minimizer = new StateMachineMinimizer();
    }
    
    const startingStateCount = this.states.size;
    
     // Compute equivalence classes
     const equivalenceClasses = EquivalenceClassComputer.computeEquivalenceClasses(this);
    
    // Merge equivalent states
    const minimizedStateMachine = StateMachineMinimizer.minimize.call(equivalenceClasses, this);
    
    // Update current state machine
    this.updateStates(minimizedStateMachine.getStates());
    this._currentState = minimizedStateMachine.getCurrentState() || this._currentState;
    
    // Update transitions in cache to reflect the minimization
    if (this.cacheEnabled) {
      this.transitionCache.clear();
      this.transitionCache.importStateMachine(this);
    }
    
    return startingStateCount - this.states.size;
  }

  public updateStates(newStates: Map<string, State>): void {
    this.states.clear();
    newStates.forEach((state, id) => {
      this.states.set(id, state);
    });
  }

    /**
     * Get the alphabet for this state machine
     * 
     * @returns The complete set of input symbols
     */
    getAlphabet(): Set<string> {
      return super.alphabet;
    }

  /**
   * Export the state machine's current state to JSON
   * 
   * @returns Serialized state machine data
   */
  exportToJSON(): string {
    const data = {
      states: {} as Record<string, any>,
      currentStateId: this._currentState?.id,
      alphabet: Array.from(this.getAlphabet())
    };
      
    
    // Export each state 
    for (const [id, state] of this.states.entries()) {
      data.states[id] = state.exportToJSON();
    }

    return JSON.stringify(data);    
    
}


    
}