
import { HTMLTokenBuilder } from '../tokens/HTMLTokenBuilder.js';
import { HTMLToken } from '../tokens/index.js';
import { TokenizerProcessor } from './HTMLProcessor.js';

export class CDATAProcessor extends TokenizerProcessor {
  /**
   * Process a CDATA token from the input
   */
  protected processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number } {
    if (!input.startsWith('<![CDATA[')) {
      return { token: null, consumed: 0 };
    }
    
    // Find the end of the CDATA section
    const endIndex = input.indexOf(']]>', 9);
    if (endIndex === -1) {
      // Unclosed CDATA - consume the rest
      const token = HTMLTokenBuilder.createCDATA(
        input.substring(9),
        position,
        position + input.length,
        this._data.line,
        this._data.column
      );
      
      return { token, consumed: input.length };
    }
    
    const cdataContent = input.substring(9, endIndex);
    const consumed = endIndex + 3; // Include ]]>
    
    const token = HTMLTokenBuilder.createCDATA(
      cdataContent,
      position,
      position + consumed,
      this._data.line,
      this._data.column
    );
    
    return { token, consumed };
  }
}