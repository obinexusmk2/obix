/**
 * Utility functions for state management in CSS processing
 * Part of the OBIX parser module
 */

import { State } from '../states/CSSStateMachine.js';
import { CSSNode } from '../../../ast/node/CSSNode.js';

/**
 * Interface for state equivalence calculation options
 */
export interface EquivalenceOptions {
  /** Whether to use strict comparison for state signatures */
  strictComparison?: boolean;
  /** Maximum depth for recursive state comparison */
  maxDepth?: number;
  /** Whether to include node metadata in state signatures */
  includeMetadata?: boolean;
}

/**
 * A state equivalence class mapping
 */
export interface EquivalenceClassMapping {
  /** Mapping from state ID to equivalence class ID */
  stateToClass: Map<string, number>;
  /** Mapping from equivalence class ID to set of states */
  classToStates: Map<number, Set<State>>;
  /** Optimization metrics */
  metrics: {
    /** Original number of states */
    originalStateCount: number;
    /** Minimized number of state classes */
    minimizedStateCount: number;
    /** Optimization ratio (minimized/original) */
    optimizationRatio: number;
  };
}

/**
 * Utility functions for state equivalence and optimization
 */
export class CSSStateUtils {
  /**
   * Compute equivalence classes for a set of states
   * 
   * @param states States to compute equivalence classes for
   * @param options Equivalence computation options
   * @returns Equivalence class mapping
   */
  static computeEquivalenceClasses(
    states: Set<State> | State[],
    options: EquivalenceOptions = {}
  ): EquivalenceClassMapping {
    const stateSet = states instanceof Set ? states : new Set(states);
    const stateArray = Array.from(stateSet);
    
    // Default options
    const {
      strictComparison = false,
      maxDepth = Infinity,
      includeMetadata = false
    } = options;

    // Initial partition by accepting/non-accepting
    const accepting = new Set(stateArray.filter(s => s.isAccepting));
    const nonAccepting = new Set(stateArray.filter(s => !s.isAccepting));
    
    // Create initial partitions
    let partition = [accepting, nonAccepting].filter(set => set.size > 0);
    let refined = true;
    
    // Refine partitions until stable
    while (refined) {
      refined = false;
      const newPartition: Set<State>[] = [];
      
      for (const block of partition) {
        // Skip singleton blocks
        if (block.size <= 1) {
          newPartition.push(block);
          continue;
        }
        
        // Group states by their transition signatures
        const signatureGroups = this.groupStatesBySignature(
          block, partition, { maxDepth, includeMetadata, strictComparison }
        );
        
        // If we split the block, we need to refine again
        if (signatureGroups.size > 1) {
          refined = true;
          for (const group of signatureGroups.values()) {
            newPartition.push(group);
          }
        } else {
          newPartition.push(block);
        }
      }
      
      partition = newPartition;
    }
    
    // Create mappings
    const stateToClass = new Map<string, number>();
    const classToStates = new Map<number, Set<State>>();
    
    partition.forEach((block, index) => {
      classToStates.set(index, block);
      for (const state of block) {
        stateToClass.set(state.name, index);
      }
    });
    
    // Calculate metrics
    const metrics = {
      originalStateCount: stateArray.length,
      minimizedStateCount: partition.length,
      optimizationRatio: partition.length / stateArray.length
    };
    
    return { stateToClass, classToStates, metrics };
  }
  
  /**
   * Group states by their transition signatures
   * 
   * @param states States to group
   * @param partition Current partition
   * @param options Grouping options
   * @returns Map of signatures to state sets
   */
  public static groupStatesBySignature(
    states: Set<State>,
    partition: Set<State>[],
    options: Required<EquivalenceOptions>
  ): Map<string, Set<State>> {
    const groups = new Map<string, Set<State>>();
    
    for (const state of states) {
      const signature = this.computeStateSignature(
        state, partition, options, 0
      );
      
      if (!groups.has(signature)) {
        groups.set(signature, new Set());
      }
      
      groups.get(signature)!.add(state);
    }
    
    return groups;
  }
  
  /**
   * Compute a signature for a state based on its transitions
   * 
   * @param state State to compute signature for
   * @param partition Current partition
   * @param options Signature computation options
   * @param depth Current recursion depth
   * @returns Signature string
   */
  public static computeStateSignature(
    state: State,
    partition: Set<State>[],
    options: Required<EquivalenceOptions>,
    depth: number
  ): string {
    // Respect max depth
    if (depth > options.maxDepth) {
      return `${state.name}:maxdepth`;
    }
    
    const components: string[] = [];
    
    // Include accepting state in signature
    components.push(`accepting:${state.isAccepting}`);
    
    // Add transitions to signature
    for (const [symbol, targetState] of state.transitions.entries()) {
      // Find the partition containing the target state
      const targetPartition = partition.findIndex(block => 
        block.has(targetState)
      );
      
      components.push(`${symbol}:${targetPartition}`);
      
      // With strict comparison, include recursive signatures
      if (options.strictComparison && depth < options.maxDepth) {
        const targetSig = this.computeStateSignature(
          targetState, partition, options, depth + 1
        );
        components.push(`${symbol}.${targetSig}`);
      }
    }
    
    // Include metadata if requested
    if (options.includeMetadata && state.equivalenceClass !== null) {
      components.push(`meta:${state.equivalenceClass}`);
    }
    
    // Sort for consistency
    return components.sort().join('|');
  }
  
  /**
   * Check if two states are equivalent
   * 
   * @param state1 First state
   * @param state2 Second state
   * @param options Equivalence check options
   * @returns Whether the states are equivalent
   */
  static areStatesEquivalent(
    state1: State,
    state2: State,
    options: EquivalenceOptions = {}
  ): boolean {
    // Different accepting status means not equivalent
    if (state1.isAccepting !== state2.isAccepting) {
      return false;
    }
    
    // If they already have equivalence classes, check those
    if (state1.equivalenceClass !== null && 
        state2.equivalenceClass !== null) {
      return state1.equivalenceClass === state2.equivalenceClass;
    }
    
    // Compute signatures and compare
    const partition = [new Set([state1, state2])];
    const sig1 = this.computeStateSignature(state1, partition, {
      strictComparison: options.strictComparison ?? true,
      maxDepth: options.maxDepth ?? 2,
      includeMetadata: options.includeMetadata ?? false
    }, 0);
    
    const sig2 = this.computeStateSignature(state2, partition, {
      strictComparison: options.strictComparison ?? true,
      maxDepth: options.maxDepth ?? 2,
      includeMetadata: options.includeMetadata ?? false
    }, 0);
    
    return sig1 === sig2;
  }
  
  /**
   * Find the equivalence class for a state within a set of classes
   * 
   * @param state State to find class for
   * @param classes Map of class IDs to state sets
   * @returns Class ID or null if not found
   */
  static findEquivalenceClass(
    state: State,
    classes: Map<number, Set<State>>
  ): number | null {
    // Check each class
    for (const [classId, stateSet] of classes.entries()) {
      if (stateSet.has(state)) {
        return classId;
      }
      
      // Check if equivalent to any state in the class
      for (const classState of stateSet) {
        if (this.areStatesEquivalent(state, classState)) {
          return classId;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Merge equivalent nodes in a CSS node tree
   * 
   * @param root Root node
   * @returns Optimized node tree
   */
  static mergeEquivalentNodes(root: CSSNode): CSSNode {
    // Map to track unique node signatures
    const nodeSignatures = new Map<string, CSSNode>();
    const optimizedNodes = new WeakMap<CSSNode, CSSNode>();
    
    // Process tree recursively
    const processNode = (node: CSSNode): CSSNode => {
      // Process children first
      const optimizedChildren = node.children.map(processNode);
      
      // Clone the node with optimized children
      const clonedNode = node.clone(false);
      optimizedChildren.forEach((child: CSSNode) => clonedNode.addChild(child));
      
      // Compute node signature
      const signature = node.computeSignature();
      
      // Check if we've seen this signature before
      if (nodeSignatures.has(signature)) {
        // Return the existing node
        const existingNode = nodeSignatures.get(signature)!;
        optimizedNodes.set(node, existingNode);
        return existingNode;
      }
      
      // Register this node signature
      nodeSignatures.set(signature, clonedNode);
      optimizedNodes.set(node, clonedNode);
      return clonedNode;
    };
    
    return processNode(root);
  }
}