/**
 * HTMLASTProcessor.ts
 * 
 * Single-pass HTML AST processor that combines parsing, optimization, validation,
 * and virtual DOM building into a unified pipeline. This implementation leverages
 * Nnamdi Okpala's automaton state minimization techniques for optimal performance.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ASTProcessor, ProcessedAST } from '../common/ASTProcessor';
import { HTMLParser } from '../parsers/HTMLParser';
import { HTMLTokenizer } from '../parsers/HTMLTokenizer';
import { HTMLNode } from '../node/HTMLNode';
import { StateMachineMinimizer } from '../common/StateMachineMinimizer';
import { HTMLAstValidator } from '../validators/HTMLAstValidator';
import { HTMLVDOMBuilder } from '../vdom/HTMLVDOMBuilder';
import { HTMLVNode } from '../vdom/HTMLVNode';
import { ValidationResult } from '../validation/ValidationResult';
import { OptimizationMetrics } from '../common/OptimizationMetrics';
import { LRUCache } from '../utils/LRUCache';

/**
 * HTML AST Processor that implements a single-pass pipeline for HTML processing
 */
export class HTMLASTProcessor implements ASTProcessor<string, HTMLVNode> {
  private parser: HTMLParser;
  private tokenizer: HTMLTokenizer;
  private minimizer: StateMachineMinimizer;
  private validator: HTMLAstValidator;
  private vdomBuilder: HTMLVDOMBuilder;
  private cache: LRUCache<string, ProcessedAST<HTMLVNode>>;
  
  /**
   * Create a new HTML AST processor
   * 
   * @param options Configuration options
   */
  constructor(options: {
    cacheSize?: number;
    enableValidation?: boolean;
    applyMemoryOptimizations?: boolean;
  } = {}) {
    this.tokenizer = new HTMLTokenizer();
    this.parser = new HTMLParser();
    this.minimizer = new StateMachineMinimizer(
      options.applyMemoryOptimizations !== false
    );
    this.validator = new HTMLAstValidator();
    this.vdomBuilder = new HTMLVDOMBuilder();
    this.cache = new LRUCache<string, ProcessedAST<HTMLVNode>>(
      options.cacheSize || 50
    );
  }
  
  /**
   * Process HTML source into an optimized AST, validation results, and virtual DOM
   * 
   * @param source HTML source code
   * @returns Processed AST with virtual DOM and validation results
   */
  public process(source: string): ProcessedAST<HTMLVNode> {
    // Check cache first
    const cachedResult = this.cache.get(source);
    if (cachedResult) {
      return cachedResult;
    }
    
    // Start metrics tracking
    const startTime = performance.now();
    
    // STEP 1: Tokenize the HTML
    const tokenizeStart = performance.now();
    const { tokens, errors: tokenizationErrors } = this.tokenizer.tokenize(source);
    const tokenizeTime = performance.now() - tokenizeStart;
    
    // STEP 2: Parse tokens into an AST
    const parseStart = performance.now();
    const ast = this.parser.parse(tokens);
    const parseTime = performance.now() - parseStart;
    
    // STEP 3: Minimize the AST and collect optimization metrics
    const minimizeStart = performance.now();
    const { minimizedAst, metrics } = this.minimizer.minimize(ast);
    const minimizeTime = performance.now() - minimizeStart;
    
    // STEP 4: Validate the minimized AST
    const validateStart = performance.now();
    const validationResult = this.validator.validate(minimizedAst);
    const validateTime = performance.now() - validateStart;
    
    // STEP 5: Build virtual DOM representation
    const vdomStart = performance.now();
    const vdom = this.vdomBuilder.build(minimizedAst);
    const vdomTime = performance.now() - vdomStart;
    
    // Compute total processing time
    const totalTime = performance.now() - startTime;
    
    // Enhance metrics with timing information
    const enhancedMetrics: OptimizationMetrics = {
      ...metrics,
      performance: {
        ...metrics.performance,
        tokenizeTime,
        parseTime,
        minimizeTime,
        validateTime,
        vdomTime,
        totalTime
      }
    };
    
    // Create processed AST result
    const result: ProcessedAST<HTMLVNode> = {
      ast: minimizedAst,
      virtualDOM: vdom,
      validationResult,
      metrics: enhancedMetrics
    };
    
    // Cache result
    this.cache.set(source, result);
    
    return result;
  }
  
  /**
   * Validate HTML without the full processing pipeline
   * 
   * @param source HTML source code
   * @returns Validation result
   */
  public validate(source: string): ValidationResult {
    // Tokenize and parse
    const { tokens } = this.tokenizer.tokenize(source);
    const ast = this.parser.parse(tokens);
    
    // Validate the AST
    return this.validator.validate(ast);
  }
  
  /**
   * Clear the processor's cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Process HTML and automatically apply updates to a DOM element
   * 
   * @param source HTML source code
   * @param target DOM element to update
   * @returns Processed AST
   */
  public render(source: string, target: HTMLElement): ProcessedAST<HTMLVNode> {
    const result = this.process(source);
    this.vdomBuilder.applyToDOM(result.virtualDOM, target);
    return result;
  }
  
  /**
   * Get a summary of processor statistics
   */
  public getStatistics(): {
    cacheSize: number;
    cacheHitRate: number;
    averageProcessingTime: number;
  } {
    return {
      cacheSize: this.cache.size(),
      cacheHitRate: this.cache.hitRate(),
      averageProcessingTime: this.cache.averageAccessTime()
    };
  }
}