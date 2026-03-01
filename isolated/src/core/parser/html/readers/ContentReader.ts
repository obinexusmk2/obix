import { TextToken, HTMLTokenBuilder, CommentToken, CDATAToken, DoctypeToken } from "../tokens.js";

export interface ContentReaderOptions {
  preserveWhitespace?: boolean;
  recognizeCDATA?: boolean;
  recognizeConditionalComments?: boolean;
}

export class ContentReader {
  public options: ContentReaderOptions;
  
  constructor(options: ContentReaderOptions = {}) {
    this.options = {
      preserveWhitespace: false,
      recognizeCDATA: true,
      recognizeConditionalComments: true,
      ...options
    };
  }

  /**
   * Read text content from the input string
   * @param content Input string
   * @param position Current position data
   * @returns TextToken and number of characters consumed
   */
  readText(
    content: string,
    position: { start: number; line: number; column: number; }
  ): { token: TextToken | null; consumed: number } {
    // Read until a < character or end of input
    let endIndex = 0;
    while (endIndex < content.length && content[endIndex] !== '<') {
      endIndex++;
    }
    
    // No text content
    if (endIndex === 0) {
      return { token: null, consumed: 0 };
    }
    
    const textContent = content.substring(0, endIndex);
    const isWhitespace = /^\s*$/.test(textContent);
    
    // Skip whitespace-only text nodes unless preserveWhitespace is true
    if (isWhitespace && !this.options.preserveWhitespace) {
      return { token: null, consumed: endIndex };
    }
    
    const token = HTMLTokenBuilder.createText(
      textContent,
      isWhitespace,
      position.start,
      position.start + endIndex,
      position.line,
      position.column
    );
    
    return { token, consumed: endIndex };
  }

  /**
   * Read a comment from the input string
   * @param content Input string starting with '<!--'
   * @param position Current position data
   * @returns CommentToken and number of characters consumed
   */
  readComment(
    content: string,
    position: { start: number; line: number; column: number; }
  ): { token: CommentToken | null; consumed: number } {
    // Check if we have a comment
    if (!content.startsWith('<!--')) {
      return { token: null, consumed: 0 };
    }
    
    // Find the end of the comment
    const endIndex = content.indexOf('-->', 4);
    if (endIndex === -1) {
      // Unclosed comment, consume the rest of the content
      const token = HTMLTokenBuilder.createComment(
        content.substring(4).trim(),
        position.start,
        position.start + content.length,
        position.line,
        position.column,
        false
      );
      
      return { token, consumed: content.length };
    }
    
    const commentData = content.substring(4, endIndex).trim();
    const consumed = endIndex + 3; // Include -->
    
    // Check if it's a conditional comment
    let isConditional = false;
    if (this.options.recognizeConditionalComments) {
      isConditional = /^\[if\s+[^\]]+\]/.test(commentData);
    }
    
    const token = HTMLTokenBuilder.createComment(
      commentData,
      position.start,
      position.start + consumed,
      position.line,
      position.column,
      isConditional
    );
    
    return { token, consumed };
  }

  /**
   * Read a CDATA section from the input string
   * @param content Input string starting with '<![CDATA['
   * @param position Current position data
   * @returns CDATAToken and number of characters consumed
   */
  readCDATA(
    content: string,
    position: { start: number; line: number; column: number; }
  ): { token: CDATAToken | null; consumed: number } {
    // Check if CDATA recognition is enabled
    if (!this.options.recognizeCDATA) {
      return { token: null, consumed: 0 };
    }
    
    // Check if we have a CDATA section
    if (!content.startsWith('<![CDATA[')) {
      return { token: null, consumed: 0 };
    }
    
    // Find the end of the CDATA section
    const endIndex = content.indexOf(']]>', 9);
    if (endIndex === -1) {
      // Unclosed CDATA, consume the rest of the content
      const token = HTMLTokenBuilder.createCDATA(
        content.substring(9),
        position.start,
        position.start + content.length,
        position.line,
        position.column
      );
      
      return { token, consumed: content.length };
    }
    
    const cdataContent = content.substring(9, endIndex);
    const consumed = endIndex + 3; // Include ]]>
    
    const token = HTMLTokenBuilder.createCDATA(
      cdataContent,
      position.start,
      position.start + consumed,
      position.line,
      position.column
    );
    
    return { token, consumed };
  }

  /**
   * Read a DOCTYPE declaration from the input string
   * @param content Input string starting with '<!DOCTYPE'
   * @param position Current position data
   * @returns DoctypeToken and number of characters consumed
   */
  readDoctype(
    content: string,
    position: { start: number; line: number; column: number; }
  ): { token: DoctypeToken | null; consumed: number } {
    // Check if we have a DOCTYPE declaration
    const match = content.match(/^<!DOCTYPE\s+([^>]+)>/i);
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
      position.start,
      position.start + consumed,
      position.line,
      position.column,
      publicId,
      systemId
    );
    
    return { token, consumed };
  }
}