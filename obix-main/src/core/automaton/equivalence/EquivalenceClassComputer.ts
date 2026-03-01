/**
 * EquivalenceClassComputer.ts
 * 
 * Implementation of automaton state minimization through equivalence class computation.
 * Based on Nnamdi Okpala's research on automaton state minimization and AST optimization.
 * 
 * This class implements the algorithm described in "Extended Automaton-AST Minimization 
 * and Validation" for computing equivalence classes of states in finite automata.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { VNode } from '../vhtml/VHTMLNode';
import { HTMLNode } from '../ast/html/node/HTMLNode';

/**
 * Interface for any node that can participate in equivalence class computation
 */
export interface MinimizableNode {
  /** Compute a signature that identifies the node's state characteristics */
  computeStateSignature(): string;
  /** Set the equivalence class for this node */
  setEquivalenceClass(classId: number): void;
  /** Check if this node is equivalent to another */
  isEquivalentTo(other: MinimizableNode): boolean;
  /** Get transitions from this node */
  getTransitionSymbols(): string[];
  /** Get target node for a transition symbol */
  getTransition(symbol: string): MinimizableNode | undefined;
}

/**
 * Class that computes equivalence classes for state minimization
 */
export class EquivalenceClassComputer {
  /** Map of class IDs to sets of nodes in that class */
  private equivalenceClasses: Map<number, Set<MinimizableNode>>;
  /** Map of node signatures to their equivalence class ID */
  private signatureToClass: Map<string, number>;
  /** Next available class ID */
  private nextClassId: number;
  /** Weak set of processed nodes to prevent cycles */
  private processedNodes: WeakSet<MinimizableNode>;
  /** Counter for tracking statistics */
  private nodeCount: number;
  
  /**
   * Create a new equivalence class computer
   */
  constructor() {
    this.equivalenceClasses = new Map();
    this.signatureToClass = new Map();
    this.nextClassId = 0;
    this.processedNodes = new WeakSet();
    this.nodeCount = 0;
  }
  
  /**
   * Compute equivalence classes for nodes in a tree
   * 
   * @param root Root node of the tree
   * @returns Map of class IDs to sets of equivalent nodes
   */
  public static computeEquivalenceClasses<T extends MinimizableNode>(
    root: T
  ): Map<number, Set<MinimizableNode>> {
    const computer = new EquivalenceClassComputer();
    return computer.computeEquivalenceClasses(root);
  }
  
  /**
   * Compute equivalence classes for nodes in a tree
   * 
   * @param root Root node of the tree
   * @returns Map of class IDs to sets of equivalent nodes
   */
  public computeEquivalenceClasses<T extends MinimizableNode>(
    root: T
  ): Map<number, Set<MinimizableNode>> {
    // Reset state
    this.equivalenceClasses.clear();
    this.signatureToClass.clear();
    this.nextClassId = 0;
    this.processedNodes = new WeakSet();
    this.nodeCount = 0;
    
    // Process the tree to collect nodes
    const nodes = this.collectNodes(root);
    
    // Initial partitioning based on node signatures
    this.initialPartitioning(nodes);
    
    // Iterative refinement until no more changes
    let changed = true;
    while (changed) {
      changed = this.refinePartitions();
    }
    
    // Assign final equivalence classes to nodes
    this.assignEquivalenceClasses();
    
    return this.equivalenceClasses;
  }
  
  /**
   * Collect all nodes in a tree
   * 
   * @param root Root node of the tree
   * @returns Array of all nodes in the tree
   */
  private collectNodes<T extends MinimizableNode>(root: T): MinimizableNode[] {
    const nodes: MinimizableNode[] = [];
    
    // Skip if already processed (prevent cycles)
    if (this.processedNodes.has(root)) {
      return nodes;
    }
    
    // Mark as processed
    this.processedNodes.add(root);
    this.nodeCount++;
    
    // Add this node
    nodes.push(root);
    
    // Handle VNode and HTMLNode differently
    if (this.isVNode(root)) {
      // Process children for VNode
      const vnode = root as unknown as VNode;
      if (vnode.children) {
        for (const child of vnode.children) {
          nodes.push(...this.collectNodes(child as unknown as MinimizableNode));
        }
      }
    } else if (this.isHTMLNode(root)) {
      // Process children for HTMLNode
      const htmlNode = root as unknown as HTMLNode;
      if (htmlNode.children) {
        for (const child of htmlNode.children) {
          nodes.push(...this.collectNodes(child as unknown as MinimizableNode));
        }
      }
    }
    
    // Process transitions (for both node types)
    const symbols = root.getTransitionSymbols();
    for (const symbol of symbols) {
      const target = root.getTransition(symbol);
      if (target && !this.processedNodes.has(target)) {
        nodes.push(...this.collectNodes(target));
      }
    }
    
    return nodes;
  }
  
  /**
   * Perform initial partitioning based on node signatures
   * 
   * @param nodes Array of nodes to partition
   */
  private initialPartitioning(nodes: MinimizableNode[]): void {
    for (const node of nodes) {
      // Compute signature
      const signature = node.computeStateSignature();
      
      // Check if signature already has a class
      let classId: number;
      if (this.signatureToClass.has(signature)) {
        classId = this.signatureToClass.get(signature)!;
      } else {
        // Create new class
        classId = this.nextClassId++;
        this.signatureToClass.set(signature, classId);
        this.equivalenceClasses.set(classId, new Set());
      }
      
      // Add node to its class
      this.equivalenceClasses.get(classId)!.add(node);
    }
  }
  
  /**
   * Refine partitions based on transition behavior
   * 
   * @returns True if any partitions were refined
   */
  private refinePartitions(): boolean {
    let changed = false;
    
    // Keep track of new partitions to add
    const newPartitions: Map<number, Set<MinimizableNode>[]> = new Map();
    
    // Check each existing partition
    for (const [classId, partition] of this.equivalenceClasses.entries()) {
      // Skip singleton partitions (can't be split further)
      if (partition.size <= 1) {
        continue;
      }
      
      // Try to split the partition
      const splits = this.splitPartition(partition);
      
      // If the partition was split
      if (splits.length > 1) {
        changed = true;
        
        // Remove the original partition
        this.equivalenceClasses.delete(classId);
        
        // Store splits to add later
        newPartitions.set(classId, splits);
      }
    }
    
    // Add new partitions
    for (const [classId, splits] of newPartitions.entries()) {
      // Keep the first split with the original class ID
      if (splits[0]) {
        this.equivalenceClasses.set(classId, splits[0]);
      }
      
      // Add remaining splits with new class IDs
      for (let i = 1; i < splits.length; i++) {
        const split = splits[i];
        if (split) {
          const newClassId = this.nextClassId++;
          this.equivalenceClasses.set(newClassId, split);
        }
      }
    }
    
    return changed;
  }
  
  /**
   * Split a partition based on transition behavior
   * 
   * @param partition Set of nodes to potentially split
   * @returns Array of new partitions
   */
  private splitPartition(partition: Set<MinimizableNode>): Set<MinimizableNode>[] {
    // Group nodes by transition behavior
    const groups = new Map<string, Set<MinimizableNode>>();
    
    for (const node of partition) {
      // Generate a transition signature for this node
      const transitionSignature = this.computeTransitionSignature(node);
      
      // Add to appropriate group
      if (!groups.has(transitionSignature)) {
        groups.set(transitionSignature, new Set());
      }
      
      groups.get(transitionSignature)!.add(node);
    }
    
    // Convert groups to array of sets
    return Array.from(groups.values());
  }
  
  /**
   * Compute a signature based on node's transitions and target classes
   * 
   * @param node Node to compute signature for
   * @returns Transition signature
   */
  private computeTransitionSignature(node: MinimizableNode): string {
    const transitionSignatures: string[] = [];
    
    // Get all transition symbols
    const symbols = node.getTransitionSymbols();
    
    // For each symbol, add a transition signature component
    for (const symbol of symbols) {
      const target = node.getTransition(symbol);
      
      if (target) {
        // Use target's class ID if it has one
        let targetClassId = -1;
        
        // Find target's class ID
        for (const [classId, nodes] of this.equivalenceClasses.entries()) {
          if (nodes.has(target)) {
            targetClassId = classId;
            break;
          }
        }
        
        transitionSignatures.push(`${symbol}:${targetClassId}`);
      }
    }
    
    // Sort to ensure consistent order
    transitionSignatures.sort();
    
    return transitionSignatures.join('|');
  }
  
  /**
   * Assign final equivalence classes to nodes
   */
  private assignEquivalenceClasses(): void {
    for (const [classId, nodes] of this.equivalenceClasses.entries()) {
      for (const node of nodes) {
        node.setEquivalenceClass(classId);
      }
    }
  }
  
  /**
   * Get the computed equivalence classes
   * 
   * @returns Map of class IDs to sets of equivalent nodes
   */
  public getEquivalenceClasses(): Map<number, Set<MinimizableNode>> {
    return new Map(this.equivalenceClasses);
  }
  
  /**
   * Get the count of equivalence classes
   * 
   * @returns Number of equivalence classes
   */
  public getEquivalenceClassCount(): number {
    return this.equivalenceClasses.size;
  }
  
  /**
   * Get the total number of nodes processed
   * 
   * @returns Number of nodes
   */
  public getNodeCount(): number {
    return this.nodeCount;
  }
  
  /**
   * Check if a node is a VNode
   * 
   * @param node Node to check
   * @returns True if node is a VNode
   */
  private isVNode(node: MinimizableNode): boolean {
    return 'type' in node && 
           'props' in node && 
           'children' in node &&
           'isText' in node;
  }
  
  /**
   * Check if a node is an HTMLNode
   * 
   * @param node Node to check
   * @returns True if node is an HTMLNode
   */
  private isHTMLNode(node: MinimizableNode): boolean {
    return 'type' in node && 
           'children' in node && 
           'position' in node &&
           'toHTML' in node;
  }
}