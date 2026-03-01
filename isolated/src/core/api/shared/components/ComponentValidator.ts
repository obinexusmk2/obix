import { ValidationResult } from "@/core/dop/BehaviourModel";
import { ImplementationComparisonResult } from "@/core/dop/ImplementationComparisonResult";
import { ValidationEngine } from "@/core/validation/engine/ValidationEngine";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";


/**
 * Validates components using the OBIX validation system
 */
export class ComponentValidator {
  /**
   * Validation engine instance
   */
  public engine: ValidationEngine;
  
  /**
   * Component validation rules
   */
  public rules: ValidationRule[] = [];
  
  /**
   * Component to validate
   */
  public component: any;
  
  /**
   * Create a new ComponentValidator
   * 
   * @param component Component to validate
   * @param engine Optional existing validation engine
   */
  constructor(component: any, engine?: ValidationEngine) {
    this.component = component;
    this.engine = engine || new ValidationEngine();
  }
  
  /**
   * Validates the component against registered rules
   * 
   * @returns Validation result
   */
  public validate(): ValidationResult<any> {
    return this.engine.validateNode(this.component);
  }
  
  /**
   * Adds a validation rule
   * 
   * @param rule The rule to add
   */
  public addRule(rule: ValidationRule): void {
    this.rules.push(rule);
    this.engine.registerRule(rule);
  }
  
  /**
   * Removes a validation rule
   * 
   * @param id ID of the rule to remove
   * @returns True if the rule was removed
   */
  public removeRule(id: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(rule => rule.id !== id);
    
    // Return true if a rule was removed
    return initialLength !== this.rules.length;
  }
  
  /**
   * Gets all registered validation rules
   * 
   * @returns Array of validation rules
   */
  public getRules(): ValidationRule[] {
    return [...this.rules];
  }
  
  /**
   * Compares functional and OOP implementations
   * 
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  public compareImplementations(funcImpl: any, oopImpl: any): ImplementationComparisonResult {
    return this.engine.compareImplementations(funcImpl, oopImpl);
  }
  
  /**
   * Optimizes validation rules using automaton state minimization
   */
  public optimize(): void {
    this.engine.minimize();
  }
}