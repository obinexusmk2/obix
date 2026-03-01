import { ProcessorFactory } from "../processors/ProcessorFactory";
import { TokenizerError, TokenizerOptions, TokenizerResult } from "../types";
import { HTMLToken } from "./HTMLToken";



export class HTMLTokenizer {
  public _input: string;
  public _position: number;
  public _line: number;
  public _column: number;
  public _tokens: HTMLToken[];
  public _errors: TokenizerError[];
  public _options: TokenizerOptions;
  public _processorFactory: ProcessorFactory;

  constructor(input: string, options: TokenizerOptions = {}) {
    this._input = input;
    this._position = 0;
    this._line = 1;
    this._column = 1;
    this._tokens = [];
    this._errors = [];
    this._options = {
      xmlMode: false,
      recognizeCDATA: true,
      recognizeConditionalComments: true,
      preserveWhitespace: false,
      allowUnclosedTags: true,
      advanced: false,
      ...options
    };
    
    // Initialize processor factory
    this._processorFactory = new ProcessorFactory(this._options);
  }

  public tokenize(): TokenizerResult {
    while (this._position < this._input.length) {
      const remainingInput = this._input.slice(this._position);
      
      // Get appropriate processor for the current input
      const processor = this._processorFactory.getProcessorForInput(remainingInput);
      
      // Set processor data
      processor.setData(remainingInput, this._position, this._line, this._column);
      
      // Process token
      const { token, consumed } = processor.process();
      
      // Add token if valid
      if (token) {
        this._tokens.push(token);
      }
      
      // Add any errors from the processor
      this._errors.push(...processor.getErrors());
      
      if (consumed > 0) {
        // Update position based on consumed text
        const consumedText = remainingInput.substring(0, consumed);
        this.advance(consumedText);
      } else {
        // If nothing was consumed, advance by one character to avoid infinite loop
        this.advance(remainingInput.charAt(0));
      }
    }

    // Add EOF token
    this._tokens.push(new HTMLToken({
      type: 'EOF',
      position: { start: this._position, end: this._position, line: this._line, column: this._column },
      metadata: { equivalenceClass: 0, stateSignature: '', isMinimized: false },
      properties: {},
    })) as unknown as HTMLToken;

    return {
      tokens: this._tokens,
      errors: this._errors
    };
  }
  
  /**
   * Advance position based on consumed text
   */
  public advance(text: string): void {
    for (const char of text) {
      if (char === '\n') {
        this._line++;
        this._column = 1;
      } else {
        this._column++;
      }
      this._position++;
    }
  }
}