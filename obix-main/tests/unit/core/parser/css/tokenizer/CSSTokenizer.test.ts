import { CSSTokenizer } from '../../src/core/parser/css/tokenizer/CSSTokenizer';
import { CSSTokenType } from '../../src/core/parser/css/tokenizer/CSSTokenType';

describe('CSSTokenizer', () => {
  test('tokenizes a simple CSS rule', () => {
    const css = '.example { color: red; }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    expect(result.tokens.length).toBeGreaterThan(0);
    
    // Verify specific tokens
    expect(result.tokens[0].type).toBe(CSSTokenType.ClassSelector);
    expect(result.tokens[0].value).toBe('.example');
    
    // Find the color property
    const colorPropertyIndex = result.tokens.findIndex(token => 
      token.type === CSSTokenType.Property && token.value === 'color'
    );
    expect(colorPropertyIndex).toBeGreaterThan(0);
    
    // Verify the value after the property
    expect(result.tokens[colorPropertyIndex + 1].type).toBe(CSSTokenType.Colon);
    
    // Find the color value
    const colorValueIndex = result.tokens.findIndex(token => 
      token.type === CSSTokenType.Value && token.value === 'red'
    );
    expect(colorValueIndex).toBeGreaterThan(0);
  });
  
  test('tokenizes a CSS rule with multiple declarations', () => {
    const css = '.example { color: red; font-size: 16px; margin: 10px; }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Count properties
    const properties = result.tokens.filter(token => token.type === CSSTokenType.Property);
    expect(properties.length).toBe(3);
    
    // Verify property names
    const propertyNames = properties.map(p => p.value);
    expect(propertyNames).toContain('color');
    expect(propertyNames).toContain('font-size');
    expect(propertyNames).toContain('margin');
    
    // Check if numeric values are tokenized correctly
    const numberTokens = result.tokens.filter(token => token.type === CSSTokenType.Number);
    expect(numberTokens.length).toBe(2);
    
    // Check if unit tokens are present
    const unitTokens = result.tokens.filter(token => token.type === CSSTokenType.Unit);
    expect(unitTokens.length).toBe(2);
    expect(unitTokens.some(token => token.value === 'px')).toBe(true);
  });
  
  test('tokenizes CSS with comments', () => {
    const css = '/* Header styles */\n.header { color: blue; }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Verify comment token
    const commentTokens = result.tokens.filter(token => token.type === CSSTokenType.Comment);
    expect(commentTokens.length).toBe(1);
    expect(commentTokens[0].value).toBe(' Header styles ');
    
    // Check that actual content is still tokenized
    const selectorTokens = result.tokens.filter(token => token.type === CSSTokenType.ClassSelector);
    expect(selectorTokens.length).toBe(1);
    expect(selectorTokens[0].value).toBe('.header');
  });
  
  test('tokenizes CSS with at-rules', () => {
    const css = '@media screen and (max-width: 600px) { .mobile { display: block; } }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Verify at-rule token
    const atRuleTokens = result.tokens.filter(token => token.type === CSSTokenType.AtKeyword);
    expect(atRuleTokens.length).toBe(1);
    expect(atRuleTokens[0].value.startsWith('@')).toBe(true);
    
    // Check that nested selectors are tokenized
    const selectorTokens = result.tokens.filter(token => token.type === CSSTokenType.ClassSelector);
    expect(selectorTokens.length).toBe(1);
  });
  
  test('handles malformed CSS gracefully', () => {
    const malformedCSS = '.unclosed { color: red; font-size: 16px';
    const tokenizer = new CSSTokenizer(malformedCSS);
    const result = tokenizer.tokenize();
    
    // Should still tokenize despite errors
    expect(result.tokens.length).toBeGreaterThan(0);
    
    // Should report the error
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0].message).toContain('Unclosed block');
  });
  
  test('correctly tracks line and column positions', () => {
    const css = '.example {\n  color: red;\n  margin: 10px;\n}';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    // First token should be on line 1
    expect(result.tokens[0].line).toBe(1);
    
    // Find tokens on line 2
    const line2Tokens = result.tokens.filter(token => token.line === 2);
    expect(line2Tokens.length).toBeGreaterThan(0);
    
    // Find tokens on line 3
    const line3Tokens = result.tokens.filter(token => token.line === 3);
    expect(line3Tokens.length).toBeGreaterThan(0);
    
    // First column should be reasonable
    expect(result.tokens[0].column).toBeGreaterThanOrEqual(1);
  });

  test('correctly handles complex selectors', () => {
    const css = 'div.container > ul#menu li:first-child::before { content: "*"; }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Verify selector tokens
    const selectorTokens = result.tokens.filter(token => 
      token.type === CSSTokenType.Selector || 
      token.type === CSSTokenType.ClassSelector ||
      token.type === CSSTokenType.IdSelector ||
      token.type === CSSTokenType.PseudoClass ||
      token.type === CSSTokenType.PseudoElement ||
      token.type === CSSTokenType.Combinator
    );
    
    expect(selectorTokens.length).toBeGreaterThan(3);
    
    // Check for pseudo-class
    const pseudoClassTokens = result.tokens.filter(token => token.type === CSSTokenType.PseudoClass);
    expect(pseudoClassTokens.length).toBe(1);
    expect(pseudoClassTokens[0].value).toContain('first-child');
    
    // Check for pseudo-element
    const pseudoElementTokens = result.tokens.filter(token => token.type === CSSTokenType.PseudoElement);
    expect(pseudoElementTokens.length).toBe(1);
    expect(pseudoElementTokens[0].value).toContain('before');
  });

  test('handles string values correctly', () => {
    const css = 'p:before { content: "Hello, world!"; }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Find the string token
    const stringTokens = result.tokens.filter(token => token.type === CSSTokenType.String);
    expect(stringTokens.length).toBe(1);
    expect(stringTokens[0].value).toBe('Hello, world!');
  });

  test('tokenizes nested CSS structures', () => {
    const css = '@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Count block starts and ends
    const blockStarts = result.tokens.filter(token => token.type === CSSTokenType.StartBlock);
    const blockEnds = result.tokens.filter(token => token.type === CSSTokenType.EndBlock);
    
    // Should have 3 blocks: @keyframes, from, and to
    expect(blockStarts.length).toBe(3);
    expect(blockEnds.length).toBe(3);
    
    // Check for property inside nested rules
    const opacityProps = result.tokens.filter(
      token => token.type === CSSTokenType.Property && token.value === 'opacity'
    );
    expect(opacityProps.length).toBe(2);
  });

  test('shift-reduce algorithm correctly handles complex tokens', () => {
    const css = '.container { background: url("https://example.com/image.jpg"); }';
    const tokenizer = new CSSTokenizer(css);
    const result = tokenizer.tokenize();
    
    expect(result.errors.length).toBe(0);
    
    // Check for URL token
    const urlTokens = result.tokens.filter(token => 
      token.type === CSSTokenType.Function && token.value.includes('url')
    );
    
    expect(urlTokens.length).toBe(1);
    
    // Check for string token inside the URL
    const stringTokens = result.tokens.filter(token => token.type === CSSTokenType.String);
    expect(stringTokens.length).toBe(1);
    expect(stringTokens[0].value).toContain('https://example.com/image.jpg');
  });
});