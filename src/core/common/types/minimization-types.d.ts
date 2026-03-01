/**
 * Type definitions for automaton state minimization
 */
import { StateId } from './state-machine-types';

/**
 * Optimization levels for state minimization
 */
export enum OptimizationLevel {
  /**
   * No optimization, keep original state machine
   */
  NONE = 0,
  
  /**
   * Basic minimization, combine obviously equivalent states
   */
  BASIC = 1,
  
  /**
   * Standard minimization using Hopcroft's algorithm
   */
  STANDARD = 2,
  
  /**
   * Aggressive minimization with memory optimizations
   */
  AGGRESSIVE = 3
}

/**
 * Options for state machine minimization
 */
export interface MinimizationOptions {
  /**
   * Whether to remove unreachable states
   */
  removeUnreachableStates?: boolean;
  
  /**
   * Whether to optimize memory usage
   */
  optimizeMemory?: boolean;
  
  /**
   * Whether to collect detailed metrics
   */
  collectMetrics?: boolean;
  
  /**
   * Optimization level to apply
   */
  optimizationLevel?: OptimizationLevel;
  
  /**
   * Whether to preserve original state IDs in metadata
   */
  preserveOriginalIds?: boolean;
  
  /**
   * Custom state comparison function
   */
  stateComparator?: (state1: any, state2: any) => boolean;
}

/**
 * Metrics collected during minimization
 */
export interface MinimizationMetrics {
  /**
   * Original number of states
   */
  originalStateCount: number;
  
  /**
   * Minimized number of states
   */
  minimizedStateCount: number;
  
  /**
   * Reduction ratio (minimized/original)
   */
  stateReductionRatio: number;
  
  /**
   * Original number of transitions
   */
  originalTransitionCount: number;
  
  /**
   * Minimized number of transitions
   */
  minimizedTransitionCount: number;
  
  /**
   * Reduction ratio for transitions
   */
  transitionReductionRatio: number;
  
  /**
   * Number of equivalence classes found
   */
  equivalenceClassCount: number;
  
  /**
   * Time taken for minimization (ms)
   */
  minimizationTimeMs: number;
  
  /**
   * Memory usage before minimization (bytes)
   */
  memoryBefore?: number;
  
  /**
   * Memory usage after minimization (bytes)
   */
  memoryAfter?: number;
  
  /**
   * Memory reduction percentage
   */
  memoryReductionPercent?: number;
}

/**
 * Represents an equivalence class of states
 */
export interface EquivalenceClass {
  /**
   * Unique identifier for the equivalence class
   */
  id: number;
  
  /**
   * Set of state IDs that belong to this equivalence class
   */
  stateIds: Set<StateId>;
  
  /**
   * Representative state ID for this class
   */
  representativeId: StateId;
  
  /**
   * Transition map: input symbol -> resulting equivalence class ID
   */
  transitionMap: Map<string, number>;
}