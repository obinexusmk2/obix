// tokenizer/processors/TextProcessor.ts

import { TokenizerProcessor } from './TokenizerProcessor.js';
import { HTMLTokenBuilder } from '../tokens/HTMLTokenBuilder.js';
import { HTMLToken, TextToken } from '../tokens.js';

export class TextProcessor extends TokenizerProcessor {
  public preserveWhitespace: boolean;
  
  constructor(preserveWhitespace: boolean = false) {
    super();
    this.preserveWhitespace = preserveWhitespace;
  }
  
  /**
   * Process a text token from the input
   */
  protected processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number } {
    // Read until a < character or end of input
    let endIndex = 0;
    while (endIndex < input.length && input[endIndex] !== '<') {
      endIndex++;
    }
    
    // No text content
    if (endIndex === 0) {
      return { token: null, consumed: 0 };
    }
    
    const textContent = input.substring(0, endIndex);
    const isWhitespace = /^\s*$/.test(textContent);
    
    // Skip whitespace-only text nodes unless preserveWhitespace is true
    if (isWhitespace && !this.preserveWhitespace) {
      return { token: null, consumed: endIndex };
    }
    
    const token = HTMLTokenBuilder.createText(
      textContent,
      isWhitespace,
      position,
      position + endIndex,
      this._data.line,
      this._data.column
    );
    
    return { token, consumed: endIndex };
  }
}