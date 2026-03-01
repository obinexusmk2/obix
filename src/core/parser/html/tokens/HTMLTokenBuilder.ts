import { HTMLToken, TokenMetadata } from './HTMLToken.js';
import { HTMLTokenType, StartTagToken, EndTagToken, TextToken, CommentToken, ConditionalCommentToken, DoctypeToken, CDATAToken, EOFToken } from './HTMLTokenType.js';

/**
 * Factory class for creating HTML tokens with validation
 */
export class HTMLTokenBuilder {
  /**
   * Create a start tag token
   */
  static createStartTag(
    name: string, 
    attributes: Map<string, string>, 
    selfClosing: boolean,
    start: number, 
    end: number, 
    line: number, 
    column: number, 
    namespace?: string
  ): StartTagToken {
    this.validateString('name', name);
    this.validateMap('attributes', attributes);
    this.validateBoolean('selfClosing', selfClosing);
    this.validatePosition(start, end, line, column);
    
    if (namespace !== undefined) {
      this.validateString('namespace', namespace);
    }
    
    return {
      type: 'StartTag',
      name,
      attributes,
      selfClosing,
      start,
      end,
      line,
      column,
      namespace
    };
  }
  
  /**
   * Create an end tag token
   */
  static createEndTag(
    name: string, 
    start: number, 
    end: number, 
    line: number, 
    column: number, 
    namespace?: string
  ): EndTagToken {
    this.validateString('name', name);
    this.validatePosition(start, end, line, column);
    
    if (namespace !== undefined) {
      this.validateString('namespace', namespace);
    }
    
    return {
      type: 'EndTag',
      name,
      start,
      end,
      line,
      column,
      namespace
    };
  }
  
  /**
   * Create a text token
   */
  static createText(
    content: string, 
    isWhitespace: boolean, 
    start: number, 
    end: number, 
    line: number, 
    column: number
  ): TextToken {
    this.validateString('content', content);
    this.validateBoolean('isWhitespace', isWhitespace);
    this.validatePosition(start, end, line, column);
    
    return {
      type: 'Text',
      content,
      isWhitespace,
      start,
      end,
      line,
      column
    };
  }
  
  /**
   * Create a comment token
   */
  static createComment(
    data: string, 
    start: number, 
    end: number, 
    line: number, 
    column: number, 
    isConditional: boolean = false
  ): CommentToken & HTMLToken {
    this.validateString('data', data);
    this.validatePosition(start, end, line, column);
    this.validateBoolean('isConditional', isConditional);
    
    return {
      data,
      isConditional,
      start,
      end,
      line,
      column,
      _id: 0,
      _type: 'Comment',
      _properties: {},
      _position: { start, end, line, column }
    };
  }
  /**
   * Create a conditional comment token
   */
  static createConditionalComment(
    condition: string, 
    content: string, 
    start: number, 
    end: number, 
    line: number, 
    column: number
  ): ConditionalCommentToken {
    this.validateString('condition', condition);
    this.validateString('content', content);
    this.validatePosition(start, end, line, column);
    
    return {
      type: 'ConditionalComment',
      condition,
      content,
      start,
      end,
      line,
      column
    };
  }
  
  /**
   * Create a doctype token
   */
  static createDoctype(
    name: string, 
    start: number, 
    end: number, 
    line: number, 
    column: number, 
    publicId?: string, 
    systemId?: string
  ): DoctypeToken {
    this.validateString('name', name);
    this.validatePosition(start, end, line, column);
    
    if (publicId !== undefined) {
      this.validateString('publicId', publicId);
    }
    
    if (systemId !== undefined) {
      this.validateString('systemId', systemId);
    }
    
    return {
      type: 'Doctype',
      name,
      publicId,
      systemId,
      start,
      end,
      line,
      column
    };
  }
  
  /**
   * Create a CDATA token
   */
  static createCDATA(
    content: string, 
    start: number, 
    end: number, 
    line: number, 
    column: number
  ): CDATAToken {
    this.validateString('content', content);
    this.validatePosition(start, end, line, column);
    
    return {
      type: 'CDATA',
      content,
      start,
      end,
      line,
      column
    };
  }
  
  /**
   * Create an EOF token
   */
  static createEOF(
    start: number, 
    end: number, 
    line: number, 
    column: number
  ): EOFToken {
    this.validatePosition(start, end, line, column);
    
    return {
      type: 'EOF',
      start,
      end,
      line,
      column
    };
  }

  /**
   * Create a token using the HTMLToken class
   */
  static createToken(
    type: HTMLTokenType, 
    properties: Record<string, any> = {}, 
    position: { start: number; end: number; line: number; column: number; },
    metadata: Partial<TokenMetadata> = {},
    isAccepting: boolean = false
  ): HTMLToken {
    return new HTMLToken({
      type,
      properties,
      position,
      metadata,
      isAccepting
    });
  }
  
  /**
   * Validate a string value
   */
  public static validateString(field: string, value: string): void {
    if (typeof value !== 'string') {
      throw new TypeError(`${field} must be a string`);
    }
  }
  
  /**
   * Validate a boolean value
   */
  public static validateBoolean(field: string, value: boolean): void {
    if (typeof value !== 'boolean') {
      throw new TypeError(`${field} must be a boolean`);
    }
  }
  
  /**
   * Validate a Map instance
   */
  public static validateMap(field: string, value: Map<any, any>): void {
    if (!(value instanceof Map)) {
      throw new TypeError(`${field} must be a Map`);
    }
  }
  
  /**
   * Validate position values
   */
  public static validatePosition(
    start: number, 
    end: number, 
    line: number, 
    column: number
  ): void {
    if (typeof start !== 'number' || isNaN(start)) {
      throw new TypeError('start must be a valid number');
    }
    
    if (typeof end !== 'number' || isNaN(end)) {
      throw new TypeError('end must be a valid number');
    }
    
    if (typeof line !== 'number' || isNaN(line) || line < 1) {
      throw new TypeError('line must be a positive number');
    }
    
    if (typeof column !== 'number' || isNaN(column) || column < 1) {
      throw new TypeError('column must be a positive number');
    }
    
    if (start > end) {
      throw new RangeError('start position cannot be greater than end position');
    }
  }
}