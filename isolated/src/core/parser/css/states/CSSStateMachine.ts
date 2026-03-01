import { CSSToken, CSSTokenType } from '../tokenizer/CSSTokenType.js';
import { CSSNode, CSSNodeType } from '../../../ast/node/CSSNode.js';
import { CSSAst } from '../../../ast/a/CSSAst.js';
import { CSSParserError, CSSParserErrorType } from '../error/CSSParserError.js';

/**
 * State type in the state machine
 */
export interface State {
  /** State name */
  name: string;
  /** Whether this is an accepting state */
  isAccepting: boolean;
  /** Map of transitions to other states */
  transitions: Map<string, State>;
  /** Equivalence class for state minimization */
  equivalenceClass: number | null;
  /** Method to process a token in this state */
  processToken: (token: CSSToken, context: ParsingContext) => void;
}

/**
 * Context for parsing that holds current state
 */
export interface ParsingContext {
  /** Current root node */
  root: CSSNode;
  /** Stack of active nodes */
  nodeStack: CSSNode[];
  /** Current node being processed */
  currentNode: CSSNode | null;
  /** Current rule node */
  currentRule: CSSNode | null;
  /** Current at-rule node */
  currentAtRule: CSSNode | null;
  /** Current declaration node */
  currentDeclaration: CSSNode | null;
  /** Whether we're expecting a value */
  expectingValue: boolean;
  /** Current selector text */
  currentSelector: string;
  /** Current property name */
  currentProperty: string;
  /** Errors encountered during parsing */
  errors: CSSParserError[];
  /** Whether we're in a block */
  inBlock: boolean;
  /** Block nesting level */
  blockLevel: number;
}

import { CSSStateUtils } from '../utils/CSSStateUtils';

/**
 * Represents a state in the CSS state machine
 */
export interface CSSStateData {
  id: string;
  isAccepting: boolean;
  transitions: Map<string, string>;
  isInitial?: boolean;
}

/**
 * CSS State Machine implementation
 * Implements automaton-based parsing with state minimization based on
 * Nnamdi Okpala's automaton state minimization technology
 */
export class CSSStateMachine {
  private states: Map<string, CSSStateData>;
  private currentState: string;
  private stateHistory: string[];
  private minimized: boolean;
  private optimizationMetrics: {
    originalStateCount: number;
    minimizedStateCount: number;
    optimizationRatio: number;
  };

  /**
   * Create a new CSS state machine
   */
  constructor() {
    this.states = new Map();
    this.stateHistory = [];
    this.minimized = false;
    this.optimizationMetrics = {
      originalStateCount: 0,
      minimizedStateCount: 0,
      optimizationRatio: 1
    };
    
    // Initialize states
    this.initializeStates();
    
    // Set initial state
    this.currentState = 'INITIAL';
    this.stateHistory.push(this.currentState);
  }

  /**
   * Initialize the state machine with default states
   */
  private initializeStates(): void {
    // Define states
    this.addState('INITIAL', false, true);
    this.addState('SELECTOR', false);
    this.addState('BLOCK_START', false);
    this.addState('PROPERTY', false);
    this.addState('COLON', false);
    this.addState('VALUE', false);
    this.addState('SEMICOLON', false);
    this.addState('BLOCK_END', false);
    this.addState('AT_RULE', false);
    this.addState('AT_RULE_BLOCK', false);
    this.addState('COMMENT', false);
    this.addState('EOF', true);
    
    // Define transitions
    this.addTransition('INITIAL', 'SELECTOR', 'SELECTOR');
    this.addTransition('INITIAL', 'AT_KEYWORD', 'AT_RULE');
    this.addTransition('INITIAL', 'EOF', 'EOF');
    
    this.addTransition('SELECTOR', 'BLOCK_START', 'BLOCK_START');
    
    this.addTransition('BLOCK_START', 'PROPERTY', 'PROPERTY');
    this.addTransition('BLOCK_START', 'BLOCK_END', 'BLOCK_END');
    
    this.addTransition('PROPERTY', 'COLON', 'COLON');
    
    this.addTransition('COLON', 'VALUE', 'VALUE');
    
    this.addTransition('VALUE', 'SEMICOLON', 'SEMICOLON');
    this.addTransition('VALUE', 'BLOCK_END', 'BLOCK_END');
    
    this.addTransition('SEMICOLON', 'PROPERTY', 'PROPERTY');
    this.addTransition('SEMICOLON', 'BLOCK_END', 'BLOCK_END');
    
    this.addTransition('BLOCK_END', 'SELECTOR', 'SELECTOR');
    this.addTransition('BLOCK_END', 'AT_KEYWORD', 'AT_RULE');
    this.addTransition('BLOCK_END', 'EOF', 'EOF');
    
    this.addTransition('AT_RULE', 'BLOCK_START', 'AT_RULE_BLOCK');
    this.addTransition('AT_RULE', 'SEMICOLON', 'INITIAL');
    
    this.addTransition('AT_RULE_BLOCK', 'BLOCK_END', 'BLOCK_END');
  }

  /**
   * Add a state to the state machine
   * 
   * @param id State identifier
   * @param isAccepting Whether this is an accepting state
   * @param isInitial Whether this is the initial state
   */
  public addState(id: string, isAccepting: boolean, isInitial: boolean = false): void {
    this.states.set(id, {
      id,
      isAccepting,
      isInitial,
      transitions: new Map()
    });
  }

  /**
   * Add a transition between states
   * 
   * @param fromId Source state ID
   * @param symbol Transition symbol
   * @param toId Target state ID
   */
  public addTransition(fromId: string, symbol: string, toId: string): void {
    const fromState = this.states.get(fromId);
    
    if (!fromState) {
      throw new Error(`State "${fromId}" not found`);
    }
    
    if (!this.states.has(toId)) {
      throw new Error(`Target state "${toId}" not found`);
    }
    
    fromState.transitions.set(symbol, toId);
  }

  /**
   * Get the current state ID
   * 
   * @returns Current state ID
   */
  public getCurrentState(): string {
    return this.currentState;
  }

  /**
   * Get the state history
   * 
   * @returns Array of state IDs in traversal order
   */
  public getStateHistory(): string[] {
    return [...this.stateHistory];
  }

  /**
   * Check if transition is valid from current state
   * 
   * @param symbol Transition symbol
   * @returns Whether transition is valid
   */
  public canTransition(symbol: string): boolean {
    const currentStateData = this.states.get(this.currentState);
    
    if (!currentStateData) {
      return false;
    }
    
    return currentStateData.transitions.has(symbol);
  }

  /**
   * Transition to a new state
   * 
   * @param symbol Transition symbol
   * @returns Whether transition was successful
   */
  public transition(symbol: string): boolean {
    const currentStateData = this.states.get(this.currentState);
    
    if (!currentStateData) {
      return false;
    }
    
    const nextStateId = currentStateData.transitions.get(symbol);
    
    if (!nextStateId) {
      return false;
    }
    
    this.currentState = nextStateId;
    this.stateHistory.push(this.currentState);
    
    return true;
  }

  /**
   * Reset state machine to initial state
   */
  public reset(): void {
    // Find initial state
    for (const [id, stateData] of this.states.entries()) {
      if (stateData.isInitial) {
        this.currentState = id;
        this.stateHistory = [id];
        return;
      }
    }
    
    // Default to INITIAL if no state is marked as initial
    this.currentState = 'INITIAL';
    this.stateHistory = ['INITIAL'];
  }

  /**
   * Minimize the state machine to reduce redundant states
   * Using Nnamdi Okpala's automaton state minimization algorithm
   */
  public minimizeStates(): void {
    if (this.minimized) {
      return;
    }
    
    // Convert states to format expected by CSSStateUtils
    const utilStates = Array.from(this.states.entries()).map(([id, stateData], index) => ({
      id: index,
      originalId: id,
      isAccepting: stateData.isAccepting,
      transitions: new Map(
        Array.from(stateData.transitions.entries()).map(([symbol, targetId]) => {
          // Find index of target state
          const targetIndex = Array.from(this.states.entries())
            .findIndex(([stateId]) => stateId === targetId);
          return [symbol, targetIndex];
        })
      )
    }));
    
    // Store original count
    this.optimizationMetrics.originalStateCount = utilStates.length;
    
    // Apply minimization
    const minimizationResult = CSSStateUtils.minimizeStates(utilStates);
    
    // Store metrics
    this.optimizationMetrics.minimizedStateCount = minimizationResult.minimizedStateCount;
    this.optimizationMetrics.optimizationRatio = minimizationResult.optimizationRatio;
    
    // Update minimized flag
    this.minimized = true;
  }

  /**
   * Get optimization metrics from state minimization
   * 
   * @returns Optimization metrics
   */
  public getOptimizationMetrics(): typeof this.optimizationMetrics {
    return { ...this.optimizationMetrics };
  }

  /**
   * Get all states in the state machine
   * 
   * @returns Map of states
   */
  public getStates(): Map<string, CSSStateData> {
    return new Map(this.states);
  }

  /**
   * Check if machine is in an accepting state
   * 
   * @returns Whether current state is accepting
   */
  public isInAcceptingState(): boolean {
    const currentStateData = this.states.get(this.currentState);
    return currentStateData?.isAccepting || false;
  }
}