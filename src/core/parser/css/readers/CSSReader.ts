import { CSSTokenizer } from '../tokenizer/CSSTokenizer';
import { CSSTokenType } from '../tokenizer/CSSTokenType';

/**
 * Base interface for CSS reader components
 */
export interface CSSReader {
  /**
   * Read tokens from the given context
   * 
   * @param context Reader context with tokens and state
   * @param options Reader options
   * @returns Reader result with read data
   */
  read(context: CSSReaderContext, options?: CSSReaderOptions): CSSReaderResult;
}

/**
 * Context for CSS token reading
 */
export interface CSSReaderContext {
  /** Current token index */
  index: number;
  /** Tokens to read */
  tokens: any[];
  /** Current parsing state */
  state: any;
  /** Error collection */
  errors: Error[];
}

/**
 * Options for CSS token reading
 */
export interface CSSReaderOptions {
  /** Whether to recover from errors */
  recover?: boolean;
  /** Maximum depth for nested structures */
  maxDepth?: number;
  /** Whether to preserve comments */
  preserveComments?: boolean;
}

/**
 * Result of reading CSS tokens
 */
export interface CSSReaderResult {
  /** Structured data from reading */
  data: any;
  /** Number of tokens consumed */
  consumed: number;
  /** Whether the read was successful */
  success: boolean;
  /** Any errors encountered */
  errors: Error[];
}


/**
 * Result of reading a CSS component
 */
export interface CSSReadResult {
  /** Read value */
  value: string;
  /** Component type */
  type: string;
  /** Start position in source */
  start: number;
  /** End position in source */
  end: number;
  /** Whether read was successful */
  success: boolean;
  /** Any errors encountered */
  errors: Error[];
}

/**
 * CSS Reader for parsing different CSS components
 * Uses tokenizer to break down CSS and extract structured information
 */
export class CSSReader {
  /** CSS content */
  private content: string;
  /** Tokenizer instance */
  private tokenizer: CSSTokenizer;
  /** Parsed tokens */
  private tokens: any[];

  /**
   * Create a new CSS reader
   * 
   * @param content CSS content to read
   */
  constructor(content: string) {
    this.content = content;
    this.tokenizer = new CSSTokenizer(content);
    const result = this.tokenizer.tokenize();
    this.tokens = result.tokens;
  }

  /**
   * Read a CSS selector starting at the given position
   * 
   * @param startIndex Position to start reading from
   * @returns Read result
   */
  public readSelector(startIndex: number): CSSReadResult {
    let value = '';
    let endIndex = startIndex;
    const errors: Error[] = [];
    
    // Token types that can be part of a selector
    const selectorTokenTypes = [
      CSSTokenType.Selector,
      CSSTokenType.ClassSelector,
      CSSTokenType.IdSelector,
      // Element selectors are handled by the general Selector type
      CSSTokenType.PseudoClass,
      CSSTokenType.PseudoElement,
      CSSTokenType.Combinator,
      CSSTokenType.AttributeSelector
    ];
    
    try {
      // Read tokens until we find a block start or hit the end
      while (endIndex < this.tokens.length) {
        const token = this.tokens[endIndex];
        
        if (token.type === CSSTokenType.StartBlock) {
          break;
        }
        
        if (selectorTokenTypes.includes(token.type)) {
          value += token.value;
        } else if (token.type === CSSTokenType.Whitespace) {
          value += ' ';
        } else {
          errors.push(new Error(`Unexpected token in selector: ${token.type}`));
          break;
        }
        
        endIndex++;
      }
      
      return {
        value: value.trim(),
        type: 'selector',
        start: startIndex,
        end: endIndex,
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        value: '',
        type: 'selector',
        start: startIndex,
        end: startIndex,
        success: false,
        errors: [error instanceof Error ? error : new Error(String(error))]
      };
    }
  }

  /**
   * Read a CSS property starting at the given position
   * 
   * @param startIndex Position to start reading from
   * @returns Read result with property information
   */
  public readProperty(startIndex: number): { 
    name: string; 
    value?: string; 
    start: number; 
    end: number; 
    success: boolean; 
    errors: Error[];
  } {
    let name = '';
    let endIndex = startIndex;
    const errors: Error[] = [];
    
    try {
      // Read property name
      const propertyToken = this.tokens[startIndex];
      
      if (propertyToken.type !== CSSTokenType.Property) {
        errors.push(new Error(`Expected property token, got ${propertyToken.type}`));
        return {
          name: '',
          start: startIndex,
          end: startIndex,
          success: false,
          errors
        };
      }
      
      name = propertyToken.value;
      endIndex++;
      
      // Skip whitespace
      while (endIndex < this.tokens.length && 
             this.tokens[endIndex].type === CSSTokenType.Whitespace) {
        endIndex++;
      }
      
      // Check for colon
      if (endIndex < this.tokens.length && 
          this.tokens[endIndex].type === CSSTokenType.Colon) {
        endIndex++;
      } else {
        errors.push(new Error('Expected colon after property name'));
      }
      
      return {
        name,
        start: startIndex,
        end: endIndex,
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        name: '',
        start: startIndex,
        end: startIndex,
        success: false,
        errors: [error instanceof Error ? error : new Error(String(error))]
      };
    }
  }

  /**
   * Read a CSS value starting at the given position
   * 
   * @param startIndex Position to start reading from
   * @returns Read result with value information
   */
  public readValue(startIndex: number): CSSReadResult {
    let value = '';
    let endIndex = startIndex;
    const errors: Error[] = [];
    
    // Value token types
    const valueTokenTypes = [
      CSSTokenType.Value,
      CSSTokenType.Number,
      CSSTokenType.Color,
      CSSTokenType.String,
      CSSTokenType.URL,
      CSSTokenType.Unit,
      CSSTokenType.Function
    ];
    
    try {
      // Read value tokens until semicolon or end of block
      let important = false;
      
      while (endIndex < this.tokens.length) {
        const token = this.tokens[endIndex];
        
        if (token.type === CSSTokenType.Semicolon || 
            token.type === CSSTokenType.EndBlock) {
          break;
        }
        
        if (valueTokenTypes.includes(token.type)) {
          value += token.value;
        } else if (token.type === CSSTokenType.Whitespace) {
          value += ' ';
        } else if (token.type === CSSTokenType.ImportantFlag) {
          important = true;
          value += ' !important';
        } else {
          errors.push(new Error(`Unexpected token in value: ${token.type}`));
          break;
        }
        
        endIndex++;
      }
      
      // Include semicolon in read range if present
      if (endIndex < this.tokens.length && 
          this.tokens[endIndex].type === CSSTokenType.Semicolon) {
        endIndex++;
      }
      
      return {
        value: value.trim(),
        type: 'value',
        start: startIndex,
        end: endIndex,
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        value: '',
        type: 'value',
        start: startIndex,
        end: startIndex,
        success: false,
        errors: [error instanceof Error ? error : new Error(String(error))]
      };
    }
  }

  /**
   * Read a CSS at-rule starting at the given position
   * 
   * @param startIndex Position to start reading from
   * @returns Read result with at-rule information
   */
  public readAtRule(startIndex: number): {
    name: string;
    prelude: string;
    start: number;
    end: number;
    success: boolean;
    errors: Error[];
  } {
    let name = '';
    let prelude = '';
    let endIndex = startIndex;
    const errors: Error[] = [];
    
    try {
      // Check for at-keyword
      const atKeywordToken = this.tokens[startIndex];
      
      if (atKeywordToken.type !== CSSTokenType.AtKeyword) {
        errors.push(new Error(`Expected at-rule token, got ${atKeywordToken.type}`));
        return {
          name: '',
          prelude: '',
          start: startIndex,
          end: startIndex,
          success: false,
          errors
        };
      }
      
      name = atKeywordToken.value;
      endIndex++;
      
      // Read prelude until semicolon or block start
      const preludeTokens = [];
      
      while (endIndex < this.tokens.length) {
        const token = this.tokens[endIndex];
        
        if (token.type === CSSTokenType.Semicolon || 
            token.type === CSSTokenType.StartBlock) {
          break;
        }
        
        preludeTokens.push(token);
        endIndex++;
      }
      
      // Build prelude string
      prelude = preludeTokens.map(token => token.value).join(' ').trim();
      
      // Handle semicolon or block
      if (endIndex < this.tokens.length) {
        if (this.tokens[endIndex].type === CSSTokenType.Semicolon) {
          endIndex++;
        } else if (this.tokens[endIndex].type === CSSTokenType.StartBlock) {
          // Skip block
          const blockResult = this.readBlock(endIndex);
          endIndex = blockResult.end;
        }
      }
      
      return {
        name,
        prelude,
        start: startIndex,
        end: endIndex,
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        name: '',
        prelude: '',
        start: startIndex,
        end: startIndex,
        success: false,
        errors: [error instanceof Error ? error : new Error(String(error))]
      };
    }
  }

  /**
   * Read a CSS block starting at the given position
   * 
   * @param startIndex Position to start reading from
   * @returns Read result with block information
   */
  public readBlock(startIndex: number): {
    content: string;
    start: number;
    end: number;
    success: boolean;
    errors: Error[];
  } {
    let content = '';
    let endIndex = startIndex;
    const errors: Error[] = [];
    
    try {
      // Check for block start
      const startBlockToken = this.tokens[startIndex];
      
      if (startBlockToken.type !== CSSTokenType.StartBlock) {
        errors.push(new Error(`Expected block start, got ${startBlockToken.type}`));
        return {
          content: '',
          start: startIndex,
          end: startIndex,
          success: false,
          errors
        };
      }
      
      content = startBlockToken.value;
      endIndex++;
      
      // Track nesting level
      let nestingLevel = 1;
      
      // Read until matching block end
      while (endIndex < this.tokens.length && nestingLevel > 0) {
        const token = this.tokens[endIndex];
        
        if (token.type === CSSTokenType.StartBlock) {
          nestingLevel++;
        } else if (token.type === CSSTokenType.EndBlock) {
          nestingLevel--;
        }
        
        content += token.value;
        endIndex++;
        
        // Break if we've found the matching end
        if (nestingLevel === 0) {
          break;
        }
      }
      
      if (nestingLevel > 0) {
        errors.push(new Error('Unclosed block'));
      }
      
      return {
        content,
        start: startIndex,
        end: endIndex,
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        content: '',
        start: startIndex,
        end: startIndex,
        success: false,
        errors: [error instanceof Error ? error : new Error(String(error))]
      };
    }
  }

  /**
   * Get all tokens from the tokenizer
   * 
   * @returns Array of tokens
   */
  public getTokens(): any[] {
    return [...this.tokens];
  }

  /**
   * Get content being read
   * 
   * @returns CSS content
   */
  public getContent(): string {
    return this.content;
  }
  /**
   * Create a successful result
   * 
   * @param data Read data
   * @param consumed Number of tokens consumed
   * @returns Successful result
   */
  protected createSuccess(data: any, consumed: number): CSSReaderResult {
    return {
      data,
      consumed,
      success: true,
      errors: []
    };
  }
  
  /**
   * Create a failure result
   * 
   * @param error Error that caused the failure
   * @returns Failed result
   */
  protected createFailure(error: Error): CSSReaderResult {
    return {
      data: null,
      consumed: 0,
      success: false,
      errors: [error]
    };
  }
  
  /**
   * Create a partial success result
   * 
   * @param data Read data
   * @param consumed Number of tokens consumed
   * @param errors Errors encountered
   * @returns Partial success result
   */
  protected createPartialSuccess(data: any, consumed: number, errors: Error[]): CSSReaderResult {
    return {
      data,
      consumed,
      success: true,
      errors
    };
  }
  
  /**
   * Get token at relative position from current index
   * 
   * @param context Reader context
   * @param offset Offset from current index (default: 0)
   * @returns Token at position or undefined
   */
  protected getToken(context: CSSReaderContext, offset: number = 0): any {
    const index = context.index + offset;
    return index < context.tokens.length ? context.tokens[index] : undefined;
  }
  
  /**
   * Check if token type matches expected type
   * 
   * @param token Token to check
   * @param type Expected token type
   * @returns Whether token type matches
   */
  protected isTokenType(token: any, type: string | string[]): boolean {
    if (!token) return false;
    return Array.isArray(type) ? type.includes(token.type) : token.type === type;
  }
  
  /**
   * Advance context by specified number of tokens
   * 
   * @param context Reader context
   * @param count Number of tokens to advance
   */
  protected advance(context: CSSReaderContext, count: number = 1): void {
    context.index += count;
  }
}
