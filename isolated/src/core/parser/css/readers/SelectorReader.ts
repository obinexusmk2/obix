import { BaseCSSReader, CSSReaderContext, CSSReaderOptions, CSSReaderResult } from './CSSReader.js';
import { CSSTokenType } from '../tokenizer/CSSTokenType.js';

/**
 * Reader for CSS selectors
 * Handles parsing of selector tokens into structured data
 */
export class SelectorReader extends BaseCSSReader {
  /**
   * Read a CSS selector
   * 
   * @param context Reader context with tokens and state
   * @param options Reader options
   * @returns Reader result with selector data
   */
  read(context: CSSReaderContext, options: CSSReaderOptions = {}): CSSReaderResult {
    const { tokens, index } = context;
    const startIndex = index;
    const selectorParts = [];
    const errors = [];
    
    // Selector token types
    const selectorTokenTypes = [
      CSSTokenType.Selector,
      CSSTokenType.ClassSelector,
      CSSTokenType.IdSelector,
      CSSTokenType.ElementSelector,
      CSSTokenType.PseudoClass,
      CSSTokenType.PseudoElement,
      CSSTokenType.Combinator,
      CSSTokenType.AttributeSelector
    ];
    
    try {
      // Read selector tokens until we hit a non-selector token or end of input
      let currentToken = this.getToken(context);
      
      if (!currentToken || !this.isTokenType(currentToken, selectorTokenTypes)) {
        return this.createFailure(new Error('Expected selector token'));
      }
      
      // Read all selector parts
      while (currentToken && this.isTokenType(currentToken, selectorTokenTypes)) {
        selectorParts.push({
          type: currentToken.type,
          value: currentToken.value
        });
        
        this.advance(context);
        currentToken = this.getToken(context);
        
        // Skip whitespace
        if (currentToken && this.isTokenType(currentToken, CSSTokenType.Whitespace)) {
          this.advance(context);
          currentToken = this.getToken(context);
        }
      }
      
      // Check if we're at a start block token
      if (!currentToken || !this.isTokenType(currentToken, CSSTokenType.StartBlock)) {
        errors.push(new Error('Expected opening brace after selector'));
        if (!options.recover) {
          return this.createFailure(errors[0]);
        }
      }
      
      // Advance past the opening brace
      if (currentToken && this.isTokenType(currentToken, CSSTokenType.StartBlock)) {
        this.advance(context);
      }
      
      // Build selector string
      const selectorText = selectorParts.map(part => part.value).join(' ');
      
      // Return result
      return this.createPartialSuccess(
        {
          selector: selectorText,
          parts: selectorParts
        },
        context.index - startIndex,
        errors
      );
    } catch (error) {
      return this.createFailure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}