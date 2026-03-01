import { BaseCSSReader, CSSReaderContext, CSSReaderOptions, CSSReaderResult } from './CSSReader.js';
import { CSSTokenType } from '../tokenizer/CSSTokenType.js';
import { PropertyReader } from './PropertyReader.js';
import { ValueReader } from './ValueReader.js';
import { SelectorReader } from './SelectorReader.js';

/**
 * Reader for CSS blocks (rule blocks, at-rule blocks)
 * Handles parsing of block tokens into structured data
 */
export class BlockReader extends BaseCSSReader {
  public propertyReader: PropertyReader;
  public valueReader: ValueReader;
  public selectorReader: SelectorReader;
  
  constructor() {
    super();
    this.propertyReader = new PropertyReader();
    this.valueReader = new ValueReader();
    this.selectorReader = new SelectorReader();
  }
  
  /**
   * Read a CSS block
   * 
   * @param context Reader context with tokens and state
   * @param options Reader options
   * @returns Reader result with block data
   */
  read(context: CSSReaderContext, options: CSSReaderOptions = {}): CSSReaderResult {
    const { tokens, index } = context;
    const startIndex = index;
    const declarations = [];
    const rules = [];
    const errors = [];
    
    try {
      // Check for start block token
      let currentToken = this.getToken(context);
      
      if (!currentToken || !this.isTokenType(currentToken, CSSTokenType.StartBlock)) {
        return this.createFailure(new Error('Expected opening brace'));
      }
      
      // Advance past opening brace
      this.advance(context);
      
      // Read block contents
      currentToken = this.getToken(context);
      
      // Track nesting level for proper block closing
      let nestedBlockLevel = 1;
      
      while (currentToken && nestedBlockLevel > 0) {
        // Check for block end
        if (this.isTokenType(currentToken, CSSTokenType.EndBlock)) {
          nestedBlockLevel--;
          if (nestedBlockLevel === 0) {
            // End of the block we're reading
            this.advance(context);
            break;
          }
          this.advance(context);
          currentToken = this.getToken(context);
          continue;
        }
        
        // Check for nested blocks
        if (this.isTokenType(currentToken, CSSTokenType.StartBlock)) {
          nestedBlockLevel++;
          this.advance(context);
          currentToken = this.getToken(context);
          continue;
        }
        
        // Check for declarations
        if (this.isTokenType(currentToken, CSSTokenType.Property)) {
          const propertyResult = this.propertyReader.read(context, options);
          
          if (!propertyResult.success) {
            errors.push(...propertyResult.errors);
            if (!options.recover) {
              return this.createFailure(errors[0]);
            }
            // Skip to next semicolon or block end to recover
            this.skipToRecover(context);
          } else {
            const property = propertyResult.data;
            
            // Read value
            const valueResult = this.valueReader.read(context, options);
            
            if (!valueResult.success) {
              errors.push(...valueResult.errors);
              if (!options.recover) {
                return this.createFailure(errors[0]);
              }
              // Skip to next semicolon or block end to recover
              this.skipToRecover(context);
            } else {
              const value = valueResult.data;
              
              // Add declaration
              declarations.push({
                property: property.property,
                value: value.value,
                important: value.important
              });
            }
          }
        }
        // Check for nested rules (in at-rules)
        else if (this.isTokenType(currentToken, [
          CSSTokenType.Selector,
          CSSTokenType.ClassSelector,
          CSSTokenType.IdSelector,
          CSSTokenType.ElementSelector
        ])) {
          const selectorResult = this.selectorReader.read(context, options);
          
          if (!selectorResult.success) {
            errors.push(...selectorResult.errors);
            if (!options.recover) {
              return this.createFailure(errors[0]);
            }
            // Skip to next block end to recover
            this.skipToBlockEnd(context);
          } else {
            const selector = selectorResult.data;
            
            // Read rule block
            const blockResult = this.read(context, options);
            
            if (!blockResult.success) {
              errors.push(...blockResult.errors);
              if (!options.recover) {
                return this.createFailure(errors[0]);
              }
            } else {
              // Add nested rule
              rules.push({
                selector: selector.selector,
                declarations: blockResult.data.declarations
              });
            }
          }
        }
        // Skip other tokens
        else {
          this.advance(context);
          currentToken = this.getToken(context);
        }
        
        // Update current token
        currentToken = this.getToken(context);
      }
      
      // Return block data
      return this.createPartialSuccess(
        {
          declarations,
          rules
        },
        context.index - startIndex,
        errors
      );
    } catch (error) {
      return this.createFailure(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * Skip to the next semicolon or block end for error recovery
   * 
   * @param context Reader context
   */
  public skipToRecover(context: CSSReaderContext): void {
    let currentToken = this.getToken(context);
    
    while (currentToken && !this.isTokenType(currentToken, [CSSTokenType.Semicolon, CSSTokenType.EndBlock])) {
      this.advance(context);
      currentToken = this.getToken(context);
    }
    
    // Advance past the semicolon or block end
    if (currentToken) {
      this.advance(context);
    }
  }
  
  /**
   * Skip to the next block end for error recovery
   * 
   * @param context Reader context
   */
  public skipToBlockEnd(context: CSSReaderContext): void {
    let currentToken = this.getToken(context);
    let nestedLevel = 0;
    
    while (currentToken) {
      if (this.isTokenType(currentToken, CSSTokenType.StartBlock)) {
        nestedLevel++;
      } else if (this.isTokenType(currentToken, CSSTokenType.EndBlock)) {
        if (nestedLevel === 0) {
          // Found the block end we were looking for
          this.advance(context);
          break;
        }
        nestedLevel--;
      }
      
      this.advance(context);
      currentToken = this.getToken(context);
    }
  }
}