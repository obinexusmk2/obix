// tokenizer/processors/TokenizerProcessor.ts

import { TokenizerError } from '../types.js';
import { HTMLToken } from '../tokens.js';

/**
 * Base processor class for all tokenizer processors using the Data-Oriented Programming pattern.
 * This class implements the separation of data and behavior, allowing for efficient state minimization
 * and automaton-based processing of HTML tokens.
 */
export abstract class TokenizerProcessor {
  // Data model for the processor - contains immutable state information
  protected _data!: {
    input: string;
    position: number;
    line: number;
    column: number;
    errors: TokenizerError[];
  };

  
  // Behavior model for the processor - contains functions that operate on the data
  protected _behavior: {
    // Process a token from the input string
    processToken: (input: string, position: number) => { token: HTMLToken | null; consumed: number };
    // Handle error reporting
    handleError: (message: string, start: number, end: number) => void;
    // Update position tracking based on consumed text
    advance: (text: string, position: { line: number; column: number }) => { line: number; column: number };
  };

  /**
   * Creates a new TokenizerProcessor instance with empty data and bound behaviors
   */
  constructor() {
    this._data = {
      input: '',
      position: 0,
      line: 1,
      column: 1,
      errors: []
    };

    this._behavior = {
      processToken: this.processTokenImpl.bind(this),
      handleError: this.handleErrorImpl.bind(this),
      advance: this.advanceImpl.bind(this)
    };
  }

  /**
   * Set the input data for processing
   * @param input The input string to process
   * @param position The current position in the source
   * @param line The current line number
   * @param column The current column number
   */
  public setData(input: string, position: number, line: number, column: number): void {
    this._data.input = input;
    this._data.position = position;
    this._data.line = line;
    this._data.column = column;
    this._data.errors = [];
  }

  /**
   * Get the current error collection
   * @returns A copy of the current errors array
   */
  public getErrors(): TokenizerError[] {
    return [...this._data.errors];
  }

  /**
   * Process the current input and return a token
   * @returns An object containing the processed token (or null) and the number of characters consumed
   */
  public process(): { token: HTMLToken | null; consumed: number } {
    try {
      return this._behavior.processToken(this._data.input, this._data.position);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.handleErrorImpl(message, this._data.position, this._data.position + 1);
      return { token: null, consumed: 1 }; // Consume one character to avoid infinite loops
    }
  }

  /**
   * Implementation of token processing - to be overridden by subclasses
   * @param input The input string to process
   * @param position The current position in the source
   * @returns An object containing the processed token (or null) and the number of characters consumed
   */
  protected abstract processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number };

  /**
   * Handle an error during token processing
   * @param message The error message
   * @param start The start position of the error
   * @param end The end position of the error
   */
  protected handleErrorImpl(message: string, start: number, end: number): void {
    this._data.errors.push({
      message,
      severity: 'error',
      line: this._data.line,
      column: this._data.column,
      start,
      end
    });
  }

  /**
   * Add a warning during token processing
   * @param message The warning message
   * @param start The start position of the warning
   * @param end The end position of the warning
   */
  protected addWarning(message: string, start: number, end: number): void {
    this._data.errors.push({
      message,
      severity: 'warning',
      line: this._data.line,
      column: this._data.column,
      start,
      end
    });
  }

  /**
   * Update position tracking based on consumed text
   * @param text The text that was consumed
   * @param position The current position information
   * @returns Updated position information with new line and column numbers
   */
  protected advanceImpl(text: string, position: { line: number; column: number }): { line: number; column: number } {
    let line = position.line;
    let column = position.column;
    
    for (const char of text) {
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    return { line, column };
  }

  /**
   * Get the current line and column for position tracking
   * @returns Current line and column
   */
  protected getCurrentPosition(): { line: number; column: number } {
    return {
      line: this._data.line,
      column: this._data.column
    };
  }

  /**
   * Determines if a character is a whitespace character
   * @param char The character to check
   * @returns True if the character is whitespace
   */
  protected isWhitespace(char: string): boolean {
    return /\s/.test(char);
  }

  /**
   * Determines if a character is a valid first character for a tag name
   * @param char The character to check
   * @returns True if the character is valid for starting a tag name
   */
  protected isValidTagNameStart(char: string): boolean {
    return /[a-zA-Z]/.test(char);
  }

  /**
   * Determines if a character is a valid character for a tag name (not first char)
   * @param char The character to check
   * @returns True if the character is valid for a tag name
   */
  protected isValidTagNameChar(char: string): boolean {
    return /[a-zA-Z0-9:-]/.test(char);
  }

  /**
   * Determines if a character is a valid attribute name character
   * @param char The character to check
   * @returns True if the character is valid for an attribute name
   */
  protected isValidAttributeNameChar(char: string): boolean {
    return !/[\s=>/]/.test(char);
  }

  /**
   * Skip whitespace characters in the input string
   * @param input The input string
   * @param startPos The starting position
   * @returns The new position after skipping whitespace
   */
  protected skipWhitespace(input: string, startPos: number): number {
    let pos = startPos;
    while (pos < input.length && this.isWhitespace(input[pos])) {
      pos++;
    }
    return pos;
  }

  /**
   * Create a token result with proper metadata
   * @param token The token to return
   * @param consumed The number of characters consumed
   * @returns A properly formatted token result
   */
  protected createResult(token: HTMLToken | null, consumed: number): { token: HTMLToken | null; consumed: number } {
    return { token, consumed };
  }
}