import { TokenizerProcessor } from "./HTMLProcessor.js";


export class AttributeProcessor extends TokenizerProcessor {
  /**
   * Process attributes from a string
   */
  protected processTokenImpl(input: string, position: number): { token: null; consumed: number } {
    // Attribute processor doesn't produce tokens directly
    const { consumed } = this.parseAttributes(input);
    return { token: null, consumed };
  }

  /**
   * Parse attributes from a string
   */
  public parseAttributes(attributesStr: string): { attributes: Map<string, string>; consumed: number } {
    const attributes = new Map<string, string>();
    let position = 0;
    
    while (position < attributesStr.length) {
      // Skip whitespace
      while (position < attributesStr.length && /\s/.test(attributesStr[position])) {
        position++;
      }
      
      if (position >= attributesStr.length) {
        break;
      }
      
      // Read attribute name
      const nameStart = position;
      while (position < attributesStr.length && !/[\s=]/.test(attributesStr[position])) {
        position++;
      }
      
      const name = attributesStr.substring(nameStart, position).toLowerCase();
      if (!name) {
        break;
      }
      
      let value = '';
      
      // Skip whitespace after name
      while (position < attributesStr.length && /\s/.test(attributesStr[position])) {
        position++;
      }
      
      // Check for equals sign
      if (position < attributesStr.length && attributesStr[position] === '=') {
        position++; // Skip '='
        
        // Skip whitespace after equals
        while (position < attributesStr.length && /\s/.test(attributesStr[position])) {
          position++;
        }
        
        if (position < attributesStr.length) {
          // Handle quoted value
          const quote = attributesStr[position];
          if (quote === '"' || quote === "'") {
            position++; // Skip opening quote
            
            const valueStart = position;
            while (position < attributesStr.length && attributesStr[position] !== quote) {
              position++;
            }
            
            value = attributesStr.substring(valueStart, position);
            
            if (position < attributesStr.length) {
              position++; // Skip closing quote
            }
          } else {
            // Unquoted value
            const valueStart = position;
            while (position < attributesStr.length && !/[\s>]/.test(attributesStr[position])) {
              position++;
            }
            
            value = attributesStr.substring(valueStart, position);
          }
        }
      }
      
      attributes.set(name, value);
    }
    
    return { attributes, consumed: position };
  }
}