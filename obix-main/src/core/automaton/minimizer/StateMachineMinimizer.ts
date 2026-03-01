/**
 * StateMachineMinimizer.ts
 * 
 * Implementation of automaton state minimization algorithm based on
 * Nnamdi Okpala's research on "Automaton State Minimization and AST Optimization".
 * 
 * This implementation follows Hopcroft's algorithm for minimizing DFAs
 * with additional optimizations for AST structures as described in 
 * "Extended Automaton-AST Minimization and Validation".
 * 
 * @copyright 2025 OBINexus Computing
 */

import { EquivalenceClassComputer } from './EquivalenceClassComputer';
import { BehaviorModel } from '../behavior/BehaviorModel';
import { ValidationStateMachine } from '../dop/ValidationStateMachine';
import { HTMLNode } from '../ast/html/node/HTMLNode';
import { VNode } from '../vhtml/VHTMLNode';
import { ExecutionTrace } from '../validation/errors/ExecutionTrace';

/**
 * Interface for a state in the automaton
 */
export interface State {
  id: string;
  isAccepting: boolean;
  transitions: Map<string, string>; // input -> target state id
  metadata?: Record<string, any> | undefined;
}

/**
 * Interface for an automaton
 */
export interface Automaton {
  states: Map<string, State>;
  alphabet: Set<string>;
  initialStateId: string;
}

/**
 * Interface for minimization metrics
 */
export interface MinimizationMetrics {
  originalStateCount: number;
  minimizedStateCount: number;
  reductionPercentage: number;
  equivalenceClassCount: number;
  processingTimeMs: number;
  memoryOptimized: boolean;
  astNodeReduction?: number;
  transitionReduction?: number;
}

/**
 * Interface for minimization options
 */
export interface MinimizationOptions {
  enableTracing?: boolean;
  enableStateCaching?: boolean;
  useHeuristicPartitioning?: boolean;
  memorySavingMode?: boolean;
  ignoreUnreachableStates?: boolean;
  maxIterations?: number;
}

/**
 * Class for optimizing state machines by finding and merging equivalent states
 */
export class StateMachineMinimizer {
  private equivalenceComputer: EquivalenceClassComputer;
  private options: MinimizationOptions;
  private metrics: MinimizationMetrics;
  private executionTrace?: ExecutionTrace;
  
  /**
   * Create a new state machine minimizer
   * 
   * @param options Minimization options
   */
  constructor(options: MinimizationOptions = {}) {
    this.equivalenceComputer = new EquivalenceClassComputer();
    this.options = {
      enableTracing: options.enableTracing !== false,
      enableStateCaching: options.enableStateCaching !== false,
      useHeuristicPartitioning: options.useHeuristicPartitioning !== false,
      memorySavingMode: options.memorySavingMode === true,
      ignoreUnreachableStates: options.ignoreUnreachableStates !== false,
      maxIterations: options.maxIterations || 100
    };
    
    this.metrics = {
      originalStateCount: 0,
      minimizedStateCount: 0,
      reductionPercentage: 0,
      equivalenceClassCount: 0,
      processingTimeMs: 0,
      memoryOptimized: this.options.memorySavingMode === true
    };
    
    if (this.options.enableTracing) {
      this.executionTrace = ExecutionTrace.start('state-machine-minimization', {
        options: this.options
      });
    }
  }
  
  /**
   * Minimize an automaton by merging equivalent states
   * 
   * @param automaton The automaton to minimize
   * @returns A minimized automaton
   */
  public minimize(automaton: Automaton): { 
    minimizedAutomaton: Automaton; 
    metrics: MinimizationMetrics;
    trace?: ExecutionTrace 
  } {
    const startTime = performance.now();
    
    if (this.executionTrace) {
      this.executionTrace.addStep('minimize.start');
    }
    
    this.metrics.originalStateCount = automaton.states.size;
    
    // Step 1: Remove unreachable states if configured
    let processedAutomaton = automaton;
    if (this.options.ignoreUnreachableStates) {
      processedAutomaton = this.removeUnreachableStates(automaton);
      
      if (this.executionTrace) {
        this.executionTrace.addStep('unreachable_states_removed');
      }
    }
    
    // Step 2: Compute equivalence classes
    const equivalenceClasses = this.computeEquivalenceClasses(processedAutomaton);
    this.metrics.equivalenceClassCount = new Set(equivalenceClasses.values()).size;
    
    if (this.executionTrace) {
      this.executionTrace.addStep('equivalence_classes_computed');
    }
    
    // Step 3: Create the minimized automaton
    const minimizedAutomaton = this.createMinimizedAutomaton(processedAutomaton, equivalenceClasses);
    this.metrics.minimizedStateCount = minimizedAutomaton.states.size;
    this.metrics.reductionPercentage = 
      (1 - (this.metrics.minimizedStateCount / this.metrics.originalStateCount)) * 100;
    
    if (this.executionTrace) {
      this.executionTrace.addStep('minimized_automaton_created');
    }
    
    // Record performance metrics
    this.metrics.processingTimeMs = performance.now() - startTime;
    
    if (this.executionTrace) {
      this.executionTrace.end({
        metrics: this.metrics,
        stateCount: minimizedAutomaton.states.size,
        alphabetSize: minimizedAutomaton.alphabet.size
      });
    }
    
    return {
      minimizedAutomaton,
      metrics: { ...this.metrics },
      trace: this.executionTrace
    };
  }
  
  /**
   * Remove unreachable states from an automaton
   * 
   * @param automaton The automaton to process
   * @returns Automaton with only reachable states
   */
  private removeUnreachableStates(automaton: Automaton): Automaton {
    const { states, alphabet, initialStateId } = automaton;
    
    // Find all reachable states using BFS
    const reachableStates = new Set<string>();
    const queue: string[] = [initialStateId];
    
    while (queue.length > 0) {
      const currentStateId = queue.shift()!;
      
      if (reachableStates.has(currentStateId)) {
        continue;
      }
      
      reachableStates.add(currentStateId);
      const currentState = states.get(currentStateId);
      
      if (!currentState) {
        continue;
      }
      
      // Add all target states to the queue
      for (const targetStateId of currentState.transitions.values()) {
        if (!reachableStates.has(targetStateId)) {
          queue.push(targetStateId);
        }
      }
    }
    
    // Create a new automaton with only reachable states
    const reachableStatesMap = new Map<string, State>();
    for (const [stateId, state] of states.entries()) {
      if (reachableStates.has(stateId)) {
        reachableStatesMap.set(stateId, state);
      }
    }
    
    return {
      states: reachableStatesMap,
      alphabet,
      initialStateId
    };
  }
  
  /**
   * Compute equivalence classes for states in the automaton
   * Implementation of Hopcroft's algorithm
   * 
   * @param automaton The automaton
   * @returns Map of state ids to their equivalence class ids
   */
  private computeEquivalenceClasses(automaton: Automaton): Map<string, string> {
    const { states, alphabet } = automaton;
    
    if (this.executionTrace) {
      this.executionTrace.addStep('equivalence_classes.computing');
    }
    
    // Step 1: Initialize partition with accepting and non-accepting states
    const acceptingStates = new Set<string>();
    const nonAcceptingStates = new Set<string>();
    
    for (const [stateId, state] of states.entries()) {
      if (state.isAccepting) {
        acceptingStates.add(stateId);
      } else {
        nonAcceptingStates.add(stateId);
      }
    }
    
    // Current partition of states
    const partition: Set<string>[] = [];
    if (acceptingStates.size > 0) partition.push(acceptingStates);
    if (nonAcceptingStates.size > 0) partition.push(nonAcceptingStates);
    
    if (this.executionTrace) {
      this.executionTrace.addStep('equivalence_classes.initial_partition');
    }
    
    // Work list of partitions to process
    const workList: Set<string>[] = [...partition];
    
    // Process partitions until work list is empty
    let iterations = 0;
    while (workList.length > 0 && iterations < this.options.maxIterations!) {
      iterations++;
      const currentPartition = workList.pop()!;
      
      if (this.executionTrace) {
        this.executionTrace.addStep(`equivalence_classes.processing_partition_${iterations}`);
      }
      
      // For each input symbol
      for (const symbol of alphabet) {
        // Compute states that lead to the current partition on the given symbol
        const preSymbol = this.computePreSymbol(automaton, currentPartition, symbol);
        
        // For each existing partition
        let i = 0;
        while (i < partition.length) {
          const existingPartition = partition[i];
          
          // Compute intersection and difference
          const intersection = new Set<string>(
            [...existingPartition].filter(state => preSymbol.has(state))
          );
          
          const difference = new Set<string>(
            [...existingPartition].filter(state => !preSymbol.has(state))
          );
          
          // If partition is split
          if (intersection.size > 0 && difference.size > 0) {
            // Replace the existing partition with the difference
            partition[i] = difference;
            
            // Add the intersection as a new partition
            partition.push(intersection);
            
            // If the existing partition is in work list, replace it with both new partitions
            const workListIndex = workList.findIndex(p => p !== undefined && this.areSetsEqual(p as Set<string>, existingPartition));
            if (workListIndex !== -1) {
              workList.splice(workListIndex, 1);
              workList.push(difference);
              workList.push(intersection);
            } 
            // Otherwise, add the smaller partition to work list
            else {
              if (difference.size <= intersection.size) {
                workList.push(difference);
              } else {
                workList.push(intersection);
              }
            }
          }
          
          i++;
        }
      }
    }
    
    if (this.executionTrace) {
      this.executionTrace.addStep(`equivalence_classes.finished_after_${iterations}_iterations`);
    }
    
    // Create a map from state ids to their equivalence class ids
    const stateToClass = new Map<string, string>();
    
    for (let i = 0; i < partition.length; i++) {
      const classId = `eq_${i}`;
      const partitionSet = partition[i];
      if (partitionSet) {
        for (const stateId of partitionSet) {
          stateToClass.set(stateId, classId);
        }
      }
    }
    
    return stateToClass;
  }
  
  /**
   * Create a minimized automaton from the original automaton and equivalence classes
   * 
   * @param automaton The original automaton
   * @param stateToClass Map of state ids to their equivalence class ids
   * @returns A minimized automaton
   */
  private createMinimizedAutomaton(
    automaton: Automaton,
    stateToClass: Map<string, string>
  ): Automaton {
    const { states, alphabet, initialStateId } = automaton;
    
    if (this.executionTrace) {
      this.executionTrace.addStep('create_minimized.start');
    }
    
    // Map from equivalence class ids to representative state ids
    const classToRepresentative = new Map<string, string>();
    
    // For each equivalence class, choose a representative state
    for (const [stateId, classId] of stateToClass.entries()) {
      if (!classToRepresentative.has(classId)) {
        classToRepresentative.set(classId, stateId);
      }
    }
    
    if (this.executionTrace) {
      this.executionTrace.addStep('create_minimized.representatives_chosen');
    }
    
    // Create the minimized automaton
    const minimizedStates = new Map<string, State>();
    
    // For each equivalence class
    for (const [classId, representativeId] of classToRepresentative.entries()) {
      const representativeState = states.get(representativeId)!;
      
      // Create a new state for the equivalence class
      const newState: State = {
        id: classId,
        isAccepting: representativeState.isAccepting,
        transitions: new Map<string, string>(),
        metadata: representativeState.metadata ? { ...representativeState.metadata } : undefined
      };
      
      // Update transitions to point to equivalence classes
      for (const [symbol, targetId] of representativeState.transitions.entries()) {
        const targetClassId = stateToClass.get(targetId)!;
        newState.transitions.set(symbol, targetClassId);
      }
      
      minimizedStates.set(classId, newState);
    }
    
    if (this.executionTrace) {
      this.executionTrace.addStep('create_minimized.automaton_constructed');
    }
    
    // Create the minimized automaton
    return {
      states: minimizedStates,
      alphabet,
      initialStateId: stateToClass.get(initialStateId)!
    };
  }
  
  /**
   * Compute the set of states that lead to states in the target partition on the given symbol
   * 
   * @param automaton The automaton
   * @param targetPartition The target partition
   * @param symbol The input symbol
   * @returns Set of state ids that lead to the target partition
   */
  private computePreSymbol(
    automaton: Automaton,
    targetPartition: Set<string>,
    symbol: string
  ): Set<string> {
    const preSymbol = new Set<string>();
    
    for (const [stateId, state] of automaton.states.entries()) {
      const targetId = state.transitions.get(symbol);
      if (targetId && targetPartition.has(targetId)) {
        preSymbol.add(stateId);
      }
    }
    
    return preSymbol;
  }
  
  /**
   * Check if two sets are equal
   * 
   * @param a First set
   * @param b Second set
   * @returns True if sets are equal
   */
  private areSetsEqual(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) return false;
    for (const item of a) {
      if (!b.has(item)) return false;
    }
    return true;
  }
  
  /**
   * Convert a BehaviorModel to an Automaton
   * 
   * @param behaviorModel The behavior model
   * @returns An automaton representation
   */
  public convertBehaviorModelToAutomaton<S, E extends string>(
    behaviorModel: BehaviorModel<S, E>
  ): Automaton {
    if (this.executionTrace) {
      this.executionTrace.addStep('convert_behavior_model.start');
    }
    
    const states = new Map<string, State>();
    const alphabet = new Set<string>();
    let initialStateId = '';
    
    // Extract states and transitions from the behavior model
    const modelStates = behaviorModel.getAllStates();
    
    for (const modelState of modelStates) {
      const stateId = modelState.getId();
      
      // Add state
      states.set(stateId, {
        id: stateId,
        isAccepting: modelState.isAccepting?.() || false,
        transitions: new Map<string, string>(),
        metadata: {
          originalState: modelState
        }
      });
      
      // Get transitions
      const transitions = modelState.getAllTransitions();
      for (const [eventType, targetState] of transitions.entries()) {
        // Add transition
        states.get(stateId)!.transitions.set(eventType, targetState.getId());
        
        // Add to alphabet
        alphabet.add(eventType);
      }
      
      // Check if this is the initial state
      if (behaviorModel.getInitialState()?.getId() === stateId) {
        initialStateId = stateId;
      }
    }
    
    if (this.executionTrace) {
      this.executionTrace.addStep('convert_behavior_model.complete');
    }
    
    return {
      states,
      alphabet,
      initialStateId
    };
  }
  
  /**
   * Convert a ValidationStateMachine to an Automaton
   * 
   * @param stateMachine The validation state machine
   * @returns An automaton representation
   */
  public convertValidationStateMachineToAutomaton(
    stateMachine: ValidationStateMachine
  ): Automaton {
    if (this.executionTrace) {
      this.executionTrace.addStep('convert_validation_machine.start');
    }
    
    const states = new Map<string, State>();
    const alphabet = new Set<string>();
    let initialStateId = 'initial';
    
    // Extract states and transitions
    const machineStates = stateMachine.getAllStates();
    
    for (const machineState of machineStates) {
      const stateId = machineState.getId();
      
      // Add state
      states.set(stateId, {
        id: stateId,
        isAccepting: machineState.metadata?.isAccepting || false,
        transitions: new Map<string, string>(),
        metadata: {
          originalState: machineState,
          phase: machineState.metadata?.phase
        }
      });
      
      // Get transitions
      const transitions = machineState.getAllTransitions();
      for (const [eventType, targetState] of transitions.entries()) {
        // Add transition
        states.get(stateId)!.transitions.set(eventType, targetState.getId());
        
        // Add to alphabet
        alphabet.add(eventType);
      }
    }
    
    if (this.executionTrace) {
      this.executionTrace.addStep('convert_validation_machine.complete');
    }
    
    return {
      states,
      alphabet,
      initialStateId
    };
  }
  
  /**
   * Apply the minimized automaton back to the validation state machine
   * 
   * @param stateMachine The original validation state machine
   * @param minimizedAutomaton The minimized automaton
   * @returns The minimized validation state machine
   */
  public applyMinimizedAutomatonToValidationStateMachine(
    stateMachine: ValidationStateMachine,
    minimizedAutomaton: Automaton
  ): ValidationStateMachine {
    if (this.executionTrace) {
      this.executionTrace.addStep('apply_to_validation_machine.start');
    }
    
    // Create a new state machine
    const minimizedStateMachine = new ValidationStateMachine();
    
    // Map from original state IDs to their minimized state IDs
    const stateMap = new Map<string, string>();
    
    // First pass: create all minimized states
    for (const [minimizedStateId, minimizedState] of minimizedAutomaton.states.entries()) {
      // Get one of the original states from this equivalence class
      const originalStateId = minimizedState.metadata?.originalState?.getId() || minimizedStateId;
      const originalState = stateMachine.getState(originalStateId);
      
      if (!originalState) {
        continue;
      }
      
      // Create a new state in the minimized state machine
      const newState = originalState.clone();
      newState.setMetadata({
        ...originalState.getMetadata(),
        isMinimized: true,
        equivalenceClass: minimizedStateId,
        originalStateId: originalStateId
      });
      
      minimizedStateMachine.addState(newState);
      
      // Update state map
      stateMap.set(originalStateId, minimizedStateId);
    }
    
    // Second pass: update transitions
    for (const [minimizedStateId, minimizedState] of minimizedAutomaton.states.entries()) {
      const stateInMinimizedMachine = minimizedStateMachine.getState(minimizedStateId);
      
      if (!stateInMinimizedMachine) {
        continue;
      }
      
      // Update transitions to point to minimized states
      for (const [symbol, targetMinimizedStateId] of minimizedState.transitions.entries()) {
        const targetState = minimizedStateMachine.getState(targetMinimizedStateId);
        
        if (targetState) {
          stateInMinimizedMachine.addTransition(symbol, targetState);
        }
      }
    }
    
    if (this.executionTrace) {
      this.executionTrace.addStep('apply_to_validation_machine.complete');
    }
    
    return minimizedStateMachine;
  }
  
  /**
   * Apply the optimized automaton back to the behavior model
   * 
   * @param behaviorModel The behavior model to optimize
   * @param optimizedAutomaton The optimized automaton
   * @returns The optimized behavior model
   */
  public applyOptimizedAutomatonToBehaviorModel<S, E extends string>(
    behaviorModel: BehaviorModel<S, E>,
    optimizedAutomaton: Automaton
  ): BehaviorModel<S, E> {
    if (this.executionTrace) {
      this.executionTrace.addStep('apply_to_behavior_model.start');
    }
    
    // This is a placeholder implementation
    // In a real implementation, we would:
    // 1. Update the behavior model's internal state machine
    // 2. Preserve the behavior while minimizing states
    
    // For now, return the original behavior model
    if (this.executionTrace) {
      this.executionTrace.addStep('apply_to_behavior_model.complete');
    }
    
    return behaviorModel;
  }
  
  /**
   * Optimize a behavior model by minimizing its state machine
   * 
   * @param behaviorModel The behavior model to optimize
   * @returns The optimized behavior model
   */
  public optimizeBehaviorModel<S, E extends string>(
    behaviorModel: BehaviorModel<S, E>
  ): { 
    optimizedModel: BehaviorModel<S, E>; 
    metrics: MinimizationMetrics 
  } {
    // Step 1: Convert the behavior model to an automaton
    const automaton = this.convertBehaviorModelToAutomaton(behaviorModel);
    
    // Step 2: Minimize the automaton
    const { minimizedAutomaton, metrics } = this.minimize(automaton);
    
    // Step 3: Apply the optimized automaton back to the behavior model
    const optimizedModel = this.applyOptimizedAutomatonToBehaviorModel(
      behaviorModel, 
      minimizedAutomaton
    );
    
    return {
      optimizedModel,
      metrics
    };
  }
  
  /**
   * Optimize a validation state machine by minimizing its states
   * 
   * @param stateMachine The validation state machine to optimize
   * @returns The optimized validation state machine and metrics
   */
  public optimizeValidationStateMachine(
    stateMachine: ValidationStateMachine
  ): { 
    optimizedMachine: ValidationStateMachine; 
    metrics: MinimizationMetrics 
  } {
    // Step 1: Convert the validation state machine to an automaton
    const automaton = this.convertValidationStateMachineToAutomaton(stateMachine);
    
    // Step 2: Minimize the automaton
    const { minimizedAutomaton, metrics } = this.minimize(automaton);
    
    // Step 3: Apply the minimized automaton back to the validation state machine
    const optimizedMachine = this.applyMinimizedAutomatonToValidationStateMachine(
      stateMachine, 
      minimizedAutomaton
    );
    
    return {
      optimizedMachine,
      metrics
    };
  }
  
  /**
   * Apply automaton state minimization to an AST node structure
   * 
   * @param rootNode The root node of the AST
   * @returns Minimized root node and metrics
   */
  public minimizeASTStructure<T extends HTMLNode | VNode>(
    rootNode: T
  ): {
    minimizedNode: T;
    metrics: MinimizationMetrics;
  } {
    // This would be a complex implementation that:
    // 1. Converts the AST structure to an automaton
    // 2. Applies minimization
    // 3. Maps the minimized automaton back to the AST structure
    
    // For now, return a placeholder implementation
    return {
      minimizedNode: rootNode,
      metrics: {
        ...this.metrics,
        originalStateCount: 0,
        minimizedStateCount: 0,
        reductionPercentage: 0,
        equivalenceClassCount: 0,
        processingTimeMs: 0,
        memoryOptimized: false
      }
    };
  }
  
  /**
   * Get minimization metrics
   * 
   * @returns Current minimization metrics
   */
  public getMetrics(): MinimizationMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get the execution trace if enabled
   * 
   * @returns Execution trace or undefined if not enabled
   */
  public getExecutionTrace(): ExecutionTrace | undefined {
    return this.executionTrace;
  }
}