import { BaseCSSReader, CSSReaderContext, CSSReaderOptions, CSSReaderResult } from './CSSReader.js';
import { CSSTokenType } from '../tokenizer/CSSTokenType.js';

/**
 * Reader for CSS properties
 * Handles parsing of property tokens into structured data
 */
export class PropertyReader extends BaseCSSReader {
  /**
   * Read a CSS property
   * 
   * @param context Reader context with tokens and state
   * @param options Reader options
   * @returns Reader result with property data
   */
  read(context: CSSReaderContext, options: CSSReaderOptions = {}): CSSReaderResult {
    const { tokens, index } = context;
    const startIndex = index;
    const errors = [];
    
    try {
      // Get property token
      const propertyToken = this.getToken(context);
      
      if (!propertyToken || !this.isTokenType(propertyToken, CSSTokenType.Property)) {
        return this.createFailure(new Error('Expected property token'));
      }
      
      // Advance past property token
      this.advance(context);
      
      // Check for colon
      const colonToken = this.getToken(context);
      
      if (!colonToken || !this.isTokenType(colonToken, CSSTokenType.Colon)) {
        errors.push(new Error('Expected colon after property name'));
        if (!options.recover) {
          return this.createFailure(errors[0]);
        }
      } else {
        // Advance past colon
        this.advance(context);
      }
      
      // Return property data
      return this.createPartialSuccess(
        {
          property: propertyToken.value,
          position: {
            start: propertyToken.position?.start,
            end: propertyToken.position?.end,
            line: propertyToken.position?.line,
            column: propertyToken.position?.column
          }
        },
        context.index - startIndex,
        errors
      );
    } catch (error) {
      return this.createFailure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}