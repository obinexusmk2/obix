import { BaseCSSReader, CSSReaderContext, CSSReaderOptions, CSSReaderResult } from './CSSReader.js';
import { CSSTokenType } from '../tokenizer/CSSTokenType.js';
import { BlockReader } from './BlockReader.js';

/**
 * Reader for CSS at-rules (e.g., @media, @keyframes)
 * Handles parsing of at-rule tokens into structured data
 */
export class AtRuleReader extends BaseCSSReader {
  public blockReader: BlockReader;
  
  constructor() {
    super();
    this.blockReader = new BlockReader();
  }
  
  /**
   * Read a CSS at-rule
   * 
   * @param context Reader context with tokens and state
   * @param options Reader options
   * @returns Reader result with at-rule data
   */
  read(context: CSSReaderContext, options: CSSReaderOptions = {}): CSSReaderResult {
    const { tokens, index } = context;
    const startIndex = index;
    const preludeParts = [];
    const errors = [];
    
    try {
      // Get at-rule token
      const atRuleToken = this.getToken(context);
      
      if (!atRuleToken || !this.isTokenType(atRuleToken, CSSTokenType.AtKeyword)) {
        return this.createFailure(new Error('Expected at-rule token'));
      }
      
      // Extract at-rule name
      const name = atRuleToken.keyword || atRuleToken.value.substring(1);
      
      // Advance past at-rule token
      this.advance(context);
      
      // Read prelude tokens until we hit a semicolon or block start
      let currentToken = this.getToken(context);
      
      while (currentToken && 
             !this.isTokenType(currentToken, [CSSTokenType.Semicolon, CSSTokenType.StartBlock])) {
        preludeParts.push({
          type: currentToken.type,
          value: currentToken.value
        });
        
        this.advance(context);
        currentToken = this.getToken(context);
      }
      
      // Build prelude string
      const prelude = preludeParts.map(part => part.value).join(' ');
      
      // Check if we have a block or just a semicolon
      let block = null;
      
      if (currentToken && this.isTokenType(currentToken, CSSTokenType.StartBlock)) {
        // Read block
        const blockResult = this.blockReader.read(context, options);
        
        if (!blockResult.success) {
          errors.push(...blockResult.errors);
          if (!options.recover) {
            return this.createFailure(errors[0]);
          }
        } else {
          block = blockResult.data;
        }
      } else if (currentToken && this.isTokenType(currentToken, CSSTokenType.Semicolon)) {
        // Advance past semicolon
        this.advance(context);
      } else {
        errors.push(new Error('Expected semicolon or opening brace after at-rule'));
        if (!options.recover) {
          return this.createFailure(errors[0]);
        }
      }
      
      // Return result
      return this.createPartialSuccess(
        {
          type: 'at-rule',
          name,
          prelude,
          block
        },
        context.index - startIndex,
        errors
      );
    } catch (error) {
      return this.createFailure(error instanceof Error ? error : new Error(String(error)));
    }
  }
}