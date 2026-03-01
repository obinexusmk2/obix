import { ValidationResult } from "@/core/dop/ValidationResult";
import { ErrorSeverity, ValidationError, ParserError } from "@/core/validation/errors/ValidationError";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";
import { HTMLNodeType, HTMLElementNode } from "../node";

/**
 * Rule for validating element attributes
 * Checks attribute values and format correctness
 */
export class AttributeValidationRule implements ValidationRule {
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
   * Rule dependencies
   */
  public readonly dependencies: string[];

  /**
   * Creates a new AttributeValidationRule
   */
  constructor(
    id: string = 'attribute-validation-rule',
    description: string = 'Validates HTML element attributes for correctness and completeness',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = ['html', 'attributes'],
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

    return new AttributeValidationRule(
      obj['id'] || 'attribute-validation-rule',
      obj['description'] || 'Validates HTML element attributes for correctness and completeness',
      obj['severity'] || ErrorSeverity.ERROR,
      obj['compatibilityMarkers'] || ['html', 'attributes'],
      obj['dependencies'] || []
    ) as ValidationRule;
  }

  /**
   * Updates this rule from a plain object
   * 
   * @param obj Plain object representation of the rule
   * @returns This rule instance
   */
  public fromObject(obj: Record<string, any>): ValidationRule {
    // Since our properties are readonly, we return a new instance
    return AttributeValidationRule.fromObject(obj);
  }

  /**
   * Validates an HTML node's attributes
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
          'AttributeValidationRule'
        ),
        node
      );
    }
    
    // Only validate element nodes
    if (!('type' in node) || node.type !== HTMLNodeType.ELEMENT) {
      return ValidationResult.createValid(node);
    }
    
    const element = node as HTMLElementNode;
    const result = new ValidationResult<HTMLElementNode>(true, element);
    
    // Validate attribute values
    const attributeValuesResult = this.validateAttributeValues(element);
    if (!attributeValuesResult.isValid) {
      result.isValid = false;
      for (const error of attributeValuesResult.errors) {
        result.addError(error);
      }
    }
    
    // Validate duplicate class names
    const duplicateClassResult = this.validateDuplicateClasses(element);
    if (!duplicateClassResult.isValid) {
      result.isValid = false;
      for (const error of duplicateClassResult.errors) {
        result.addError(error);
      }
    }
    
    return result;
  }
  
  /**
   * Validates attribute values for correctness
   * 
   * @param element The element to validate
   * @returns Validation result
   */
  private validateAttributeValues(element: HTMLElementNode): ValidationResult<HTMLElementNode> {
    const result = new ValidationResult<HTMLElementNode>(true, element);
    const tagName = element.tagName.toLowerCase();
    
    // Validate specific attributes based on element type
    switch (tagName) {
      case 'input':
        // Validate input type attribute
        const typeAttr = element.getAttribute('type');
        if (typeAttr) {
          const validInputTypes = [
            'text', 'password', 'checkbox', 'radio', 'submit', 'reset', 'file', 
            'hidden', 'image', 'button', 'email', 'number', 'search', 'tel',
            'url', 'date', 'datetime-local', 'month', 'time', 'week', 'color'
          ];
          
          if (!validInputTypes.includes(typeAttr.toLowerCase())) {
            result.isValid = false;
            result.addError(new ValidationError(
              'INVALID_ATTRIBUTE_VALUE',
              `Invalid value '${typeAttr}' for input type attribute`,
              'AttributeValidationRule',
              'validator',
              ErrorSeverity.ERROR,
              {
                tagName,
                attribute: 'type',
                value: typeAttr,
                validValues: validInputTypes
              }
            ));
          }
        }
        break;
        
      case 'a':
        // Validate href attribute
        const hrefAttr = element.getAttribute('href');
        if (hrefAttr) {
          // Check for javascript: URLs (potential security issue)
          if (hrefAttr.toLowerCase().startsWith('javascript:')) {
            result.addWarning(new ParserError(
              'SECURITY_RISK_ATTRIBUTE',
              `Security risk: 'javascript:' URLs should be avoided in href attributes`,
              'AttributeValidationRule',
              element.position,
              `href="${hrefAttr}"`
            ));
          }
        }
        break;
        
      case 'img':
        // Validate alt attribute (shouldn't be empty for non-decorative images)
        const altAttr = element.getAttribute('alt');
        if (altAttr === '') {
          // Check if role is presentation or none (decorative image)
          const role = element.getAttribute('role');
          if (role !== 'presentation' && role !== 'none') {
            result.addWarning(new ParserError(
              'EMPTY_ALT_ATTRIBUTE',
              `Empty alt attribute on non-decorative image may cause accessibility issues`,
              'AttributeValidationRule',
              element.position,
              `<img alt="">`
            ));
          }
        }
        
        // Validate src attribute
        const srcAttr = element.getAttribute('src');
        if (srcAttr === '') {
          result.isValid = false;
          result.addError(new ValidationError(
            'EMPTY_SRC_ATTRIBUTE',
            `Empty src attribute on img element`,
            'AttributeValidationRule'
          ));
        }
        break;
        
      case 'button':
        // Validate button type attribute
        const btnTypeAttr = element.getAttribute('type');
        if (btnTypeAttr) {
          const validButtonTypes = ['button', 'submit', 'reset'];
          if (!validButtonTypes.includes(btnTypeAttr.toLowerCase())) {
            result.isValid = false;
            result.addError(new ValidationError(
              'INVALID_ATTRIBUTE_VALUE',
              `Invalid value '${btnTypeAttr}' for button type attribute`,
              'AttributeValidationRule'
            ));
          }
        }
        break;
    }
    
    // Validate global attributes applicable to all elements
    
    // Validate id format
    const idAttr = element.getAttribute('id');
    if (idAttr) {
      // Check for invalid characters in id
      const invalidIdRegex = /^[^a-zA-Z]|[^a-zA-Z0-9_\-:\.]/;
      if (invalidIdRegex.test(idAttr)) {
        result.addWarning(new ParserError(
          'INVALID_ID_FORMAT',
          `Invalid id format: '${idAttr}'`,
          'AttributeValidationRule',
          element.position,
          `id="${idAttr}"`
        ));
      }
    }
    
    return result;
  }
  
  /**
   * Validates that there are no duplicate class names
   * 
   * @param element The element to validate
   * @returns Validation result
   */
  private validateDuplicateClasses(element: HTMLElementNode): ValidationResult<HTMLElementNode> {
    const result = new ValidationResult<HTMLElementNode>(true, element);
    
    const classAttr = element.getAttribute('class');
    if (classAttr) {
      const classes = classAttr.split(/\s+/).filter(c => c.length > 0);
      const uniqueClasses = new Set(classes);
      
      if (uniqueClasses.size !== classes.length) {
        result.addWarning(new ParserError(
          'DUPLICATE_CLASS_NAME',
          'Element contains duplicate class names',
          'AttributeValidationRule',
          element.position,
          `class="${classAttr}"`
        ));
      }
      
      // Check for invalid characters in class names
      const invalidClassRegex = /[^a-zA-Z0-9_\-]/;
      for (const className of classes) {
        if (invalidClassRegex.test(className)) {
          result.addWarning(new ParserError(
            'INVALID_CLASS_NAME',
            `Class name contains invalid characters: '${className}'`,
            'AttributeValidationRule',
            element.position,
            `class="${classAttr}"`
          ));
        }
      }
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