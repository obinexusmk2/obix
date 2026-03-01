import { CSSToken, CSSTokenType } from "@/core/parser/css/tokenizer/CSSTokenType";
import { CSSNode, CSSNodeType } from "../../css/node/CSSNode";
import { OptimizationMetrics } from "@/core/dop/OptimizationMetrics";






/**
 * CSS AST structure
 */
export interface ICSSAst {
  /** Root node of the AST */
  root: CSSNode;
  /** Metadata for the AST */
  metadata: {
    /** Optimization metrics */
    optimizationMetrics?: OptimizationMetrics;
    /** Minimization metrics */
    minimizationMetrics?: {
      originalStateCount: number;
      minimizedStateCount: number;
      optimizationRatio: number;
    };
  };
}

/**
 * CSS AST implementation
 */
export class CSSAst implements ICSSAst {
  /** Root node of the AST */
  public root: CSSNode;
  /** Metadata for the AST */
  public metadata: {
    optimizationMetrics?: OptimizationMetrics;
    minimizationMetrics?: {
      originalStateCount: number;
      minimizedStateCount: number;
      optimizationRatio: number;
    };
  };

  /**
   * Create a new CSS AST
   * 
   * @param root Root node of the AST
   */
  constructor(root: CSSNode = new CSSNode(CSSNodeType.Stylesheet)) {
    this.root = root;
    this.metadata = {};
  }

  /**
   * Build an AST from an array of tokens
   * 
   * @param tokens Array of CSS tokens
   * @returns The constructed AST
   */
  buildAst(tokens: CSSToken[]): CSSAst {
    // Initialize a new stylesheet root
    this.root = new CSSNode(CSSNodeType.Stylesheet);

    // Parse tokens into the AST
    this.parseTokens(tokens);

    return this;
  }

  /**
   * Parse an array of tokens into the AST
   * 
   * @param tokens Array of CSS tokens
   */
  public parseTokens(tokens: CSSToken[]): void {
    // Skip empty token arrays
    if (tokens.length === 0) return;

    // State tracking for parsing
    let currentRule: CSSNode | null = null;
    let currentAtRule: CSSNode | null = null;
    let currentDeclaration: CSSNode | null = null;
    let currentSelector = '';
    let currentProperty = '';
    let expectingValue = false;
    let parenDepth = 0;

    // Current context stack for nested structures
    const contextStack: { node: CSSNode, type: string }[] = [{ node: this.root, type: 'stylesheet' }];

    // Get current context
    const getCurrentContext = () => contextStack[contextStack.length - 1];
    let inParentheses = false;

    // Process each token
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const context = getCurrentContext();

      // Skip whitespace and comments (but store comments)
      if (token && token.type === CSSTokenType.Whitespace) {
        continue;
      }

      if (token && token.type === CSSTokenType.Comment) {
        const commentNode = new CSSNode(CSSNodeType.Comment, token.value);
        if (context) {
          context.node.addChild(commentNode);
        }
        continue;
      }

      // Process token based on current context
      if (!context) {
        continue;
      }

      switch (context.type) {
        case 'stylesheet':
          // Top-level context
          if (token && token.type === CSSTokenType.AtKeyword) {
            // Handle at-rules (media, keyframes, etc.)
            currentAtRule = new CSSNode(CSSNodeType.AtRule, null, {
              name: (token as any).keyword || token.value?.substring(1),
              prelude: ''
            });
            if (context) {
              context.node.addChild(currentAtRule);
            }
            contextStack.push({ node: currentAtRule, type: 'at-rule-prelude' });
          } else if (
            token && (
              token && (
                token.type === CSSTokenType.Selector || 
                token.type === CSSTokenType.ClassSelector || 
                token.type === CSSTokenType.IdSelector || 
                token.type === CSSTokenType.SelectorElement
              )
            )
          ) {
            // Start a new rule
            if (token && 'value' in token) {
              currentSelector = token.value || '';
            }
            currentRule = new CSSNode(CSSNodeType.Rule, null, { selector: currentSelector });
            contextStack.push({ node: currentRule, type: 'selector' });
          }
          break;

        case 'at-rule-prelude':
          if (token && token.type === CSSTokenType.StartBlock) {
            // Start at-rule block
            const currentContext = contextStack[contextStack.length - 1];
            if (currentContext) {
              currentContext.type = 'at-rule-block';
            }
          } else if (token && token.type === CSSTokenType.Semicolon) {
            // End at-rule without block
            contextStack.pop();
          } else {
            // Accumulate at-rule prelude
            const currentContext = contextStack[contextStack.length - 1];
            if (currentContext) {
              currentAtRule = currentContext.node;
            }
            if (currentAtRule && token && 'value' in token) {
              currentAtRule['prelude'] = (currentAtRule['prelude'] || '') + ' ' + token.value;
            }
          }
          break;

        case 'at-rule-block':
          if (token && token.type === CSSTokenType.AtKeyword) {
            // Nested at-rule
            const nestedAtRule = new CSSNode(CSSNodeType.AtRule, null, {
              name: (token as any).keyword || token.value.substring(1),
              prelude: ''
            });
            context.node.addChild(nestedAtRule);
            contextStack.push({ node: nestedAtRule, type: 'at-rule-prelude' });
          } else if (
            token && (
              token.type === CSSTokenType.Selector || 
              token.type === CSSTokenType.ClassSelector || 
              token.type === CSSTokenType.IdSelector || 
              token.type === CSSTokenType.SelectorElement
            )
          ) {
            // Rule within at-rule
            if ('value' in token) {
              currentSelector = token.value;
            }
            currentRule = new CSSNode(CSSNodeType.Rule, null, { selector: currentSelector });
            context.node.addChild(currentRule);
            contextStack.push({ node: currentRule, type: 'selector' });
          } else if (token && token.type === CSSTokenType.EndBlock) {
            // End at-rule block
            contextStack.pop();
          }
          break;

        case 'selector':
          if (token && token.type === CSSTokenType.StartBlock) {
            // End selector, start rule block
            const currentContext = contextStack[contextStack.length - 1];
            if (currentContext) {
              currentContext.type = 'rule-block';
              currentRule = context.node;
            }
            this.root.addChild(currentRule as CSSNode);
          } else if (token && token.type === CSSTokenType.EndBlock) {
            // End rule block (error case)
            contextStack.pop();
          } else {
            // Accumulate selector
            if (token && 'value' in token) {
              currentSelector += ' ' + (token as any).value;
            }
            currentRule = context.node;
            currentRule['selector'] = currentSelector.trim();
          }
          break;

        case 'rule-block':
          if (token && token.type === CSSTokenType.Property) {
            // Start declaration
            currentProperty = token.value;
            currentDeclaration = new CSSNode(CSSNodeType.Declaration, null, { important: false });
            const propertyNode = new CSSNode(CSSNodeType.Property, currentProperty);
            currentDeclaration.addChild(propertyNode);
            expectingValue = false;
          } else if (token && token.type === CSSTokenType.Colon && currentDeclaration) {
            // Property-value separator
            expectingValue = true;
          } else if (expectingValue && (
            token && token.type === CSSTokenType.Value ||
            token && token.type === CSSTokenType.Number ||
            token && token.type === CSSTokenType.Color ||
            token && token.type === CSSTokenType.String ||
            token && token.type === CSSTokenType.URL
          )) {
            // Add value to declaration
            const valueNode = new CSSNode(CSSNodeType.Value, token.value);
            currentDeclaration!.addChild(valueNode);
          } else if (token && token.type === CSSTokenType.Function) {
            // Start function value
            const functionNode = new CSSNode(CSSNodeType.Function, token.value);
            currentDeclaration!.addChild(functionNode);
            contextStack.push({ node: functionNode, type: 'function-args' });
            parenDepth = 1;
          } else if (token && token.type === CSSTokenType.ImportantFlag && currentDeclaration) {
            // Mark as important
            currentDeclaration['important'] = true;
          } else if (token && token.type === CSSTokenType.Semicolon) {
            // End declaration
            if (currentDeclaration) {
              context.node.addChild(currentDeclaration);
              currentDeclaration = null;
              expectingValue = false;
            }
          } else if (token && token.type === CSSTokenType.EndBlock) {
            // End rule block
            contextStack.pop();
          }
          break;

        case 'function-args':
          if (token && token.type === CSSTokenType.OpenParen) {
            // Nested parenthesis
            parenDepth++;
          } else if (token && token.type === CSSTokenType.CloseParen) {
            // End parenthesis
            parenDepth--;
            if (parenDepth === 0) {
              inParentheses = false;
              contextStack.pop();
            }
          } else if (token && token.type === CSSTokenType.Function) {
            // Nested function
            const nestedFunction = new CSSNode(CSSNodeType.Function, token.value);
            context.node.addChild(nestedFunction);
            contextStack.push({ node: nestedFunction, type: 'function-args' });
            parenDepth++;
          } else if (
            token && (
              token.type === CSSTokenType.Value ||
              token.type === CSSTokenType.Number ||
              token.type === CSSTokenType.Color ||
              token.type === CSSTokenType.String ||
              token.type === CSSTokenType.Unit
            )
          ) {
            // Function argument
            const valueNode = new CSSNode(CSSNodeType.Value, token.value);
            context.node.addChild(valueNode);
          }
          break;
      }
    }
  }

  /**
   * Convert the AST to a CSS string
   * 
   * @returns CSS string representation
   */
  toCSS(): string {
    return this.root.toCSS();
  }
}