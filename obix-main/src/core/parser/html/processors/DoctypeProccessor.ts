// tokenizer/processors/DoctypeProcessor.ts

import { TokenizerProcessor } from './TokenizerProcessor.js';
import { HTMLTokenBuilder } from '../tokens/HTMLTokenBuilder.js';
import { HTMLToken, DoctypeToken } from '../tokens.js';

export class DoctypeProcessor extends TokenizerProcessor {
  /**
   * Process a doctype token from the input
   */
  protected processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number } {
    const match = input.match(/^<!DOCTYPE\s+([^>]+)>/i);
    if (!match) {
      return { token: null, consumed: 0 };
    }
    
    const [fullMatch, doctypeContent] = match;
    const consumed = fullMatch.length;
    
    // Parse public and system identifiers
    let publicId: string | undefined;
    let systemId: string | undefined;
    
    // Basic parsing of PUBLIC and SYSTEM identifiers
    const publicMatch = doctypeContent.match(/PUBLIC\s+["']([^"']*)["']\s+["']([^"']*)["']/i);
    const systemMatch = doctypeContent.match(/SYSTEM\s+["']([^"']*)["']/i);
    
    if (publicMatch) {
      publicId = publicMatch[1];
      systemId = publicMatch[2];
    } else if (systemMatch) {
      systemId = systemMatch[1];
    }
    
    // Extract the doctype name (e.g., 'html')
    const nameMatch = doctypeContent.match(/^([^\s]+)/);
    const name = nameMatch ? nameMatch[1].toLowerCase() : 'html';
    
    const token = HTMLTokenBuilder.createDoctype(
      name,
      position,
      position + consumed,
      this._data.line,
      this._data.column,
      publicId,
      systemId
    );
    
    return { token, consumed };
  }
}