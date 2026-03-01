import { CSSNode, CSSNodeType } from "@/core/ast/node/CSSNode";
import { CSSAst } from "@/core/ast/optimizer/CSSAst";
import { CSSParserError, CSSParserErrorTracker, CSSParserErrorType } from "../errors/CSSParserError";
import { TokenizerOptions, CSSTokenizer } from "../tokenizer/CSSTokenizer";
import { CSSToken, CSSTokenType } from "../tokenizer/CSSTokenType";


/**
 * Parser options for controlling the parsing behavior
 */
export interface CSSParserOptions {
  /** Whether to apply state minimization optimization */
  stateMinimization: boolean;
  /** Whether to apply AST optimization */
  astOptimization: boolean;
  /** Whether to recover from parsing errors */
  errorRecovery: boolean;
  /** Whether to parse nested at-rules */
  parseNestedRules: boolean;
  /** Custom tokenizer options */
  tokenizer: Partial<TokenizerOptions>;
}

/**
 * Result of the parsing process
 */
export interface CSSParserResult {
  /** The AST representing the parsed CSS */
  ast: CSSAst;
  /** Errors encountered during parsing */
  errors: CSSParserError[];
  /** Optimization metrics if optimization is enabled */
  optimizationMetrics?: {
    /** Original state count before minimization */
    originalStateCount: number;
    /** Minimized state count after optimization */
    minimizedStateCount: number;
    /** Ratio of minimized states to original states */
    stateReductionRatio: number;
    /** Memory usage before optimization in bytes */
    originalMemoryUsage: number;
    /** Memory usage after optimization in bytes */
    optimizedMemoryUsage: number;
    /** Ratio of optimized memory to original memory */
    memoryReductionRatio: number;
  };
}

/**
 * State representation for the parser state machine
 */
export interface ParserState {
  /** State type identifier */
  type: string;
  /** Whether this is an accepting state */
  isAccepting: boolean;
  /** Transitions to other states */
  transitions: Map<string, ParserState>;
  /** State metadata for optimization */
  metadata: {
    /** Equivalence class for minimization */
    equivalenceClass: number | null;
    /** Computed signature for equivalence determination */
    stateSignature: string | null;
    /** Whether this state has been minimized */
    isMinimized: boolean;
  };
}

/**
 * CSS Parser with automaton-based implementation and state minimization
 */
export class CSSParser {
  /** Tokenizer for breaking input into tokens */
  public tokenizer: CSSTokenizer;
  /** The input CSS to parse */
  public input: string;
  /** Current position in the token stream */
  public position: number;
  /** Current token being processed */
  public currentToken: CSSToken | null;
  /** Tokens from the tokenization phase */
  public tokens: CSSToken[];
  /** Error tracker for managing parsing errors */
  public errorTracker: CSSParserErrorTracker;
  /** Parser options */
  public options: CSSParserOptions;
  /** Parser states for the automaton */
  public states: Set<ParserState>;
  /** Current state in the automaton */
  public currentState: ParserState;
  /** Equivalence classes for state minimization */
  public equivalenceClasses: Map<number, Set<ParserState>>;
  /** Current rule node being constructed */
  public currentRule: CSSNode | null;
  /** Current declaration node being constructed */
  public currentDeclaration: CSSNode | null;
  /** Stack of at-rule nodes */
  public atRuleStack: CSSNode[];
  /** Stack of selectors for the current rule */
  public selectorStack: string[];

  /**
   * Create a new CSS Parser
   * 
   * @param input CSS text to parse
   * @param options Parser configuration options
   */
  constructor(input: string, options: Partial<CSSParserOptions> = {}) {
    this.input = input;
    this.position = 0;
    this.currentToken = null;
    this.tokens = [];
    this.errorTracker = new CSSParserErrorTracker();
    this.states = new Set();
    this.equivalenceClasses = new Map();
    this.currentRule = null;
    this.currentDeclaration = null;
    this.atRuleStack = [];
    this.selectorStack = [];
    
    // Default options with overrides
    this.options = {
      stateMinimization: true,
      astOptimization: true,
      errorRecovery: true,
      parseNestedRules: true,
      tokenizer: {
        preserveWhitespace: false,
        recognizeColors: true,
        recognizeFunctions: true,
        advancedMode: true
      },
      ...options
    };
    
    // Initialize tokenizer
    this.tokenizer = new CSSTokenizer(input, this.options.tokenizer);
    
    // Initialize parser states
    this.initializeStates();
    this.currentState = this.getInitialState();
  }

  /**
   * Initialize the parser state machine
   */
  public initializeStates(): void {
    // Create states for the parser automaton
    const initialState = this.createState('Initial', false);
    const ruleStartState = this.createState('RuleStart', false);
    const selectorState = this.createState('Selector', false);
    const blockStartState = this.createState('BlockStart', false);
    const propertyState = this.createState('Property', false);
    const colonState = this.createState('Colon', false);
    const valueState = this.createState('Value', false);
    const semicolonState = this.createState('Semicolon', false);
    const blockEndState = this.createState('BlockEnd', false);
    const atRuleState = this.createState('AtRule', false);
    const finalState = this.createState('Final', true);
    
    // Define transitions between states
    this.addTransition(initialState, 'selector', selectorState);
    this.addTransition(initialState, 'at-keyword', atRuleState);
    this.addTransition(initialState, 'eof', finalState);
    
    this.addTransition(selectorState, 'selector', selectorState);
    this.addTransition(selectorState, 'start-block', blockStartState);
    
    this.addTransition(blockStartState, 'property', propertyState);
    this.addTransition(blockStartState, 'end-block', blockEndState);
    
    this.addTransition(propertyState, 'colon', colonState);
    
    this.addTransition(colonState, 'value', valueState);
    
    this.addTransition(valueState, 'value', valueState);
    this.addTransition(valueState, 'semicolon', semicolonState);
    this.addTransition(valueState, 'end-block', blockEndState);
    
    this.addTransition(semicolonState, 'property', propertyState);
    this.addTransition(semicolonState, 'end-block', blockEndState);
    
    this.addTransition(blockEndState, 'selector', selectorState);
    this.addTransition(blockEndState, 'at-keyword', atRuleState);
    this.addTransition(blockEndState, 'eof', finalState);
    
    this.addTransition(atRuleState, 'start-block', blockStartState);
    this.addTransition(atRuleState, 'semicolon', initialState);
  }

  /**
   * Create a parser state
   * 
   * @param type State type identifier
   * @param isAccepting Whether this is an accepting state
   * @returns The created state
   */
  public createState(type: string, isAccepting: boolean): ParserState {
    const state: ParserState = {
      type,
      isAccepting,
      transitions: new Map(),
      metadata: {
        equivalenceClass: null,
        stateSignature: null,
        isMinimized: false
      }
    };
    
    this.states.add(state);
    return state;
  }

  /**
   * Add a transition between states
   * 
   * @param from Source state
   * @param symbol Transition symbol
   * @param to Target state
   */
  public addTransition(from: ParserState, symbol: string, to: ParserState): void {
    from.transitions.set(symbol, to);
  }

  /**
   * Get the initial state for the parser
   * @returns The initial state
   */
  public getInitialState(): ParserState {
    for (const state of this.states) {
      if (state.type === 'Initial') {
        return state;
      }
    }
    
    throw new Error('Initial state not found');
  }

  /**
   * Parse the input CSS
   * @returns The parsing result
   */
  public parse(): CSSParserResult {
    // Tokenize the input
    const tokenizeResult = this.tokenizer.tokenize();
    this.tokens = tokenizeResult.tokens;
    
    // Add tokenizer errors to parser errors
    tokenizeResult.errors.forEach(error => {
      this.errorTracker.addError(
        new CSSParserError({
          type: CSSParserErrorType.SYNTAX_ERROR,
          message: error.message,
          line: error.line,
          column: error.column,
          context: this.input.substring(error.start, error.end)
        })
      );
    });
    
    // Create AST
    const ast = new CSSAst();
    const rootNode = new CSSNode(CSSNodeType.Stylesheet);
    
    // Apply state minimization if enabled
    if (this.options.stateMinimization) {
      this.minimizeStates();
    }
    
    // Process tokens to build AST
    this.processTokens(rootNode);
    
    // Generate metrics
    const metrics = this.options.stateMinimization ? {
      originalStateCount: this.states.size,
      minimizedStateCount: this.equivalenceClasses.size,
      stateReductionRatio: this.equivalenceClasses.size / this.states.size,
      originalMemoryUsage: this.estimateMemoryUsage(rootNode),
      optimizedMemoryUsage: 0, // Will be updated after optimization
      memoryReductionRatio: 0  // Will be updated after optimization
    } : undefined;
    
    // Apply AST optimization if enabled
    let optimizedRoot: CSSNode;
    if (this.options.astOptimization) {
      const optimizeResult = ast.optimize(rootNode);
      optimizedRoot = optimizeResult.root;
      
      // Update metrics if available
      if (metrics) {
        metrics.optimizedMemoryUsage = this.estimateMemoryUsage(optimizedRoot);
        metrics.memoryReductionRatio = metrics.optimizedMemoryUsage / metrics.originalMemoryUsage;
      }
    } else {
      optimizedRoot = rootNode;
    }
    
    return {
      ast: { root: optimizedRoot, metadata: { optimizationMetrics: ast.computeOptimizationMetrics(rootNode, optimizedRoot) } },
      errors: this.errorTracker.getErrors(),
      optimizationMetrics: metrics
    };
  }

  /**
   * Minimize states using automaton state minimization
   */
  public minimizeStates(): void {
    // Separate accepting and non-accepting states
    const accepting = new Set<ParserState>();
    const nonAccepting = new Set<ParserState>();
    
    for (const state of this.states) {
      if (state.isAccepting) {
        accepting.add(state);
      } else {
        nonAccepting.add(state);
      }
    }
    
    // Initial partition
    let partition = [accepting, nonAccepting].filter(set => set.size > 0);
    let newPartition: Set<ParserState>[] = [];
    
    // Iteratively refine partitions until no further refinement is possible
    do {
      partition = newPartition.length > 0 ? newPartition : partition;
      newPartition = [];
      
      for (const block of partition) {
        const splits = this.splitPartition(block, partition);
        newPartition.push(...splits);
      }
    } while (partition.length !== newPartition.length);
    
    // Assign equivalence classes
    partition.forEach((block, index) => {
      this.equivalenceClasses.set(index, block);
      for (const state of block) {
        state.metadata.equivalenceClass = index;
      }
    });
  }

  /**
   * Split a partition based on transition behavior
   * 
   * @param partition Set of states to split
   * @param allPartitions All current partitions
   * @returns Array of split partitions
   */
  public splitPartition(
    partition: Set<ParserState>,
    allPartitions: Set<ParserState>[]
  ): Set<ParserState>[] {
    if (partition.size <= 1) return [partition];
    
    const splits = new Map<string, Set<ParserState>>();
    
    for (const state of partition) {
      const signature = this.computeTransitionSignature(state, allPartitions);
      
      if (!splits.has(signature)) {
        splits.set(signature, new Set());
      }
      
      splits.get(signature)!.add(state);
    }
    
    return Array.from(splits.values());
  }

  /**
   * Compute a signature for state's transitions
   * 
   * @param state State to compute signature for
   * @param partitions Current partitions
   * @returns Signature string
   */
  public computeTransitionSignature(
    state: ParserState,
    partitions: Set<ParserState>[]
  ): string {
    const transitionSignatures: string[] = [];
    
    for (const [symbol, targetState] of state.transitions.entries()) {
      // Find which partition the target state belongs to
      const partitionIndex = partitions.findIndex(partition => 
        partition.has(targetState)
      );
      
      transitionSignatures.push(`${symbol}:${partitionIndex}`);
    }
    
    // Sort for consistent signatures regardless of map iteration order
    return transitionSignatures.sort().join('|');
  }

  /**
   * Process tokens to build the AST
   * 
   * @param rootNode Root node of the AST
   */
  public processTokens(rootNode: CSSNode): void {
    // Process all tokens to build the AST
    let i = 0;
    while (i < this.tokens.length) {
      try {
        this.currentToken = this.tokens[i] ?? null;
        
        // Skip whitespace and comments if not preserving
        if (!this.options.tokenizer.preserveWhitespace && 
            this.currentToken && 
            (this.currentToken.type === CSSTokenType.Whitespace || 
             this.currentToken.type === CSSTokenType.Comment)) {
          i++;
          continue;
        }
        
        // Get the input symbol for the state machine
        const symbol = this.getSymbolForToken(this.currentToken);
        
        // Transition to the next state
        const nextState = this.currentState.transitions.get(symbol);
        
        if (nextState) {
          // Valid transition
          this.currentState = nextState;
          this.processTokenForState(rootNode, this.currentToken, this.currentState);
        } else {
          // No valid transition - handle error
          this.handleParseError(this.currentToken, symbol);
          
          if (!this.options.errorRecovery) {
            break;
          }
        }
        
        i++;
      } catch (error) {
        // Unexpected error during processing
        this.errorTracker.addError(
          new CSSParserError({
            type: CSSParserErrorType.SYNTAX_ERROR,
            message: error instanceof Error ? error.message : String(error),
            token: this.currentToken || undefined
          })
        );
        
        if (!this.options.errorRecovery) {
          break;
        }
        
        // Skip to next token
        i++;
      }
    }
  }

  /**
   * Get the input symbol for a token
   * 
   * @param token Token to get symbol for
   * @returns Symbol string for the state machine
   */
  public getSymbolForToken(token: CSSToken): string {
    switch (token.type) {
      case CSSTokenType.Selector:
      case CSSTokenType.SelectorClass:
      case CSSTokenType.SelectorId:
      case CSSTokenType.SelectorElement:
      case CSSTokenType.PseudoClass:
      case CSSTokenType.PseudoElement:
      case CSSTokenType.Combinator:
      case CSSTokenType.ClassSelector:
      case CSSTokenType.IdSelector:
      case CSSTokenType.AttributeSelector:
        return 'selector';
        
      case CSSTokenType.Property:
        return 'property';
        
      case CSSTokenType.Value:
      case CSSTokenType.Unit:
      case CSSTokenType.Number:
      case CSSTokenType.Color:
      case CSSTokenType.URL:
      case CSSTokenType.String:
      case CSSTokenType.Function:
      case CSSTokenType.ImportantFlag:
        return 'value';
        
      case CSSTokenType.StartBlock:
        return 'start-block';
        
      case CSSTokenType.EndBlock:
        return 'end-block';
        
      case CSSTokenType.Semicolon:
        return 'semicolon';
        
      case CSSTokenType.Colon:
        return 'colon';
        
      case CSSTokenType.AtKeyword:
        return 'at-keyword';
        
      case CSSTokenType.EOF:
        return 'eof';
        
      default:
        return token.type.toLowerCase();
    }
  }

  /**
   * Process a token based on the current state
   * 
   * @param rootNode Root node of the AST
   * @param token Current token
   * @param state Current state
   */
  public processTokenForState(rootNode: CSSNode, token: CSSToken, state: ParserState): void {
    switch (state.type) {
      case 'Selector':
        if (!this.currentRule) {
          this.currentRule = new CSSNode('rule');
          rootNode.addChild(this.currentRule);
        }
        
        // Add selector to current rule
        this.selectorStack.push(token.value);
        break;
        
      case 'BlockStart':
        if (this.selectorStack.length > 0) {
          // Store the selector as a child node
          const selectorNode = new CSSNode('selector', this.selectorStack.join(' '));
          this.currentRule!.addChild(selectorNode);
          this.selectorStack = [];
        }
        break;
        
      case 'Property':
        this.currentDeclaration = new CSSNode('declaration');
        this.currentDeclaration.addChild(new CSSNode('property', token.value));
        
        if (this.currentRule) {
          this.currentRule.addChild(this.currentDeclaration);
        }
        break;
        
      case 'Value':
        if (this.currentDeclaration) {
          const valueNode = new CSSNode('value', token.value);
          this.currentDeclaration.addChild(valueNode);
        }
        break;
        
      case 'BlockEnd':
        this.currentRule = null;
        this.currentDeclaration = null;
        break;
        
      case 'AtRule':
        const atRule = new CSSNode(CSSNodeType.AtRule, token.value);
        
        if (this.options.parseNestedRules) {
          this.atRuleStack.push(atRule);
        }
        
        rootNode.addChild(atRule);
        break;
    }
  }

  /**
   * Handle a parsing error
   * 
   * @param token Token that caused the error
   * @param symbol Symbol that wasn't handled
   */
  public handleParseError(token: CSSToken, symbol: string): void {
    let errorType: CSSParserErrorType;
    let message: string;
    
    switch (this.currentState.type) {
      case 'Selector':
        errorType = CSSParserErrorType.INVALID_SELECTOR;
        message = `Invalid selector syntax: unexpected ${token.type}`;
        break;
        
      case 'Property':
        errorType = CSSParserErrorType.INVALID_PROPERTY;
        message = `Invalid property syntax: expected colon, got ${token.type}`;
        break;
        
      case 'Value':
        errorType = CSSParserErrorType.INVALID_VALUE;
        message = `Invalid value syntax: unexpected ${token.type}`;
        break;
        
      case 'BlockStart':
      case 'BlockEnd':
        errorType = CSSParserErrorType.UNCLOSED_BLOCK;
        message = `Unbalanced block structure at ${token.type}`;
        break;
        
      default:
        errorType = CSSParserErrorType.UNEXPECTED_TOKEN;
        message = `Unexpected token ${token.type} in state ${this.currentState.type}`;
    }
    
    this.errorTracker.addError(
      new CSSParserError({
        type: errorType,
        message,
        token
      })
    );
    
    // Attempt error recovery if enabled
    if (this.options.errorRecovery) {
      const recoveryResult = CSSParserError.recoverFromError(
        this.errorTracker.getErrors()[this.errorTracker.getErrors().length - 1],
        { state: this.currentState, position: this.position }
      );
      
      if (recoveryResult.recovered && recoveryResult.newState) {
        // Apply recovery strategy
        if (recoveryResult.newState.skipToNextRule) {
          this.skipToNextRule();
        } else if (recoveryResult.newState.forceCloseBlock) {
          this.forceCloseBlock();
        }
      }
    }
  }

  /**
   * Skip to the next rule for error recovery
   */
  public skipToNextRule(): void {
    this.currentRule = null;
    this.currentDeclaration = null;
    this.selectorStack = [];
    
    // Reset to initial state
    this.currentState = this.getInitialState();
  }

  /**
   * Force close the current block for error recovery
   */
  public forceCloseBlock(): void {
    this.currentDeclaration = null;
    
    // Transition to block end state
    for (const state of this.states) {
      if (state.type === 'BlockEnd') {
        this.currentState = state;
        break;
      }
    }
  }

  /**
   * Estimate memory usage of an AST node
   * 
   * @param node Node to estimate memory for
   * @returns Estimated memory usage in bytes
   */
  public estimateMemoryUsage(node: CSSNode): number {
    let bytes = 0;
    
    // Base object overhead
    bytes += 40;
    
    // Type and value strings
    bytes += (node.type?.length ?? 0) * 2;
    bytes += (node.value?.length ?? 0) * 2;
    
    // Metadata
    bytes += JSON.stringify(node.metadata).length * 2;
    
    // Children (recursive)
    for (const child of node.children) {
      bytes += this.estimateMemoryUsage(child);
    }
    
    return bytes;
  }
}