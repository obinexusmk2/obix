// tests/unit/core/parser/html/HTMLParserSuite.test.ts

import { describe, test, expect, beforeEach } from 'vitest';
import { HTMLTokenizer } from '../../../../../src/core/parser/html/tokens/HTMLTokenizer';
import { HTMLToken } from '../../../../../src/core/parser/html/tokens/HTMLToken';
import { HTMLTokenBuilder } from '../../../../../src/core/parser/html/tokens/HTMLTokenBuilder';
import { 
  TagProcessor, 
  CommentProcessor, 
  TextProcessor,
  CDATAProcessor,
  DoctypeProcessor
} from '../../../../../src/core/parser/html/processors';
import { TokenizerOptions } from '../../../../../src/core/parser/html/types';
import { ProcessorFactory } from '../../../../../src/core/parser/html/processors/ProcessorFactory';

/**
 * Test suite for HTML parser components following the single-pass approach
 * where each component is tested individually and each stage is isolated.
 */
describe('HTML Parser Components', () => {
  // TokenBuilder Tests
  describe('HTMLTokenBuilder', () => {
    test('createStartTag creates a valid start tag token', () => {
      const attributes = new Map([['class', 'test'], ['id', 'example']]);
      const token = HTMLTokenBuilder.createStartTag(
        'div',
        attributes,
        false,
        10,
        25,
        1,
        10
      );
      
      expect(token.type).toBe('StartTag');
      expect(token.name).toBe('div');
      expect(token.attributes).toBe(attributes);
      expect(token.selfClosing).toBe(false);
      expect(token.start).toBe(10);
      expect(token.end).toBe(25);
      expect(token.line).toBe(1);
      expect(token.column).toBe(10);
    });
    
    test('createEndTag creates a valid end tag token', () => {
      const token = HTMLTokenBuilder.createEndTag(
        'div',
        26,
        32,
        1,
        26
      );
      
      expect(token.type).toBe('EndTag');
      expect(token.name).toBe('div');
      expect(token.start).toBe(26);
      expect(token.end).toBe(32);
      expect(token.line).toBe(1);
      expect(token.column).toBe(26);
    });
    
    test('createText creates a valid text token', () => {
      const token = HTMLTokenBuilder.createText(
        'Hello, world!',
        false,
        25,
        38,
        1,
        25
      );
      
      expect(token.type).toBe('Text');
      expect(token.content).toBe('Hello, world!');
      expect(token.isWhitespace).toBe(false);
      expect(token.start).toBe(25);
      expect(token.end).toBe(38);
      expect(token.line).toBe(1);
      expect(token.column).toBe(25);
    });
    
    test('createComment creates a valid comment token', () => {
      const token = HTMLTokenBuilder.createComment(
        'This is a comment',
        0,
        20,
        1,
        1,
        false
      );
      
      expect(token.type).toBe('Comment');
      expect(token.data).toBe('This is a comment');
      expect(token.isConditional).toBe(false);
      expect(token.start).toBe(0);
      expect(token.end).toBe(20);
      expect(token.line).toBe(1);
      expect(token.column).toBe(1);
    });
  });

  // Token Tests
  describe('HTMLToken', () => {
    let token: HTMLToken;
    
    beforeEach(() => {
      token = new HTMLToken({
        type: 'StartTag',
        properties: { name: 'div', selfClosing: false },
        position: { start: 0, end: 5, line: 1, column: 1 }
      });
    });
    
    test('creates a token with correct properties', () => {
      expect(token.type).toBe('StartTag');
      expect(token.position.start).toBe(0);
      expect(token.position.end).toBe(5);
      expect(token.getProperty('name')).toBe('div');
    });
    
    test('can add and query transitions', () => {
      const targetToken = new HTMLToken({
        type: 'Text',
        properties: { content: 'test', isWhitespace: false },
        position: { start: 5, end: 9, line: 1, column: 6 }
      });
      
      const updated = token.addTransition('next', targetToken);
      expect(updated.hasTransition('next')).toBe(true);
      expect(updated.transition('next')).toBe(targetToken);
    });
    
    test('computes state signatures for equivalence checking', () => {
      const token1 = new HTMLToken({
        type: 'StartTag',
        properties: { name: 'div', selfClosing: false },
        position: { start: 0, end: 5, line: 1, column: 1 }
      });
      
      const token2 = new HTMLToken({
        type: 'StartTag',
        properties: { name: 'div', selfClosing: false },
        position: { start: 10, end: 15, line: 2, column: 1 }
      });
      
      const classes = new Map<number, Set<HTMLToken>>();
      classes.set(1, new Set([token1]));
      
      const sig1 = token1.computeStateSignature(classes);
      const sig2 = token2.computeStateSignature(classes);
      
      // Signatures should be the same for equivalent tokens
      expect(sig1).toBe(sig2);
    });
    
    test('can be cloned', () => {
      const cloned = token.clone();
      expect(cloned).not.toBe(token); // Different object
      expect(cloned.type).toBe(token.type);
      expect(cloned.position.start).toBe(token.position.start);
      expect(cloned.getProperty('name')).toBe(token.getProperty('name'));
    });
    
    test('can be minimized', () => {
      const minimized = token.minimize();
      expect(minimized.getMetadata('isMinimized')).toBe(true);
    });
  });
  
  // Processor Tests
  describe('TokenizerProcessors', () => {
    test('TagProcessor processes start tags correctly', () => {
      const processor = new TagProcessor();
      processor.setData('<div class="test">', 0, 1, 1);
      
      const result = processor.process();
      expect(result.token).not.toBeNull();
      if (result.token) {
        expect(result.token.type).toBe('StartTag');
        expect(result.consumed).toBe(18);
        // @ts-ignore - We know this is a StartTag
        expect(result.token.name).toBe('div');
      }
    });
    
    test('TagProcessor processes end tags correctly', () => {
      const processor = new TagProcessor();
      processor.setData('</div>', 0, 1, 1);
      
      const result = processor.process();
      expect(result.token).not.toBeNull();
      if (result.token) {
        expect(result.token.type).toBe('EndTag');
        expect(result.consumed).toBe(6);
        // @ts-ignore - We know this is an EndTag
        expect(result.token.name).toBe('div');
      }
    });
    
      test('CommentProcessor processes comments correctly', () => {
        const processor = new CommentProcessor();
        processor.setData('<!-- This is a comment -->', 0, 1, 1);
        
        const result = processor.process();
        expect(result.token).not.toBeNull();
        if (result.token) {
          expect(result.token.type).toBe('Comment');
          expect(result.consumed).toBe(25);
          // @ts-ignore - We know this is a Comment
          expect(result.token.data).toBe(' This is a comment ');
        }
      });
      
      test('TextProcessor processes text correctly', () => {
        const processor = new TextProcessor();
        processor.setData('Hello, world!', 0, 1, 1);
        
        const result = processor.process();
        expect(result.token).not.toBeNull();
        if (result.token) {
          expect(result.token.type).toBe('Text');
          expect(result.consumed).toBe(13);
          // @ts-ignore - We know this is a Text
          expect(result.token.content).toBe('Hello, world!');
        }
      });
      
      test('CDATAProcessor processes CDATA correctly', () => {
        const processor = new CDATAProcessor();
        processor.setData('<![CDATA[Some data here]]>', 0, 1, 1);
        
        const result = processor.process();
        expect(result.token).not.toBeNull();
        if (result.token) {
          expect(result.token.type).toBe('CDATA');
          expect(result.consumed).toBe(26);
          // @ts-ignore - We know this is CDATA
          expect(result.token.content).toBe('Some data here');
        }
      });
      
      test('DoctypeProcessor processes doctype correctly', () => {
        const processor = new DoctypeProcessor();
        processor.setData('<!DOCTYPE html>', 0, 1, 1);
        
        const result = processor.process();
        expect(result.token).not.toBeNull();
        if (result.token) {
          expect(result.token.type).toBe('Doctype');
          expect(result.consumed).toBe(15);
        }
      });
      
      test('ProcessorFactory returns correct processor for different token types', () => {
        const factory = new ProcessorFactory();
        
        expect(factory.createProcessor('<div>')).toBeInstanceOf(TagProcessor);
        expect(factory.createProcessor('<!-- comment -->')).toBeInstanceOf(CommentProcessor);
        expect(factory.createProcessor('plain text')).toBeInstanceOf(TextProcessor);
        expect(factory.createProcessor('<![CDATA[')).toBeInstanceOf(CDATAProcessor);
        expect(factory.createProcessor('<!DOCTYPE')).toBeInstanceOf(DoctypeProcessor);
      });
    });