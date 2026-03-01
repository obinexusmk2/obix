import { HTMLNode } from "@/core/ast/html/node";
import { ValidationResult } from "@/core/dop/ValidationResult";
import { ErrorSeverity, ValidationError, ParserError, Position } from "@/core/validation/errors/ValidationError";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";

/**
 * Rule for validating the state machine data of HTML nodes
 * Implements Nnamdi Okpala's automaton state minimization verification
 */
export class StateMachineValidationRule implements ValidationRule {
  /**
   * Rule identifier
   */
  public readonly id: string;
  
  /**
   * Rule description
   */
  public readonly description: string;
  
  /**
   * Rule severity
   */
  public readonly severity: ErrorSeverity;
  
  /**
   * Compatibility markers for this rule
   */
  public readonly compatibilityMarkers: string[];

  /**
   * Optional rule dependencies
   */
  public readonly dependencies: string[];

  /**
   * Creates a new StateMachineValidationRule
   */
  constructor(
    id: string = 'state-machine-validation-rule',
    description: string = 'Validates state machine data for HTML nodes to ensure proper minimization',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = ['html', 'state-machine', 'minimization'],
    dependencies: string[] = []
  ) {
    this.id = id;
    this.description = description;
    this.severity = severity;
    this.compatibilityMarkers = compatibilityMarkers;
    this.dependencies = dependencies;
  }

  /**
   * Gets the rule ID
   * 
   * @returns Rule ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Gets the rule dependencies
   * 
   * @returns Rule dependencies
   */
  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Converts the rule to a plain object
   * 
   * @returns Plain object representation of the rule
   */
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      description: this.description,
      severity: this.severity,
      compatibilityMarkers: this.compatibilityMarkers,
      dependencies: this.dependencies
    };
  }

  /**
   * Creates a rule from a plain object
   * 
   * @param obj Plain object representation of the rule
   * @returns New validation rule instance
   */
  public static fromObject(obj: Record<string, any>): ValidationRule {
    if (!obj || typeof obj !== 'object') {
      throw new Error("Invalid object provided for deserialization");
    }

    return new StateMachineValidationRule(
      obj.id || 'state-machine-validation-rule',
      obj.description || 'Validates state machine data for HTML nodes to ensure proper minimization',
      obj.severity || ErrorSeverity.ERROR,
      obj.compatibilityMarkers || ['html', 'state-machine', 'minimization'],
      obj.dependencies || []
    );
  }

  /**
   * Updates this rule from a plain object
   * 
   * @param obj Plain object representation of the rule
   * @returns This rule instance
   */
  public fromObject(obj: Record<string, any>): ValidationRule {
    // Since our properties are readonly, we return a new instance
    return StateMachineValidationRule.fromObject(obj);
  }

  /**
   * Validates state machine data of an HTML node
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  public validate(node: any): ValidationResult<any> {
    if (!node || typeof node !== 'object') {
      return ValidationResult.createInvalid(
        new ValidationError(
          'INVALID_NODE',
          'Invalid node provided for validation',
          'StateMachineValidationRule'
        ),
        node
      );
    }
    
    // Ensure node is an HTML node with state machine data
    if (!('stateMachine' in node)) {
      return ValidationResult.createValid(node);
    }
    
    const result = new ValidationResult<HTMLNode>(true, node);
    
    // Validate state signature
    const signatureResult = this.validateStateSignature(node);
    if (!signatureResult.isValid) {
      result.isValid = false;
      for (const error of signatureResult.errors) {
        result.addError(error);
      }
    }
    
    // Validate transitions
    const transitionsResult = this.validateTransitions(node);
    if (!transitionsResult.isValid) {
      result.isValid = false;
      for (const error of transitionsResult.errors) {
        result.addError(error);
      }
    }
    
    // Validate equivalence class
    const equivalenceResult = this.validateEquivalenceClass(node);
    if (!equivalenceResult.isValid) {
      result.isValid = false;
      for (const error of equivalenceResult.errors) {
        result.addError(error);
      }
    }
    
    return result;
  }
    
  /**
   * Validates the state signature of a node
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  private validateStateSignature(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    // Skip validation if the node hasn't been minimized
    if (!node.stateMachine.isMinimized) {
      return result;
    }
    
    // Check if state signature exists
    if (!node.stateMachine.stateSignature) {
      result.isValid = false;
      result.addError(new ValidationError(
        'MISSING_STATE_SIGNATURE',
        `Minimized node ${node.id} is missing state signature`,
        'StateMachineValidationRule'
      ));
      return result;
    }
    
    // Check if state signature is correctly formatted
    // State signatures typically include node type and transitions
    const signature = node.stateMachine.stateSignature;
    if (!signature.includes(`type:${node.type}`)) {
      result.isValid = false;
      result.addError(new ValidationError(
        'INVALID_STATE_SIGNATURE',
        `Node ${node.id} has an invalid state signature missing type information`,
        'StateMachineValidationRule',
        'validator',
        ErrorSeverity.ERROR,
        {
          nodeId: node.id,
          nodeType: node.type,
          signature: signature
        }
      ));
    }
    
    return result;
  }
    
  /**
   * Validates the transitions of a node
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  private validateTransitions(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    // Check if transitions map exists
    if (!node.stateMachine.transitions) {
      result.addWarning(new ParserError(
        'MISSING_TRANSITIONS',
        `Node ${node.id} is missing transitions map`,
        'StateMachineValidationRule',
        node.position || new Position(0, 0, 0, 0)
      ));
      return result;
    }
    
    // Check for null or invalid transition targets
    for (const [symbol, targetNode] of node.stateMachine.transitions.entries()) {
      if (!targetNode) {
        result.isValid = false;
        result.addError(new ValidationError(
          'INVALID_TRANSITION_TARGET',
          `Node ${node.id} has a transition with symbol '${symbol}' to a null target`,
          'StateMachineValidationRule'
        ));
        continue;
      }
      
      // Check if target node exists (has an ID)
      if (!('id' in targetNode)) {
        result.isValid = false;
        result.addError(new ValidationError(
          'INVALID_TRANSITION_TARGET',
          `Node ${node.id} has a transition with symbol '${symbol}' to an invalid target`,
          'StateMachineValidationRule'
        ));
      }
    }
    
    return result;
  }
    
  /**
   * Validates the equivalence class of a node
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  private validateEquivalenceClass(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    // Skip validation if the node hasn't been minimized
    if (!node.stateMachine.isMinimized) {
      return result;
    }
    
    // Check if equivalence class is set for minimized nodes
    if (node.stateMachine.equivalenceClass === null || node.stateMachine.equivalenceClass === undefined) {
      result.isValid = false;
      result.addError(new ValidationError(
        'MISSING_EQUIVALENCE_CLASS',
        `Minimized node ${node.id} is missing equivalence class`,
        'StateMachineValidationRule'
      ));
      return result;
    }
    
    // Equivalence class should be a non-negative number
    if (typeof node.stateMachine.equivalenceClass === 'number' && node.stateMachine.equivalenceClass < 0) {
      result.isValid = false;
      result.addError(new ValidationError(
        'INVALID_EQUIVALENCE_CLASS',
        `Node ${node.id} has an invalid equivalence class: ${node.stateMachine.equivalenceClass}`,
        'StateMachineValidationRule'
      ));
    }
    
    return result;
  }
    
  /**
   * Checks if this rule is compatible with another rule
   * 
   * @param other The other rule to check compatibility with
   * @returns True if the rules are compatible
   */
  public isCompatibleWith(other: ValidationRule): boolean {
    return other.compatibilityMarkers.some(marker => 
      this.compatibilityMarkers.includes(marker)
    );
  }
}