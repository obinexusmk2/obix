// core/automaton/index.d.ts
declare module 'obix/core/automaton' {
    export interface StateMetadata {
      equivalenceClass: number | null;
      stateSignature: string | null;
      isMinimized: boolean;
      [key: string]: any;
    }
  
    export class State {
      constructor(id: string, value?: any);
      
      getId(): string;
      getValue(): any;
      getTransitions(): Map<string, State>;
      getMetadata(): StateMetadata;
      addTransition(symbol: string, target: State): void;
      removeTransition(symbol: string): boolean;
      getNextState(symbol: string): State | undefined;
      hasTransition(symbol: string): boolean;
      computeStateSignature(classes: Map<number, Set<State>>): string;
      isEquivalentTo(other: State, alphabet: Set<string>): boolean;
      setEquivalenceClass(classId: number): void;
      clone(): State;
    }
  
    export class StateMachine {
      constructor(initialStateId?: string);
      
      addState(id: string, value?: any): State;
      getState(id: string): State | undefined;
      setInitialState(stateId: string): void;
      addTransition(fromId: string, symbol: string, toId: string): void;
      transition(symbol: string): State;
      reset(): void;
      processSequence(symbols: string[]): State;
      accepts(symbols: string[]): boolean;
      getReachableStates(): Set<State>;
      removeUnreachableStates(): number;
    }
  
    export interface MinimizationOptions {
      removeUnreachableStates?: boolean;
      optimizeMemory?: boolean;
      collectMetrics?: boolean;
    }
  
    export interface MinimizationMetrics {
      originalStateCount: number;
      minimizedStateCount: number;
      stateReductionRatio: number;
      originalTransitionCount: number;
      minimizedTransitionCount: number;
      transitionReductionRatio: number;
      equivalenceClassCount: number;
      minimizationTimeMs: number;
    }
  
    export class StateMachineMinimizer {
      static minimize(
        stateMachine: StateMachine, 
        options?: MinimizationOptions
      ): { minimized: StateMachine; metrics?: MinimizationMetrics };
    }
  }