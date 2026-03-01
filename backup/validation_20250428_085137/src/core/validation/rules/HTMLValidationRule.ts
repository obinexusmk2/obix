import { ErrorSeverity, ParserError, Position } from "../errors/ValidationError";
import { ValidationResult } from "../../../../old/dop/dop/ValidationResult";
import { BaseValidationRule, ValidationRule } from "./ValidationRule";

/**
 * Concrete implementation for HTML validation rules
 */
export class HTMLValidationRule extends BaseValidationRule {
  public override fromObject(obj: any): ValidationRule {
    return HTMLValidationRule.fromObject(obj);
  }

  /**
   * Types of nodes this rule can validate
   */
  public targetNodeTypes: string[];
  
  /**
   * Signature representing the implementation details
   */
  public implementationSignature: string;
  
  /**
   * Implementation function that performs the actual validation
   */
  public validationFunction: (node: any) => ValidationResult;
  
  constructor(
    id: string,
    description: string,
    targetNodeTypes: string[],
    validationFunction: (node: any) => ValidationResult,
    implementationSignature: string = "",
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = []
  ) {
    super(id, description, severity, compatibilityMarkers);
    this.targetNodeTypes = [...targetNodeTypes];
    this.implementationSignature = implementationSignature;
    this.validationFunction = validationFunction;
  }
  
  /**
   * Validates an HTML node against this rule
   * 
   * @param node The HTML node to validate
   * @returns Validation result
   */
  public validate(node: any): ValidationResult {
    if (!this.isApplicableToNodeType(node)) {
      return ValidationResult.createValid();
    }
    try {
      return this.validationFunction(node);
    } catch (error) {
      const errorMessage: string = error instanceof Error ? error.message : String(error);
      const result = new ValidationResult();
      result.addError(new ParserError(
        'VALIDATION_ERROR',
        `Validation failed: ${errorMessage}`,
        'HTMLValidationRule',
        new Position(),
        '',
        {
          ruleId: this.id,
          nodeType: node.type || 'unknown'
        }
      ));
      result.metadata = { ruleId: this.id };
      return result;
    }
  }
  
  /**
   * Checks if this rule applies to the given node type
   * 
   * @param node The node to check
   * @returns True if the rule is applicable
   */
  public isApplicableToNodeType(node: any): boolean {
    if (!node || typeof node !== 'object') {
      return false;
    }
    
    const nodeType = node.type || node.nodeType || node.tagName?.toLowerCase() || typeof node;
    return this.targetNodeTypes.includes(nodeType) || this.targetNodeTypes.includes('*');
  }
  
  /**
   * Gets detailed implementation information
   */
  public getImplementationDetails(): object {
    return {
      targetNodeTypes: this.targetNodeTypes,
      implementationSignature: this.implementationSignature,
      id: this.id,
      severity: this.severity,
      description: this.description
    };
  }
  
  public override toObject(): any {
    return {
      ...super.toObject(),
      targetNodeTypes: this.targetNodeTypes,
      implementationSignature: this.implementationSignature,
      type: 'HTMLValidationRule'
    };
  }
  
  public static override fromObject(obj: any): HTMLValidationRule {
    if (obj.type !== 'HTMLValidationRule') {
      throw new Error('Invalid object type for HTMLValidationRule');
    }
    
    const defaultValidation = (_node: any) => ValidationResult.createValid();
    
    return new HTMLValidationRule(
      obj.id,
      obj.description,
      obj.targetNodeTypes,
      obj.validationFunction || defaultValidation,
      obj.implementationSignature,
      obj.severity,
      obj.compatibilityMarkers
    );
  }
}
