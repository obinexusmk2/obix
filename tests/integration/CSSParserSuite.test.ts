// tests/unit/core/parser/css/CSSParserSuite.test.ts

import { describe, test, expect, beforeEach } from 'vitest';
import { CSSTokenizer } from '../../src/core/parser/css/tokenizer/CSSTokenizer';
import { CSSTokenBuilder } from '../../src/core/parser/css/tokenizer/CSSTokenBuilder';
import { CSSParser } from '../../src/core/parser/css/parser/CSSParser';
import { CSSReader } from '../../src/core/parser/css/readers/CSSReader';
import { CSSStateMachine } from '../../src/core/parser/css/parser/CSSStateMachine';
import { CSSSignatureGenerator } from '../../src/core/parser/css/utils/CSSSignatureGenerator';
import { CSSStateUtils } from '../../src/core/parser/css/utils/CSSStateUtils';


  // CSS Parser Integration Tests

  describe('CSSParser Integration', () => {
    test('parses a complete CSS stylesheet', () => {
      const css = `
        /* Global styles */
        body {
          margin: 0;
          padding: 0;
        }
        
        /* Header styles */
        .header {
          background-color: blue;
          color: white;
        }
        
        /* Footer styles */
        .footer {
          background-color: gray;
          color: black;
        }
      `;
      
      const parser = new CSSParser();
      const result = parser.parse(css);
      
      expect(result.errors.length).toBe(0);
      expect(result.ast).toBeDefined();
      
      // Check AST structure
      expect(result.ast?.type).toBe('Stylesheet');
      expect(result.ast?.children.length).toBe(3); // Three rules
      
      const bodyRule = result.ast?.children[0];
      expect(bodyRule?.type).toBe('Rule');
      expect(bodyRule?.selector).toBe('body');
      
      const headerRule = result.ast?.children[1];
      expect(headerRule?.type).toBe('Rule');
      expect(headerRule?.selector).toBe('.header');
      
      const footerRule = result.ast?.children[2];
      expect(footerRule?.type).toBe('Rule');
      expect(footerRule?.selector).toBe('.footer');
    });
  });

