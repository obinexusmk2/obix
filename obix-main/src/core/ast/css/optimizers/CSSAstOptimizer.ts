import { CSSNode, CSSNodeType } from "../node/CSSNode";
import { CSSAst, OptimizationMetrics } from "./CSSAst";

/**
 * Interface for a state equivalence class
 */
interface StateClass {
  /** Signature of the state class */
  signature: string;
  /** Set of nodes in this equivalence class */
  nodes: Set<CSSNode>;
}

/**
 * CSS AST Optimizer implementation
 * Applies automaton state minimization techniques to reduce AST size and improve performance
 */
export class CSSAstOptimizer {
  /** Map of state equivalence classes */
  public stateClasses: Map<number, StateClass>;
  /** Map of node signatures to equivalence class IDs */
  public nodeSignatures: Map<string, number>;
  /** WeakMap to track minimized nodes */
  public minimizedNodes: WeakMap<CSSNode, CSSNode>;
  /** Whether to apply memory optimizations */
  public applyMemoryOptimizations: boolean;

  /**
   * Create a new CSS AST optimizer
   * 
   * @param applyMemoryOptimizations Whether to apply memory optimizations
   */
  constructor(applyMemoryOptimizations: boolean = true) {
    this.stateClasses = new Map();
    this.nodeSignatures = new Map();
    this.minimizedNodes = new WeakMap();
    this.applyMemoryOptimizations = applyMemoryOptimizations;
  }

  /**
   * Optimize a CSS AST
   * 
   * @param ast AST to optimize
   * @returns Optimized AST
   */
  optimize(ast: CSSAst): CSSAst {
    // Phase 1: Build state equivalence classes
    this.buildStateClasses(ast.root);
    
    // Phase 2: Node reduction and path optimization
    const optimizedRoot = this.optimizeNode(ast.root);
    
    // Phase 3: Memory optimization if enabled
    if (this.applyMemoryOptimizations) {
      this.applyMemoryOptimizationsToNode(optimizedRoot);
    }

    // Compute optimization metrics
    const metrics: OptimizationMetrics = {
      nodeReduction: {
        original: 0,
        optimized: 0,
        ratio: 0
      },
      memoryUsage: {
        original: 0,
        optimized: 0,
        ratio: 0
      },
      stateClasses: {
        count: 0,
        averageSize: 0
      }
    };

    // Create optimized AST
    const optimizedAst = new CSSAst(optimizedRoot);
    optimizedAst.metadata = {
      ...ast.metadata,
      optimizationMetrics: metrics
    };

    return optimizedAst;
  }

  /**
   * Build state equivalence classes for nodes in the AST
   * 
   * @param root Root node of the AST
   */
  public buildStateClasses(root: CSSNode): void {
    const stateSignatures = new Map<string, Set<CSSNode>>();
    
    // First pass: Collect state signatures
    const collectSignatures = (node: CSSNode) => {
      const signature = this.computeNodeSignature(node);
      if (!stateSignatures.has(signature)) {
        stateSignatures.set(signature, new Set());
      }
      stateSignatures.get(signature)!.add(node);
      
      for (const child of node.children) {
        collectSignatures(child);
      }
    };
    
    collectSignatures(root);
    
    // Second pass: Build equivalence classes
    let classId = 0;
    for (const [signature, nodes] of stateSignatures.entries()) {
      if (nodes.size > 1) {
        this.stateClasses.set(classId, {
          signature,
          nodes: new Set(nodes)
        });
        this.nodeSignatures.set(signature, classId);
        
        // Assign equivalence class to all nodes
        for (const node of nodes) {
          node.setEquivalenceClass(classId);
        }
        
        classId++;
      }
    }
  }

  /**
   * Compute a signature for a node
   * 
   * @param node Node to compute signature for
   * @returns Node signature
   */
  public computeNodeSignature(node: CSSNode): string {
    // Use the node's built-in signature computation
    return node.computeSignature();
  }

  /**
   * Optimize a node and its children
   * 
   * @param node Node to optimize
   * @returns Optimized node
   */
  public optimizeNode(node: CSSNode): CSSNode {
    // Check if node has already been minimized
    if (this.minimizedNodes.has(node)) {
      return this.minimizedNodes.get(node)!;
    }
    
    // Create optimized node
    const optimized = node.clone(false); // Clone without children
    optimized.setMinimized(true);
    
    // Store the optimized node
    this.minimizedNodes.set(node, optimized);
    
    // Optimize children
    if (node.children.length > 0) {
      optimized.children = this.optimizeChildren(node.children);
    }
    
    return optimized;
  }

  /**
   * Optimize an array of child nodes
   * 
   * @param children Child nodes to optimize
   * @returns Optimized child nodes
   */
  public optimizeChildren(children: CSSNode[]): CSSNode[] {
    // First optimize each child
    const optimizedChildren = children
      .filter(child => this.shouldKeepNode(child))
      .map(child => this.optimizeNode(child));
    
    // Then apply node-specific optimizations based on parent type
    const firstParent = children[0]?.parent;
    if (!firstParent) return optimizedChildren;
    
    // Apply different optimizations based on parent node type
    switch (firstParent.type) {
      case CSSNodeType.Rule:
        // For CSS rules, we can apply property merging
        return this.optimizeRuleChildren(optimizedChildren);
        
      case CSSNodeType.Stylesheet:
        // For stylesheets, we can merge similar rules
        return this.optimizeStylesheetChildren(optimizedChildren);
        
      case CSSNodeType.Declaration:
        // For declarations, we can merge adjacent values
        return this.mergeAdjacentValues(optimizedChildren);
        
      default:
        return optimizedChildren;
    }
  }

  /**
   * Determine whether a node should be kept or removed
   * 
   * @param node Node to check
   * @returns Whether the node should be kept
   */
  public shouldKeepNode(node: CSSNode): boolean {
    // Keep all nodes except empty values or comments
    if (node.type === CSSNodeType.Value) {
      return node.value !== null && node.value.trim().length > 0;
    }
    
    // Optionally filter out comments
    if (node.type === CSSNodeType.Comment) {
      return false; // Remove comments in optimized AST
    }
    
    return true;
  }

  /**
   * Optimize children of a CSS rule
   * 
   * @param children Child nodes of a rule
   * @returns Optimized child nodes
   */
  public optimizeRuleChildren(children: CSSNode[]): CSSNode[] {
    // Group declarations by property name
    const declarationsByProperty = new Map<string, CSSNode[]>();
    
    for (const child of children) {
      if (child.type === CSSNodeType.Declaration) {
        const property = child.findChild(CSSNodeType.Property);
        if (property?.value) {
          const propertyName = property.value;
          if (!declarationsByProperty.has(propertyName)) {
            declarationsByProperty.set(propertyName, []);
          }
          declarationsByProperty.get(propertyName)!.push(child);
        }
      }
    }
    
    // Keep only the last declaration for each property
    const optimizedChildren: CSSNode[] = [];
    const processedProperties = new Set<string>();
    
    // Process in reverse to keep the last declarations
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i];
      
      if (child && child.type === CSSNodeType.Declaration) {
        const property = child.findChild(CSSNodeType.Property);
        if (property?.value) {
          const propertyName = property.value;
          
          if (!processedProperties.has(propertyName)) {
            // This is the first time we've seen this property (going backward)
            optimizedChildren.unshift(child);
            processedProperties.add(propertyName);
          }
        } else {
          // Property without a name, keep it
          optimizedChildren.unshift(child);
        }
      } else if (child) {
        // Non-declaration node, keep it
        optimizedChildren.unshift(child);
      }
    }
    
    return optimizedChildren;
  }

  /**
   * Optimize children of a stylesheet
   * 
   * @param children Child nodes of a stylesheet
   * @returns Optimized child nodes
   */
  public optimizeStylesheetChildren(children: CSSNode[]): CSSNode[] {
    // Group rules by selector
    const rulesBySelector = new Map<string, CSSNode[]>();
    
    for (const child of children) {
      if (child.type === CSSNodeType.Rule && child['selector']) {
        if (!rulesBySelector.has(child['selector'])) {
          rulesBySelector.set(child['selector'], []);
        }
        rulesBySelector.get(child['selector'])!.push(child);
      }
    }
    
    // Merge rules with the same selector
    const mergedRules: CSSNode[] = [];
    const processedSelectors = new Set<string>();
    
    for (const child of children) {
      if (child.type === CSSNodeType.Rule && child['selector']) {
        if (!processedSelectors.has(child['selector'])) {
          const rulesWithSameSelector = rulesBySelector.get(child['selector'])!;
          
          if (rulesWithSameSelector.length === 1) {
            // Only one rule with this selector, keep it as is
            mergedRules.push(child);
          } else {
            // Multiple rules with the same selector, merge them
            const mergedRule = new CSSNode(CSSNodeType.Rule, null, { selector: child['selector'] });
            mergedRule.setMinimized(true);
            
            // Collect all declarations from all rules with this selector
            const allDeclarations: CSSNode[] = [];
            for (const rule of rulesWithSameSelector) {
              allDeclarations.push(...rule.children);
            }
            
            // Optimize the collected declarations
            mergedRule.children = this.optimizeRuleChildren(allDeclarations);
            
            mergedRules.push(mergedRule);
          }
          
            processedSelectors.add(child['selector']);
        }
      } else {
        // Non-rule node, keep it
        mergedRules.push(child);
      }
    }
    
    return mergedRules;
  }

  /**
   * Merge adjacent value nodes
   * 
   * @param children Child nodes to merge
   * @returns Merged nodes
   */
  public mergeAdjacentValues(children: CSSNode[]): CSSNode[] {
    const merged: CSSNode[] = [];
    let currentValueNode: CSSNode | null = null;
    
    for (const child of children) {
      if (child.type === CSSNodeType.Value) {
        if (currentValueNode) {
          // Merge with the current value node
          currentValueNode.value = `${currentValueNode.value} ${child.value}`;
        } else {
          // Start a new value node
          currentValueNode = child;
          merged.push(currentValueNode);
        }
      } else {
        // Non-value node, reset current value node
        currentValueNode = null;
        merged.push(child);
      }
    }
    
    return merged;
  }

  /**
   * Apply memory optimizations to a node and its children
   * 
   * @param node Node to optimize
   */
  public applyMemoryOptimizationsToNode(node: CSSNode): void {
    // Freeze metadata to prevent modifications
    Object.freeze(node.metadata);
    
    // Recursively apply optimizations to children
    for (const child of node.children) {
      this.applyMemoryOptimizationsToNode(child);
    }
    
    // Freeze the children array to prevent modifications
    Object.freeze(node.children);
    
    // Don't freeze the node itself, as it might need to be modified
    // during parsing or rendering
  }

  /**
   * Compute optimization metrics
   * 
   * @param originalRoot Original AST root
   * @param optimizedRoot Optimized AST root
   * @returns Optimization metrics
   */
  public computeOptimizationMetrics(originalRoot: CSSNode, optimizedRoot: CSSNode): OptimizationMetrics {
    const originalMetrics = this.getNodeMetrics(originalRoot);
    const optimizedMetrics = this.getNodeMetrics(optimizedRoot);
    
    return {
      nodeReduction: {
        original: originalMetrics.totalNodes,
        optimized: optimizedMetrics.totalNodes,
        ratio: optimizedMetrics.totalNodes / Math.max(1, originalMetrics.totalNodes)
      },
      memoryUsage: {
        original: originalMetrics.estimatedMemory,
        optimized: optimizedMetrics.estimatedMemory,
        ratio: optimizedMetrics.estimatedMemory / Math.max(1, originalMetrics.estimatedMemory)
      },
      stateClasses: {
        count: this.stateClasses.size,
        averageSize: Array.from(this.stateClasses.values())
          .reduce((acc, cls) => acc + cls.nodes.size, 0) / Math.max(1, this.stateClasses.size)
      },
      
    };
  }

  /**
   * Get metrics for a node and its children
   * 
   * @param node Node to get metrics for
   * @returns Node metrics
   */
  public getNodeMetrics(node: CSSNode): { totalNodes: number; estimatedMemory: number } {
    const metrics = { totalNodes: 0, estimatedMemory: 0 };
    
    const traverse = (n: CSSNode): void => {
      metrics.totalNodes++;
      metrics.estimatedMemory += this.estimateNodeMemory(n);
      
      for (const child of n.children) {
        traverse(child);
      }
    };
    
    traverse(node);
    return metrics;
  }

  /**
   * Estimate memory usage of a node
   * 
   * @param node Node to estimate memory for
   * @returns Estimated memory usage in bytes
   */
  public estimateNodeMemory(node: CSSNode): number {
    let bytes = 0;
    
    // Base object overhead (varies by implementation, approximate)
    bytes += 40;
    
    // Type string
    bytes += node.type.length * 2;
    
    // Value string
    bytes += (node.value?.length || 0) * 2;
    
    // Metadata
    bytes += JSON.stringify(node.metadata).length * 2;
    
    // Type-specific properties
    switch (node.type) {
      case CSSNodeType.Rule:
        bytes += (node['selector']?.length || 0) * 2;
        break;
      case CSSNodeType.AtRule:
        bytes += (node['name']?.length || 0) * 2;
        bytes += (node['prelude']?.length || 0) * 2;
        break;
      case CSSNodeType.MediaQuery:
        bytes += (node['mediaType']?.length || 0) * 2;
        if (node['mediaFeatures']) {
            bytes += node['mediaFeatures']!.reduce((acc: number, feature: string) => acc + feature.length * 2, 0);
        }
        break;
      case CSSNodeType.KeyframeBlock:
        bytes += (node['keyText']?.length || 0) * 2;
        break;
    }
    
    return bytes;
  }
}