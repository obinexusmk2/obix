/**
 * File readers for CSS processing
 * Part of the OBIX parser module
 */

import { CSSToken } from '../tokenizer/CSSTokenType.js';
import { CSSTokenizer } from '../tokenizer/CSSTokenizer.js';

/**
 * Options for CSS file reading
 */
export interface CSSReaderOptions {
  /** Whether to preserve whitespace tokens */
  preserveWhitespace?: boolean;
  /** Whether to throw errors on parsing issues */
  throwOnError?: boolean;
  /** Encoding for the file (default: utf-8) */
  encoding?: BufferEncoding;
}

/**
 * Result of reading a CSS file
 */
export interface CSSReadResult {
  /** Parsed tokens */
  tokens: CSSToken[];
  /** Raw file content */
  content: string;
  /** File path */
  filePath: string;
  /** Any errors encountered */
  errors: Error[];
}

/**
 * Reads CSS files and provides tokens for parsing
 */
 class CSSFileReader {
  /**
   * Read a CSS file and tokenize it
   * 
   * @param filePath Path to the CSS file
   * @param options Reader options
   * @returns Read result with tokens
   */
  static async readFile(
    filePath: string,
    options: CSSReaderOptions = {}
  ): Promise<CSSReadResult> {
    try {
      // Default options
      const {
        preserveWhitespace = false,
        throwOnError = false,
        encoding = 'utf8'
      } = options;
      
      // Read file content
      let content: string;
      const errors: Error[] = [];
      
      try {
        // In browser environment use fetch
        if (typeof window !== 'undefined') {
          const response = await fetch(filePath);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
          }
          const blob = await response.blob();
          content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(blob, encoding);
          });
        } 
        // In Node.js environment use fs
        else if (typeof process !== 'undefined' && process.versions?.node) {
          const { promises: fs } = await import('fs');
          content = await fs.readFile(filePath, { encoding });
        }
        else {
          throw new Error('Cannot read file: No file system access available');
        }
      } catch (error) {
        errors.push(error as Error);
        if (throwOnError) {
          throw error;
        }
        content = '';
      }
      
      // Tokenize the content
      const tokenizer = new CSSTokenizer(content, {
        preserveWhitespace
      });
      
      const result = tokenizer.tokenize();
      errors.push(...result.errors.map(err => 
        new Error(`${err.message} at line ${err.line}, column ${err.column}`)
      ));
      
      return {
        tokens: result.tokens,
        content,
        filePath,
        errors
      };
    } catch (error) {
      if (options.throwOnError) {
        throw error;
      }
      
      return {
        tokens: [],
        content: '',
        filePath,
        errors: [error as Error]
      };
    }
  }
  
  /**
   * Read multiple CSS files and combine their tokens
   * 
   * @param filePaths Array of file paths
   * @param options Reader options
   * @returns Combined read results
   */
  static async readFiles(
    filePaths: string[],
    options: CSSReaderOptions = {}
  ): Promise<CSSReadResult[]> {
    const results: CSSReadResult[] = [];
    
    for (const filePath of filePaths) {
      try {
        const result = await this.readFile(filePath, {
          ...options,
          throwOnError: false
        });
        results.push(result);
      } catch (error) {
        results.push({
          tokens: [],
          content: '',
          filePath,
          errors: [error as Error]
        });
      }
    }
    
    return results;
  }
  
  /**
   * Read CSS content from a string
   * 
   * @param content CSS content string
   * @param options Reader options
   * @returns Read result with tokens
   */
  static readString(
    content: string,
    options: CSSReaderOptions = {}
  ): CSSReadResult {
    // Default options
    const {
      preserveWhitespace = false,
      throwOnError = false
    } = options;
    
    try {
      // Tokenize the content
      const tokenizer = new CSSTokenizer(content, {
        preserveWhitespace
      });
      
      const result = tokenizer.tokenize();
      const errors = result.errors.map(err => 
        new Error(`${err.message} at line ${err.line}, column ${err.column}`)
      );
      
      return {
        tokens: result.tokens,
        content,
        filePath: 'string',
        errors
      };
    } catch (error) {
      if (throwOnError) {
        throw error;
      }
      
      return {
        tokens: [],
        content,
        filePath: 'string',
        errors: [error as Error]
      };
    }
  }
}

export { CSSFileReader };