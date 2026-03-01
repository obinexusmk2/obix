import { HTMLToken, StartTagToken, HTMLTokenBuilder, EndTagToken } from "../tokens.js";
import { AttributeProcessor } from "./AttributeProcessor.js";
import { TokenizerProcessor } from "./HTMLProcessor.js";


export class TagProcessor extends TokenizerProcessor {
  public attributeProcessor: AttributeProcessor;
  
  constructor() {
    super();
    this.attributeProcessor = new AttributeProcessor();
  }

  /**
   * Process a tag token from the input
   */
  protected processTokenImpl(input: string, position: number): { token: HTMLToken | null; consumed: number } {
    if (!input.startsWith('<')) {
      return { token: null, consumed: 0 };
    }

    // Check if it's an end tag
    if (input.startsWith('</')) {
      return this.processEndTag(input, position);
    }
    
    // Otherwise it's a start tag
    return this.processStartTag(input, position);
  }

  /**
   * Process a start tag
   */
  public processStartTag(input: string, position: number): { token: StartTagToken | null; consumed: number } {
    const match = input.match(/^<([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^>\/\s]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^>\s]+))?)*)\s*(\/?)>/);
    
    if (!match) {
      return { token: null, consumed: 0 };
    }
    
    const [fullMatch, tagName, attributesStr, selfClosing] = match;
    const consumed = fullMatch.length;
    const end = position + consumed;
    
    // Process attributes
    const { attributes } = this.attributeProcessor.parseAttributes(attributesStr);
    
    // Create token
    const token = HTMLTokenBuilder.createStartTag(
      tagName.toLowerCase(),
      attributes,
      Boolean(selfClosing),
      position,
      end,
      this._data.line,
      this._data.column
    );
    
    return { token, consumed };
  }

  /**
   * Process an end tag
   */
  public processEndTag(input: string, position: number): { token: EndTagToken | null; consumed: number } {
    const match = input.match(/^<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>/);
    
    if (!match) {
      return { token: null, consumed: 0 };
    }
    
    const [fullMatch, tagName] = match;
    const consumed = fullMatch.length;
    const end = position + consumed;
    
    // Create token
    const token = HTMLTokenBuilder.createEndTag(
      tagName.toLowerCase(),
      position,
      end,
      this._data.line,
      this._data.column
    );
    
    return { token, consumed };
  }
}