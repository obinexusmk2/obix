
/**
 * CSS State Machine implementation
 * Implements automaton-based parsing with state minimization
 */
export class CSSStateMachine {
    /** Initial state */
    public initialState: State;
    /** Map of all states */
    public states: Map<string, State>;
    /** Whether the state machine has been minimized */
    public isMinimized: boolean;
    /** Map of state equivalence classes */
    public equivalenceClasses: Map<number, Set<State>>;
    /** Performance metrics for optimization */
    public metrics: {
      originalStateCount: number;
      minimizedStateCount: number;
      optimizationRatio: number;
    };
  
    /**
     * Create a new CSS state machine
     */
    constructor() {
      this.states = new Map();
      this.isMinimized = false;
      this.equivalenceClasses = new Map();
      this.metrics = {
        originalStateCount: 0,
        minimizedStateCount: 0,
        optimizationRatio: 1
      };
      
      // Define all states
      this.initialState = this.createStates();
      
      // Initialize transitions between states
      this.initializeTransitions();
    }
  
    /**
     * Create all states in the state machine
     * 
     * @returns Initial state
     */
    public createStates(): State {
      // Create initial state - the root state for parsing a stylesheet
      const initialState: State = {
        name: 'initial',
        isAccepting: false,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          if (token.type === CSSTokenType.AtKeyword) {
            // Create at-rule node
            const atRule = new CSSNode(CSSNodeType.AtRule, null, {
              name: (token as any).keyword || token.value.substring(1),
              prelude: ''
            });
            context.root.addChild(atRule);
            context.currentAtRule = atRule;
            context.nodeStack.push(atRule);
          } else if (
            token.type === CSSTokenType.Selector || 
            token.type === CSSTokenType.ClassSelector ||
            token.type === CSSTokenType.IdSelector ||
            token.type === CSSTokenType.ElementSelector
          ) {
            // Start building selector
            context.currentSelector = token.value;
          }
        }
      };
      this.states.set(initialState.name, initialState);
  
      // State for at-rule prelude (e.g., after @media but before block)
      const atRulePreludeState: State = {
        name: 'atRulePrelude',
        isAccepting: false,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          if (token.type === CSSTokenType.StartBlock) {
            // Start block for at-rule
            context.inBlock = true;
            context.blockLevel++;
          } else if (token.type === CSSTokenType.Semicolon) {
            // End at-rule without block
            const atRule = context.currentAtRule;
            if (atRule && context.nodeStack.length > 0) {
              context.nodeStack.pop();
            }
            context.currentAtRule = null;
          } else {
            // Add to at-rule prelude
            if (context.currentAtRule) {
              context.currentAtRule.prelude = (context.currentAtRule.prelude || '') + 
                (context.currentAtRule.prelude ? ' ' : '') + token.value;
            }
          }
        }
      };
      this.states.set(atRulePreludeState.name, atRulePreludeState);
  
      // State for at-rule block
      const atRuleBlockState: State = {
        name: 'atRuleBlock',
        isAccepting: false,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          if (token.type === CSSTokenType.EndBlock) {
            // End at-rule block
            context.blockLevel--;
            if (context.blockLevel === 0) {
              context.inBlock = false;
            }
            if (context.nodeStack.length > 0) {
              context.nodeStack.pop();
            }
            context.currentAtRule = null;
          } else if (token.type === CSSTokenType.AtKeyword) {
            // Nested at-rule
            const nestedAtRule = new CSSNode(CSSNodeType.AtRule, null, {
              name: (token as any).keyword || token.value.substring(1),
              prelude: ''
            });
            
            if (context.nodeStack.length > 0) {
              context.nodeStack[context.nodeStack.length - 1].addChild(nestedAtRule);
            } else {
              context.root.addChild(nestedAtRule);
            }
            
            context.currentAtRule = nestedAtRule;
            context.nodeStack.push(nestedAtRule);
          } else if (
            token.type === CSSTokenType.Selector || 
            token.type === CSSTokenType.ClassSelector ||
            token.type === CSSTokenType.IdSelector ||
            token.type === CSSTokenType.ElementSelector
          ) {
            // Rule within at-rule
            context.currentSelector = token.value;
          }
        }
      };
      this.states.set(atRuleBlockState.name, atRuleBlockState);
  
      // State for selector
      const selectorState: State = {
        name: 'selector',
        isAccepting: false,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          if (token.type === CSSTokenType.StartBlock) {
            // End selector, start rule block
            const rule = new CSSNode(CSSNodeType.Rule, null, { 
              selector: context.currentSelector.trim() 
            });
            
            if (context.nodeStack.length > 0 && context.nodeStack[context.nodeStack.length - 1].type === CSSNodeType.AtRule) {
              // Add rule to parent at-rule
              context.nodeStack[context.nodeStack.length - 1].addChild(rule);
            } else {
              // Add rule to root
              context.root.addChild(rule);
            }
            
            context.currentRule = rule;
            context.nodeStack.push(rule);
            context.inBlock = true;
            context.blockLevel++;
          } else {
            // Accumulate selector
            context.currentSelector += ' ' + token.value;
          }
        }
      };
      this.states.set(selectorState.name, selectorState);
  
      // State for rule block
      const ruleBlockState: State = {
        name: 'ruleBlock',
        isAccepting: false,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          if (token.type === CSSTokenType.EndBlock) {
            // End rule block
            context.blockLevel--;
            if (context.blockLevel === 0) {
              context.inBlock = false;
            }
            if (context.nodeStack.length > 0) {
              context.nodeStack.pop();
            }
            context.currentRule = null;
          } else if (token.type === CSSTokenType.Property) {
            // Start declaration
            context.currentProperty = token.value;
            context.currentDeclaration = new CSSNode(CSSNodeType.Declaration, null, { 
              important: false 
            });
            const propertyNode = new CSSNode(CSSNodeType.Property, context.currentProperty);
            context.currentDeclaration.addChild(propertyNode);
            context.expectingValue = false;
          } else if (token.type === CSSTokenType.Colon && context.currentDeclaration) {
            // Property-value separator
            context.expectingValue = true;
          } else if (context.expectingValue && (
            token.type === CSSTokenType.Value ||
            token.type === CSSTokenType.Number ||
            token.type === CSSTokenType.Color ||
            token.type === CSSTokenType.String ||
            token.type === CSSTokenType.URL
          )) {
            // Add value to declaration
            const valueNode = new CSSNode(CSSNodeType.Value, token.value);
            context.currentDeclaration!.addChild(valueNode);
          } else if (token.type === CSSTokenType.Function) {
            // Start function value
            const functionNode = new CSSNode(CSSNodeType.Function, token.value);
            if (context.currentDeclaration) {
              context.currentDeclaration.addChild(functionNode);
              context.nodeStack.push(functionNode);
            }
          } else if (token.type === CSSTokenType.ImportantFlag && context.currentDeclaration) {
            // Mark as important
            context.currentDeclaration.important = true;
          } else if (token.type === CSSTokenType.Semicolon) {
            // End declaration
            if (context.currentDeclaration) {
              if (context.nodeStack.length > 0 && 
                  context.nodeStack[context.nodeStack.length - 1].type === CSSNodeType.Rule) {
                context.nodeStack[context.nodeStack.length - 1].addChild(context.currentDeclaration);
              } else if (context.currentRule) {
                context.currentRule.addChild(context.currentDeclaration);
              }
              context.currentDeclaration = null;
              context.expectingValue = false;
            }
          }
        }
      };
      this.states.set(ruleBlockState.name, ruleBlockState);
  
      // State for function arguments
      const functionArgsState: State = {
        name: 'functionArgs',
        isAccepting: false,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          if (token.type === CSSTokenType.CloseParen) {
            // End function
            if (context.nodeStack.length > 0) {
              const lastNode = context.nodeStack[context.nodeStack.length - 1];
              if (lastNode.type === CSSNodeType.Function) {
                context.nodeStack.pop();
              }
            }
          } else if (token.type === CSSTokenType.Function) {
            // Nested function
            const functionNode = new CSSNode(CSSNodeType.Function, token.value);
            if (context.nodeStack.length > 0) {
              context.nodeStack[context.nodeStack.length - 1].addChild(functionNode);
              context.nodeStack.push(functionNode);
            }
          } else if (
            token.type === CSSTokenType.Value ||
            token.type === CSSTokenType.Number ||
            token.type === CSSTokenType.Color ||
            token.type === CSSTokenType.String ||
            token.type === CSSTokenType.Unit
          ) {
            // Function argument
            const valueNode = new CSSNode(CSSNodeType.Value, token.value);
            if (context.nodeStack.length > 0) {
              context.nodeStack[context.nodeStack.length - 1].addChild(valueNode);
            }
          }
        }
      };
      this.states.set(functionArgsState.name, functionArgsState);
  
      // State for end of file
      const eofState: State = {
        name: 'eof',
        isAccepting: true,
        transitions: new Map(),
        equivalenceClass: null,
        processToken: (token, context) => {
          // Check for unclosed blocks
          if (context.blockLevel > 0) {
            context.errors.push(new CSSParserError({
              type: CSSParserErrorType.UNCLOSED_BLOCK,
              message: `Unclosed blocks at end of file: ${context.blockLevel}`,
              line: token.position?.line || 0,
              column: token.position.column
            }));
          }
        }
      };
      this.states.set(eofState.name, eofState);
  
      return initialState;
    }
  
    /**
     * Initialize transitions between states
     */
    public initializeTransitions(): void {
      const initialState = this.states.get('initial')!;
      const atRulePreludeState = this.states.get('atRulePrelude')!;
      const atRuleBlockState = this.states.get('atRuleBlock')!;
      const selectorState = this.states.get('selector')!;
      const ruleBlockState = this.states.get('ruleBlock')!;
      const functionArgsState = this.states.get('functionArgs')!;
      const eofState = this.states.get('eof')!;
  
      // Initial state transitions
      initialState.transitions.set('AtKeyword', atRulePreludeState);
      initialState.transitions.set('Selector', selectorState);
      initialState.transitions.set('ClassSelector', selectorState);
      initialState.transitions.set('IdSelector', selectorState);
      initialState.transitions.set('ElementSelector', selectorState);
      initialState.transitions.set('EOF', eofState);
  
      // At-rule prelude transitions
      atRulePreludeState.transitions.set('StartBlock', atRuleBlockState);
      atRulePreludeState.transitions.set('Semicolon', initialState);
      atRulePreludeState.transitions.set('EOF', eofState);
  
      // At-rule block transitions
      atRuleBlockState.transitions.set('EndBlock', initialState);
      atRuleBlockState.transitions.set('AtKeyword', atRulePreludeState);
      atRuleBlockState.transitions.set('Selector', selectorState);
      atRuleBlockState.transitions.set('ClassSelector', selectorState);
      atRuleBlockState.transitions.set('IdSelector', selectorState);
      atRuleBlockState.transitions.set('ElementSelector', selectorState);
      atRuleBlockState.transitions.set('EOF', eofState);
  
      // Selector transitions
      selectorState.transitions.set('StartBlock', ruleBlockState);
      selectorState.transitions.set('EOF', eofState);
  
      // Rule block transitions
      ruleBlockState.transitions.set('EndBlock', initialState);
      ruleBlockState.transitions.set('Property', ruleBlockState);
      ruleBlockState.transitions.set('Function', functionArgsState);
      ruleBlockState.transitions.set('EOF', eofState);
  
      // Function arguments transitions
      functionArgsState.transitions.set('CloseParen', ruleBlockState);
      functionArgsState.transitions.set('Function', functionArgsState);
      functionArgsState.transitions.set('EOF', eofState);
    }
  
    /**
     * Minimize the state machine using equivalence classes
     */
    minimizeStates(): void {
      if (this.isMinimized) return;
  
      // Save original state count
      this.metrics.originalStateCount = this.states.size;
  
      // Step 1: Initial partition by accepting/non-accepting states
      const accepting = new Set<State>();
      const nonAccepting = new Set<State>();
  
      for (const state of this.states.values()) {
        if (state.isAccepting) {
          accepting.add(state);
        } else {
          nonAccepting.add(state);
        }
      }
  
      // Step 2: Refine partitions until no more refinement is possible
      let partition = [accepting, nonAccepting].filter(set => set.size > 0);
      let refined = true;
  
      while (refined) {
        refined = false;
        const newPartition: Set<State>[] = [];
  
        for (const stateSet of partition) {
          // Skip single-state partitions
          if (stateSet.size <= 1) {
            newPartition.push(stateSet);
            continue;
          }
  
          // Group states by transition behavior
          const signatures = new Map<string, Set<State>>();
  
          for (const state of stateSet) {
            const signature = this.computeStateSignature(state, partition);
            if (!signatures.has(signature)) {
              signatures.set(signature, new Set());
            }
            signatures.get(signature)!.add(state);
          }
  
          // If we found more than one signature, we can refine the partition
          if (signatures.size > 1) {
            refined = true;
            for (const subSet of signatures.values()) {
              newPartition.push(subSet);
            }
          } else {
            newPartition.push(stateSet);
          }
        }
  
        partition = newPartition;
      }
  
      // Step 3: Assign equivalence classes
      this.equivalenceClasses.clear();
      partition.forEach((stateSet, index) => {
        this.equivalenceClasses.set(index, stateSet);
        for (const state of stateSet) {
          state.equivalenceClass = index;
        }
      });
  
      // Update metrics
      this.metrics.minimizedStateCount = this.equivalenceClasses.size;
      this.metrics.optimizationRatio = this.metrics.minimizedStateCount / this.metrics.originalStateCount;
      
      this.isMinimized = true;
    }
  
    /**
     * Compute a signature for a state based on its transitions
     * 
     * @param state State to compute signature for
     * @param partition Current partition
     * @returns State signature
     */
    public computeStateSignature(state: State, partition: Set<State>[]): string {
      const components: string[] = [];
  
      // Add transitions to signature
      for (const [symbol, targetState] of state.transitions.entries()) {
        // Find the partition index of the target state
        const targetPartition = partition.findIndex(set => set.has(targetState));
        components.push(`${symbol}:${targetPartition}`);
      }
  
      return components.sort().join('|');
    }
  
    /**
     * Parse tokens into an AST using the state machine
     * 
     * @param tokens Tokens to parse
     * @param errors Array to collect errors
     * @returns Parsed AST
     */
    parseTokens(tokens: CSSToken[], errors: CSSParserError[]): CSSAst {
      // Minimize states if not already minimized
      if (!this.isMinimized) {
        this.minimizeStates();
      }
  
      // Create root node
      const root = new CSSNode(CSSNodeType.Stylesheet);
  
      // Initialize parsing context
      const context: ParsingContext = {
        root,
        nodeStack: [],
        currentNode: null,
        currentRule: null,
        currentAtRule: null,
        currentDeclaration: null,
        expectingValue: false,
        currentSelector: '',
        currentProperty: '',
        errors,
        inBlock: false,
        blockLevel: 0
      };
  
      // Start with initial state
      let currentState = this.initialState;
  
      // Process each token
      for (const token of tokens) {
        try {
          // Skip whitespace tokens unless they contain significant information
          if (token.type === CSSTokenType.Whitespace && token.value.trim().length === 0) {
            continue;
          }
          
          // Process token in current state
          currentState.processToken(token, context);
  
          // Determine next state based on token type
          const transition = currentState.transitions.get(token.type);
          if (transition) {
            currentState = transition;
          }
        } catch (error) {
          // Add error and try to recover
          const parserError = new CSSParserError({
            type: CSSParserErrorType.UNEXPECTED_TOKEN,
            message: `Unexpected token: ${token.value || token.type}`,
            line: token.position?.line || 0,
            column: token.position?.column || 0
          });
          context.errors.push(parserError);
  
          // Simple recovery: try to find a synchronization point
          if (token.type === CSSTokenType.Semicolon || token.type === CSSTokenType.EndBlock) {
            // Reset current declaration context
            context.currentDeclaration = null;
            context.expectingValue = false;
            
            // If ending a block, adjust block level
            if (token.type === CSSTokenType.EndBlock) {
              context.blockLevel = Math.max(0, context.blockLevel - 1);
              if (context.blockLevel === 0) {
                context.inBlock = false;
              }
              
              // Pop from the node stack if possible
              if (context.nodeStack.length > 0) {
                context.nodeStack.pop();
              }
            }
            
            // Try to determine appropriate state
            if (context.blockLevel === 0) {
              currentState = this.initialState;
            } else if (context.nodeStack.length > 0) {
              const lastNode = context.nodeStack[context.nodeStack.length - 1];
              if (lastNode.type === CSSNodeType.Rule) {
                currentState = this.states.get('ruleBlock')!;
              } else if (lastNode.type === CSSNodeType.AtRule) {
                currentState = this.states.get('atRuleBlock')!;
              } else if (lastNode.type === CSSNodeType.Function) {
                currentState = this.states.get('functionArgs')!;
              }
            }
          }
        }
      }
  
      // Create AST with metadata
      const ast = new CSSAst(root);
      ast.metadata.minimizationMetrics = { ...this.metrics };
      
      return ast;
    }
  
    /**
     * Get optimization metrics from state minimization
     * 
     * @returns Optimization metrics
     */
    getMinimizationMetrics(): { 
      originalStateCount: number; 
      minimizedStateCount: number; 
      optimizationRatio: number;
    } {
      return { ...this.metrics };
    }
  
    /**
     * Get the number of equivalence classes
     * 
     * @returns Number of equivalence classes
     */
    getEquivalenceClassCount(): number {
      return this.equivalenceClasses.size;
    }
  
    /**
     * Get all states with their equivalence classes
     * 
     * @returns Map of state names to equivalence classes
     */
    getStateEquivalenceClasses(): Map<string, number | null> {
      const result = new Map<string, number | null>();
      
      for (const [name, state] of this.states) {
        result.set(name, state.equivalenceClass);
      }
      
      return result;
    }
  
    /**
     * Generate a visualization of the state machine for debugging
     * 
     * @returns Simple text visualization of the state machine
     */
    visualize(): string {
      let result = 'CSS State Machine:\n';
      
      // Add states
      result += `\nStates (${this.states.size}):\n`;
      for (const [name, state] of this.states) {
        const equivalenceClass = state.equivalenceClass !== null ? 
          `Class: ${state.equivalenceClass}` : 'No class';
        result += `- ${name} (${state.isAccepting ? 'Accepting' : 'Non-accepting'}, ${equivalenceClass})\n`;
        
        // Add transitions
        result += '  Transitions:\n';
        for (const [symbol, target] of state.transitions) {
          result += `  - ${symbol} → ${target.name}\n`;
        }
      }
      
      // Add equivalence classes
      result += `\nEquivalence Classes (${this.equivalenceClasses.size}):\n`;
      for (const [id, stateSet] of this.equivalenceClasses) {
        const stateNames = Array.from(stateSet).map(s => s.name).join(', ');
        result += `- Class ${id}: ${stateNames}\n`;
      }
      
      // Add metrics
      result += `\nOptimization Metrics:\n`;
      result += `- Original State Count: ${this.metrics.originalStateCount}\n`;
      result += `- Minimized State Count: ${this.metrics.minimizedStateCount}\n`;
      result += `- Optimization Ratio: ${this.metrics.optimizationRatio.toFixed(2)}\n`;
      
      return result;
    }
  }