import { ErrorSeverity, ValidationError } from "../errors/ValidationError";
import { ValidationResult } from "../../../../old/dop/dop/ValidationResult";
import { BaseValidationRule, ValidationRule } from "./ValidationRule";

/**
 * Concrete implementation for CSS validation rules
 */
export class CSSValidationRule extends BaseValidationRule {
  /**
   * Creates a validation rule from a plain object
   */
  public override fromObject(obj: any): ValidationRule {
    if (!obj || typeof obj !== 'object') {
      throw new Error("Invalid object provided");
    }

    // Use the static fromObject method to create a new instance
    return CSSValidationRule.fromObject(obj);
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
   * Validates a CSS node against this rule
   */
  public validate(node: any): ValidationResult {
    if (!this.isApplicableToNodeType(node)) {
      return ValidationResult.createValid();
    }
    
    try {
      return this.validationFunction(node);
    } catch (error) {
      // Return an invalid result with the ValidationError
      return ValidationResult.createInvalid(new ValidationError(
        'RULE_EXECUTION_ERROR',
        `Error executing CSS validation rule "${this.id}": ${error instanceof Error ? error.message : String(error)}`,
        'CSSValidationRule',
        'css',
        this.severity,
        { ruleId: this.id }
      ));
    }
  }
  
  /**
   * Checks if this rule applies to the given node type
   */
  public isApplicableToNodeType(node: any): boolean {
    if (!node || typeof node !== 'object') {
      return false;
    }
    
    const nodeType = node.type || node.nodeType || typeof node;
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
      description: this.description,
      severity: this.severity
    };
  }
  
  /**
   * Converts the rule to a plain object
   */
  public override toObject(): any {
    return {
      ...super.toObject(),
      targetNodeTypes: this.targetNodeTypes,
      implementationSignature: this.implementationSignature
    };
  }
  
  /**
   * Creates a CSSValidationRule from a plain object
   */
  public static override fromObject(obj: any): CSSValidationRule {
    if (!obj.id || !obj.targetNodeTypes) {
      throw new Error("Invalid object structure: missing required properties");
    }

    const defaultValidation = (_node: any) => ValidationResult.createValid();
    
    return new CSSValidationRule(
      obj.id,
      obj.description || "",
      obj.targetNodeTypes,
      obj.validationFunction || defaultValidation,
      obj.implementationSignature || "",
      obj.severity || ErrorSeverity.ERROR,
      obj.compatibilityMarkers || []
    );
  }
}