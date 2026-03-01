import { ExecutionTrace } from "../validation/errors/ExecutionTrace";
import { ValidationError } from "../validation/errors/ValidationError";
import { ValidationRule } from "../validation/rules/ValidationRule";
import { DataModel } from "./BaseDataModel";
import { ValidationBehavior } from "./BehaviourModel";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";
import { ValidationResult } from "./ValidationResult";
import { ValidationStateMachine } from "./ValidationStateMachine";


/**
 * Enhanced validation behavior model with state minimization capabilities
 * Implements Nnamdi Okpala's automaton state minimization algorithm
 */
export class EnhancedValidationBehaviorModel<T extends DataModel<T>> extends ValidationBehavior<T> {
    /**
     * State machine for validation states
     */
    public stateMachine: ValidationStateMachine;

    /**
     * Description of this behavior
     */
    public override description: string = 'Enhanced validation behavior model with state minimization';
    
    /**
     * Whether state minimization is enabled
     */
    public minimizationEnabled: boolean;
    
    /**
     * Whether tracing is enabled
     */
    public tracingEnabled: boolean;
    
    /**
     * Cache for optimized rules by node type
     */
    public ruleCache: Map<string, ValidationRule[]> = new Map();
    
    /**
     * Rule dependency graph for optimization
     */
    public ruleDependencyGraph: Map<string, Set<string>> = new Map();
    
    /**
     * Creates a new enhanced validation behavior model
     * 
     * @param id Unique identifier
     * @param description Description of this behavior
     * @param stateMachine State machine for validation states
     * @param minimizationEnabled Whether state minimization is enabled
     * @param tracingEnabled Whether tracing is enabled
     */
    constructor(
      id: string = 'enhanced-validation-behavior',
      description: string = 'Enhanced validation behavior model with state minimization',
      stateMachine: ValidationStateMachine = new ValidationStateMachine(),
      minimizationEnabled: boolean = true,
      tracingEnabled: boolean = false
    ) {
      super(id, description);
      this.stateMachine = stateMachine;
      this.minimizationEnabled = minimizationEnabled;
      this.tracingEnabled = tracingEnabled;
    }
    
    /**
     * Validates a data model with state minimization
     * 
     * @param data The data model to validate
     * @returns Validation result
     */
    override process(data: T): ValidationResult<T> {
      // Reset state machine
      this.stateMachine.reset();
      
      // Start trace if enabled
      let trace: ExecutionTrace | undefined;
      if (this.tracingEnabled) {
        trace = ExecutionTrace.start('validation-process', { 
          dataModelType: data.constructor.name,
          minimizationEnabled: this.minimizationEnabled
        });
      }
      
      try {
        // Extract validation rules from the data model if it's a ValidationDataModelImpl
        let rules: ValidationRule[] = [];
        if (data instanceof ValidationDataModelImpl) {
          rules = data.getRules();
        }
        
        // Initialize result
        const result = new ValidationResult<T>(true, data);
        
        // Apply each rule
        for (const rule of rules) {
          try {
            // Apply the rule
            const ruleResult = this.applyRule(rule, data);
            
            // Update validity
            if (!ruleResult.isValid) {
              result.isValid = false;
              result.errors.push(...ruleResult.errors);
            }
            
            // Transition the state machine
            this.stateMachine.transition(rule.id);
          } catch (error) {
            // Handle rule application errors
            result.isValid = false;
            result.errors.push(new ValidationError(
                'RULE_EXECUTION_ERROR',
                `Error applying rule ${rule.id}: ${error instanceof Error ? error.message : String(error)}`,
                'EnhancedValidationBehaviorModel'
            ));
            
            // Handle error in state machine
            if (error instanceof ValidationError) {
              this.stateMachine.handleErrorInState(error);
            }
          }
        }
        
        // Minimize state machine if enabled
        if (this.minimizationEnabled) {
          this.stateMachine.minimize();
        }
        
        // Complete trace if enabled
        if (trace) {
          trace.end({ 
            isValid: result.isValid,
            errorCount: result.errors.length
          });
          result.traces = [trace];
        }
        
        return result;
      } catch (error) {
        // Handle unexpected errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Complete trace if enabled
        if (trace) {
          trace.end({ 
            error: errorMessage,
            success: false
          });
        }
        
        return new ValidationResult<T>(false, data, [new ValidationError(
          'UNEXPECTED_ERROR',
          `Unexpected error during validation: ${errorMessage}`,
          'EnhancedValidationBehaviorModel'
        )]);
      }
    }
    
    /**
     * Applies a validation rule to a data model
     * 
     * @param rule The rule to apply
     * @param data The data model to validate
     * @returns Validation result for this rule
     */
    public applyRule(rule: ValidationRule, data: T): ValidationResult<T> {
      try {
        // Start trace if enabled
        let trace: ExecutionTrace | undefined;
        if (this.tracingEnabled) {
          trace = ExecutionTrace.start(`rule-${rule.id}`, { rule: rule.id });
        }
        
        // Apply the rule
        const ruleResult = rule.validate(data instanceof ValidationDataModelImpl ? (data as ValidationDataModelImpl).getData() : data);
        
        // Create a validation result
        const result = new ValidationResult<T>(
          ruleResult && typeof ruleResult === 'object' ? ruleResult.isValid !== false : true,
          data,
          ruleResult && typeof ruleResult === 'object' && Array.isArray(ruleResult.errors) ? 
            ruleResult.errors : []
        );
        
        // Complete trace if enabled
        if (trace) {
          trace.end({ 
            isValid: result.isValid,
            errorCount: result.errors.length
          });
          result.traces = [trace];
        }
        
        return result;
      } catch (error) {
        // Handle errors in rule application
        return new ValidationResult<T>(false, data, [new ValidationError(
          'RULE_ERROR',
          `Error in rule ${rule.id}: ${error instanceof Error ? error.message : String(error)}`,
          'EnhancedValidationBehaviorModel'
        )]);
      }
    }
    
    /**
     * Finds rules that are applicable to a given node
     * 
     * @param node The node to find applicable rules for
     * @param rules The pool of available rules
     * @returns Array of applicable rules
     */
    public findApplicableRules(node: any, rules: ValidationRule[]): ValidationRule[] {
      // Get the node type
      const nodeType = this.getNodeType(node);
      
      // Check cache
      if (this.ruleCache.has(nodeType)) {
        return this.ruleCache.get(nodeType) || [];
      }
      
      // Filter rules that apply to this node type
      const applicableRules = rules.filter(rule => {
        if (!('targetNodeTypes' in rule)) {
          return true; // If rule doesn't specify types, assume it applies to all
        }
        
        const targetTypes = (rule as any).targetNodeTypes;
        if (!targetTypes || !Array.isArray(targetTypes)) {
          return true;
        }
        
        return targetTypes.includes(nodeType) || targetTypes.includes('*');
      });
      
      // Sort by severity (highest first)
      applicableRules.sort((a, b) => b.severity - a.severity);
      
      // Cache the result
      this.ruleCache.set(nodeType, applicableRules);
      
      return applicableRules;
    }
    
    /**
     * Gets the type of a node
     * 
     * @param node The node to get the type of
     * @returns The node type as a string
     */
    public getNodeType(node: any): string {
      if (node === null || node === undefined) {
        return 'null';
      }
      
      // Check for type property
      if (node.type) {
        return node.type;
      }
      
      // Check for nodeType property
      if (node.nodeType) {
        return node.nodeType;
      }
      
      // Fall back to constructor name or typeof
      return node.constructor?.name || typeof node;
    }
    
    /**
     * Builds a rule dependency graph for optimization
     * 
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
          const dependencies = this.ruleDependencyGraph.get(rule.id);
          
          if (dependencies) {
            for (const depId of deps) {
              // Only add if the dependency rule exists
              if (rules.some(r => r.id === depId)) {
                dependencies.add(depId);
              }
            }
          }
        }
        
        // 2. Add sequential dependencies for rules of the same type
        // Rules with the same target type but different severity have an implicit order
        this.analyzeRuleDependencies(rule, rules);
      }
      
      // Validate and minimize the dependency graph
      this.validateDependencyGraph();
    }
    
    /**
     * Analyzes rule dependencies
     * 
     * @param rule The rule to analyze
     * @param allRules All rules
     */
    public analyzeRuleDependencies(rule: ValidationRule, allRules: ValidationRule[]): void {
      // Get target types for this rule
      const targetTypes = 'targetNodeTypes' in rule ? (rule as any).targetNodeTypes : ['*'];
      if (!targetTypes || !Array.isArray(targetTypes)) {
        return;
      }
      
      // Group rules by target types
      const rulesByType = new Map<string, ValidationRule[]>();
      for (const type of targetTypes) {
        rulesByType.set(type, []);
      }
      
      // Populate rules by type
      for (const otherRule of allRules) {
        if (rule.id === otherRule.id) continue;
        
        const otherTypes = 'targetNodeTypes' in otherRule ? (otherRule as any).targetNodeTypes : ['*'];
        if (!otherTypes || !Array.isArray(otherTypes)) {
          continue;
        }
        
        for (const type of otherTypes) {
          if (rulesByType.has(type)) {
            rulesByType.get(type)!.push(otherRule);
          }
        }
      }
      
      // Add dependencies based on severity
      const dependencies = this.ruleDependencyGraph.get(rule.id);
      if (!dependencies) return;
      
      for (const [_, typeRules] of rulesByType.entries()) {
        // Sort by severity (highest first)
        const orderedRules = [...typeRules].sort((a, b) => b.severity - a.severity);
        
        // Find this rule's position in the ordered list
        const ruleIndex = orderedRules.findIndex(r => r.id === rule.id);
        if (ruleIndex === -1) continue;
        
        // Add dependencies on all higher severity rules of the same type
        for (let i = 0; i < ruleIndex; i++) {
          const higherRule = orderedRules[i];
          if (higherRule) {
            dependencies.add(higherRule.id);
          }
        }
      }
    }
    
    /**
     * Validates the dependency graph and removes cycles
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
            if (lastRule) {
              const dependencies = this.ruleDependencyGraph.get(lastRule);
           if (dependencies) {
              dependencies.delete(ruleId);
           }
            
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
     * Minimizes the dependency graph by removing redundant dependencies
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
    
    /**
     * Gets the state machine used by this behavior model
     * 
     * @returns The validation state machine
     */
    public getStateMachine(): ValidationStateMachine {
      return this.stateMachine;
    }
    
    /**
     * Enables or disables state minimization
     * 
     * @param enabled Whether to enable state minimization
     * @returns This behavior model for method chaining
     */
    public setMinimizationEnabled(enabled: boolean): EnhancedValidationBehaviorModel<T> {
      this.minimizationEnabled = enabled;
      return this;
    }
    
    /**
     * Checks if state minimization is enabled
     * 
     * @returns True if state minimization is enabled
     */
    public isMinimizationEnabled(): boolean {
      return this.minimizationEnabled;
    }
    
    /**
     * Enables or disables tracing
     * 
     * @param enabled Whether to enable tracing
     * @returns This behavior model for method chaining
     */
    public setTracingEnabled(enabled: boolean): EnhancedValidationBehaviorModel<T> {
      this.tracingEnabled = enabled;
      return this;
    }
    
    /**
     * Checks if tracing is enabled
     * 
     * @returns True if tracing is enabled
     */
    public isTracingEnabled(): boolean {
      return this.tracingEnabled;
    }
    
    /**
     * Clears the rule cache
     * 
     * @returns This behavior model for method chaining
     */
    public clearCache(): EnhancedValidationBehaviorModel<T> {
      this.ruleCache.clear();
      return this;
    }
    
    /**
     * Creates a clone of this behavior model
     * 
     * @returns A new EnhancedValidationBehaviorModel instance
     */
    public clone(): EnhancedValidationBehaviorModel<T> {
      return new EnhancedValidationBehaviorModel<T>(
        this.id,
        this.description,
        this.stateMachine.clone(),
        this.minimizationEnabled,
        this.tracingEnabled
      );
    }
  }