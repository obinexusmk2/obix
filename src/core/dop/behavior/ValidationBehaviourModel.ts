import { ValidationDataModel } from "../validation/data/ValidationDataModel";
import { ExecutionTrace } from "../validation/errors/ExecutionTrace";
import { ValidationSystemError, ValidationPhase, Position } from "../validation/errors/ValidationError";
import { ValidationRule } from "../validation/rules/ValidationRule";
import { BehaviorModel } from "./BehaviourModel";
import { ImplementationComparisonResult } from "./ImplementationComparisonResult";
import { ValidationResult } from "./ValidationResult";
import { ValidationState } from "./ValidationState";
import { ValidationStateMachine } from "./ValidationStateMachine";



export class ValidationBehaviorModel implements BehaviorModel<ValidationDataModel, ValidationResult<any>> {

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
    
    // Filter rules that apply to this node type
    // For this example, we assume rules have a 'targetNodeTypes' property
    return rules.filter(rule => {
      if (!('targetNodeTypes' in rule)) {
        return true; // If rule doesn't specify types, assume it applies to all
      }
      
      const targetTypes = (rule as any).targetNodeTypes;
      if (!targetTypes || !Array.isArray(targetTypes)) {
        return true;
      }
      
      return targetTypes.includes(nodeType) || targetTypes.includes('*');
    });
  }
  
  compareWith( ): ImplementationComparisonResult {
    // Implementation of compareWith method
    return new ImplementationComparisonResult(true, []);
  }

  process(): ValidationResult<any> {
    // Implement the process method
    
    return new ValidationResult<any>(true, []);
  }

  getBehaviorId(): string {
    // Implement the getBehaviorId method
    return 'validation-behavior';
  }

  getDescription(): string {
    // Implement the getDescription method
    return 'Validation behavior model for processing validation rules';
  }
  /**
   * Applies a validation rule to a node
   * 
   * @param rule The rule to apply
   * @param node The node to validate
   * @returns Validation result
   */
  public applyRule(rule: ValidationRule, node: any): ValidationResult<any> {
    try {
      // Create an execution trace for this rule application
      const trace = this.captureRuleExecution(rule, node);
      
      // Apply the rule
      const result = rule.validate(node);
      
      // Add trace to result
      result.addTrace(trace);
      
      return result;
    } catch (error) {
      // Handle error
      const systemError = this.handleRuleExecutionError(
        rule,
        error instanceof Error ? error : new Error(String(error))
      );
      
      // Create an invalid result with the error
      return ValidationResult.createInvalid(systemError, node);
    }
  }

  /**
   * Validates a data model using a set of rules
   * 
   * @param dataModel The data model to validate
   * @returns Validation result
   */
  public validate(dataModel: ValidationDataModel): ValidationResult<ValidationDataModel> {
    // Implement the validate method
    const result = new ValidationResult<ValidationDataModel>(true, dataModel);
    const rules = this.getRulesForDataModel(dataModel);
    
    for (const node of dataModel.nodes) {
      const applicableRules = this.findApplicableRules(node, rules);
      for (const rule of applicableRules) {
        const ruleResult = this.applyRule(rule, node);
        result.addResult(ruleResult);
      }
    }
    
    return result;
  }

  /**
   * Retrieves the validation rules for a given data model
   * 
   * @param dataModel The data model to retrieve rules for
   * @returns Array of validation rules
   */
  public getRulesForDataModel(dataModel: ValidationDataModel): ValidationRule[] {
    // Retrieve rules based on the data model's properties
    if (dataModel.ruleSet && Array.isArray(dataModel.ruleSet)) {
      return dataModel.ruleSet;
    }
    return [];
  }

  
  /**
   * Optimizes rules for efficient validation
   * Groups rules by node type for faster lookup
   * 
   * @param rules The rules to optimize
   * @returns Map of node types to optimized rules
   */
  public optimizeRules(rules: ValidationRule[]): Map<string, ValidationRule[]> {
    const optimizedRules = new Map<string, ValidationRule[]>();
    
    // Group rules by target node type
    for (const rule of rules) {
      if (!('targetNodeTypes' in rule)) {
        // Rules without type constraints go into a special group
        const wildcardRules = optimizedRules.get('*') || [];
        wildcardRules.push(rule);
        optimizedRules.set('*', wildcardRules);
        continue;
      }
      
      const targetTypes = (rule as any).targetNodeTypes;
      if (!targetTypes || !Array.isArray(targetTypes)) {
        const wildcardRules = optimizedRules.get('*') || [];
        wildcardRules.push(rule);
        optimizedRules.set('*', wildcardRules);
        continue;
      }
      
      // Add rule to each of its target types
      for (const type of targetTypes) {
        const typeRules = optimizedRules.get(type) || [];
        typeRules.push(rule);
        optimizedRules.set(type, typeRules);
      }
    }
    
    // Apply state minimization to the rule sets
    // This is where Nnamdi Okpala's automaton state minimization technology would be applied
    // to further optimize the rule sets
    this.minimizeRuleSets(optimizedRules);
    
    return optimizedRules;
  }
  
  /**
   * Validates whether two rules are equivalent
   * This is a key part of ensuring 1:1 correspondence between paradigms
   * 
   * @param rule1 First rule
   * @param rule2 Second rule
   * @returns True if the rules are equivalent
   */
  public validateRuleEquivalence(rule1: ValidationRule, rule2: ValidationRule): boolean {
    // Check basic properties
    if (rule1.id !== rule2.id || rule1.severity !== rule2.severity) {
      return false;
    }
    
    // Check compatibility markers
    if (!rule1.isCompatibleWith(rule2) || !rule2.isCompatibleWith(rule1)) {
      return false;
    }
    
    // For a more comprehensive check, we would need to test the rules
    // with a set of test inputs and compare results
    // This is a simplified implementation
    
    return true;
  }
  
  /**
   * Captures an execution trace for a rule application
   * 
   * @param rule The rule being executed
   * @param node The node being validated
   * @returns An execution trace
   */
  public captureRuleExecution(rule: ValidationRule, node: any): ExecutionTrace {
    // Create a new trace
    const trace = ExecutionTrace.start(rule.id, { node });
    
    // Add the node type to the execution path
    trace.addStep(`Validating node of type ${this.getNodeType(node)}`);
    
    return trace;
  }
  
  /**
   * Handles an error that occurred during rule execution
   * 
   * @public
   * @param rule The rule that caused the error
   * @param error The error that occurred
   * @returns A ValidationSystemError
   */
  public handleRuleExecutionError(rule: ValidationRule, error: Error): ValidationSystemError {
    return new ValidationSystemError(
      'RULE_EXECUTION_ERROR',
      `Error executing rule "${rule.id}": ${error.message}`,
      'ValidationBehaviorModel',
      ValidationPhase.RULE_APPLICATION,
      { ruleId: rule.id },
      error.stack || '',
      false
    );
  }
  
  /**
   * Gets the position information for a node if available
   * 
   * @param node The node to get position for
   * @returns Position information or default position
   */
  public getNodePosition(node: any): Position {
    // Extract position information if available
    if (node && typeof node === 'object') {
      if ('position' in node && typeof node.position === 'object') {
        const pos = node.position;
        return new Position(
          pos.line || 1,
          pos.column || 1,
          pos.start || 0,
          pos.end || 0
        );
      }
      
      if ('loc' in node && typeof node.loc === 'object') {
        const loc = node.loc;
        const start = loc.start || {};
        const end = loc.end || {};
        return new Position(
          start.line || 1,
          start.column || 1,
          start.offset || 0,
          end.offset || 0
        );
      }
    }
    
    // Default position
    return new Position();
  }
  
  /**
   * Gets the type of a node
   * 
   * @public
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
 * Applies minimization techniques to rule sets
 * Implements Nnamdi Okpala's automaton state minimization
 * 
 * @public
 * @param ruleSets Map of node types to rule sets
 */
public minimizeRuleSets(ruleSets: Map<string, ValidationRule[]>): void {
  // Step 1: Model rules as states in a finite automaton
  const states = new Map<string, ValidationState>();
  for (const [_, ruleSet] of ruleSets.entries()) {
    for (const rule of ruleSet) {
      const state = new ValidationState(rule.id, false, { 
        rule, 
        nodeType: _,
        isAccepting: true,  // All rule states are accepting states in this model
        ruleSignature: this.computeRuleSignature(rule)
      });
      states.set(rule.id, state);
    }
  }
    
  // Step 2: Define transitions based on rule application conditions
  this.buildRuleTransitions(states, ruleSets);
  
  // Step 3: Apply state minimization to merge equivalent states
  // Create a ValidationStateMachine from our states
  const stateMachine = new ValidationStateMachine();
  for (const state of states.values()) {
    stateMachine.addState(state);
  }
  
  // Add transitions to the state machine
  for (const [ruleId, state] of states.entries()) {
    for (const [input, targetState] of state.getAllTransitions().entries()) {
      stateMachine.addTransition(ruleId, input, targetState.getId());
    }
  }
  
  // Minimize the state machine
  stateMachine.minimize();
  
  // Step 4: Restructure rule sets based on minimized automaton
  this.restructureRuleSets(ruleSets, stateMachine);
}

/**
 * Computes a unique signature for a rule
 * 
 * @public
 * @param rule The rule to compute a signature for
 * @returns A string signature representing the rule's characteristics
 */
public computeRuleSignature(rule: ValidationRule): string {
  // Create a signature based on rule properties
  const components = [
    `id:${rule.id}`,
    `severity:${rule.severity}`,
    `markers:[${rule.compatibilityMarkers.sort().join(',')}]`
  ];
  
  // Add additional properties depending on rule type
  if ('targetNodeTypes' in rule) {
    const nodeTypes = (rule as any).targetNodeTypes || [];
    components.push(`nodeTypes:[${nodeTypes.sort().join(',')}]`);
  }
  
  if ('implementationSignature' in rule) {
    components.push(`impl:${(rule as any).implementationSignature}`);
  }
  
  return components.join('|');
}

/**
 * Builds transitions between rule states
 * 
 * @public
 * @param states Map of rule IDs to ValidationState instances
 * @param ruleSets Map of node types to rule sets
 */
public buildRuleTransitions(
  states: Map<string, ValidationState>,
  ruleSets: Map<string, ValidationRule[]>
): void {
  // For each rule, define transitions to dependent rules
  for (const [_nodeKey, ruleSet] of ruleSets.entries()) {
    for (const rule of ruleSet) {
      const state = states.get(rule.id);
      if (!state) continue;
      
      // Handle dependencies if they exist
      if ('dependencies' in rule) {
        const dependencies = (rule as any).dependencies || [];
        for (const depId of dependencies) {
          const depState = states.get(depId);
          if (depState) {
            // Create a transition with the dependency name as the input symbol
            state.addTransition(`dep:${depId}`, depState);
          }
        }
      }
      
      // Build transitions based on compatibility
      for (const otherRule of ruleSet) {
        if (rule.id === otherRule.id) continue;
        
        if (rule.isCompatibleWith(otherRule)) {
          const otherState = states.get(otherRule.id);
          if (otherState) {
            // Create a transition based on compatibility
            state.addTransition(`compat:${otherRule.id}`, otherState);
          }
        }
      }
      
      // Add transitions for target node types if available
      if ('targetNodeTypes' in rule) {
        const targetNodeTypes = (rule as any).targetNodeTypes || [];
        for (const targetType of targetNodeTypes) {
          // Create transitions to rules that validate the same node type
          const rulesForType = ruleSets.get(targetType) || [];
          for (const typeRule of rulesForType) {
            if (rule.id === typeRule.id) continue;
            
            const typeState = states.get(typeRule.id);
            if (typeState) {
              state.addTransition(`type:${targetType}`, typeState);
            }
          }
        }
      }
    }
  }
}

/**
 * Restructures rule sets based on minimized state machine
 * 
 * @public
 * @param ruleSets Map of node types to rule sets
 * @param minimizedStateMachine The minimized state machine
 */
public restructureRuleSets(
  ruleSets: Map<string, ValidationRule[]>,
  minimizedStateMachine: ValidationStateMachine
): void {
  // Extract equivalence classes from the minimized state machine
  const stateToClass = new Map<string, number>();
  for (const [stateId, state] of minimizedStateMachine.getAllStates().entries()) {
    const equivalenceClass = state.getEquivalenceClass();
    if (equivalenceClass !== undefined && equivalenceClass >= 0) {
      stateToClass.set(stateId, equivalenceClass);
    }
  }
  
  // Group rules by equivalence class
  const classToBucket = new Map<number, string[]>();
  for (const [stateId, classId] of stateToClass.entries()) {
    if (!classToBucket.has(classId)) {
      classToBucket.set(classId, []);
    }
    classToBucket.get(classId)!.push(stateId);
  }
  
  // Optimization: For each node type, keep one rule from each equivalence class
  for (const [nodeType, ruleSet] of ruleSets.entries()) {
    // Group rules by equivalence class
    const classToRules = new Map<number, ValidationRule[]>();
    
    for (const rule of ruleSet) {
      const classId = stateToClass.get(rule.id);
      if (classId !== undefined) {
        if (!classToRules.has(classId)) {
          classToRules.set(classId, []);
        }
        classToRules.get(classId)!.push(rule);
      }
    }
    
    // Keep only one rule per class (prioritizing by severity)
    const optimizedRules: ValidationRule[] = [];
    for (const [_, rulesInClass] of classToRules.entries()) {
      if (rulesInClass.length > 0) {
        // Sort by severity and pick the highest severity rule
        rulesInClass.sort((a, b) => b.severity - a.severity);
        optimizedRules.push(rulesInClass[0] as ValidationRule) // Keep the highest severity rule
      }
    }
    
    // Replace the rule set with the optimized rules
    ruleSets.set(nodeType, optimizedRules);
  }
  
  // Sort optimized rule sets by severity to ensure critical checks are done first
  for (const [_, rules] of ruleSets.entries()) {
    rules.sort((a, b) => b.severity - a.severity);
  }
}
}

