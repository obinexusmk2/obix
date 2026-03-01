/**
 * MemoryOptimizer.ts
 * 
 * Implements memory optimization techniques for HTML ASTs based on automaton 
 * state minimization principles. This class focuses on reducing memory footprint
 * through structural optimization and property freezing.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { HTMLNode, HTMLNodeType } from "../node/HTMLNode";
import { HTMLElementNode } from "../node/HTMLElementNode";
import { HTMLTextNode } from "../node/HTMLTextNode";

/**
 * Interface for node size metrics
 */
interface NodeSizeMetrics {
  /** Total memory usage in bytes */
  totalBytes: number;
  /** Breakdown of memory usage by property */
  breakdown: Record<string, number>;
}

/**
 * Optimizes memory usage in HTML ASTs
 */
export class MemoryOptimizer {
  /** Maps equivalence classes to representative nodes */
  private classRepresentatives: Map<number, HTMLNode>;
  
  /** Set of processed node IDs to avoid re-processing */
  private processedNodes: Set<number>;
  
  /** Cache of node size measurements */
  private nodeSizeCache: Map<string, NodeSizeMetrics>;
  
  /**
   * Create a new MemoryOptimizer
   */
  constructor() {
    this.classRepresentatives = new Map();
    this.processedNodes = new Set();
    this.nodeSizeCache = new Map();
  }
  
  /**
   * Optimize memory usage in an HTML AST
   * 
   * @param node Root node to optimize
   */
  public optimizeMemoryUsage(node: HTMLNode): void {
    // Reset state
    this.classRepresentatives.clear();
    this.processedNodes.clear();
    this.nodeSizeCache.clear();
    
    // Phase 1: Share node instances between equivalence classes
    this.shareNodeInstancesBetweenClasses(node);
    
    // Phase 2: Freeze immutable properties to prevent modifications
    this.freezeImmutableProperties(node);
    
    // Phase 3: Inline small children into parent nodes where beneficial
    this.inlineSmallChildrenIntoParent(node);
  }
  
  /**
   * Share node instances between equivalent node classes
   * 
   * @param root Root node to start from
   */
  public shareNodeInstancesBetweenClasses(root: HTMLNode): void {
    // First, identify class representatives
    this.identifyClassRepresentatives(root);
    
    // Then, replace nodes with representatives
    this.replaceWithClassRepresentatives(root);
  }
  
  /**
   * Identify class representatives for all equivalence classes
   * 
   * @param node Node to process
   */
  private identifyClassRepresentatives(node: HTMLNode): void {
    // Skip if already processed
    if (this.processedNodes.has(node.id)) {
      return;
    }
    
    // Mark as processed
    this.processedNodes.add(node.id);
    
    // Check if this node belongs to an equivalence class
    const classId = node.stateMachine.equivalenceClass;
    if (classId !== null && !this.classRepresentatives.has(classId)) {
      // This is the first node we've seen in this class, make it the representative
      this.classRepresentatives.set(classId, node);
    }
    
    // Process children
    for (const child of node.children) {
      this.identifyClassRepresentatives(child);
    }
  }
  
  /**
   * Replace nodes with their class representatives where possible
   * 
   * @param node Node to process
   */
  private replaceWithClassRepresentatives(node: HTMLNode): void {
    // Skip root node
    
    // Process children
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;
      
      // Check if this child belongs to an equivalence class
      const classId = child.stateMachine.equivalenceClass;
      if (classId !== null && this.classRepresentatives.has(classId)) {
        const representative = this.classRepresentatives.get(classId)!;
        
        // If this isn't already the representative, replace it
        if (child.id !== representative.id) {
          // Replace the child with the representative
          node.children[i] = representative;
          
          // Don't process its children since we're replacing it
          continue;
        }
      }
      
      // Process this child's children if child exists
      if (child) {
        this.replaceWithClassRepresentatives(child);
      }
    }
  }
  
  /**
   * Freeze immutable properties to prevent modifications and reduce memory usage
   * 
   * @param node Node to freeze properties for
   */
  public freezeImmutableProperties(node: HTMLNode): void {
    // Skip if already processed
    if (this.processedNodes.has(node.id)) {
      return;
    }
    
    // Mark as processed
    this.processedNodes.add(node.id);
    
    // Freeze state machine data
    if (node.stateMachine) {
      // Freeze equivalence class - it shouldn't change after optimization
      Object.defineProperty(node.stateMachine, 'equivalenceClass', {
        writable: false,
        configurable: false
      });
      
      // Freeze isMinimized flag
      Object.defineProperty(node.stateMachine, 'isMinimized', {
        writable: false,
        configurable: false
      });
      
      // Freeze state signature if it exists
      if (node.stateMachine.stateSignature !== null) {
        Object.defineProperty(node.stateMachine, 'stateSignature', {
          writable: false,
          configurable: false
        });
      }
    }
    
    // Freeze node type - it never changes
    Object.defineProperty(node, 'type', {
      writable: false,
      configurable: false
    });
    
    // Freeze position - it doesn't change after parsing
    Object.defineProperty(node, 'position', {
      writable: false,
      configurable: false
    });
    
    // Freeze node ID - it never changes
    Object.defineProperty(node, 'id', {
      writable: false,
      configurable: false
    });
    
    // Type-specific freezing
    if (node.type === HTMLNodeType.ELEMENT) {
      const elementNode = node as HTMLElementNode;
      
      // Freeze tag name - it never changes
      Object.defineProperty(elementNode, 'tagName', {
        writable: false,
        configurable: false
      });
      
      // Freeze attributes if they exist
      if (elementNode.attributes && elementNode.attributes.size > 0) {
        // Create a frozen Map from the existing Map
        const frozenAttributes = new Map(elementNode.attributes);
        Object.freeze(frozenAttributes);
        
        Object.defineProperty(elementNode, 'attributes', {
          value: frozenAttributes,
          writable: false,
          configurable: false
        });
      }
    } else if (node.type === HTMLNodeType.TEXT) {
      const textNode = node as HTMLTextNode;
      
      // Freeze content since text content is immutable after optimization
      Object.defineProperty(textNode, 'content', {
        writable: false,
        configurable: false
      });
    }
    
    // Process children
    for (const child of node.children) {
      this.freezeImmutableProperties(child);
    }
  }
  
  /**
   * Inline small children into parent nodes where beneficial
   * 
   * @param node Node to process
   * @param maxChildSize Maximum size in bytes to consider for inlining
   */
  public inlineSmallChildrenIntoParent(node: HTMLNode, maxChildSize: number = 128): void {
    // Skip if already processed
    if (this.processedNodes.has(node.id)) {
      return;
    }
    
    // Mark as processed
    this.processedNodes.add(node.id);
    
    // Skip leaf nodes
    if (node.children.length === 0) {
      return;
    }
    
    // Track children that should be inlined
    const childrenToInline: number[] = [];
    
    // Check each child
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (!child) continue;
      
      // Skip if child has its own children
      if (child.children.length > 0) {
        // Process this child's children recursively
        this.inlineSmallChildrenIntoParent(child, maxChildSize);
        continue;
      }
      
      // Check child size
      const childSize = this.estimateNodeSize(child);
      if (childSize.totalBytes <= maxChildSize) {
        // This child is small enough to inline
        childrenToInline.push(i);
      }
    }
    
    // If we have children to inline, do so
    if (childrenToInline.length > 0) {
      this.inlineChildren(node, childrenToInline);
    }
  }
  
  /**
   * Inline specified children into parent node
   * 
   * @param parent Parent node
   * @param childIndices Indices of children to inline
   */
  private inlineChildren(parent: HTMLNode, childIndices: number[]): void {
    // For now, we'll just add metadata to the parent indicating which children are inlined
    // This is a placeholder for a more sophisticated inlining mechanism
    
    if (!parent.stateMachine.metadata) {
      parent.stateMachine.metadata = {};
    }
    
    // Create inlined children metadata
    parent.stateMachine.metadata = {
      ...parent.stateMachine.metadata,
      inlinedChildren: childIndices.map(i => {
        const child = parent.children[i];
        if (!child || i < 0 || i >= parent.children.length) {
          return null;
        }
        return {
          id: child.id,
          type: child.type,
          // Store type-specific properties
          properties: this.extractNodeProperties(child)
        };
      }).filter(item => item !== null)
    };
    
    // Remove inlined children from the children array
    // Note: In a real implementation, we might keep them but mark them as inlined
    // For this implementation, we're removing them to save memory
    for (let i = childIndices.length - 1; i >= 0; i--) {
      const index = childIndices[i];
      if (typeof index === 'number' && index >= 0 && index < parent.children.length) {
        parent.children.splice(index, 1, ...[] as HTMLNode[]);
      }
    }
  }
  
  /**
   * Extract properties from a node for inlining
   * 
   * @param node Node to extract properties from
   * @returns Object with extracted properties
   */
  private extractNodeProperties(node: HTMLNode): Record<string, any> {
    const properties: Record<string, any> = {};
    
    // Extract type-specific properties
    if (node.type === HTMLNodeType.TEXT) {
      const textNode = node as HTMLTextNode;
      properties['content'] = textNode.content;
    } else if (node.type === HTMLNodeType.ELEMENT) {
      const elementNode = node as HTMLElementNode;
      properties['tagName'] = elementNode.tagName;
      properties['attributes'] = Array.from(elementNode.attributes.entries());
    }
    
    return properties;
  }
  
  /**
   * Estimate memory usage of a node
   * 
   * @param node Node to estimate size for
   * @returns Size metrics
   */
  private estimateNodeSize(node: HTMLNode): NodeSizeMetrics {
    // Check cache first
    const cacheKey = `${node.type}-${node.id}`;
    if (this.nodeSizeCache.has(cacheKey)) {
      return this.nodeSizeCache.get(cacheKey)!;
    }
    
    // Base size for any node
    const breakdown: Record<string, number> = {
      base: 40, // Base object overhead
      stateMachine: 40, // StateMachineData object
      children: 24 + (node.children.length * 8) // Array overhead + pointers
    };
    
      // Add size for type-specific properties
    if (node.type === HTMLNodeType.TEXT) {
      const textNode = node as HTMLTextNode;
      breakdown['content'] = (textNode.content?.length || 0) * 2; // UTF-16 string
    } else if (node.type === HTMLNodeType.ELEMENT) {
      const elementNode = node as HTMLElementNode;
      breakdown['tagName'] = (elementNode.tagName?.length || 0) * 2; // UTF-16 string
      
      // Calculate attributes size
      if (elementNode.attributes && elementNode.attributes.size > 0) {
        let attributesSize = 40; // Map overhead
        
        elementNode.attributes.forEach((value, key) => {
          attributesSize += (key.length + (value?.toString().length || 0)) * 2 + 16; // Key + value + entry overhead
        });
        
        breakdown['attributes'] = attributesSize;
      }
    }
    
    // Sum up total
    const totalBytes = Object.values(breakdown).reduce((sum, size) => sum + size, 0);
    
    // Cache the result
    const metrics = { totalBytes, breakdown };
    this.nodeSizeCache.set(cacheKey, metrics);
    
    return metrics;
  }
}