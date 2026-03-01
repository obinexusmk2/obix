import { ValidationRule } from "../validation/rules/ValidationRule";
import { ValidationBehaviorModel } from "./ValidationBehaviourModel";
import { ValidationResult } from "./ValidationResult";




/**
 * Enhanced ValidationBehaviorModel with additional optimization techniques
 */
export class OptimizedValidationBehaviorModel extends ValidationBehaviorModel {
    /**
     * Cache for rule execution results to avoid redundant computation
     */
    public ruleResultCache: Map<string, Map<string, ValidationResult<any>>>;
    
    /**
     * Rule dependency graph for optimization
     */
    public ruleDependencyGraph: Map<string, Set<string>>;
    
    /**
     * Creates a new OptimizedValidationBehaviorModel instance
     */
    constructor() {
      super();
      this.ruleResultCache = new Map();
      this.ruleDependencyGraph = new Map();
    }
    
    /**
     * Applies a validation rule to a node with result caching
     * 
     * @override
     * @param rule The rule to apply
     * @param node The node to validate
     * @returns Validation result
     */
    public override applyRule(rule: ValidationRule, node: any): ValidationResult<any> {
      // Compute cache key
      const nodeHash = this.computeNodeHash(node);
      
      // Check cache
      const ruleCache = this.ruleResultCache.get(rule.id);
      if (ruleCache && ruleCache.has(nodeHash)) {
        return ruleCache.get(nodeHash)!;
      }
      
      // Apply rule normally
      const result = super.applyRule(rule, node);
      
      // Cache result
      if (!this.ruleResultCache.has(rule.id)) {
        this.ruleResultCache.set(rule.id, new Map());
      }
      this.ruleResultCache.get(rule.id)!.set(nodeHash, result);
      
      return result;
    }
    
    /**
     * Optimizes rules for efficient validation with dependency analysis
     * 
     * @override
     * @param rules The rules to optimize
     * @returns Map of node types to optimized rules
     */
    public override optimizeRules(rules: ValidationRule[]): Map<string, ValidationRule[]> {
      // Build dependency graph
      this.buildRuleDependencyGraph(rules);
      
      // Get rule sets using base implementation
      const ruleSets = super.optimizeRules(rules);
      
      // Further optimize by applying topological sorting based on dependencies
      for (const [type, typeRules] of ruleSets.entries()) {
        const sortedRules = this.topologicalSortRules(typeRules);
        ruleSets.set(type, sortedRules);
      }
      
      return ruleSets;
    }
    
   
  /**
   * Builds a dependency graph for rules
   * 
   * @public
   * @param rules The rules to analyze
   */
  public buildRuleDependencyGraph(rules: ValidationRule[]): void {
    this.ruleDependencyGraph.clear();
    
    // Initialize graph with empty dependencies for each rule
    for (const rule of rules) {
      this.ruleDependencyGraph.set(rule.id, new Set<string>());
    }
    
    // Analyze rule relationships to identify dependencies
    for (const rule of rules) {
      // 1. Check explicit dependencies if available
      if ('dependencies' in rule && Array.isArray((rule as any).dependencies)) {
        const deps = (rule as any).dependencies as string[];
        const dependencies = this.ruleDependencyGraph.get(rule.id)!;
        
        for (const depId of deps) {
          // Only add if the dependency rule exists
          if (rules.some(r => r.id === depId)) {
            dependencies.add(depId);
          }
        }
      }
      
      // 2. Check compatibility-based implicit dependencies
      for (const otherRule of rules) {
        if (rule.id === otherRule.id) continue;
        
        // Rules with matching compatibility markers have a potential dependency
        if (rule.isCompatibleWith(otherRule)) {
          // For rules with the same target types, lower severity depends on higher
          if (this.haveOverlappingTargets(rule, otherRule) && 
              rule.severity < otherRule.severity) {
            const dependencies = this.ruleDependencyGraph.get(rule.id)!;
            dependencies.add(otherRule.id);
          }
        }
      }
      
      // 3. Add sequential dependencies for rules of the same type
      // Rules with the same target type but different severity have an implicit order
      const targetsMap = this.groupRulesByTargets(rules);
      for (const [_targetKey, targetRules] of targetsMap.entries()) {
        if (targetRules.length <= 1) continue;
        
        // Sort by severity (highest first) to establish natural order
        const orderedRules = [...targetRules].sort((a, b) => b.severity - a.severity);
        
        // Each rule depends on the rules that come before it in severity order
        for (let i = 1; i < orderedRules.length; i++) {
          const currentRule = orderedRules[i];
          if (!currentRule) continue;
          const dependencies = this.ruleDependencyGraph.get(currentRule.id);
          
          // Add dependencies on all higher severity rules of the same type
          if (dependencies instanceof Set) {
            for (let j = 0; j < i; j++) {
              const ruleAtIndex = orderedRules[j];
              if (ruleAtIndex) {
                dependencies.add(ruleAtIndex.id);
              }
            }
          }
        }
      }
      
      // 4. Analyze rule implementation code patterns (simplified)
      // In a real implementation, this would involve code analysis to detect 
      // if a rule's validation logic depends on another rule's results
      // Here, we'll simulate with simple patterns using metadata
      
      if ('implementationSignature' in rule) {
        const signature = (rule as any).implementationSignature as string;
        const dependencies = this.ruleDependencyGraph.get(rule.id)!;
        
        for (const otherRule of rules) {
          if (rule.id === otherRule.id) continue;
          
          // Check if this rule's implementation references other rules
          if (signature.includes(`rule:${otherRule.id}`) || 
              signature.includes(`depends:${otherRule.id}`)) {
            dependencies.add(otherRule.id);
          }
        }
      }
    }
    
    // Validate and minimize the dependency graph
    this.validateDependencyGraph();
  }
  
  /**
   * Checks if two rules have overlapping target node types
   * 
   * @public
   * @param rule1 First rule
   * @param rule2 Second rule
   * @returns True if rules have at least one common target node type
   */
  public haveOverlappingTargets(rule1: ValidationRule, rule2: ValidationRule): boolean {
    // If rules don't specify target types, assume they don't overlap
    if (!('targetNodeTypes' in rule1) || !('targetNodeTypes' in rule2)) {
      return false;
    }
    
    const targets1 = (rule1 as any).targetNodeTypes as string[] || [];
    const targets2 = (rule2 as any).targetNodeTypes as string[] || [];
    
    // Check for wildcard targets
    if (targets1.includes('*') || targets2.includes('*')) {
      return true;
    }
    
    // Check for common target types
    return targets1.some(t => targets2.includes(t));
  }
  
  /**
   * Groups rules by their target node types
   * 
   * @public
   * @param rules Rules to group
   * @returns Map of target type signatures to rule arrays
   */
  public groupRulesByTargets(rules: ValidationRule[]): Map<string, ValidationRule[]> {
    const result = new Map<string, ValidationRule[]>();
    
    for (const rule of rules) {
      const targetKey = this.getTargetSignature(rule);
      if (!result.has(targetKey)) {
        result.set(targetKey, []);
      }
      result.get(targetKey)!.push(rule);
    }
    
    return result;
  }
  
  /**
   * Gets a signature string for a rule's target node types
   * 
   * @public
   * @param rule The rule to get a target signature for
   * @returns Target signature string
   */
  public getTargetSignature(rule: ValidationRule): string {
    if (!('targetNodeTypes' in rule)) {
      return 'unknown';
    }
    
    const targets = (rule as any).targetNodeTypes as string[] || [];
    return targets.sort().join(',');
  }
  
  /**
   * Validates the dependency graph and removes cycles
   * 
   * @public
   */
  public validateDependencyGraph(): void {
    // Detect and break cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // Depth-first search to detect cycles
    const detectCycle = (ruleId: string, path: string[] = []): boolean => {
      // If we've already checked this rule and found no cycles, skip
      if (visited.has(ruleId)) {
        return false;
      }
      
      // If we encounter a rule already in the current path, we've found a cycle
      if (recursionStack.has(ruleId)) {
        // Break the cycle by removing the dependency
        const cycleStart = path.indexOf(ruleId);
        if (cycleStart >= 0) {
          // Get the rule before the cycle start
          const lastRule = path[path.length - 1];
          const dependencies = this.ruleDependencyGraph.get(lastRule as string);
          if (dependencies) {
            dependencies.delete(ruleId);
          }
        }
        return true;
      }
      
      // Add to current path and mark as being processed
      recursionStack.add(ruleId);
      path.push(ruleId);
      
      // Check all dependencies
      const dependencies = this.ruleDependencyGraph.get(ruleId);
      if (dependencies) {
        for (const depId of dependencies) {
          if (detectCycle(depId, [...path])) {
            return true;
          }
        }
      }
      
      // Mark as fully processed and remove from current path
      recursionStack.delete(ruleId);
      visited.add(ruleId);
      
      return false;
    };
    
    // Check each rule
    for (const ruleId of this.ruleDependencyGraph.keys()) {
      detectCycle(ruleId);
    }
    
    // Minimize the graph by removing redundant dependencies
    this.minimizeDependencyGraph();
  }
  
  
    
    /**
     * Sorts rules topologically based on dependencies
     * 
     * @public
     * @param rules The rules to sort
     * @returns Sorted rules
     */
    public topologicalSortRules(rules: ValidationRule[]): ValidationRule[] {
      // Simple implementation - sort by severity and ID
      // A real implementation would use actual topological sorting
      // based on the dependency graph
      return [...rules].sort((a, b) => {
        if (a.severity !== b.severity) {
          return b.severity - a.severity; // Higher severity first
        }
        return a.id.localeCompare(b.id);
      });
    }
    
    /**
     * Computes a hash for a node to use as cache key
     * 
     * @public
     * @param node The node to hash
     * @returns A string hash
     */
    public computeNodeHash(node: any): string {
      if (node === null || node === undefined) {
        return 'null';
      }
      
      try {
        // Simple hashing strategy - in a real implementation,
        // this would use a more sophisticated approach
        const nodeType = this.getNodeType(node);
        const nodeId = node.id || '';
        
        // Include a subset of properties in the hash
        const relevantProps: any = {};
        for (const key of ['id', 'type', 'name', 'value']) {
          if (key in node) {
            relevantProps[key] = node[key];
          }
        }
        
        return `${nodeType}:${nodeId}:${JSON.stringify(relevantProps)}`;
      } catch (e) {
        // Fallback to simple type-based hash
        return `${this.getNodeType(node)}:${Date.now()}`;
      }
    }
    
    /**
     * Clears the result cache
     */
    public clearCache(): void {
      this.ruleResultCache.clear();
    }
  
    /**
     * Minimizes the dependency graph by removing redundant dependencies
     * 
     * @public
     */
    public minimizeDependencyGraph(): void {
      for (const [ruleId, dependencies] of this.ruleDependencyGraph.entries()) {
        const minimized = new Set<string>();
        
        for (const depId of dependencies) {
          // Check if this dependency is already implied by other dependencies
          const isRedundant = Array.from(dependencies).some(otherId => {
            if (otherId === depId) return false;
            const otherDeps = this.ruleDependencyGraph.get(otherId);
            return otherDeps?.has(depId);
          });
          
          if (!isRedundant) {
            minimized.add(depId);
          }
        }
        
        this.ruleDependencyGraph.set(ruleId, minimized);
      }
    }
  }