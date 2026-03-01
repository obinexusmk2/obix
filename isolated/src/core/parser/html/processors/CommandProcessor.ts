// tokenizer/processors/CommentProcessor.ts

import { TokenizerProcessor } from './TokenizerProcessor.js';
import { HTMLTokenBuilder } from '../tokens/HTMLTokenBuilder.js';
import { HTMLToken, CommentToken } from '../tokens.js';

export class CommentProcessor extends TokenizerProcessor {

  /**
   * Process a comment token from the input
   */
  protected processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number } {
    if (!input.startsWith('<!--')) {
      return { token: null, consumed: 0 };
    }
    
    // Find the end of the comment
    const endIndex = input.indexOf('-->', 4);
    if (endIndex === -1) {
      // Unclosed comment - consume the rest as a comment
      const token = HTMLTokenBuilder.createComment(
        input.substring(4),
        position,
        position + input.length,
        this._data.line,
        this._data.column,
        false
      );
      
      return { token , consumed: input.length };
    }
    
    const commentData = input.substring(4, endIndex).trim();
    const consumed = endIndex + 3; // Include -->
    
    // Check if it's a conditional comment
    const isConditional = /^\[if\s+[^\]]+\]/.test(commentData);
    
    const token = HTMLTokenBuilder.createComment(
      commentData,
      position,
      position + consumed,
      this._data.line,
      this._data.column,
      isConditional
    );
    
    return { token, consumed };
  }
}