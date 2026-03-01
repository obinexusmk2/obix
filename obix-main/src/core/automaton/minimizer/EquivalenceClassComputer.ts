import { State } from "../state/State.js";
import { StateMachine } from "../state/StateMachineClass.js";


/**
 * EquivalenceClassComputer
 * Implements algorithms for computing state equivalence classes,
 * a key component of automaton state minimization
 */
export class EquivalenceClassComputer {
  /**
   * Compute equivalence classes for states in a state machine
   * Using the partitioning algorithm
   * 
   * @param stateMachine State machine to compute equivalence classes for
   * @returns Map of equivalence class IDs to sets of equivalent states
   */
  static computeEquivalenceClasses(stateMachine: StateMachine): Map<number, Set<State>> {
    const states = Array.from(stateMachine.states.values());
    const alphabet = stateMachine.alphabet;
    
    // Start with initial partition: accepting vs non-accepting states
    const accepting = new Set<State>();
    const nonAccepting = new Set<State>();
    
    for (const state of states) {
      if ((state as State).getMetadata('accepting') === true) {
        accepting.add(state);
      } else {
        nonAccepting.add(state);
      }
    }
    
    let partitions: Set<Set<State>> = new Set();
    if (accepting.size > 0) partitions.add(accepting);
    if (nonAccepting.size > 0) partitions.add(nonAccepting);
    
    let changed = true;
    
    // Refine partitions until no more changes
    while (changed) {
      changed = false;
      const newPartitions = new Set<Set<State>>();
      
      for (const partition of partitions) {
        const splits = this.splitPartition(partition, partitions, alphabet);
        
        // If the partition was split, we need to continue refining
        if (splits.size > 1) {
          changed = true;
          for (const split of splits.values()) {
            newPartitions.add(split);
          }
        } else {
          newPartitions.add(partition);
        }
      }
      
      partitions = newPartitions;
    }
    
    // Convert to map with numeric IDs
    const equivalenceClasses = new Map<number, Set<State>>();
    let classId = 0;
    
    for (const partition of partitions) {
      equivalenceClasses.set(classId, partition);
      
      // Assign equivalence class ID to each state
      for (const state of partition) {
        state.setEquivalenceClass(classId);
      }
      
      classId++;
    }
    
    return equivalenceClasses;
  }
  
  /**
   * Split a partition of states based on their transition behavior
   * 
   * @param partition Set of states to potentially split
   * @param allPartitions All current partitions
   * @param alphabet Complete set of input symbols
   * @returns Map of signature strings to sets of states
   */
  public static splitPartition(
    partition: Set<State>,
    allPartitions: Set<Set<State>>,
    alphabet: Set<string>
  ): Map<string, Set<State>> {
    const splits = new Map<string, Set<State>>();
    
    for (const state of partition) {
      // Compute transition signature for this state
      const signature = this.computeTransitionSignature(state, allPartitions, alphabet);
      
      if (!splits.has(signature)) {
        splits.set(signature, new Set<State>());
      }
      
      splits.get(signature)!.add(state);
    }
    
    return splits;
  }
  
  /**
   * Compute a unique signature for a state based on its transitions
   * 
   * @param state State to compute signature for
   * @param partitions Current state partitions
   * @param alphabet Complete set of input symbols
   * @returns Signature string
   */
  public static computeTransitionSignature(
    state: State,
    partitions: Set<Set<State>>,
    alphabet: Set<string>
  ): string {
    const transitionSignatures: string[] = [];
    
    // For each input symbol, find the partition of the target state
    for (const symbol of alphabet) {
      const targetState = state.getNextState(symbol);
      
      if (targetState) {
        const partitionIndex = this.findPartitionIndex(targetState, partitions);
        transitionSignatures.push(`${symbol}:${partitionIndex}`);
      } else {
        // No transition for this symbol
        transitionSignatures.push(`${symbol}:-1`);
      }
    }
    
    // Sort for consistent ordering
    return transitionSignatures.sort().join('|');
  }
  
  /**
   * Find the partition index for a state
   * 
   * @param state State to find partition for
   * @param partitions All current partitions
   * @returns Partition index or -1 if not found
   */
  public static findPartitionIndex(
    state: State,
    partitions: Set<Set<State>>
  ): number {
    let index = 0;
    
    for (const partition of partitions) {
      if (partition.has(state)) {
        return index;
      }
      index++;
    }
    
    return -1; // Not found
  }
  
  /**
   * Find the equivalence class for a state
   * 
   * @param state State to find class for
   * @param classes Equivalence classes
   * @returns Class ID or -1 if not found
   */
  static findEquivalenceClass(
    state: State,
    classes: Map<number, Set<State>>
  ): number {
    // If the state has a pre-assigned class, use it
    if (state.metadata.equivalenceClass !== null) {
      return state.metadata.equivalenceClass;
    }
    
    // Otherwise search through classes
    for (const [classId, stateSet] of classes.entries()) {
      if (stateSet.has(state)) {
        return classId;
      }
    }
    
    return -1; // Not found in any class
  }
  
  /**
   * Check if two states are equivalent
   * 
   * @param state1 First state
   * @param state2 Second state
   * @param equivalenceClasses Current equivalence classes
   * @returns True if the states are equivalent
   */
  static areStatesEquivalent(
    state1: State,
    state2: State,
    equivalenceClasses: Map<number, Set<State>>
  ): boolean {
    return this.findEquivalenceClass(state1, equivalenceClasses) === 
           this.findEquivalenceClass(state2, equivalenceClasses);
  }
  
  /**
   * Compute state signatures for all states
   * 
   * @param states States to compute signatures for
   * @param equivalenceClasses Current equivalence classes
   * @returns Map of states to their signatures
   */
  static computeStateSignatures(
    states: State[],
    equivalenceClasses: Map<number, Set<State>>
  ): Map<State, string> {
    const signatures = new Map<State, string>();
    
    for (const state of states) {
      const signature = state.computeStateSignature(equivalenceClasses);
      signatures.set(state, signature);
    }
    
    return signatures;
  }
}
