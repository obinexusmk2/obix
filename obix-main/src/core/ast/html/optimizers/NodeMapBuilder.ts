/**
 * NodeMapBuilder.ts
 * 
 * Builds a map of node IDs to node instances for efficient node lookup
 * during optimization and state minimization. This utility component supports
 * the AST optimization process by enabling O(1) node access by ID.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { HTMLNode } from "../node/HTMLNode";

/**
 * Builds maps of node IDs to node instances
 */
export class NodeMapBuilder {
  /** Set of visited node IDs to prevent cycles */
  private visitedNodes: Set<number>;
  
  /**
   * Create a new NodeMapBuilder
   */
  constructor() {
    this.visitedNodes = new Set();
  }
  
  /**
   * Build a map of node IDs to node instances
   * 
   * @param root Root node to start mapping from
   * @returns Map of node IDs to node instances
   */
  public buildNodeMap(root: HTMLNode): Map<number, HTMLNode> {
    // Reset visited nodes
    this.visitedNodes.clear();
    
    // Create node map
    const nodeMap = new Map<number, HTMLNode>();
    
    // Traverse the tree and collect nodes
    this.traverseAndCollect(root, nodeMap);
    
    return nodeMap;
  }
  
  /**
   * Recursively traverse the tree and collect nodes
   * 
   * @param node Current node
   * @param map Map to add nodes to
   */
  private traverseAndCollect(node: HTMLNode, map: Map<number, HTMLNode>): void {
    // Skip if already visited
    if (this.visitedNodes.has(node.id)) {
      return;
    }
    
    // Mark as visited
    this.visitedNodes.add(node.id);
    
    // Add to map
    map.set(node.id, node);
    
    // Process children
    for (const child of node.children) {
      this.traverseAndCollect(child, map);
    }
    
    // Process transitions
    if (node.stateMachine && node.stateMachine.transitions) {
      for (const targetNode of node.stateMachine.transitions.values()) {
        if (targetNode && !this.visitedNodes.has(targetNode.id)) {
          this.traverseAndCollect(targetNode, map);
        }
      }
    }
  }
  
  /**
   * Build a map of node equivalence classes to node instances
   * 
   * @param root Root node to start mapping from
   * @returns Map of equivalence class IDs to sets of node instances
   */
  public buildEquivalenceClassMap(root: HTMLNode): Map<number, Set<HTMLNode>> {
    // Reset visited nodes
    this.visitedNodes.clear();
    
    // Create class map
    const classMap = new Map<number, Set<HTMLNode>>();
    
    // Traverse the tree and collect nodes by class
    this.collectNodesByClass(root, classMap);
    
    return classMap;
  }
  
  /**
   * Collect nodes by equivalence class
   * 
   * @param node Current node
   * @param classMap Map to add nodes to
   */
  private collectNodesByClass(node: HTMLNode, classMap: Map<number, Set<HTMLNode>>): void {
    // Skip if already visited
    if (this.visitedNodes.has(node.id)) {
      return;
    }
    
    // Mark as visited
    this.visitedNodes.add(node.id);
    
    // Add to class map if node has an equivalence class
    const classId = node.stateMachine.equivalenceClass;
    if (classId !== null) {
      if (!classMap.has(classId)) {
        classMap.set(classId, new Set<HTMLNode>());
      }
      
      classMap.get(classId)!.add(node);
    }
    
    // Process children
    for (const child of node.children) {
      this.collectNodesByClass(child, classMap);
    }
    
    // Process transitions
    if (node.stateMachine && node.stateMachine.transitions) {
      for (const targetNode of node.stateMachine.transitions.values()) {
        if (targetNode && !this.visitedNodes.has(targetNode.id)) {
          this.collectNodesByClass(targetNode, classMap);
        }
      }
    }
  }
  
  /**
   * Find nodes that match a specific signature
   * 
   * @param root Root node to start search from
   * @param signature Signature to match
   * @returns Array of matching nodes
   */
  public findNodesBySignature(root: HTMLNode, signature: string): HTMLNode[] {
    // Reset visited nodes
    this.visitedNodes.clear();
    
    // Create result array
    const matchingNodes: HTMLNode[] = [];
    
    // Traverse and find nodes
    this.traverseAndFindBySignature(root, signature, matchingNodes);
    
    return matchingNodes;
  }
  
  /**
   * Traverse and find nodes with a specific signature
   * 
   * @param node Current node
   * @param signature Signature to match
   * @param results Array to add matching nodes to
   */
  private traverseAndFindBySignature(
    node: HTMLNode, 
    signature: string, 
    results: HTMLNode[]
  ): void {
    // Skip if already visited
    if (this.visitedNodes.has(node.id)) {
      return;
    }
    
    // Mark as visited
    this.visitedNodes.add(node.id);
    
    // Check if this node matches the signature
    if (node.stateMachine.stateSignature === signature) {
      results.push(node);
    }
    
    // Process children
    for (const child of node.children) {
      this.traverseAndFindBySignature(child, signature, results);
    }
    
    // Process transitions
    if (node.stateMachine && node.stateMachine.transitions) {
      for (const targetNode of node.stateMachine.transitions.values()) {
        if (targetNode && !this.visitedNodes.has(targetNode.id)) {
          this.traverseAndFindBySignature(targetNode, signature, results);
        }
      }
    }
  }
}