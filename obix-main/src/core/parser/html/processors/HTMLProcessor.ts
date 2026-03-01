// tokenizer/processors/TokenizerProcessor.ts

import { TokenizerError } from '../types.js';
import { HTMLToken } from '../tokens.js';

/**
 * Base processor class for all tokenizer processors using DOP pattern
 */
export abstract class TokenizerProcessor {
  // Data model for the processor
  protected _data: {
    input: string;
    position: number;
    line: number;
    column: number;
    errors: TokenizerError[];
  };

  // Behavior model for the processor
  protected _behavior: {
    processToken: (input: string, position: number) => { token: HTMLToken | null; consumed: number };
    handleError: (message: string, start: number, end: number) => void;
    advance: (text: string, position: { line: number; column: number }) => { line: number; column: number };
  };

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
   * Set the input and position data
   */
  public setData(input: string, position: number, line: number, column: number): void {
    this._data.input = input;
    this._data.position = position;
    this._data.line = line;
    this._data.column = column;
  }

  /**
   * Get current errors
   */
  public getErrors(): TokenizerError[] {
    return [...this._data.errors];
  }

  /**
   * Process the current input
   */
  public process(): { token: HTMLToken | null; consumed: number } {
    return this._behavior.processToken(this._data.input, this._data.position);
  }

  /**
   * Implementation of token processing - to be overridden by subclasses
   */
  protected abstract processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number };

  /**
   * Handle an error
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
   * Advance position based on consumed text
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
}