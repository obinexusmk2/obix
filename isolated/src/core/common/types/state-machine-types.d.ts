/**
 * Core type definitions for state machine implementations
 */

/**
 * Unique identifier for states within a state machine
 */
export type StateId = string;

/**
 * Input symbol that triggers state transitions
 */
export type InputSymbol = string;

/**
 * The value associated with a state
 * Can be any data type depending on the application's needs
 */
export type StateValue = any;

/**
 * Function signature for state transitions
 * Takes a current state value and returns a new state value
 */
export type TransitionFunction<T = any> = (state: T, payload?: any) => T;

/**
 * Metadata associated with states for optimization and tracking
 */
export interface StateMetadata {
  /**
   * Equivalence class identifier for state minimization
   */
  equivalenceClass: number | null;
  
  /**
   * Signature for state comparison in minimization algorithms
   */
  stateSignature: string | null;
  
  /**
   * Whether this state has been minimized
   */
  isMinimized: boolean;
  
  /**
   * Whether this state is an accepting state (for automaton validation)
   */
  accepting?: boolean;
  
  /**
   * ID of the original state this minimized state represents
   */
  representativeId?: string;
  
  /**
   * Reference count for memory management
   */
  referenceCount?: number;
  
  /**
   * Frequency of access (for optimization)
   */
  accessFrequency?: number;
  
  /**
   * Custom metadata properties
   */
  [key: string]: any;
}

/**
 * Interface for state transition definition
 */
export interface TransitionDefinition {
  /**
   * Source state identifier
   */
  from: StateId;
  
  /**
   * Input symbol triggering the transition
   */
  input: InputSymbol;
  
  /**
   * Target state identifier
   */
  to: StateId;
  
  /**
   * Optional metadata for the transition
   */
  metadata?: {
    /**
     * Priority of this transition when multiple transitions are possible
     */
    priority?: number;
    
    /**
     * Whether this transition is a default/fallback
     */
    isDefault?: boolean;
    
    /**
     * Whether this transition has side effects
     */
    hasSideEffects?: boolean;
    
    /**
     * Custom metadata
     */
    [key: string]: any;
  };
}

/**
 * Configuration options for state machines
 */
export interface StateMachineOptions {
  /**
   * Whether to enable transition caching
   */
  enableCache?: boolean;
  
  /**
   * Whether to automatically minimize the state machine
   */
  autoMinimize?: boolean;
  
  /**
   * Whether to validate transitions
   */
  validateTransitions?: boolean;
  
  /**
   * Whether to collect performance metrics
   */
  collectMetrics?: boolean;
  
  /**
   * Maximum allowed states (for preventing memory issues)
   */
  maxStates?: number;
}