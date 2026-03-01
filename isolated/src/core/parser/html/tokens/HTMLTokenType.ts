/**
 * Enumeration of HTML token types with constant values
 * for the OBIX parser implementation
 */
export const HTMLTokenType = {
  StartTag: 'StartTag',
  EndTag: 'EndTag',
  Text: 'Text',
  Comment: 'Comment',
  ConditionalComment: 'ConditionalComment',
  Doctype: 'Doctype',
  CDATA: 'CDATA',
  EOF: 'EOF'
  } as const as IHTMKLTokenType
  
export interface IHTMKLTokenType {
    StartTag: 'StartTag';
    EndTag: 'EndTag';
    Text: 'Text';
    Comment: 'Comment';
    ConditionalComment: 'ConditionalComment';
    Doctype: 'Doctype';
    CDATA: 'CDATA';
    EOF: 'EOF';
  }



  /**
   * Union type of all possible token type values
   */
  export type TokenType = typeof HTMLTokenType[keyof typeof HTMLTokenType];
  
  /**
   * Base token interface with required positional metadata
   */
  export interface BaseToken {
    /** Token type identifier */
    type: TokenType;
    /** Start position in source */
    start: number;
    /** End position in source */
    end: number;
    /** Line number in source */
    line: number;
    /** Column number in source */
    column: number;
  }
  
  /**
   * Start tag token interface
   */
  export interface StartTagToken extends BaseToken {
    type: 'StartTag';
    /** Tag name (lowercase) */
    name: string;
    /** Map of attribute name-value pairs */
    attributes: Map<string, string>;
    /** Whether the tag is self-closing */
    selfClosing: boolean;
    /** Optional XML namespace */
    namespace?: string;
  }
  
  /**
   * End tag token interface
   */
  export interface EndTagToken extends BaseToken {
    type: 'EndTag';
    /** Tag name (lowercase) */
    name: string;
    /** Optional XML namespace */
    namespace?: string;
  }
  
  /**
   * Text content token interface
   */
  export interface TextToken extends BaseToken {
    type: 'Text';
    /** Text content */
    content: string;
    /** Whether the text contains only whitespace */
    isWhitespace: boolean;
  }
  
  /**
   * Comment token interface
   */
  export interface CommentToken extends BaseToken {
    type: 'Comment';
    /** Comment data */
    data: string;
    /** Whether this is a conditional comment */
    isConditional?: boolean;
  }
  
  /**
   * Conditional comment token interface
   */
  export interface ConditionalCommentToken extends BaseToken {
    type: 'ConditionalComment';
    /** Condition expression */
    condition: string;
    /** Comment content */
    content: string;
  }
  
  /**
   * Doctype token interface
   */
  export interface DoctypeToken extends BaseToken {
    type: 'Doctype';
    /** Doctype name */
    name: string;
    /** Optional public identifier */
    publicId?: string;
    /** Optional system identifier */
    systemId?: string;
  }
  
  /**
   * CDATA section token interface
   */
  export interface CDATAToken extends BaseToken {
    type: 'CDATA';
    /** CDATA content */
    content: string;
  }
  
  /**
   * End-of-file token interface
   */
  export interface EOFToken extends BaseToken {
    type: 'EOF';
  }
  
  /**
   * Union type of all possible token types
   */
  export type HTMLToken = 
    | StartTagToken 
    | EndTagToken 
    | TextToken 
    | CommentToken 
    | ConditionalCommentToken 
    | DoctypeToken 
    | CDATAToken 
    | EOFToken;
  
    
