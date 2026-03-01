import { 
  CSSTokenType, 
  TokenType, 
  TokenPosition,
  StartBlockToken,
  EndBlockToken,
  SemicolonToken,
  ColonToken,
  CommaToken,
  SelectorToken,
  PseudoClassToken,
  PseudoElementToken,
  CombinatorToken,
  PropertyToken,
  ValueToken,
  UnitToken,
  NumberToken,
  ColorToken,
  URLToken,
  StringToken,
  FunctionToken,
  ParenToken,
  AtKeywordToken,
  CommentToken,
  WhitespaceToken,
  ImportantFlagToken,
  EOFToken,
  ErrorToken,
  CSSToken
} from './CSSTokenType';

/**
 * Token builder factory for creating CSS tokens with validation
 */
export class CSSTokenBuilder {
  /**
   * Create a token with the specified type and value
   * 
   * @param type Token type
   * @param value Token value
   * @param position Token position information
   * @returns The created token
   */
  static create(
    type: TokenType,
    value: string,
    position: TokenPosition
  ): CSSToken {
    this.validateType(type);
    this.validatePosition(position);
    
    switch (type) {
      case CSSTokenType.StartBlock:
        return this.createStartBlock(position);
      case CSSTokenType.EndBlock:
        return this.createEndBlock(position);
      case CSSTokenType.Semicolon:
        return this.createSemicolon(position);
      case CSSTokenType.Colon:
        return this.createColon(position);
      case CSSTokenType.Comma:
        return this.createComma(position);
      case CSSTokenType.Selector:
      case CSSTokenType.SelectorClass:
      case CSSTokenType.SelectorId:
      case CSSTokenType.SelectorElement:
      case CSSTokenType.ClassSelector:
      case CSSTokenType.IdSelector:
      case CSSTokenType.AttributeSelector:
        return this.createSelector(type, value, position);
      case CSSTokenType.PseudoClass:
        return this.createPseudoClass(value, position);
      case CSSTokenType.PseudoElement:
        return this.createPseudoElement(value, position);
      case CSSTokenType.Combinator:
        return this.createCombinator(value, position);
      case CSSTokenType.Property:
        return this.createProperty(value, position);
      case CSSTokenType.Value:
        return this.createValue(value, position);
      case CSSTokenType.Unit:
        return this.createUnit(value, position);
      case CSSTokenType.Number:
        return this.createNumber(value, position);
      case CSSTokenType.Color:
        return this.createColor(value, position);
      case CSSTokenType.URL:
        return this.createURL(value, position);
      case CSSTokenType.String:
        return this.createString(value, position);
      case CSSTokenType.Function:
        return this.createFunction(value, position);
      case CSSTokenType.OpenParen:
        return this.createOpenParen(position);
      case CSSTokenType.CloseParen:
        return this.createCloseParen(position);
      case CSSTokenType.AtKeyword:
        return this.createAtKeyword(value, position);
      case CSSTokenType.Comment:
        return this.createComment(value, position);
      case CSSTokenType.Whitespace:
        return this.createWhitespace(value, position);
      case CSSTokenType.ImportantFlag:
        return this.createImportantFlag(position);
      case CSSTokenType.EOF:
        return this.createEOF(position);
      case CSSTokenType.Error:
        return this.createError(value, position);
      default:
        throw new TypeError(`Unsupported token type: ${type}`);
    }
  }

  /**
   * Validate that a token type is valid
   * @param type Token type to validate
   */
  public static validateType(type: TokenType): void {
    const validTypes = Object.values(CSSTokenType);
    if (!validTypes.includes(type as any)) {
      throw new TypeError(`Invalid token type: ${type}`);
    }
  }

  /**
   * Validate position information is valid
   * @param position Position to validate
   */
  public static validatePosition(position: TokenPosition): void {
    if (!position || 
        typeof position.line !== 'number' || 
        typeof position.column !== 'number' ||
        position.line < 1 || 
        position.column < 1) {
      throw new TypeError('Invalid position object. Must have line and column numbers >= 1');
    }
  }

  /**
   * Create a structural token with the specified token type
   */
  public static createStructuralToken<T extends CSSToken>(
    type: TokenType,
    value: string,
    position: TokenPosition
  ): T {
    return {
      type: type as any, // Type assertion needed for TypeScript
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    } as T;
  }

  // Structural tokens
  static createStartBlock(position: TokenPosition): StartBlockToken {
    return this.createStructuralToken<StartBlockToken>(CSSTokenType.StartBlock, '{', position);
  }

  static createEndBlock(position: TokenPosition): EndBlockToken {
    return this.createStructuralToken<EndBlockToken>(CSSTokenType.EndBlock, '}', position);
  }

  static createSemicolon(position: TokenPosition): SemicolonToken {
    return this.createStructuralToken<SemicolonToken>(CSSTokenType.Semicolon, ';', position);
  }

  static createColon(position: TokenPosition): ColonToken {
    return this.createStructuralToken<ColonToken>(CSSTokenType.Colon, ':', position);
  }

  static createComma(position: TokenPosition): CommaToken {
    return this.createStructuralToken<CommaToken>(CSSTokenType.Comma, ',', position);
  }

  static createOpenParen(position: TokenPosition): ParenToken {
    return this.createStructuralToken<ParenToken>(CSSTokenType.OpenParen, '(', position);
  }

  static createCloseParen(position: TokenPosition): ParenToken {
    return this.createStructuralToken<ParenToken>(CSSTokenType.CloseParen, ')', position);
  }

  // Selector tokens
  static createSelector(
    type: typeof CSSTokenType.Selector | typeof CSSTokenType.SelectorClass | typeof CSSTokenType.SelectorId | 
          typeof CSSTokenType.SelectorElement | typeof CSSTokenType.ClassSelector | 
          typeof CSSTokenType.IdSelector | typeof CSSTokenType.AttributeSelector,
    value: string,
    position: TokenPosition
  ): SelectorToken {
    return {
      type,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createPseudoClass(
    value: string,
    position: TokenPosition
  ): PseudoClassToken {
    // Strip the initial colon if it's present
    const pseudoName = value.startsWith(':') ? value.substring(1) : value;
    return {
      type: CSSTokenType.PseudoClass,
      value: `:${pseudoName}`,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createPseudoElement(
    value: string,
    position: TokenPosition
  ): PseudoElementToken {
    // Strip the initial colons if they're present
    const pseudoName = value.startsWith('::') ? value.substring(2) : value;
    return {
      type: CSSTokenType.PseudoElement,
      value: `::${pseudoName}`,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createCombinator(
    value: string,
    position: TokenPosition
  ): CombinatorToken {
    return {
      type: CSSTokenType.Combinator,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  // Property and value tokens
  static createProperty(
    value: string,
    position: TokenPosition
  ): PropertyToken {
    return {
      type: CSSTokenType.Property,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createValue(
    value: string,
    position: TokenPosition
  ): ValueToken {
    return {
      type: CSSTokenType.Value,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createUnit(
    value: string,
    position: TokenPosition
  ): UnitToken {
    return {
      type: CSSTokenType.Unit,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createNumber(
    value: string,
    position: TokenPosition
  ): NumberToken {
    const numericValue = parseFloat(value);
    return {
      type: CSSTokenType.Number,
      value,
      numericValue: isNaN(numericValue) ? 0 : numericValue, // Default to 0 instead of undefined
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createColor(
    value: string,
    position: TokenPosition
  ): ColorToken {
    return {
      type: CSSTokenType.Color,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createURL(
    value: string,
    position: TokenPosition
  ): URLToken {
    // Extract the actual URL from url() syntax if present
    const urlMatch = value.match(/url\(['"]?([^'"()]*)['"]?\)/i);
    const url = urlMatch && urlMatch[1] !== undefined ? urlMatch[1] : value;
    
    return {
      type: CSSTokenType.URL,
      value,
      url,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createString(
    value: string,
    position: TokenPosition
  ): StringToken {
    return {
      type: CSSTokenType.String,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createFunction(
    value: string,
    position: TokenPosition
  ): FunctionToken {
    return {
      type: CSSTokenType.Function,
      value,
      name: value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  // Special tokens
  static createAtKeyword(
    value: string,
    position: TokenPosition
  ): AtKeywordToken {
    // Strip the @ symbol if it's present
    const keyword = value.startsWith('@') ? value.substring(1) : value;
    
    return {
      type: CSSTokenType.AtKeyword,
      value: `@${keyword}`,
      keyword,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createComment(
    value: string,
    position: TokenPosition
  ): CommentToken {
    return {
      type: CSSTokenType.Comment,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createWhitespace(
    value: string,
    position: TokenPosition
  ): WhitespaceToken {
    return {
      type: CSSTokenType.Whitespace,
      value,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + value.length),
      line: position.line,
      column: position.column
    };
  }

  static createImportantFlag(
    position: TokenPosition
  ): ImportantFlagToken {
    return {
      type: CSSTokenType.ImportantFlag,
      value: '!important',
      start: position.start ?? position.column,
      end: position.end ?? (position.column + 10), // Length of '!important'
      line: position.line,
      column: position.column
    };
  }

  static createEOF(
    position: TokenPosition
  ): EOFToken {
    return {
      type: CSSTokenType.EOF,
      start: position.start ?? position.column,
      end: position.end ?? position.column,
      line: position.line,
      column: position.column
    };
  }

  static createError(
    message: string,
    position: TokenPosition
  ): ErrorToken {
    return {
      type: CSSTokenType.Error,
      value: message,
      message,
      start: position.start ?? position.column,
      end: position.end ?? (position.column + message.length),
      line: position.line,
      column: position.column
    };
  }
}