/**
 * ValidationDataModel.ts
 * 
 * Implementation of the ValidationDataModel class as part of the DOP Adapter pattern.
 * This class represents the data aspect of the Data-Oriented Programming approach,
 * storing validation rules, state, errors, and execution traces.
 * 
 * Copyright © 2025 OBINexus Computing
 */
import { ExecutionTrace } from "../errors";
import { ValidationError } from "../errors";
import { ValidationRule, ValidationRuleFactory } from "../rules";


/**
 * ValidationDataModel implements the data component of the validation system,
 * following immutable data patterns from DOP (Data-Oriented Programming).
 * It stores validation rules, state, errors, optimized rules, and execution traces.
 */
export class ValidationDataModel {

  /**
   * Collection of validation rules to be applied during validation
   * @public
   */
  public rules: ValidationRule[] = [];
  
  /**`
   * Collection of public nodes
   * @public
   * @type {any[]}
   * @memberof ValidationDataModel
   */
  public nodes: any[] = [];
  /**
   * Map containing validation state information
   * @public
   */
  public validationState: Map<string, any> = new Map<string, any>();

  /**
   * Collection of validation errors that occurred during validation
   * @public
   */
  public errors: ValidationError[] = [];

  /**
   * Map of optimized rules grouped by node type for faster processing
   * @public
   */
  public optimizedRules: Map<string, ValidationRule[]> = new Map<string, ValidationRule[]>();

  /**
   * Map tracking rule execution traces for debugging and comparison
   * @public
   */
  public ruleExecutionTraces: Map<string, ExecutionTrace> = new Map<string, ExecutionTrace>();

  /**
   * Collection of rule sets for the data model
   * @public
   */
  public ruleSet: ValidationRule[] = [];

  /**
   * Creates a new instance of ValidationDataModel with default empty collections
    this.ruleExecutionTraces = new Map<string, ExecutionTrace>();
    this.rules = [];
    this.validationState = new Map<string, any>();
    this.errors = [];
    this.optimizedRules = new Map<string, ValidationRule[]>();
    this
    this.ruleExecutionTraces = new Map<string, ExecutionTrace>();
  }

  /**
   * Adds a validation rule to the data model, returning a new instance
   * following immutability principles
   * 
   * @param rule The validation rule to add
   * @returns A new ValidationDataModel instance with the added rule
   */
  public withRule(rule: ValidationRule): ValidationDataModel {
    const newModel = this.clone();
    newModel.rules = [...this.rules, rule];
    return newModel;
  }


  /**
   * Sets a value in the validation state, returning a new instance
   * 
   * @param key The state key to set
   * @param value The value to associate with the key
   * @returns A new ValidationDataModel instance with the updated state
   */
  public withValidationState(key: string, value: any): ValidationDataModel {
    const newModel = this.clone();
    const newState = new Map(this.validationState);
    newState.set(key, value);
    newModel.validationState = newState;
    return newModel;
  }

  /**
   * Adds a validation error to the data model, returning a new instance
   * 
   * @param error The validation error to add
   * @returns A new ValidationDataModel instance with the added error
   */
  public withError(error: ValidationError): ValidationDataModel {
    const newModel = this.clone();
    newModel.errors = [...this.errors, error];
    return newModel;
  }

  /**
   * Sets optimized rules for a specific node type, returning a new instance
   * 
   * @param nodeType The type of node these rules apply to
   * @param rules The optimized rules for this node type
   * @returns A new ValidationDataModel instance with the optimized rules
   */
  public withOptimizedRules(nodeType: string, rules: ValidationRule[]): ValidationDataModel {
    const newModel = this.clone();
    const newOptimizedRules = new Map(this.optimizedRules);
    newOptimizedRules.set(nodeType, [...rules]);
    newModel.optimizedRules = newOptimizedRules;
    return newModel;
  }

  /**
   * Adds a rule execution trace to the data model, returning a new instance
   * 
   * @param ruleId The ID of the rule this trace applies to
   * @param trace The execution trace to add
   * @returns A new ValidationDataModel instance with the added trace
   */
  public withRuleExecutionTrace(ruleId: string, trace: ExecutionTrace): ValidationDataModel {
    const newModel = this.clone();
    const newTraces = new Map(this.ruleExecutionTraces);
    newTraces.set(ruleId, trace);
    newModel.ruleExecutionTraces = newTraces;
    return newModel;
  }

  /**
   * Gets a state value by key
   * 
   * @param key The key to retrieve from the validation state
   * @returns The value associated with the key, or undefined if not found
   */
  public getState(key: string): any {
    return this.validationState.get(key);
  }

  /**
   * Gets optimized rules for a specific node type
   * 
   * @param nodeType The node type to get rules for
   * @returns Array of optimized validation rules for the specified node type
   */
  public getOptimizedRules(nodeType: string): ValidationRule[] {
    return this.optimizedRules.get(nodeType) || [];
  }

  /**
   * Checks if optimized rules exist for a specific node type
   * 
   * @param nodeType The node type to check
   * @returns True if optimized rules exist for this node type
   */
  public hasOptimizedRules(nodeType: string): boolean {
    return this.optimizedRules.has(nodeType) && 
           this.optimizedRules.get(nodeType)!.length > 0;
  }

  /**
   * Gets the execution trace for a specific rule
   * 
   * @param ruleId The ID of the rule to get the execution trace for
   * @returns The execution trace for the specified rule
   */
  public getRuleExecutionTrace(ruleId: string): ExecutionTrace | undefined {
    return this.ruleExecutionTraces.get(ruleId);
  }

  /**
   * Gets all validation rules
   * 
   * @returns Array of all validation rules
   */
  public getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Gets all validation errors
   * 
   * @returns Array of all validation errors
   */
  public getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Creates a shallow clone of the current data model
   * 
   * @public
   * @returns A new ValidationDataModel instance with copied properties
   */
  public clone(): ValidationDataModel {
    const newModel = new ValidationDataModel();
    newModel.rules = [...this.rules];
    newModel.validationState = new Map(this.validationState);
    newModel.errors = [...this.errors];
    newModel.optimizedRules = new Map(this.optimizedRules);
    newModel.ruleExecutionTraces = new Map(this.ruleExecutionTraces);
    return newModel;
  }

  /**
   * Merges another data model into this one, creating a new instance
   * 
   * @param other The other data model to merge
   * @returns A new data model containing merged data
   */
  public merge(other: ValidationDataModel): ValidationDataModel {
    let merged = this.clone();
    
    // Merge rules
    for (const rule of other.getRules()) {
      merged = merged.withRule(rule);
    }
    
    // Merge validation state
    other.validationState.forEach((value, key) => {
      merged = merged.withValidationState(key, value);
    });
    
    // Merge errors
    for (const error of other.getErrors()) {
      merged = merged.withError(error);
    }
    
    // Merge optimized rules
    other.optimizedRules.forEach((rules, nodeType) => {
      merged = merged.withOptimizedRules(nodeType, rules);
    });
    
    // Merge rule execution traces
    other.ruleExecutionTraces.forEach((trace, ruleId) => {
      merged = merged.withRuleExecutionTrace(ruleId, trace);
    });
    
    return merged;
  }

  /**
   * Gets all validation warnings
   * 
   * @returns Array of all validation warnings
   */
  public getWarnings(): ValidationError[] {
    // Implement the logic to get warnings
    return [];
  }

  /**
   * Gets all rule execution traces
   * 
   * @returns Array of all rule execution traces
   */
  public getTraces(): ExecutionTrace[] {
    // Implement the logic to get traces
    return Array.from(this.ruleExecutionTraces.values());
  }
  /**
   * 
   * @param other 
   * @returns 
   */
  equals(other: ValidationDataModel): boolean {
    // Implement the equality check logic here
    return JSON.stringify(this) === JSON.stringify(other);
  }
  
  /**
   * Creates a ValidationDataModel from a plain JavaScript object
   * 
   * @param obj The plain object to convert
   * @returns A new ValidationDataModel instance
   */
  public static fromObject(obj: any): ValidationDataModel {
    const model = new ValidationDataModel();
    let result = model;
    
    // Convert rules array
    if (Array.isArray(obj.rules)) {
      for (const rule of obj.rules) {
        // Assuming ValidationRule has a fromObject method
        result = result.withRule(ValidationRuleFactory.fromObject(rule));
      }
    
    }
    
    // Convert validation state
    if (obj.validationState && typeof obj.validationState === 'object') {
      for (const [key, value] of Object.entries(obj.validationState)) {
        result = result.withValidationState(key, value);
      }
    }
    
    // Convert errors
    if (Array.isArray(obj.errors)) {
      for (const error of obj.errors) {
        // Assuming ValidationError has a fromObject method
        result = result.withError(ValidationError.fromObject(error));
      }
    }
    
    // Convert optimized rules
    if (obj.optimizedRules && typeof obj.optimizedRules === 'object') {
      for (const [nodeType, rules] of Object.entries(obj.optimizedRules)) {
        if (Array.isArray(rules)) {
          const convertedRules = rules.map(rule => ValidationRuleFactory.createFromObject(rule));
          result = result.withOptimizedRules(nodeType, convertedRules);
        }
      }
    }
    
    // Convert rule execution traces
    if (obj.ruleExecutionTraces && typeof obj.ruleExecutionTraces === 'object') {
      for (const [ruleId, trace] of Object.entries(obj.ruleExecutionTraces)) {
        // Assuming ExecutionTrace has a fromObject method
        result = result.withRuleExecutionTrace(
          ruleId,
          ExecutionTrace.fromObject(trace)
        );
      }
    }
    
    return result;
  }

  /**
   * Generates a unique signature for minimization purposes
   * 
   * @returns A unique signature string
   */
  public getMinimizationSignature(): string {
    const data = {
      rules: this.rules.map(rule => rule.toObject()),
      validationState: Object.fromEntries(this.validationState),
      errors: this.errors.map(error => error.toObject()),
      optimizedRules: Object.fromEntries(
        Array.from(this.optimizedRules.entries()).map(
          ([nodeType, rules]) => [nodeType, rules.map(rule => rule.toObject())]
        )
      ),
      ruleExecutionTraces: Object.fromEntries(
        Array.from(this.ruleExecutionTraces.entries()).map(
          ([ruleId, trace]) => [ruleId, trace.toObject()]
        )
      )
    };
    return JSON.stringify(data);
  }
  
  /**
   * Converts the data model to a plain JavaScript object
   * 
   * @returns A plain object representation of this model
   */
  public toObject(): any {
    return {
      rules: this.rules.map(rule => rule.toObject()),
      validationState: Object.fromEntries(this.validationState),
      errors: this.errors.map(error => error.toObject()),
      optimizedRules: Object.fromEntries(
        Array.from(this.optimizedRules.entries()).map(
          ([nodeType, rules]) => [nodeType, rules.map(rule => rule.toObject())]
        )
      ),
      ruleExecutionTraces: Object.fromEntries(
        Array.from(this.ruleExecutionTraces.entries()).map(
          ([ruleId, trace]) => [ruleId, trace.toObject()]
        )
      )
    };
  }
}