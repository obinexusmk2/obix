/**
 * HTMLAstOptimizer.ts
 * 
 * Implementation of the HTML AST optimizer that applies automaton state minimization
 * techniques to reduce the size and complexity of HTML Abstract Syntax Trees.
 * 
 * This optimizer implements the algorithms described in "Extended Automaton-AST 
 * Minimization and Validation" by Nnamdi Michael Okpala, focusing on equivalent
 * state identification and transition optimization.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { HTMLNode, HTMLNodeType } from "../node/HTMLNode";
import { HTMLAst, ASTMetadata, OptimizationMetrics } from "./HTMLAst";
import { EquivalenceClassComputer } from "./EquivalenceClassComputer";
import { NodeReductionOptimizer } from "./NodeReductionOptimizer";
import { PathOptimizer } from "./PathOptimizer";
import { MemoryOptimizer } from "./MemoryOptimizer";
import { NodeMapBuilder } from "./NodeMapBuilder";

/**
 * Interface for a state equivalence class
 */
interface StateClass {
  /** Signature of the state class */
  signature: string;
  /** Set of nodes in this equivalence class */
  nodes: Set<HTMLNode>;
}

/**
 * Optimizer for HTML ASTs that applies automaton state minimization techniques
 */
export class HTMLAstOptimizer {
  /** Map of state equivalence classes */
  private stateClasses: Map<number, StateClass>;
  /** Map of node signatures to equivalence class IDs */
  private nodeSignatures: Map<string, number>;
  /** WeakMap to track minimized nodes */
  private minimizedNodes: WeakMap<HTMLNode, HTMLNode>;
  /** Component dependencies */
  private equivalenceClassComputer: EquivalenceClassComputer;
  private nodeReductionOptimizer: NodeReductionOptimizer;
  private pathOptimizer: PathOptimizer;
  private memoryOptimizer: MemoryOptimizer;
  private nodeMapBuilder: NodeMapBuilder;
  /** Whether to apply memory optimizations */
  private applyMemoryOptimizations: boolean;

  /**
   * Create a new HTML AST optimizer
   * 
   * @param applyMemoryOptimizations Whether to apply memory optimizations (default: true)
   */
  constructor(applyMemoryOptimizations: boolean = true) {
    this.stateClasses = new Map();
    this.nodeSignatures = new Map();
    this.minimizedNodes = new WeakMap();
    this.applyMemoryOptimizations = applyMemoryOptimizations;
    
    // Initialize component dependencies
    this.equivalenceClassComputer = new EquivalenceClassComputer();
    this.nodeReductionOptimizer = new NodeReductionOptimizer();
    this.pathOptimizer = new PathOptimizer();
    this.memoryOptimizer = new MemoryOptimizer();
    this.nodeMapBuilder = new NodeMapBuilder();
  }

  /**
   * Optimize an HTML AST
   * 
   * @param ast AST to optimize
   * @returns Optimized AST
   */
  public optimize(ast: HTMLAst): HTMLAst {
    // Phase 1: Build state equivalence classes
    this.buildStateClasses(ast.root);
    
    // Phase 2: Node reduction and path optimization
    const originalNodeMap = this.nodeMapBuilder.buildNodeMap(ast.root);
    const optimizedRoot = this.optimizeNode(ast.root);
    
    // Phase 3: Path optimization
    this.pathOptimizer.optimizePaths(optimizedRoot);
    
    // Phase 4: Memory optimization if enabled
    if (this.applyMemoryOptimizations) {
      this.memoryOptimizer.optimizeMemoryUsage(optimizedRoot);
    }
    
    // Compute optimization metrics
    const metrics = this.computeOptimizationMetrics(ast.root, optimizedRoot);
    
    // Create optimized AST with updated metadata
    return {
      root: optimizedRoot,
      metadata: {
        ...ast.metadata,
        optimizationMetrics: metrics
      }
    };
  }

  /**
   * Build state equivalence classes for nodes in the AST
   * 
   * @param root Root node of the AST
   */
  private buildStateClasses(root: HTMLNode): void {
    // Use the equivalence class computer to compute classes
    const equivalenceClasses = this.equivalenceClassComputer.computeEquivalenceClasses(root);
    this.stateClasses = equivalenceClasses;
    
    // Build node signatures map for quick lookups
    for (const [classId, nodeSet] of equivalenceClasses.entries()) {
      if (nodeSet.size > 0) {
        const node = nodeSet.values().next().value;
        const signature = node.computeStateSignature();
        this.nodeSignatures.set(signature, classId);
        
        // Assign equivalence class to all nodes in the set
        for (const node of nodeSet) {
          node.setEquivalenceClass(classId);
        }
      }
    }
  }

  /**
   * Optimize a node and its children
   * 
   * @param node Node to optimize
   * @returns Optimized node
   */
  private optimizeNode(node: HTMLNode): HTMLNode {
    // Check if node has already been minimized
    if (this.minimizedNodes.has(node)) {
      return this.minimizedNodes.get(node)!;
    }
    
    // Clone the node without children
    const optimized = node.clone();
    optimized.markAsMinimized();
    
    // Store the optimized node
    this.minimizedNodes.set(node, optimized);
    
    // Optimize children if the node has any
    if (node.children.length > 0) {
      const optimizedChildren = this.optimizeChildren(node.children);
      
      // Clear existing children and add optimized ones
      optimized.children = [];
      for (const child of optimizedChildren) {
        optimized.appendChild(child);
      }
    }
    
    return optimized;
  }

  /**
   * Optimize an array of child nodes
   * 
   * @param children Child nodes to optimize
   * @returns Optimized child nodes
   */
  private optimizeChildren(children: HTMLNode[]): HTMLNode[] {
    // First filter out nodes that should be removed
    const filteredChildren = children.filter(child => this.shouldKeepNode(child));
    
    // Then optimize each remaining child
    const optimizedChildren = filteredChildren.map(child => this.optimizeNode(child));
    
    // Merge adjacent text nodes
    const mergedChildren = this.mergeAdjacentTextNodes(optimizedChildren);
    
    // Apply node structure optimizations
    return this.nodeReductionOptimizer.optimizeNodeStructure(mergedChildren);
  }

  /**
   * Determine whether a node should be kept or removed
   * 
   * @param node Node to check
   * @returns Whether the node should be kept
   */
  private shouldKeepNode(node: HTMLNode): boolean {
    // Remove empty text nodes
    if (node.type === HTMLNodeType.TEXT) {
      // Cast to access text-specific properties
      const textValue = (node as any).content || '';
      return textValue.trim().length > 0;
    }
    
    // Keep all other node types
    return true;
  }

  /**
   * Merge adjacent text nodes
   * 
   * @param children Child nodes to merge
   * @returns Merged nodes
   */
  private mergeAdjacentTextNodes(children: HTMLNode[]): HTMLNode[] {
    const merged: HTMLNode[] = [];
    let currentTextNode: HTMLNode | null = null;
    
    for (const child of children) {
      if (child.type === HTMLNodeType.TEXT) {
        if (currentTextNode && currentTextNode.type === HTMLNodeType.TEXT) {
          // Access text content property
          const currentContent = (currentTextNode as any).content || '';
          const childContent = (child as any).content || '';
          
          // Merge text content
          (currentTextNode as any).content = currentContent + childContent;
        } else {
          // Start a new text node
          currentTextNode = child;
          merged.push(currentTextNode);
        }
      } else {
        // Non-text node, reset current text node
        currentTextNode = null;
        merged.push(child);
      }
    }
    
    return merged;
  }

  /**
   * Apply memory optimizations to a node
   * 
   * @param node Node to optimize
   */
  private applyMemoryOptimizationsToNode(node: HTMLNode): void {
    // Delegate to memory optimizer
    this.memoryOptimizer.optimizeMemoryUsage(node);
  }

  /**
   * Compute optimization metrics
   * 
   * @param originalRoot Original AST root
   * @param optimizedRoot Optimized AST root
   * @returns Optimization metrics
   */
  private computeOptimizationMetrics(originalRoot: HTMLNode, optimizedRoot: HTMLNode): OptimizationMetrics {
    const countNodes = (node: HTMLNode): { totalNodes: number, estimatedMemory: number } => {
      let totalNodes = 1;
      let estimatedMemory = this.estimateNodeMemory(node);
      
      for (const child of node.children) {
        const childCounts = countNodes(child);
        totalNodes += childCounts.totalNodes;
        estimatedMemory += childCounts.estimatedMemory;
      }
      
      return { totalNodes, estimatedMemory };
    };
    
    const originalCounts = countNodes(originalRoot);
    const optimizedCounts = countNodes(optimizedRoot);
    
    // Calculate average class size
    let totalNodesInClasses = 0;
    for (const [_, stateClass] of this.stateClasses.entries()) {
      totalNodesInClasses += stateClass.nodes.size;
    }
    
    const averageClassSize = this.stateClasses.size > 0
      ? totalNodesInClasses / this.stateClasses.size
      : 0;
    
    return {
      nodeReduction: {
        original: originalCounts.totalNodes,
        optimized: optimizedCounts.totalNodes,
        ratio: optimizedCounts.totalNodes / Math.max(1, originalCounts.totalNodes)
      },
      memoryUsage: {
        original: originalCounts.estimatedMemory,
        optimized: optimizedCounts.estimatedMemory,
        ratio: optimizedCounts.estimatedMemory / Math.max(1, originalCounts.estimatedMemory)
      },
      stateClasses: {
        count: this.stateClasses.size,
        averageSize: averageClassSize
      }
    };
  }

  /**
   * Estimate memory usage of a node
   * 
   * @param node Node to estimate memory for
   * @returns Estimated memory usage in bytes
   */
  private estimateNodeMemory(node: HTMLNode): number {
    // Base object overhead (approximate)
    let bytes = 40;
    
    // Add bytes for node type
    bytes += 8;
    
    // Add bytes for children array (base size)
    bytes += 24 + (8 * node.children.length);
    
    // Add bytes for position object
    bytes += 32;
    
    // Add bytes for stateMachine object
    bytes += 48 + (node.stateMachine.transitions.size * 16);
    
    // Additional bytes based on node type
    switch (node.type) {
      case HTMLNodeType.ELEMENT:
        // Cast to access element-specific properties
        const elementNode = node as any;
        bytes += (elementNode.tagName?.length || 0) * 2;
        
        // Add bytes for attributes
        if (elementNode.attributes) {
          bytes += 40; // Map overhead
          
          // Iterate through attributes
          if (typeof elementNode.attributes.forEach === 'function') {
            elementNode.attributes.forEach((value: string, key: string) => {
              bytes += (key.length + (value?.length || 0)) * 2 + 16;
            });
          }
        }
        break;
        
      case HTMLNodeType.TEXT:
        // Cast to access text-specific properties
        const textNode = node as any;
        bytes += (textNode.content?.length || 0) * 2;
        break;
        
      case HTMLNodeType.COMMENT:
        // Cast to access comment-specific properties
        const commentNode = node as any;
        bytes += (commentNode.data?.length || 0) * 2;
        break;
    }
    
    return bytes;
  }
}