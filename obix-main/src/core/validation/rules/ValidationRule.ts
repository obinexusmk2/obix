/**
 * ValidationRule.ts
 * 
 * Implementation of the ValidationRule interface and concrete rule implementations
 * for the OBIX validation system. This follows the DOP pattern by separating
 * rule definitions from their execution behaviors.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationResult } from '../../../../old/dop/dop/ValidationResult';
import { ErrorSeverity } from '../errors/ValidationError';
import { HTMLValidationRule } from './HTMLValidationRule';
import { CSSValidationRule } from './CSSValidationRule';

/**
 * Base interface for all validation rules in the system
 */
export interface ValidationRule {
  dependencies: never[];

  /**
   * Retrieves the dependencies for this rule
   */
  getDependencies(): never[];
  /**
   * Unique identifier for the rule
   */
  id: string;
  
  /**
   * Human-readable description of what the rule validates
   */
  description: string;
  
  /**
   * Severity level if the rule is violated
   */
  severity: ErrorSeverity;
  
  /**
   * Tags that mark compatibility aspects for this rule
   */
  compatibilityMarkers: string[];
  
  /**
   * Validates a node against this rule
   * 
   * @param node The node to validate
   * @returns Validation result indicating success or failure with details
   */
  validate(node: any): ValidationResult<unknown>;
  
  /**
   * Determines if this rule is compatible with another rule
   * 
   * @param rule The rule to check compatibility with
   * @returns True if the rules are compatible
   */
  isCompatibleWith(rule: ValidationRule): boolean;
  
  /**
   * Converts the rule to a plain object for serialization
   */
  toObject(): any;
  
  /**
   * Creates a ValidationRule instance from a plain object
   * 
   * @param obj The object to create the rule from
   * @returns A concrete ValidationRule instance
   */
  fromObject(obj: any): ValidationRule;

  /**
   * Retrieves the unique identifier for the rule
   * 
   * @returns The rule ID
   */
  getId(): string;
}




/**
 * Base class for all validation rules in the system
 */
export abstract class BaseValidationRule implements ValidationRule {
 
  public dependencies: never[] = [];
  public id: string;
  public description: string;
  public severity: ErrorSeverity;
  public compatibilityMarkers: string[];
  
  constructor(
    id: string,
    description: string,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = []
  ) {
    this.id = id;
    this.description = description;
    this.severity = severity;
    this.compatibilityMarkers = [...compatibilityMarkers];
  }
  
   /**
   * Retrieves the dependencies for this rule
   */
   public getDependencies(): never[] {
    return this.dependencies;
  }

  /**
   * Abstract method to be implemented by concrete rule classes
   */
  public abstract validate(node: any): ValidationResult<unknown>;
  
  /**
   * Checks compatibility based on shared compatibility markers
   */
  public isCompatibleWith(rule: ValidationRule): boolean {
    // If no compatibility markers are specified, rules are considered compatible
    if (this.compatibilityMarkers.length === 0 || rule.compatibilityMarkers.length === 0) {
      return true;
    }
    
    // Check for intersection of compatibility markers
    return this.compatibilityMarkers.some(marker => 
      rule.compatibilityMarkers.includes(marker)
    );
  }
  
  /**
 * Retrieves the unique identifier for the rule
 * 
 * @returns The rule ID
 */
public getId(): string {
  return this.id;
}

  /**
   * Converts the rule to a plain object for serialization
   */
  public toObject(): any {
    return {
      id: this.id,
      description: this.description,
      severity: this.severity,
      compatibilityMarkers: this.compatibilityMarkers,
      type: this.constructor.name
    };
  }
  
  /**
   * Creates a BaseValidationRule instance from a plain object
   * Note: This is implemented by subclasses with their specific factory methods
   */
  public abstract fromObject(obj: any): ValidationRule;
  static fromObject(obj: any): ValidationRule {
    throw new Error('BaseValidationRule cannot be instantiated directly. Use a subclass implementation.');
  }
  
}


/**
 * Factory class for creating validation rules
 */
export class ValidationRuleFactory {
   /**
   * Registry of rule constructors by type
   */
  public static ruleConstructors = new Map<string, typeof BaseValidationRule>([
      ['HTMLValidationRule', HTMLValidationRule] as unknown as [string, typeof BaseValidationRule],
      ['CSSValidationRule', CSSValidationRule]  as unknown as [string, typeof BaseValidationRule],
    ]) as Map<string, typeof BaseValidationRule>;
  
  /**
   * Creates a validation rule from a plain object
   * 
   * @param obj The object representation of a rule
   * @returns A concrete ValidationRule instance
   */
  public static createFromObject(obj: any): ValidationRule {
    if (!obj.type) {
      throw new Error("Rule type is required for deserialization");
    }
    
    const constructor = this.ruleConstructors.get(obj.type);
    if (!constructor) {
      throw new Error(`Unknown rule type: ${obj.type}`);
    }
    
    return constructor.fromObject(obj);
  }
  
  /**
   * Creates a validation rule from a plain object with required parameters
   * 
   * @param obj The plain object containing rule data
   * @returns A concrete ValidationRule instance
   * @throws Error if required fields are missing
   */
  public static fromObject(obj: any): ValidationRule {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Invalid object provided for rule creation');
    }
    
    const requiredFields = ['id', 'description', 'severity'];
    for (const field of requiredFields) {
      if (!obj[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Determine rule type and use appropriate constructor
    const type = obj.type || 'HTMLValidationRule'; // Default to HTML rule if not specified
    const constructor = this.ruleConstructors.get(type);
    if (!constructor) {
      throw new Error(`Unknown rule type: ${type}`);
    }

    return constructor.fromObject(obj);
  }


  /**
   * Registers a custom rule constructor
   * 
   * @param type The rule type identifier
   * @param constructor The constructor function
   */
  public static registerRuleType(type: string, constructor: typeof BaseValidationRule): void {
    this.ruleConstructors.set(type, constructor);
  }
}