import { CSSTokenBuilder } from "./CSSTokenBuilder.js";
import { CSSToken, TokenPosition, CSSTokenType, TokenType } from "./CSSTokenType.js";

/**
 * Options for the CSS tokenizer
 */
export interface TokenizerOptions {
  /** Whether to preserve whitespace tokens in the output */
  preserveWhitespace: boolean;
  /** Whether to recognize color values as special tokens */
  recognizeColors: boolean;
  /** Whether to recognize function syntax with special tokens */
  recognizeFunctions: boolean;
  /** Whether to use advanced token classification */
  advancedMode: boolean;
}

/**
 * Error information for tokenization issues
 */
export interface TokenizerError {
  /** Error message */
  message: string;
  /** Error severity */
  severity: 'warning' | 'error';
  /** Line number where the error occurred */
  line: number;
  /** Column number where the error occurred */
  column: number;
  /** Start position in the input */
  start: number;
  /** End position in the input */
  end: number;
}

/**
 * Result of the tokenization process
 */
export interface TokenizerResult {
  /** Array of tokens produced */
  tokens: CSSToken[];
  /** Array of errors encountered during tokenization */
  errors: TokenizerError[];
}

/**
 * CSS Tokenizer with automaton-based shift-reduce implementation
 * Converts CSS text into a stream of tokens for the parser
 * Implements Nnamdi Okpala's automaton state minimization algorithm
 */
export class CSSTokenizer {
  /** Input string to tokenize */
  public input: string;
  /** Current position in the input */
  public position: number;
  /** Current line number */
  public line: number;
  /** Current column number */
  public column: number;
  /** Collected tokens */
  public tokens: CSSToken[];
  /** Errors encountered during tokenization */
  public errors: TokenizerError[];
  /** Tokenizer configuration options */
  public options: TokenizerOptions;
  /** Stack for the current token being built */
  public stack: string[];
  /** Current token position info */
  public currentTokenPosition: TokenPosition;
  /** Stack of nested blocks to track matching braces */
  public bracketStack: string[];

  /**
   * Create a new CSS tokenizer
   * 
   * @param input CSS text to tokenize
   * @param options Tokenizer configuration options
   */
  constructor(input: string, options: Partial<TokenizerOptions> = {}) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.errors = [];
    this.stack = [];
    this.bracketStack = [];
    this.currentTokenPosition = { line: 1, column: 1 };
    
    // Default options with overrides
    this.options = {
      preserveWhitespace: false,
      recognizeColors: true,
      recognizeFunctions: true,
      advancedMode: false,
      ...options
    };
  }

  /**
   * Tokenize the input CSS
   * @returns The tokenization result with tokens and errors
   */
  public tokenize(): TokenizerResult {
    // Shift-reduce algorithm implementation
    while (this.position < this.input.length || this.stack.length > 0) {
      if (!this.reduce()) {
        if (!this.shift()) {
          this.handleRemainingStack();
        }
      }
    }

    // Check for unclosed blocks
    if (this.bracketStack.length > 0) {
      this.addError('Unclosed block', this.position, this.position);
    }

    // Add EOF token
    this.tokens.push(CSSTokenBuilder.createEOF({
      line: this.line, 
      column: this.column
    }));

    return { 
      tokens: this.tokens,
      errors: this.errors
    };
  }

  /**
   * Shift operation - move next character onto the stack
   * @returns Whether a character was shifted
   */
  public shift(): boolean {
    if (this.position < this.input.length) {
      const char = this.input[this.position];
      if (char !== undefined) {
        this.stack.push(char);
      }
      this.advance();
      return true;
    }
    return false;
  }

  /**
   * Reduce operation - try to match stack contents to a token pattern
   * @returns Whether a reduction was performed
   */
  public reduce(): boolean {
    const stackContent = this.stack.join('');
    
    // Try to match patterns from most specific to least specific
    if (this.matchComment(stackContent)) return true;
    if (this.matchAtKeyword(stackContent)) return true;
    if (this.matchFunction(stackContent)) return true;
    if (this.matchHexColor(stackContent)) return true;
    if (this.matchStructural(stackContent)) return true;
    if (this.matchSelector(stackContent)) return true;
    if (this.matchProperty(stackContent)) return true;
    if (this.matchNumber(stackContent)) return true;
    if (this.matchWhitespace(stackContent)) return true;
    if (this.matchString(stackContent)) return true;
    
    return false;
  }

  /**
   * Match a CSS comment pattern
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchComment(content: string): boolean {
    const match = content.match(/^\/\*(.*?)\*\//s);
    if (match) {
      const [_, commentContent] = match;
      this.addToken(CSSTokenType.Comment, commentContent ?? '');
      this.stack = [];
      return true;
    }
    return false;
  }

  /**
   * Match an at-keyword pattern (@media, @import, etc.)
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchAtKeyword(content: string): boolean {
    const match = content.match(/^@([a-zA-Z-]+)/);
    if (match) {
      const [_, keyword] = match;
      if (keyword !== undefined) {
        this.addToken(CSSTokenType.AtKeyword, keyword);
      }
      this.stack = [];
      return true;
    }
    return false;
  }

  /**
   * Match a function pattern (rgb(), calc(), etc.)
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchFunction(content: string): boolean {
    if (!this.options.recognizeFunctions) return false;
    
    const match = content.match(/^([a-zA-Z-]+)\(/);
    if (match) {
      const [, functionName] = match;
      if (functionName !== undefined) {
        this.addToken(CSSTokenType.Function, functionName);
      }
      this.addToken(CSSTokenType.OpenParen, '(');
      this.stack = [];
      return true;
    }
    return false;
  }

  /**
   * Match a hex color pattern (#fff, #123456, etc.)
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchHexColor(content: string): boolean {
    if (!this.options.recognizeColors) return false;
    
    const match = content.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/);
    if (match) {
      const [fullMatch] = match;
      this.addToken(CSSTokenType.Color, fullMatch);
      this.stack = [];
      return true;
    }
    return false;
  }

  /**
   * Match structural tokens ({, }, :, ;, etc.)
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchStructural(content: string): boolean {
    if (content.length !== 1) return false;
    
    const char = content[0];
    const typeMap: Partial<Record<string, TokenType>> = {
      '{': CSSTokenType.StartBlock,
      '}': CSSTokenType.EndBlock,
      ':': CSSTokenType.Colon,
      ';': CSSTokenType.Semicolon,
      ',': CSSTokenType.Comma,
      '(': CSSTokenType.OpenParen,
      ')': CSSTokenType.CloseParen
    };

    const tokenType = typeMap[char as keyof typeof typeMap];
    if (char && tokenType) {
      // Track bracket matching
      if (char === '{') {
        this.bracketStack.push(char);
      } else if (char === '}') {
        if (this.bracketStack.pop() !== '{') {
          this.addError('Unmatched closing brace', 
            this.position - 1, this.position);
        }
      }
      
      this.addToken(tokenType, char);
      this.stack = [];
      return true;
    }
    
    return false;
  }

  /**
   * Match a selector pattern
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchSelector(content: string): boolean {
    // Comprehensive selector pattern
    const selectorPattern = /^([.#]?[a-zA-Z0-9_-]+(?:\[[^\]]*\])?|::?[a-zA-Z0-9_-]+|[>+~])/;
    const match = content.match(selectorPattern);
    
    if (match && this.isSelectorContext()) {
      const [fullMatch] = match;
      
      // Specialized selector types
      let tokenType: TokenType = CSSTokenType.Selector;
      if (fullMatch.startsWith('.')) {
        tokenType = CSSTokenType.ClassSelector;
      } else if (fullMatch.startsWith('#')) {
        tokenType = CSSTokenType.IdSelector;
      } else if (fullMatch.startsWith('::')) {
        tokenType = CSSTokenType.PseudoElement;
      } else if (fullMatch.startsWith(':')) {
        tokenType = CSSTokenType.PseudoClass;
      } else if (['>','+','~'].includes(fullMatch)) {
        tokenType = CSSTokenType.Combinator;
      }
      
      this.addToken(tokenType, fullMatch);
      this.stack = [];
      return true;
    }
    
    return false;
  }

  /**
   * Match a property name pattern
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchProperty(content: string): boolean {
    const propertyPattern = /^([a-zA-Z-]+)(?=:)/;
    const match = content.match(propertyPattern);
    
    if (match && this.isPropertyContext()) {
      const [fullMatch] = match;
      this.addToken(CSSTokenType.Property, fullMatch);
      this.stack = [];
      return true;
    }
    
    return false;
  }
  
  /**
   * Match a numeric value pattern
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchNumber(content: string): boolean {
    const numberPattern = /^([+-]?(?:\d*\.)?\d+)([a-zA-Z%]+)?/;
    const match = content.match(numberPattern);
    
    if (match) {
      const [, number, unit] = match;
      if (number !== undefined) {
        this.addToken(CSSTokenType.Number, number);
      }
      
      if (unit) {
        this.addToken(CSSTokenType.Unit, unit);
      }
      
      this.stack = [];
      return true;
    }
    
    return false;
  }

  /**
   * Match whitespace pattern
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchWhitespace(content: string): boolean {
    if (/^\s+$/.test(content)) {
      if (this.options.preserveWhitespace) {
        this.addToken(CSSTokenType.Whitespace, content);
      }
      this.stack = [];
      return true;
    }
    return false;
  }

  /**
   * Match string literals ("string" or 'string')
   * @param content Stack content to match against
   * @returns Whether a match was found
   */
  public matchString(content: string): boolean {
    const stringPattern = /^(['"])((?:\\.|[^\\])*?)\1/;
    const match = content.match(stringPattern);
    
    if (match) {
      // Use underscores for unused variables and ensure value is defined
      const [_, _quote, value] = match;
      if (value !== undefined) {
        this.addToken(CSSTokenType.String, value);
        this.stack = [];
        return true;
      }
    }
    
    return false;
  }

  /**
   * Handle any remaining content in the stack
   */
  public handleRemainingStack(): void {
    if (this.stack.length > 0) {
      const content = this.stack.join('');
      
      // If it looks like an identifier or value
      if (/^[a-zA-Z0-9-_]+$/.test(content)) {
        const type = this.isValueContext() ? CSSTokenType.Value : CSSTokenType.Property;
        this.addToken(type, content);
      } else {
        // Add error token for unrecognized content
        this.addError(`Unrecognized content: ${content}`, 
          this.position - content.length, this.position);
      }
      
      this.stack = [];
    }
  }

  /**
   * Determine if we're in a selector context based on token history
   * @returns Whether we're in a selector context
   */
  public isSelectorContext(): boolean {
    const lastToken = this.getLastMeaningfulToken();
    return !lastToken || 
      lastToken.type === CSSTokenType.StartBlock || 
      lastToken.type === CSSTokenType.Comma ||
      lastToken.type === CSSTokenType.Combinator;
  }

  /**
   * Determine if we're in a property context based on token history
   * @returns Whether we're in a property context
   */
  public isPropertyContext(): boolean {
    const lastToken = this.getLastMeaningfulToken();
    return lastToken !== undefined && 
      (lastToken.type === CSSTokenType.Semicolon || 
       lastToken.type === CSSTokenType.StartBlock);
  }

  /**
   * Determine if we're in a value context based on token history
   * @returns Whether we're in a value context
   */
  public isValueContext(): boolean {
    const lastToken = this.getLastMeaningfulToken();
    return !!lastToken && 
      (lastToken.type === CSSTokenType.Colon || 
       lastToken.type === CSSTokenType.Value ||
       lastToken.type === CSSTokenType.Number ||
       lastToken.type === CSSTokenType.Unit);
  }

  /**
   * Get the last non-whitespace, non-comment token
   * @returns The last meaningful token or undefined
   */
  public getLastMeaningfulToken(): CSSToken | undefined {
    for (let i = this.tokens.length - 1; i >= 0; i--) {
      const token = this.tokens[i];
      if (token && token.type !== CSSTokenType.Whitespace && 
          token.type !== CSSTokenType.Comment) {
        return token;
      }
    }
    return undefined;
  }

  /**
   * Add a token to the output array
   * 
   * @param type Token type
   * @param value Token value
   * @param position Optional token position, defaults to current position
   */
  public addToken(
    type: TokenType, 
    value: string,
    position?: TokenPosition
  ): void {
    const tokenPosition = position || {
      line: this.currentTokenPosition.line,
      column: this.currentTokenPosition.column
    };
    
    const token = CSSTokenBuilder.create(type, value, tokenPosition);
    this.tokens.push(token);
  }

  /**
   * Add an error to the error list
   * 
   * @param message Error message
   * @param start Error start position
   * @param end Error end position
   * @param severity Error severity, defaults to 'error'
   */
  public addError(
    message: string, 
    start: number, 
    end: number,
    severity: 'warning' | 'error' = 'error'
  ): void {
    this.errors.push({
      message,
      severity,
      line: this.line,
      column: this.column,
      start,
      end
    });
  }

  /**
   * Advance the position in the input
   * @returns The character at the previous position
   */
  public advance(): string {
    const char = this.input[this.position++];
    
    // Store the token start position before advancing
    this.currentTokenPosition = {
      line: this.line,
      column: this.column
    };
    
    // Update line and column counters
    if (char === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    
    return char ?? '';
  }

  /**
   * Look ahead in the input without consuming
   * 
   * @param offset Number of characters to look ahead
   * @returns The character at the position + offset
   */
  public peek(offset = 0): string {
    return this.input[this.position + offset] || '';
  }
}