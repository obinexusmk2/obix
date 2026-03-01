/**
 * HTMLAst.ts
 * 
 * Defines the HTML Abstract Syntax Tree structure and related interfaces.
 * This module serves as the bridge between the HTML parser and the HTML AST optimizer.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationResult } from "@/core/dop/ValidationResult";
import { HTMLNode } from "../node/HTMLNode";
import { ParserError, ValidationError } from "@/core/validation/errors/ValidationError";
import { OptimizationMetrics } from "@/core/dop/OptimizationMetrics";

/**
 * Metadata for the HTML AST
 */
export interface ASTMetadata {
  /** Total number of nodes in the AST */
  nodeCount: number;
  /** Number of element nodes */
  elementCount: number;
  /** Number of text nodes */
  textCount: number;
  /** Number of comment nodes */
  commentCount: number;
  /** Optional optimization metrics */
  optimizationMetrics?: OptimizationMetrics;
}

/**
 * HTML Abstract Syntax Tree
 */
export interface HTMLAst {
  /** Root node of the AST */
  root: HTMLNode;
  /** Metadata for the AST */
  metadata: ASTMetadata;
}

/**
 * HTML AST implementation
 */
export class HTMLAstImpl implements HTMLAst {
  /** Root node of the AST */
  public root: HTMLNode;
  /** Metadata for the AST */
  public metadata: ASTMetadata;
  
  /**
   * Create a new HTML AST
   * 
   * @param root Root node
   * @param metadata Optional metadata
   */
  constructor(root: HTMLNode, metadata?: Partial<ASTMetadata>) {
    this.root = root;
    this.metadata = {
      nodeCount: 0,
      elementCount: 0,
      textCount: 0,
      commentCount: 0,
      ...metadata
    };
    
    // Calculate metadata if not provided
    if (!metadata?.nodeCount) {
      this.calculateMetadata();
    }
  }
  
  /**
   * Calculate AST metadata
   */
  public calculateMetadata(): void {
    const counts = {
      nodeCount: 0,
      elementCount: 0,
      textCount: 0,
      commentCount: 0
    };
    
    const countNodes = (node: HTMLNode): void => {
      counts.nodeCount++;
      
      switch (node.type) {
        case 'ELEMENT':
          counts.elementCount++;
          break;
        case 'TEXT':
          counts.textCount++;
          break;
        case 'COMMENT':
          counts.commentCount++;
          break;
      }
      
      for (const child of node.children) {
        countNodes(child);
      }
    };
    
    countNodes(this.root);
    this.metadata = { ...this.metadata, ...counts };
  }
  
  /**
   * Convert the AST to an HTML string
   * 
   * @returns HTML string representation
   */
  public toHTML(): string {
    return this.root.toHTML();
  }
  
  /**
   * Validate the AST structure
   * 
   * @returns Validation result
   */
  public validate(): ValidationResult<HTMLNode> {
    // Basic validation logic
    const errors: ValidationError[] = [];
    const warnings: ParserError[] = [];
    
    // Validate node hierarchy
    const validateNode = (node: HTMLNode): void => {
      // Check parent-child relationships
      for (const child of node.children) {
        if (child.parent !== node) {
            errors.push(new ValidationError(
              'INVALID_PARENT_REF',
              `Invalid parent-child relationship: child ${child.id} does not reference correct parent ${node.id}`,
              'HTMLAst',
              { id: child.id, parent: node.id },
              { id: child.id, parent: child.parent?.id },
              new Map([[node.id.toString(), [node.id, child.parent?.id]]]),
              'parent-child-validation'
            ));
        }
        
        // Recursively validate children
        validateNode(child);
      }
    };
    
    validateNode(this.root);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      traces: [],
      equivalent: false,
      metadata: {},
      data: this.root,
      severity: errors.length > 0 ? 'error' : 'info',
      timestamp: Date.now(),
      source: 'HTMLAst.validate',
      component: 'HTMLAst',
      details: '',
      stackTrace: new Error().stack || '',
      isRecoverable: true,
      recommendations: [],
      relatedResults: [],
      debugInfo: {}
    };
  }
  
  /**
   * Create an HTMLAst from a Node
   * 
   * @param node Root node
   * @returns New HTMLAst
   */
  public static fromNode(node: HTMLNode): HTMLAst {
    return new HTMLAstImpl(node);
  }
}