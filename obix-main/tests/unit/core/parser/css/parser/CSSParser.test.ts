
/**
 * Test suite for CSS parser components following the single-pass approach
 * where each component is tested individually and each stage is isolated.
 */
describe('CSS Parser Components', () => {
  // Token Builder Tests
  describe('CSSTokenBuilder', () => {
    test('creates selector tokens correctly', () => {
      const token = CSSTokenBuilder.createSelectorToken(
        '.example',
        10,
        18,
        1,
        10
      );
      
      expect(token.type).toBe('Selector');
      expect(token.value).toBe('.example');
      expect(token.start).toBe(10);
      expect(token.end).toBe(18);
      expect(token.line).toBe(1);
      expect(token.column).toBe(10);
    });
    
    test('creates property tokens correctly', () => {
      const token = CSSTokenBuilder.createPropertyToken(
        'color',
        20,
        25,
        1,
        20
      );
      
      expect(token.type).toBe('Property');
      expect(token.name).toBe('color');
      expect(token.start).toBe(20);
      expect(token.end).toBe(25);
      expect(token.line).toBe(1);
      expect(token.column).toBe(20);
    });
    
    test('creates value tokens correctly', () => {
      const token = CSSTokenBuilder.createValueToken(
        'red',
        27,
        30,
        1,
        27
      );
      
      expect(token.type).toBe('Value');
      expect(token.value).toBe('red');
      expect(token.start).toBe(27);
      expect(token.end).toBe(30);
      expect(token.line).toBe(1);
      expect(token.column).toBe(27);
    });
    
    test('creates punctuation tokens correctly', () => {
      const token = CSSTokenBuilder.createPunctuationToken(
        '{',
        19,
        20,
        1,
        19
      );
      
      expect(token.type).toBe('Punctuation');
      expect(token.value).toBe('{');
      expect(token.start).toBe(19);
      expect(token.end).toBe(20);
      expect(token.line).toBe(1);
      expect(token.column).toBe(19);
    });
    
    test('creates at-rule tokens correctly', () => {
      const token = CSSTokenBuilder.createAtRuleToken(
        '@media',
        0,
        6,
        1,
        1,
        'screen and (max-width: 600px)'
      );
      
      expect(token.type).toBe('AtRule');
      expect(token.name).toBe('@media');
      expect(token.value).toBe('screen and (max-width: 600px)');
      expect(token.start).toBe(0);
      expect(token.end).toBe(6);
      expect(token.line).toBe(1);
      expect(token.column).toBe(1);
    });
    
    test('creates comment tokens correctly', () => {
      const token = CSSTokenBuilder.createCommentToken(
        '/* This is a comment */',
        0,
        23,
        1,
        1
      );
      
      expect(token.type).toBe('Comment');
      expect(token.value).toBe('/* This is a comment */');
      expect(token.start).toBe(0);
      expect(token.end).toBe(23);
      expect(token.line).toBe(1);
      expect(token.column).toBe(1);
    });
  });


  
  // Parser Tests
  describe('CSSParser', () => {
    test('parses a simple CSS rule', () => {
      const css = '.example { color: red; }';
      const parser = new CSSParser();
      const result = parser.parse(css);
      
      expect(result.errors.length).toBe(0);
      expect(result.ast).toBeDefined();
      
      // Check AST structure
      expect(result.ast?.type).toBe('Stylesheet');
      expect(result.ast?.children.length).toBe(1);
      
      const rule = result.ast?.children[0];
      expect(rule?.type).toBe('Rule');
      expect(rule?.selector).toBe('.example');
      expect(rule?.declarations.length).toBe(1);
      
      const declaration = rule?.declarations[0];
      expect(declaration?.property).toBe('color');
      expect(declaration?.value).toBe('red');
    });
    
    test('parses CSS with nested at-rules', () => {
      const css = '@media screen and (max-width: 600px) { .mobile { display: block; } }';
      const parser = new CSSParser();
      const result = parser.parse(css);
      
      expect(result.errors.length).toBe(0);
      expect(result.ast).toBeDefined();
      
      // Check AST structure for at-rule
      expect(result.ast?.type).toBe('Stylesheet');
      expect(result.ast?.children.length).toBe(1);
      
      const atRule = result.ast?.children[0];
      expect(atRule?.type).toBe('AtRule');
      expect(atRule?.name).toBe('@media');
      expect(atRule?.value).toBe('screen and (max-width: 600px)');
      expect(atRule?.children.length).toBe(1);
      
      const rule = atRule?.children[0];
      expect(rule?.type).toBe('Rule');
      expect(rule?.selector).toBe('.mobile');
    });
    
    test('parses multiple CSS rules', () => {
      const css = '.header { color: blue; } .footer { color: gray; }';
      const parser = new CSSParser();
      const result = parser.parse(css);
      
      expect(result.errors.length).toBe(0);
      expect(result.ast).toBeDefined();
      
      // Check AST structure for multiple rules
      expect(result.ast?.type).toBe('Stylesheet');
      expect(result.ast?.children.length).toBe(2);
      
      const rule1 = result.ast?.children[0];
      expect(rule1?.type).toBe('Rule');
      expect(rule1?.selector).toBe('.header');
      
      const rule2 = result.ast?.children[1];
      expect(rule2?.type).toBe('Rule');
      expect(rule2?.selector).toBe('.footer');
    });
    
    test('handles malformed CSS with error reporting', () => {
      const malformedCSS = '.unclosed { color: red;';
      const parser = new CSSParser();
      const result = parser.parse(malformedCSS);
      
      // Should have error for unclosed block
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('unclosed');
      
      // Should still produce a partial AST
      expect(result.ast).toBeDefined();
    });
  });