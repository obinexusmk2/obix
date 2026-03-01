import { ValidationResult } from "@/core/dop/ValidationResult";
import { ErrorSeverity, ValidationError, ParserError } from "@/core/validation/errors/ValidationError";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";
import { HTMLNodeType, HTMLElementNode, HTMLNode } from "../node";

/**
 * Rule for validating HTML structure
 * Checks parent-child relationships, element nesting, and structural validity
 */
export class HTMLStructureRule implements ValidationRule {
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
   * Creates a new HTMLStructureRule
   */
  constructor(
    id: string = 'html-structure-rule',
    description: string = 'Validates HTML structure, including parent-child relationships and element nesting',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = ['html', 'structure'],
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

    return new HTMLStructureRule(
      obj.id || 'html-structure-rule',
      obj.description || 'Validates HTML structure, including parent-child relationships and element nesting',
      obj.severity || ErrorSeverity.ERROR,
      obj.compatibilityMarkers || ['html', 'structure'],
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
    return HTMLStructureRule.fromObject(obj);
  }

  /**
   * Validates an HTML node's structure
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  public validate(node: any): ValidationResult<any> {
    // Ensure node is an HTML node
    if (!node || typeof node !== 'object' || !('type' in node) || !Array.isArray(node.children)) {
      return ValidationResult.createValid(node);
    }
    
    const result = new ValidationResult<HTMLNode>(true, node);
    
    // Validate parent-child relationships
    const parentChildResult = this.validateParentChildRelationships(node);
    if (!parentChildResult.isValid) {
      result.isValid = false;
      for (const error of parentChildResult.errors) {
        result.addError(error);
      }
    }
    
    // Validate element nesting if this is an element node
    if (node.type === HTMLNodeType.ELEMENT) {
      const nestingResult = this.validateElementNesting(node as HTMLElementNode);
      if (!nestingResult.isValid) {
        result.isValid = false;
        for (const error of nestingResult.errors) {
          result.addError(error);
        }
      }
      
      // Validate required attributes for element
      const attributesResult = this.validateRequiredAttributes(node as HTMLElementNode);
      if (!attributesResult.isValid) {
        result.isValid = false;
        for (const error of attributesResult.errors) {
          result.addError(error);
        }
      }
    }
    
    return result;
  }

  /**
   * Validates parent-child relationships in an HTML node
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  private validateParentChildRelationships(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    node.children.forEach(child => {
      if (child.parent !== node) {
        result.addError(new ValidationError(
          'INVALID_PARENT_REFERENCE',
          `Invalid parent reference: Child node ${child.id} has incorrect parent reference`,
          'HTMLStructureRule',
          'validator',
          ErrorSeverity.ERROR,
          {
            childId: child.id,
            parentId: node.id,
            actualParentId: child.parent?.id
          }
        ));
      }
    });
    
    return result;
  }

  /**
   * Validates element nesting rules
   * 
   * @param element The element to validate
   * @returns Validation result
   */
  private validateElementNesting(element: HTMLElementNode): ValidationResult<HTMLElementNode> {
    const result = new ValidationResult<HTMLElementNode>(true, element);
    const tagName = element.tagName.toLowerCase();
    
    // Validate structural rules based on element type
    switch (tagName) {
      case 'li':
        // <li> should be inside <ul>, <ol>, or <menu>
        if (element.parent && element.parent.type === HTMLNodeType.ELEMENT) {
          const parentTag = (element.parent as HTMLElementNode).tagName.toLowerCase();
          if (!['ul', 'ol', 'menu'].includes(parentTag)) {
            result.addWarning(new ParserError(
              'INVALID_ELEMENT_NESTING',
              `<li> element should be inside <ul>, <ol>, or <menu>`,
              'HTMLStructureRule',
              element.position,
              `<${tagName}>`
            ));
          }
        }
        break;
        
      case 'td':
      case 'th':
        // <td> and <th> should be inside <tr>
        if (element.parent && element.parent.type === HTMLNodeType.ELEMENT) {
          const parentTag = (element.parent as HTMLElementNode).tagName.toLowerCase();
          if (parentTag !== 'tr') {
            result.addWarning(new ParserError(
              'INVALID_ELEMENT_NESTING',
              `<${tagName}> element should be inside <tr>`,
              'HTMLStructureRule',
              element.position,
              `<${tagName}>`
            ));
          }
        }
        break;
        
      case 'tr':
        // <tr> should be inside <table>, <thead>, <tbody>, or <tfoot>
        if (element.parent && element.parent.type === HTMLNodeType.ELEMENT) {
          const parentTag = (element.parent as HTMLElementNode).tagName.toLowerCase();
          if (!['table', 'thead', 'tbody', 'tfoot'].includes(parentTag)) {
            result.addWarning(new ParserError(
              'INVALID_ELEMENT_NESTING',
              `<tr> element should be inside <table>, <thead>, <tbody>, or <tfoot>`,
              'HTMLStructureRule',
              element.position,
              `<${tagName}>`
            ));
          }
        }
        break;
        
      case 'a':
        // <a> elements should not be nested within other <a> elements
        this.checkForNestedElements(element, 'a', result);
        break;
        
      case 'button':
        // <button> elements should not be nested
        this.checkForNestedElements(element, 'button', result);
        break;
        
      case 'form':
        // <form> elements should not be nested
        this.checkForNestedElements(element, 'form', result);
        break;
    }
    
    return result;
  }

  /**
   * Checks for nested elements of the same type
   * 
   * @param element The element to check
   * @param tagToCheck The tag name to check for nesting
   * @param result The validation result to update
   */
  private checkForNestedElements(
    element: HTMLElementNode, 
    tagToCheck: string, 
    result: ValidationResult<HTMLElementNode>
  ): void {
    let parentEl = element.parent;
    
    while (parentEl) {
      if (parentEl.type === HTMLNodeType.ELEMENT) {
        const parentTag = (parentEl as HTMLElementNode).tagName.toLowerCase();
        if (parentTag === tagToCheck) {
          result.addError(new ValidationError(
            'INVALID_ELEMENT_NESTING',
            `<${tagToCheck}> elements should not be nested within other <${tagToCheck}> elements`,
            'HTMLStructureRule',
            'validator',
            ErrorSeverity.ERROR,
            {
              tagName: tagToCheck,
              elementId: element.id,
              parentId: parentEl.id
            }
          ));
          break;
        }
      }
      parentEl = parentEl.parent;
    }
  }

  /**
   * Validates required attributes for specific elements
   * 
   * @param element The element to validate
   * @returns Validation result
   */
  private validateRequiredAttributes(element: HTMLElementNode): ValidationResult<HTMLElementNode> {
    const result = new ValidationResult<HTMLElementNode>(true, element);
    const tagName = element.tagName.toLowerCase();
    
    // Required attributes for specific elements
    const requiredAttributes: Record<string, string[]> = {
      'img': ['alt', 'src'],
      'a': ['href'],
      'input': ['type'],
      'link': ['rel'],
      'meta': ['content'],
      'form': ['action'],
      'textarea': ['rows', 'cols'],
      'select': ['name'],
      'button': ['type'],
      'iframe': ['src']
    };
    
    // Check if element has required attributes
    if (requiredAttributes[tagName]) {
      for (const attr of requiredAttributes[tagName]) {
        if (!element.hasAttribute(attr)) {
          result.addError(new ValidationError(
            'MISSING_REQUIRED_ATTRIBUTE',
            `Element <${tagName}> is missing required attribute '${attr}'`,
            'HTMLStructureRule',
            'validator',
            ErrorSeverity.ERROR,
            {
              tagName,
              requiredAttribute: attr
            }
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