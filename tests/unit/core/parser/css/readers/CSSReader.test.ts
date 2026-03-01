import { CSSReader } from '../../src/core/parser/css/readers/CSSReader';

describe('CSSReader', () => {
  test('reads a selector correctly', () => {
    const css = '.example { color: red; }';
    const reader = new CSSReader(css);
    const result = reader.readSelector(0);
    
    expect(result.value).toBe('.example');
    expect(result.type).toBe('selector');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  test('reads a property correctly', () => {
    const css = 'color: red;';
    const reader = new CSSReader(css);
    const result = reader.readProperty(0);
    
    expect(result.name).toBe('color');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  test('reads a value correctly', () => {
    const css = 'red;';
    const reader = new CSSReader(css);
    const result = reader.readValue(0);
    
    expect(result.value).toBe('red');
    expect(result.type).toBe('value');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  test('reads an at-rule correctly', () => {
    const css = '@media screen and (max-width: 600px) { .mobile { display: block; } }';
    const reader = new CSSReader(css);
    const result = reader.readAtRule(0);
    
    expect(result.name).toBe('@media');
    expect(result.prelude).toBe('screen and (max-width: 600px)');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  test('reads a block correctly', () => {
    const css = '{ color: red; font-size: 16px; }';
    const reader = new CSSReader(css);
    const result = reader.readBlock(0);
    
    expect(result.content).toContain('color: red');
    expect(result.content).toContain('font-size: 16px');
    expect(result.success).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('handles complex nested structures', () => {
    const css = '@media screen and (max-width: 600px) { .mobile { display: block; } }';
    const reader = new CSSReader(css);
    const atRuleResult = reader.readAtRule(0);
    
    expect(atRuleResult.success).toBe(true);
    
    // Since the reader.readBlock returns the content as string, we should check if it contains our selector
    const tokens = reader.getTokens();
    // Find the start block token for the at-rule
    const blockStartIndex = tokens.findIndex(token => 
      token.type === 'StartBlock' && 
      tokens[tokens.findIndex(t => t === token) - 1].type === 'Value' &&
      tokens[tokens.findIndex(t => t === token) - 1].value.includes('max-width')
    );
    
    expect(blockStartIndex).toBeGreaterThan(0);
    
    // Read the block content
    const blockResult = reader.readBlock(blockStartIndex);
    expect(blockResult.success).toBe(true);
    expect(blockResult.content).toContain('.mobile');
  });

  test('handles errors gracefully', () => {
    const malformedCSS = 'color red;'; // Missing colon
    const reader = new CSSReader(malformedCSS);
    const result = reader.readProperty(0);
    
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('handles multiple selectors', () => {
    const css = 'h1, h2, h3 { color: blue; }';
    const reader = new CSSReader(css);
    const result = reader.readSelector(0);
    
    expect(result.success).toBe(true);
    expect(result.value).toContain('h1');
    expect(result.value).toContain('h2');
    expect(result.value).toContain('h3');
  });

  test('correctly handles important declarations', () => {
    const css = 'color: red !important;';
    const reader = new CSSReader(css);
    
    // Skip property token to get to the value
    const tokens = reader.getTokens();
    const valueIndex = tokens.findIndex(token => token.type === 'Value');
    
    expect(valueIndex).toBeGreaterThan(0);
    
    const valueResult = reader.readValue(valueIndex);
    expect(valueResult.success).toBe(true);
    expect(valueResult.value).toContain('red !important');
  });

  test('handles comments within declarations', () => {
    const css = 'color: /* Brand color */ red;';
    const reader = new CSSReader(css);
    
    // Skip property token to get to the value
    const tokens = reader.getTokens();
    const valueIndex = tokens.findIndex(token => token.type === 'Value');
    
    expect(valueIndex).toBeGreaterThan(0);
    
    const valueResult = reader.readValue(valueIndex);
    expect(valueResult.success).toBe(true);
    expect(valueResult.value).toBe('red');
  });
});