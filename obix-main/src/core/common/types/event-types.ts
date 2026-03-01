/**
 * Type definitions for event handling in state machines
 */
import { StateId, InputSymbol } from './state-machine-types.js';

/**
 * Event handler function signature
 */
export type EventHandler<T = any> = (eventData: T) => void;

/**
 * Subscription cancellation function
 */
export type Unsubscribe = () => void;

/**
 * Data provided with state change events
 */
export interface StateChangeEventData<T = any> {
  /**
   * Previous state ID
   */
  previousStateId: StateId;
  
  /**
   * New state ID
   */
  newStateId: StateId;
  
  /**
   * Previous state value
   */
  previousValue: T;
  
  /**
   * New state value
   */
  newValue: T;
  
  /**
   * Timestamp of the state change
   */
  timestamp: number;
  
  /**
   * Whether this state change was triggered by a transition
   */
  fromTransition: boolean;
  
  /**
   * Input symbol that triggered the transition (if applicable)
   */
  inputSymbol?: InputSymbol;
}

/**
 * Data provided with transition events
 */
export interface TransitionEventData<T = any> {
  /**
   * Source state ID
   */
  sourceStateId: StateId;
  
  /**
   * Target state ID
   */
  targetStateId: StateId;
  
  /**
   * Input symbol that triggered the transition
   */
  inputSymbol: InputSymbol;
  
  /**
   * Source state value before transition
   */
  sourceValue: T;
  
  /**
   * Target state value after transition
   */
  targetValue: T;
  
  /**
   * Payload provided with the transition
   */
  payload?: any;
  
  /**
   * Timestamp of the transition
   */
  timestamp: number;
  
  /**
   * Whether this transition was from the cache
   */
  fromCache: boolean;
  
  /**
   * Time taken to compute the transition (ms)
   */
  transitionTimeMs?: number;
}

/**
 * Data provided with cache events
 */
export interface CacheEventData {
  /**
   * Type of cache event
   */
  type: 'hit' | 'miss' | 'set' | 'evict' | 'clear';
  
  /**
   * Cache key affected
   */
  key?: string;
  
  /**
   * Source state ID (if applicable)
   */
  sourceStateId?: StateId;
  
  /**
   * Input symbol (if applicable)
   */
  inputSymbol?: InputSymbol;
  
  /**
   * Target state ID (if applicable)
   */
  targetStateId?: StateId;
  
  /**
   * Current cache statistics
   */
  cacheStats?: {
    size: number;
    hitRatio: number;
  };
  
  /**
   * Timestamp of the event
   */
  timestamp: number;
}

/**
 * Data provided with error events
 */
export interface ErrorEventData {
  /**
   * Error code
   */
  code: string;
  
  /**
   * Error message
   */
  message: string;
  
  /**
   * Error details
   */
  details?: any;
  
  /**
   * Original error object
   */
  originalError?: Error;
  
  /**
   * Context in which the error occurred
   */
  context?: {
    /**
     * State ID when error occurred
     */
    stateId?: StateId;
    
    /**
     * Input symbol being processed
     */
    inputSymbol?: InputSymbol;
    
    /**
     * Operation that caused the error
     */
    operation?: string;
  };
  
  /**
   * Timestamp of the error
   */
  timestamp: number;
}