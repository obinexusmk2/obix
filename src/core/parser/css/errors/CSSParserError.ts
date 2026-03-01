import { CSSToken } from '../tokenizer/CSSTokenType.js';

/**
 * Enum representing different categories of CSS parsing errors
 */
export enum CSSParserErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  INCOMPLETE_RULE = 'INCOMPLETE_RULE',
  INVALID_DECLARATION = 'INVALID_DECLARATION',
  UNEXPECTED_TOKEN = 'UNEXPECTED_TOKEN',
  MALFORMED_AT_RULE = 'MALFORMED_AT_RULE',
  UNCLOSED_BLOCK = 'UNCLOSED_BLOCK',
  INVALID_SELECTOR = 'INVALID_SELECTOR',
  INVALID_PROPERTY = 'INVALID_PROPERTY',
  INVALID_VALUE = 'INVALID_VALUE'
}

/**
 * Detailed error information for CSS parsing
 */
export interface CSSParserErrorDetails {
  type: CSSParserErrorType;
  message: string;
  token?: CSSToken;
  line?: number;
  column?: number;
  context?: string;
}

/**
 * Advanced CSS Parser Error class with state machine integration
 */
export class CSSParserError extends Error {
  public readonly errorType: CSSParserErrorType;
  public readonly token?: CSSToken;
  public readonly line?: number;
  public readonly column?: number;
  public readonly context?: string;

  constructor(details: CSSParserErrorDetails) {
    super(details.message);
    this.name = 'CSSParserError';
    this.errorType = details.type;
    this.token = details.token;
    this.line = details.line ?? details.token?.line;
    this.column = details.column ?? details.token?.column;
    this.context = details.context;
  }

  /**
   * Create a detailed error for unexpected tokens
   */
  public static createUnexpectedTokenError(
    currentToken: CSSToken, 
    expectedTokenTypes?: string[]
  ): CSSParserError {
    const expectedTypes = expectedTokenTypes 
      ? expectedTokenTypes.join(' or ') 
      : 'valid token';

    return new CSSParserError({
      type: CSSParserErrorType.UNEXPECTED_TOKEN,
      message: `Unexpected token '${currentToken.value}'. Expected ${expectedTypes}.`,
      token: currentToken
    });
  }

  /**
   * Create an error for incomplete or malformed rules
   */
  public static createIncompleteRuleError(
    startToken: CSSToken, 
    ruleType: 'selector' | 'at-rule' | 'declaration'
  ): CSSParserError {
    return new CSSParserError({
      type: CSSParserErrorType.INCOMPLETE_RULE,
      message: `Incomplete ${ruleType} starting with '${startToken.value}'`,
      token: startToken
    });
  }

  /**
   * Create an error for invalid property or value
   */
  public static createInvalidPropertyError(
    propertyToken: CSSToken, 
    reason?: string
  ): CSSParserError {
    return new CSSParserError({
      type: CSSParserErrorType.INVALID_PROPERTY,
      message: `Invalid CSS property: '${propertyToken.value}'${reason ? `. ${reason}` : ''}`,
      token: propertyToken
    });
  }

  /**
   * Create an error for unclosed blocks
   */
  public static createUnclosedBlockError(
    startToken: CSSToken
  ): CSSParserError {
    return new CSSParserError({
      type: CSSParserErrorType.UNCLOSED_BLOCK,
      message: `Unclosed block starting with '${startToken.value}'`,
      token: startToken
    });
  }

  /**
   * Generate a comprehensive error report
   */
  public toErrorReport(): string {
    const errorParts = [
      `Type: ${this.errorType}`,
      `Message: ${this.message}`,
      this.token && `Token: ${this.token.value}`,
      this.line !== undefined && `Line: ${this.line}`,
      this.column !== undefined && `Column: ${this.column}`,
      this.context && `Context: ${this.context}`
    ].filter(Boolean);

    return errorParts.join('\n');
  }

  /**
   * Error recovery strategy factory
   */
  public static recoverFromError(
    error: CSSParserError, 
    currentState: any
  ): { recovered: boolean; newState?: any } {
    switch (error.errorType) {
      case CSSParserErrorType.UNEXPECTED_TOKEN:
        // Strategy: Skip token and continue parsing
        return { 
          recovered: true, 
          newState: { 
            ...currentState, 
            position: (currentState.position || 0) + 1 
          }
        };

      case CSSParserErrorType.INCOMPLETE_RULE:
        // Strategy: Attempt to find next valid parsing point
        return { 
          recovered: true, 
          newState: { 
            ...currentState, 
            skipToNextRule: true 
          }
        };

      case CSSParserErrorType.UNCLOSED_BLOCK:
        // Strategy: Force close the current block
        return { 
          recovered: true, 
          newState: { 
            ...currentState, 
            forceCloseBlock: true 
          }
        };

      default:
        return { recovered: false };
    }
  }
}

/**
 * Error logging and tracking utility
 */
export class CSSParserErrorTracker {
  public errors: CSSParserError[] = [];

  /**
   * Add a new parsing error
   */
  public addError(error: CSSParserError): void {
    this.errors.push(error);
  }

  /**
   * Get all collected errors
   */
  public getErrors(): CSSParserError[] {
    return [...this.errors];
  }

  /**
   * Check if any errors have been encountered
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Clear all tracked errors
   */
  public clearErrors(): void {
    this.errors = [];
  }

  /**
   * Generate a comprehensive error summary
   */
  public generateErrorSummary(): string {
    if (this.errors.length === 0) return 'No parsing errors';

    return this.errors
      .map((error, index) => 
        `Error ${index + 1}:\n${error.toErrorReport()}`
      )
      .join('\n\n');
  }

  /**
   * Count errors by type
   */
  public getErrorTypeCounts(): Record<CSSParserErrorType, number> {
    return this.errors.reduce((counts, error) => {
      counts[error.errorType] = (counts[error.errorType] || 0) + 1;
      return counts;
    }, {} as Record<CSSParserErrorType, number>);
  }
}