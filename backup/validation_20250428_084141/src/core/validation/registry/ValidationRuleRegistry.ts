/**
 * ValidationRuleRegistry.ts
 * 
 * Registry for managing ValidationRule instances with efficient lookup by ID
 * and node type. This supports the ValidationEngine by providing centralized 
 * rule management.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationRule } from '../../rules/ValidationRule';

/**
 * Registry for validation rules
 */
export class ValidationRuleRegistry {
  /**
   * Map of rule IDs to rule instances
   */
  public rulesById: Map<string, ValidationRule> = new Map();
  
  /**
   * Map of node types to applicable rules
   */
  public rulesByNodeType: Map<string, Set<ValidationRule>> = new Map();
  
  /**
   * Constructor initializes an empty registry
   */
  constructor() {
    // Initialize with an empty wildcard rule set
    this.rulesByNodeType.set('*', new Set<ValidationRule>());
  }
  
  /**
   * Registers a rule with the registry
   * 
   * @param rule The rule to register
   * @returns This registry for method chaining
   */
  public register(rule: ValidationRule): ValidationRuleRegistry {
    // Add to ID map
    this.rulesById.set(rule.id, rule);
    
    // Add to node type map
    this.indexRuleByNodeType(rule);
    
    return this;
  }
  
  /**
   * Indexes a rule by applicable node types
   * 
   * @public
   * @param rule The rule to index
   */
  public indexRuleByNodeType(rule: ValidationRule): void {
    // Check if rule has targetNodeTypes property
    if ('targetNodeTypes' in rule) {
      const targetTypes = (rule as any).targetNodeTypes;
      
      if (Array.isArray(targetTypes)) {
        // Add rule to each target type's set
        for (const nodeType of targetTypes) {
          if (!this.rulesByNodeType.has(nodeType)) {
            this.rulesByNodeType.set(nodeType, new Set<ValidationRule>());
          }
          
          this.rulesByNodeType.get(nodeType)!.add(rule);
        }
        
        return;
      }
    }
    
    // If no target types are defined or the property doesn't exist,
    // add to wildcard set (applies to all node types)
    this.rulesByNodeType.get('*')!.add(rule);
  }
  
  /**
   * Gets a rule by ID
   * 
   * @param id The rule ID
   * @returns The rule or undefined if not found
   */
  public get(id: string): ValidationRule | undefined {
    return this.rulesById.get(id);
  }
  
  /**
   * Gets all rules applicable to a node type
   * 
   * @param nodeType The node type
   * @returns Array of applicable rules
   */
  public getByNodeType(nodeType: string): ValidationRule[] {
    const result: ValidationRule[] = [];
    
    // Add wildcard rules (apply to all node types)
    const wildcardRules = this.rulesByNodeType.get('*');
    if (wildcardRules) {
      result.push(...wildcardRules);
    }
    
    // Add type-specific rules
    const typeRules = this.rulesByNodeType.get(nodeType);
    if (typeRules) {
      result.push(...typeRules);
    }
    
    return result;
  }
  
  /**
   * Gets all registered rules
   * 
   * @returns Array of all rules
   */
  public getAll(): ValidationRule[] {
    return Array.from(this.rulesById.values());
  }
  
  /**
   * Gets rules that match a predicate function
   * 
   * @param predicate The predicate function
   * @returns Array of matching rules
   */
  public getWhere(predicate: (rule: ValidationRule) => boolean): ValidationRule[] {
    return this.getAll().filter(predicate);
  }
  
  /**
   * Removes a rule by ID
   * 
   * @param id The rule ID
   * @returns True if the rule was removed
   */
  public remove(id: string): boolean {
    const rule = this.rulesById.get(id);
    if (!rule) {
      return false;
    }
    
    // Remove from ID map
    this.rulesById.delete(id);
    
    // Remove from node type map
    for (const ruleSet of this.rulesByNodeType.values()) {
      ruleSet.delete(rule);
    }
    
    return true;
  }
  
  /**
   * Checks if a rule exists
   * 
   * @param id The rule ID
   * @returns True if the rule exists
   */
  public has(id: string): boolean {
    return this.rulesById.has(id);
  }
  
  /**
   * Gets the number of registered rules
   * 
   * @returns The number of rules
   */
  public count(): number {
    return this.rulesById.size;
  }
  
  /**
   * Clears all rules
   * 
   * @returns This registry for method chaining
   */
  public clear(): ValidationRuleRegistry {
    this.rulesById.clear();
    
    // Clear node type map but keep the structure
    for (const ruleSet of this.rulesByNodeType.values()) {
      ruleSet.clear();
    }
    
    return this;
  }
  
  /**
   * Gets all registered node types
   * 
   * @returns Array of node types
   */
  public getNodeTypes(): string[] {
    return Array.from(this.rulesByNodeType.keys());
  }
  
  /**
   * Gets rule counts by node type
   * 
   * @returns Map of node types to rule counts
   */
  public getRuleCounts(): Map<string, number> {
    const counts = new Map<string, number>();
    
    for (const [nodeType, ruleSet] of this.rulesByNodeType.entries()) {
      counts.set(nodeType, ruleSet.size);
    }
    
    return counts;
  }
  
  /**
   * Registers multiple rules
   * 
   * @param rules The rules to register
   * @returns This registry for method chaining
   */
  public registerMany(rules: ValidationRule[]): ValidationRuleRegistry {
    for (const rule of rules) {
      this.register(rule);
    }
    
    return this;
  }
}