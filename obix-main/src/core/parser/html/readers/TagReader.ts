import { StartTagToken, HTMLTokenBuilder, EndTagToken } from "../tokens.js";

export interface TagReaderOptions {
  xmlMode?: boolean;
  selfClosingAsVoid?: boolean;
}

export class TagReader {
  public options: TagReaderOptions;

  constructor(options: TagReaderOptions = {}) {
    this.options = {
      xmlMode: false,
      selfClosingAsVoid: false,
      ...options
    };
  }

  /**
   * Read a start tag from the input string
   * @param content Input string starting with '<'
   * @param position Current position data
   * @returns StartTagToken or null if not a valid start tag
   */
  readStartTag(
    content: string, 
    position: { start: number; line: number; column: number; }
  ): { token: StartTagToken | null; consumed: number } {
    const match = content.match(/^<([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^>\/\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/?)>/);
    
    if (!match) {
      return { token: null, consumed: 0 };
    }
    
    const [fullMatch, tagName, attributesStr, selfClosing] = match;
    const consumed = fullMatch.length;
    const end = position.start + consumed;
    
    // Handle XML namespaces if in XML mode
    let namespace: string | undefined;
    let localName = tagName.toLowerCase();
    
    if (this.options.xmlMode && tagName.includes(':')) {
      const [ns, name] = tagName.split(':');
      namespace = ns;
      localName = name.toLowerCase();
    }

    // Parse attributes
    const attributes = this.parseAttributes(attributesStr);
    
    // Create token using the builder
    const token = HTMLTokenBuilder.createStartTag(
      localName,
      attributes,
      !!selfClosing || ((this.options.selfClosingAsVoid ?? false) && this.isVoidElement(localName)),
      position.start,
      end,
      position.line,
      position.column,
      namespace
    );
    
    return { token, consumed };
  }

  /**
   * Read an end tag from the input string
   * @param content Input string starting with '</'
   * @param position Current position data
   * @returns EndTagToken or null if not a valid end tag
   */
  readEndTag(
    content: string, 
    position: { start: number; line: number; column: number; }
  ): { token: EndTagToken | null; consumed: number } {
    const match = content.match(/^<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>/);
    
    if (!match) {
      return { token: null, consumed: 0 };
    }
    
    const [fullMatch, tagName] = match;
    const consumed = fullMatch.length;
    const end = position.start + consumed;
    
    // Handle XML namespaces if in XML mode
    let namespace: string | undefined;
    let localName = tagName.toLowerCase();
    
    if (this.options.xmlMode && tagName.includes(':')) {
      const [ns, name] = tagName.split(':');
      namespace = ns;
      localName = name.toLowerCase();
    }
    
    // Create token using the builder
    const token = HTMLTokenBuilder.createEndTag(
      localName,
      position.start,
      end,
      position.line,
      position.column,
      namespace
    );
    
    return { token, consumed };
  }

  /**
   * Parse attribute string into a map of attribute names to values
   * @param attributesStr String containing HTML attributes
   * @returns Map of attribute names to their values
   */
  public parseAttributes(attributesStr: string): Map<string, string> {
    const attributes = new Map<string, string>();
    const pattern = /([^=\s]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
    let match: RegExpExecArray | null;
    
    while ((match = pattern.exec(attributesStr))) {
      const [, name, quotedValue1, quotedValue2, unquotedValue] = match;
      const value = quotedValue1 || quotedValue2 || unquotedValue || '';
      attributes.set(name.toLowerCase(), value);
    }
    
    return attributes;
  }

  /**
   * Check if an element is a void element (self-closing by definition)
   * @param tagName Tag name to check
   * @returns True if the element is a void element
   */
  public isVoidElement(tagName: string): boolean {
    return [
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
      'link', 'meta', 'param', 'source', 'track', 'wbr'
    ].includes(tagName);
  }
}