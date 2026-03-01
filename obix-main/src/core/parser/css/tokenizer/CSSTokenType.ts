/**
 * Comprehensive token type definitions for CSS parsing
 * Provides strong typing and validation support
 */

// Define all possible CSS token types with a const assertion for better type inference
export const CSSTokenType = {
  // Structure tokens
  StartBlock: 'StartBlock',     // {
  EndBlock: 'EndBlock',         // }
  Semicolon: 'Semicolon',       // ;
  Colon: 'Colon',               // :
  Comma: 'Comma',               // ,
  
  // Selector tokens
  Selector: 'Selector',         // Generic selector
  SelectorClass: 'SelectorClass', // .class
  SelectorId: 'SelectorId',     // #id
  SelectorElement: 'SelectorElement', // div, span, etc.
  PseudoClass: 'PseudoClass',   // :hover, :active, etc.
  PseudoElement: 'PseudoElement', // ::before, ::after, etc.
  Combinator: 'Combinator',     // >, +, ~, space
  ClassSelector: 'ClassSelector', // .class-name
  IdSelector: 'IdSelector',     // #identifier
  AttributeSelector: 'AttributeSelector', // [attr=value]
  
  // Property and value tokens
  Property: 'Property',         // property name
  Value: 'Value',               // property value
  Unit: 'Unit',                 // px, em, rem, etc.
  Number: 'Number',             // numeric value
  Color: 'Color',               // color value (#fff, rgb(), etc.)
  URL: 'URL',                   // url()
  String: 'String',             // "text", 'text'
  
  // Function tokens
  Function: 'Function',         // rgb(), calc(), etc.
  OpenParen: 'OpenParen',       // (
  CloseParen: 'CloseParen',     // )
  
  // Special tokens
  AtKeyword: 'AtKeyword',       // @media, @import, etc.
  Comment: 'Comment',           // /* comment */
  Whitespace: 'Whitespace',     // space, tab, newline
  ImportantFlag: 'ImportantFlag', // !important
  EOF: 'EOF',                   // End of file
  
  // Meta tokens
  Error: 'Error'                // Invalid token
} as const;

// Extract the type from the object values, ensuring they're used as literals
export type TokenType = typeof CSSTokenType[keyof typeof CSSTokenType];

/**
 * Interface for token position information
 */
export interface TokenPosition {
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column: number;
  /** Optional start position in the source */
  start?: number;
  /** Optional end position in the source */
  end?: number;
}

/**
 * Interface for token metadata
 */
export interface TokenMetadata {
  /** Computed state signature for state minimization */
  stateSignature: string | null;
  /** Assigned equivalence class for optimization */
  equivalenceClass: number | null;
  /** Available transitions to other tokens */
  transitions: Map<string, CSSToken>;
  /** Whether this token is in a minimized state */
  isMinimized: boolean;
  /** Custom metadata properties */
  [key: string]: any;
}

/**
 * Base token interface with required properties
 */
export interface BaseToken {
  /** Token type */
  type: TokenType;
  /** Start position in the source */
  start: number;
  /** End position in the source */
  end: number;
  /** Line number */
  line: number;
  /** Column number */
  column: number;
}

// Token-specific interfaces with explicitly typed 'type' properties
export interface StartBlockToken extends BaseToken {
  type: typeof CSSTokenType.StartBlock;
  value: '{';
}

export interface EndBlockToken extends BaseToken {
  type: typeof CSSTokenType.EndBlock;
  value: '}';
}

export interface SemicolonToken extends BaseToken {
  type: typeof CSSTokenType.Semicolon;
  value: ';';
}

export interface ColonToken extends BaseToken {
  type: typeof CSSTokenType.Colon;
  value: ':';
}

export interface CommaToken extends BaseToken {
  type: typeof CSSTokenType.Comma;
  value: ',';
}

export interface SelectorToken extends BaseToken {
  type: typeof CSSTokenType.Selector | 
        typeof CSSTokenType.SelectorClass | 
        typeof CSSTokenType.SelectorId | 
        typeof CSSTokenType.SelectorElement | 
        typeof CSSTokenType.ClassSelector | 
        typeof CSSTokenType.IdSelector | 
        typeof CSSTokenType.AttributeSelector;
  value: string;
}

export interface PseudoClassToken extends BaseToken {
  type: typeof CSSTokenType.PseudoClass;
  value: string;
}

export interface PseudoElementToken extends BaseToken {
  type: typeof CSSTokenType.PseudoElement;
  value: string;
}

export interface CombinatorToken extends BaseToken {
  type: typeof CSSTokenType.Combinator;
  value: '>' | '+' | '~' | string;
}

export interface PropertyToken extends BaseToken {
  type: typeof CSSTokenType.Property;
  value: string;
}

export interface ValueToken extends BaseToken {
  type: typeof CSSTokenType.Value;
  value: string;
}

export interface UnitToken extends BaseToken {
  type: typeof CSSTokenType.Unit;
  value: string;
}

export interface NumberToken extends BaseToken {
  type: typeof CSSTokenType.Number;
  value: string;
  numericValue?: number;
}

export interface ColorToken extends BaseToken {
  type: typeof CSSTokenType.Color;
  value: string;
}

export interface URLToken extends BaseToken {
  type: typeof CSSTokenType.URL;
  value: string;
  url: string;
}

export interface StringToken extends BaseToken {
  type: typeof CSSTokenType.String;
  value: string;
}

export interface FunctionToken extends BaseToken {
  type: typeof CSSTokenType.Function;
  value: string;
  name: string;
}

export interface ParenToken extends BaseToken {
  type: typeof CSSTokenType.OpenParen | typeof CSSTokenType.CloseParen;
  value: '(' | ')';
}

export interface AtKeywordToken extends BaseToken {
  type: typeof CSSTokenType.AtKeyword;
  value: string;
  keyword: string;
}

export interface CommentToken extends BaseToken {
  type: typeof CSSTokenType.Comment;
  value: string;
}

export interface WhitespaceToken extends BaseToken {
  type: typeof CSSTokenType.Whitespace;
  value: string;
}

export interface ImportantFlagToken extends BaseToken {
  type: typeof CSSTokenType.ImportantFlag;
  value: '!important';
}

export interface EOFToken extends BaseToken {
  type: typeof CSSTokenType.EOF;
}

export interface ErrorToken extends BaseToken {
  type: typeof CSSTokenType.Error;
  value: string;
  message: string;
}

/**
 * Union type for all possible token types
 */
export type CSSToken = 
  | StartBlockToken
  | EndBlockToken
  | SemicolonToken
  | ColonToken
  | CommaToken
  | SelectorToken
  | PseudoClassToken
  | PseudoElementToken
  | CombinatorToken
  | PropertyToken
  | ValueToken
  | UnitToken
  | NumberToken
  | ColorToken
  | URLToken
  | StringToken
  | FunctionToken
  | ParenToken
  | AtKeywordToken
  | CommentToken
  | WhitespaceToken
  | ImportantFlagToken
  | EOFToken
  | ErrorToken;

/**
 * Helper type guards for checking token types
 */
export function isStructureToken(token: CSSToken): boolean {
  return [
    CSSTokenType.StartBlock,
    CSSTokenType.EndBlock,
    CSSTokenType.Semicolon,
    CSSTokenType.Colon,
    CSSTokenType.Comma,
    CSSTokenType.OpenParen,
    CSSTokenType.CloseParen
  ].includes(token.type as any);
}

export function isSelectorToken(token: CSSToken): boolean {
  return [
    CSSTokenType.Selector,
    CSSTokenType.SelectorClass,
    CSSTokenType.SelectorId,
    CSSTokenType.SelectorElement,
    CSSTokenType.PseudoClass,
    CSSTokenType.PseudoElement,
    CSSTokenType.Combinator,
    CSSTokenType.ClassSelector,
    CSSTokenType.IdSelector,
    CSSTokenType.AttributeSelector
  ].includes(token.type as any);
}

export function isValueToken(token: CSSToken): boolean {
  return [
    CSSTokenType.Value,
    CSSTokenType.Unit,
    CSSTokenType.Number,
    CSSTokenType.Color,
    CSSTokenType.URL,
    CSSTokenType.String,
    CSSTokenType.Function,
    CSSTokenType.ImportantFlag
  ].includes(token.type as any);
}

export function isWhitespaceOrComment(token: CSSToken): boolean {
  return token.type === CSSTokenType.Whitespace || token.type === CSSTokenType.Comment;
}