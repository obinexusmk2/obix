
  // Tokenizer Tests
  describe('CSSTokenizer', () => {
    test('tokenizes a simple CSS rule', () => {
      const css = '.example { color: red; }';
      const tokenizer = new CSSTokenizer(css);
      const result = tokenizer.tokenize();
      
      expect(result.errors.length).toBe(0);
      expect(result.tokens.length).toBeGreaterThan(0);
      
      const tokenTypes = result.tokens.map(token => token.type);
      expect(tokenTypes).toContain('Selector');
      expect(tokenTypes).toContain('Punctuation');
      expect(tokenTypes).toContain('Property');
      expect(tokenTypes).toContain('Value');
    });
    
    test('tokenizes a CSS rule with multiple declarations', () => {
      const css = '.example { color: red; font-size: 16px; margin: 10px; }';
      const tokenizer = new CSSTokenizer(css);
      const result = tokenizer.tokenize();
      
      expect(result.errors.length).toBe(0);
      
      // Count property tokens
      const propertyTokens = result.tokens.filter(t => t.type === 'Property');
      expect(propertyTokens.length).toBe(3);
      
      // Count value tokens
      const valueTokens = result.tokens.filter(t => t.type === 'Value');
      expect(valueTokens.length).toBe(3);
    });
    
    test('tokenizes CSS with comments', () => {
      const css = '/* Header styles */\n.header { color: blue; }';
      const tokenizer = new CSSTokenizer(css);
      const result = tokenizer.tokenize();
      
      expect(result.errors.length).toBe(0);
      
      // Find comment token
      const commentToken = result.tokens.find(t => t.type === 'Comment');
      expect(commentToken).toBeDefined();
      expect(commentToken?.value).toContain('Header styles');
    });
    
    test('tokenizes CSS with at-rules', () => {
      const css = '@media screen and (max-width: 600px) { .mobile { display: block; } }';
      const tokenizer = new CSSTokenizer(css);
      const result = tokenizer.tokenize();
      
      expect(result.errors.length).toBe(0);
      
      // Find at-rule token
      const atRuleToken = result.tokens.find(t => t.type === 'AtRule');
      expect(atRuleToken).toBeDefined();
      expect(atRuleToken?.name).toBe('@media');
    });
    
    test('handles malformed CSS gracefully', () => {
      const malformedCSS = '.unclosed { color: red; font-size: 16px';
      const tokenizer = new CSSTokenizer(malformedCSS);
      const result = tokenizer.tokenize();
      
      // Should still tokenize despite errors
      expect(result.tokens.length).toBeGreaterThan(0);
      
      // Should have error for unclosed block
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });