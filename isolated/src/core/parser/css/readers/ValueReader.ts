import { BaseCSSReader, CSSReaderContext, CSSReaderOptions, CSSReaderResult } from './CSSReader.js';
import { CSSTokenType } from '../tokenizer/CSSTokenType.js';

/**
 * Reader for CSS values
 * Handles parsing of value tokens into structured data
 */
export class ValueReader extends BaseCSSReader {
  /**
   * Read a CSS value
   * 
   * @param context Reader context with tokens and state
   * @param options Reader options
   * @returns Reader result with value data
   */
  read(context: CSSReaderContext, options: CSSReaderOptions = {}): CSSReaderResult {
    const { tokens, index } = context;
    const startIndex = index;
    const valueParts = [];
    const errors = [];
    
    // Value token types
    const valueTokenTypes = [
      CSSTokenType.Value,
      CSSTokenType.Number,
      CSSTokenType.Unit,
      CSSTokenType.Color,
      CSSTokenType.String,
      CSSTokenType.URL,
      CSSTokenType.Function
    ];
    
    try {
      // Read value tokens until we hit a semicolon or end of block
      let currentToken = this.getToken(context);
      
      if (!currentToken || !this.isTokenType(currentToken, valueTokenTypes)) {
        return this.createFailure(new Error('Expected value token'));
      }
      
      // Read all value parts
      let important = false;
      let functionDepth = 0;
      
      while (currentToken && 
             (this.isTokenType(currentToken, valueTokenTypes) || 
              (functionDepth > 0 && !this.isTokenType(currentToken, CSSTokenType.Semicolon)) || 
              this.isTokenType(currentToken, CSSTokenType.ImportantFlag))) {
        
        // Handle function tokens
        if (this.isTokenType(currentToken, CSSTokenType.Function)) {
          functionDepth++;
          valueParts.push({
            type: currentToken.type,
            value: currentToken.value
          });
        }
        else if (this.isTokenType(currentToken, CSSTokenType.CloseParen) && functionDepth > 0) {
          functionDepth--;
          valueParts.push({
            type: currentToken.type,
            value: currentToken.value
          });
        }
        else if (this.isTokenType(currentToken, CSSTokenType.ImportantFlag)) {
          important = true;
        }
        else {
          valueParts.push({
            type: currentToken.type,
            value: currentToken.value
          });
        }
        
        this.advance(context);
        currentToken = this.getToken(context);
        
        // Skip whitespace
        if (currentToken && this.isTokenType(currentToken, CSSTokenType.Whitespace)) {
          this.advance(context);
          currentToken = this.getToken(context);
        }
      }
      
      // Check for semicolon
      if (currentToken && this.isTokenType(currentToken, CSSTokenType.Semicolon)) {
        this.advance(context);
      } else {
        errors.push(new Error('Expected semicolon after property value'));
        if (!options.recover) {
          return this.createFailure(errors[0]);
        }
      }
      
      // Build value string
      const valueText = valueParts.map(part => part.value).join(' ');
      
      // Return result
      return this.createPartialSuccess(
        {
          value: valueText,
          parts: valueParts,
          important
        },
        context.index - startIndex,
        errors
      );
    } catch (error) {
      return this.createFailure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}