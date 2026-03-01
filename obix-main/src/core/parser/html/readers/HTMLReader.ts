export { TagReader, TagReaderOptions } from './TagReader';
export { AttributeReader, AttributeParseResult } from './AttributeReader';
export { ContentReader, ContentReaderOptions } from './ContentReader';

// Combined reader implementation
import { TagReader, TagReaderOptions } from './TagReader.js';
import { AttributeReader } from './AttributeReader.js';
import { ContentReader, ContentReaderOptions } from './ContentReader.js';
import { HTMLToken } from '../tokens/HTMLTokenType.js';

export interface ReaderOptions extends TagReaderOptions, ContentReaderOptions {}

export class HTMLReader {
  public tagReader: TagReader;
  public attributeReader: AttributeReader;
  public contentReader: ContentReader;
  
  constructor(options: ReaderOptions = {}) {
    this.tagReader = new TagReader(options);
    this.attributeReader = new AttributeReader();
    this.contentReader = new ContentReader(options);
  }
  
  /**
   * Read the next token from the input string
   * @param input Input string
   * @param position Current position data
   * @returns Next token and characters consumed
   */
  readNext(
    input: string, 
    position: { start: number; line: number; column: number; }
  ): { token: HTMLToken | null; consumed: number } {
    // Check for empty input
    if (!input || input.length === 0) {
      return { token: null, consumed: 0 };
    }
    
    // Start with tag detection
    if (input.startsWith('<')) {
      // End tag
      if (input.startsWith('</')) {
        return this.tagReader.readEndTag(input, position);
      }
      // Comment
      else if (input.startsWith('<!--')) {
        return this.contentReader.readComment(input, position);
      }
      // DOCTYPE
      else if (input.startsWith('<!DOCTYPE') || input.startsWith('<!doctype')) {
        return this.contentReader.readDoctype(input, position);
      }
      // CDATA
      else if (input.startsWith('<![CDATA[')) {
        return this.contentReader.readCDATA(input, position);
      }
      // Start tag
      else {
        return this.tagReader.readStartTag(input, position);
      }
    }
    
    // Text content
    return this.contentReader.readText(input, position);
  }

  /**
   * Update position based on consumed content
   * @param input Content that was consumed
   * @param position Current position
   * @returns Updated position
   */
  updatePosition(
    input: string, 
    position: { start: number; line: number; column: number; }
  ): { start: number; line: number; column: number } {
    let line = position.line;
    let column = position.column;
    
    for (const char of input) {
      if (char === '\n') {
        line++;
        column = 1;
      } else {
        column++;
      }
    }
    
    return {
      start: position.start + input.length,
      line,
      column
    };
  }
}