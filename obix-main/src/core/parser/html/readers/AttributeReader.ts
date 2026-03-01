export interface AttributeParseResult {
    name: string;
    value: string;
    quoted: boolean;
    consumed: number;
  }
  
  export class AttributeReader {
    /**
     * Read a single attribute from the input string
     * @param input Input string starting at the attribute
     * @returns Parsed attribute or null if not a valid attribute
     */
    readAttribute(input: string): AttributeParseResult | null {
      // Skip leading whitespace
      let position = 0;
      while (position < input.length && /\s/.test(input[position])) {
        position++;
      }
      
      // No attribute name
      if (position >= input.length) {
        return null;
      }
      
      // Read attribute name
      const nameStart = position;
      while (position < input.length && !/[\s=>/]/.test(input[position])) {
        position++;
      }
      
      if (nameStart === position) {
        return null; // No name found
      }
      
      const name = input.substring(nameStart, position).toLowerCase();
      let value = '';
      let quoted = false;
      
      // Skip whitespace after name
      while (position < input.length && /\s/.test(input[position])) {
        position++;
      }
      
      // Check if we have a value
      if (position < input.length && input[position] === '=') {
        position++; // Skip '='
        
        // Skip whitespace after equals sign
        while (position < input.length && /\s/.test(input[position])) {
          position++;
        }
        
        if (position < input.length) {
          // Check for quoted value
          const quote = input[position];
          if (quote === '"' || quote === "'") {
            quoted = true;
            position++; // Skip opening quote
            
            const valueStart = position;
            while (position < input.length && input[position] !== quote) {
              position++;
            }
            
            value = input.substring(valueStart, position);
            
            if (position < input.length) {
              position++; // Skip closing quote
            }
          } else {
            // Unquoted value
            const valueStart = position;
            while (position < input.length && !/[\s>]/.test(input[position])) {
              position++;
            }
            
            value = input.substring(valueStart, position);
          }
        }
      }
      
      return { name, value, quoted, consumed: position };
    }
  
    /**
     * Read multiple attributes from an input string
     * @param input Input string containing attributes
     * @returns Map of attribute names to values and number of characters consumed
     */
    readAttributes(input: string): { attributes: Map<string, string>; consumed: number } {
      const attributes = new Map<string, string>();
      let position = 0;
      
      while (position < input.length) {
        // Skip whitespace
        const initialPosition = position;
        while (position < input.length && /\s/.test(input[position])) {
          position++;
        }
        
        // End of attributes or start of another element
        if (position >= input.length || input[position] === '>' || input[position] === '/' || input[position] === '<') {
          break;
        }
        
        // Read attribute
        const attributeResult = this.readAttribute(input.substring(position));
        if (!attributeResult) {
          break;
        }
        
        // Add to map and advance position
        attributes.set(attributeResult.name, attributeResult.value);
        position += attributeResult.consumed;
        
        // Detect infinite loop
        if (position === initialPosition) {
          break;
        }
      }
      
      return { attributes, consumed: position };
    }
    
    /**
     * Validates the attributes according to HTML specification
     * @param attributes Map of attributes to validate
     * @returns Set of validation warnings
     */
    validateAttributes(attributes: Map<string, string>): Set<string> {
      const warnings = new Set<string>();
      
      // Check for duplicate IDs
      if (attributes.has('id') && attributes.get('id')!.trim() === '') {
        warnings.add('Empty ID attribute');
      }
      
      // Validate ARIA attributes
      for (const [name, value] of attributes.entries()) {
        if (name.startsWith('aria-') && value.trim() === '') {
          warnings.add(`Empty ARIA attribute: ${name}`);
        }
      }
      
      return warnings;
    }
  }