import { CSSReader } from './CSSReader.js';
import { SelectorReader } from './SelectorReader.js';
import { PropertyReader } from './PropertyReader.js';
import { ValueReader } from './ValueReader.js';
import { AtRuleReader } from './AtRuleReader.js';
import { BlockReader } from './BlockReader.js';
import { CSSTokenType } from '../tokenizer/CSSTokenType.js';

/**
 * Factory for creating appropriate reader based on token type
 */
export class ReaderFactory {
  public static readers: Map<string, CSSReader> = new Map();
  
  /**
   * Get a reader for the specified token type
   * 
   * @param tokenType Token type to get reader for
   * @returns Appropriate reader or undefined
   */
  static getReader(tokenType: string): CSSReader | undefined {
    // Initialize readers on first use
    if (this.readers.size === 0) {
      this.initializeReaders();
    }
    
    return this.readers.get(tokenType);
  }
  
  /**
   * Initialize all available readers
   */
  public static initializeReaders(): void {
    const selectorReader = new SelectorReader();
    const propertyReader = new PropertyReader();
    const valueReader = new ValueReader();
    const atRuleReader = new AtRuleReader();
    const blockReader = new BlockReader();
    
    // Map token types to appropriate readers
    this.readers.set(CSSTokenType.Selector, selectorReader);
    this.readers.set(CSSTokenType.ClassSelector, selectorReader);
    this.readers.set(CSSTokenType.IdSelector, selectorReader);
    this.readers.set(CSSTokenType.ElementSelector, selectorReader);
    
    this.readers.set(CSSTokenType.Property, propertyReader);
    
    this.readers.set(CSSTokenType.Value, valueReader);
    this.readers.set(CSSTokenType.Number, valueReader);
    this.readers.set(CSSTokenType.Color, valueReader);
    this.readers.set(CSSTokenType.String, valueReader);
    
    this.readers.set(CSSTokenType.AtKeyword, atRuleReader);
    
    this.readers.set(CSSTokenType.StartBlock, blockReader);
  }
  
  /**
   * Get appropriate reader for the current context
   * 
   * @param context Reader context
   * @returns Appropriate reader or undefined
   */
  static getReaderForContext(context: { tokens: any[], index: number }): CSSReader | undefined {
    const currentToken = context.tokens[context.index];
    
    if (!currentToken) {
      return undefined;
    }
    
    return this.getReader(currentToken.type);
  }
}