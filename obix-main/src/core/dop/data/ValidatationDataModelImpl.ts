/**
 * ValidationDataModelImpl.ts
 * 
 * Implementation of the ValidationDataModelImpl class that serves as the primary
 * data structure for validation operations in the OBIX framework. This class follows
 * the DOP (Data-Oriented Programming) pattern by maintaining immutable data structures
 * and providing methods that return new instances with updates.
 * 
 * This component is a core part of Nnamdi Okpala's automaton state minimization
 * technology, providing the data side of the DOP pattern.
 * 
 * @author Nnamdi M Okpala
 * @copyright 2025 Your Company
 */

import { ValidationRule } from "../validation/rules/ValidationRule";
import { ValidationError } from "../validation/errors/ValidationError";
import { ExecutionTrace } from "../validation/errors/ExecutionTrace";
import { DataModel } from "./BaseDataModel";

/**
 * Implementation of a validation data model designed to work with
 * the BehaviorModel and DOPAdapter pattern, providing immutable data handling
 */
export class ValidationDataModelImpl<T = any> implements DataModel<ValidationDataModelImpl<T>> {
  /**
   * Validation rules to apply during validation
   */
  public rules: ValidationRule[];
  
  /**
   * Validation errors found during validation
   */
  public errors: ValidationError[];
  
  /**
   * Validation warnings that don't invalidate but should be addressed
   */
  public warnings: ValidationError[];
  
  /**
   * Rules optimized by node type for faster lookup during validation
   */
  public optimizedRules: Map<string, ValidationRule[]>;
  
  /**
   * Execution traces for debugging and implementation comparison
   */
  public traces: ExecutionTrace[];
  
  /**
   * Metadata for optimization and tracking
   */
  public metadata: Map<string, any>;
  
  /**
   * Equivalence class ID for state minimization
   */
  public equivalenceClass: number | null;
  
  /**
   * The data being validated
   */
  private data: T;
  
  /**
   * Validation state for internal tracking
   */
  private validationState: Map<string, any>;
  
  /**
   * Creates a new ValidationDataModelImpl instance
   * 
   * @param data The data to validate
   * @param rules Initial validation rules
   */
  constructor(data: T, rules: ValidationRule[] = []) {
    this.data = data;
    this.rules = [...rules];
    this.errors = [];
    this.warnings = [];
    this.optimizedRules = new Map<string, ValidationRule[]>();
    this.traces = [];
    this.metadata = new Map<string, any>();
    this.equivalenceClass = null;
    this.validationState = new Map<string, any>();
  }
  
  

  /**
   * Gets the data being validated
   * 
   * @returns The data
   */
  public getData(): T {
    return this.data;
  }
  
  /**
   * Gets all validation rules
   * 
   * @returns Array of validation rules
   */
  public getRules(): ValidationRule[] {
    return [...this.rules];
  }
  
  /**
   * Checks if the model has a specific rule
   * 
   * @param ruleId ID of the rule to check
   * @returns True if the rule exists
   */
  public hasRule(ruleId: string): boolean {
    return this.rules.some(rule => rule.id === ruleId);
  }
  
  /**
   * Adds a validation rule
   * 
   * @param rule The rule to add
   * @returns A new data model with the added rule
   */
  public addRule(rule: ValidationRule): ValidationDataModelImpl<T> {
    // Create a new instance with the added rule
    const newModel = this.clone();
    newModel.rules.push(rule);
    return newModel;
  }
  
  /**
   * Adds a rule to the current model (mutable version)
   * 
   * @param rule The rule to add
   */
  public withRule(rule: ValidationRule): ValidationDataModelImpl<T> {
    return this.addRule(rule);
  }
  
  /**
   * Gets all validation errors
   * 
   * @returns Array of validation errors
   */
  public getErrors(): ValidationError[] {
    return [...this.errors];
  }
  
  /**
   * Gets validation errors
   */
  public getValidationErrors(): ValidationError[] {
    return this.getErrors();
  }
  
  /**
   * Gets validation warnings
   * 
   * @returns Array of validation warnings
   */
  public getValidationWarnings(): ValidationError[] {
    return [...this.warnings];
  }
  
  /**
   * Adds a validation error
   * 
   * @param error The error to add
   * @returns A new data model with the added error
   */
  public withError(error: ValidationError | string): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    
    if (typeof error === 'string') {
      // Create a simple validation error from string
      newModel.errors.push(new ValidationError(
        'VALIDATION_ERROR',
        error,
        'ValidationDataModelImpl'
      ));
    } else {
      newModel.errors.push(error);
    }
    
    return newModel;
  }
  
  /**
   * Adds a validation warning
   * 
   * @param warning The warning to add
   * @returns A new data model with the added warning
   */
  public withWarning(warning: ValidationError | string): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    
    if (typeof warning === 'string') {
      // Create a simple validation warning from string
      newModel.warnings.push(new ValidationError(
        'VALIDATION_WARNING',
        warning,
        'ValidationDataModelImpl'
      ));
    } else {
      newModel.warnings.push(warning);
    }
    
    return newModel;
  }
  
  /**
   * Gets optimized rules for a specific node type
   * 
   * @param nodeType The node type
   * @returns Array of optimized rules or an empty array if none
   */
  public getOptimizedRules(nodeType: string): ValidationRule[] {
    return this.optimizedRules.get(nodeType) || [];
  }
  
  /**
   * Sets optimized rules for a specific node type
   * 
   * @param nodeType The node type
   * @param rules The optimized rules
   * @returns A new data model with the optimized rules
   */
  public withOptimizedRules(nodeType: string, rules: ValidationRule[]): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    newModel.optimizedRules.set(nodeType, [...rules]);
    return newModel;
  }
  
  /**
   * Checks if optimized rules exist for a specific node type
   * 
   * @param nodeType The node type
   * @returns True if optimized rules exist
   */
  public hasOptimizedRules(nodeType: string): boolean {
    return this.optimizedRules.has(nodeType) && 
           this.optimizedRules.get(nodeType)!.length > 0;
  }
  
  /**
   * Gets all traces
   * 
   * @returns Array of traces
   */
  public getAllTraces(): ExecutionTrace[] {
    return [...this.traces];
  }
  
  /**
   * Gets all traces
   */
  public getTraces(): ExecutionTrace[] {
    return this.getAllTraces();
  }
  
  /**
   * Adds an execution trace
   * 
   * @param trace The trace to add
   * @returns A new data model with the added trace
   */
  public withTrace(trace: ExecutionTrace): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    newModel.traces.push(trace);
    return newModel;
  }
  
  /**
   * Sets a validation state value
   * 
   * @param key The state key
   * @param value The state value
   * @returns A new data model with the updated state
   */
  public withValidationState(key: string, value: any): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    newModel.validationState.set(key, value);
    return newModel;
  }
  
  /**
   * Gets a validation state value
   * 
   * @param key The state key
   * @returns The state value or undefined if not found
   */
  public getState(key: string): any {
    return this.validationState.get(key);
  }
  
  /**
   * Stores a rule execution trace
   * 
   * @param ruleId The rule ID
   * @param trace The execution trace
   * @returns A new data model with the added trace
   */
  public withRuleExecutionTrace(ruleId: string, trace: ExecutionTrace): ValidationDataModelImpl<T> {
    // Add trace to traces array and metadata
    const newModel = this.clone();
    newModel.traces.push(trace);
    newModel.metadata.set(`trace:${ruleId}`, trace);
    return newModel;
  }
  
  /**
   * Sets the equivalence class for state minimization
   * 
   * @param classId The equivalence class ID
   * @returns A new data model with the updated equivalence class
   */
  public setEquivalenceClass(classId: number): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    newModel.equivalenceClass = classId;
    return newModel;
  }
  
  /**
   * Gets the equivalence class
   * 
   * @returns The equivalence class ID or null if not set
   */
  public getEquivalenceClass(): number | null {
    return this.equivalenceClass;
  }
  
  /**
   * Adds metadata
   * 
   * @param key The metadata key
   * @param value The metadata value
   * @returns A new data model with the added metadata
   */
  public withMetadata(key: string, value: any): ValidationDataModelImpl<T> {
    const newModel = this.clone();
    newModel.metadata.set(key, value);
    return newModel;
  }

  /**
   * Sets metadata directly (mutable version)
   * 
   * @param key The metadata key
   * @param value The metadata value
   */
  public setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }
  
  /**
   * Gets a metadata value
   * 
   * @param key The metadata key
   * @returns The metadata value or undefined if not found
   */
  public getMetadata(key: string): any {
    return this.metadata.get(key);
  }
  
  /**
   * Gets all metadata
   * 
   * @returns Map of all metadata
   */
  public getAllMetadata(): Map<string, any> {
    return new Map(this.metadata);
  }
  
  /**
   * Creates a deep clone of the data model
   * 
   * @returns A new instance with identical data
   */
  public clone(): ValidationDataModelImpl<T> {
    const clone = new ValidationDataModelImpl<T>(this.cloneData(this.data));
    
    // Copy rules
    clone.rules = [...this.rules];
    
    // Copy errors and warnings
    clone.errors = [...this.errors];
    clone.warnings = [...this.warnings];
    
    // Copy optimized rules
    clone.optimizedRules = new Map();
    this.optimizedRules.forEach((rules, nodeType) => {
      clone.optimizedRules.set(nodeType, [...rules]);
    });
    
    // Copy traces
    clone.traces = [...this.traces];
    
    // Copy metadata
    clone.metadata = new Map(this.metadata);
    
    // Copy validation state
    clone.validationState = new Map(this.validationState);
    
    // Copy equivalence class
    clone.equivalenceClass = this.equivalenceClass;
    
    return clone;
  }
  
  /**
   * Creates a deep clone of the data
   * 
   * @param data The data to clone
   * @returns A deep clone of the data
   */
  private cloneData(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }
    
    // Handle basic types
    if (typeof data !== 'object') {
      return data;
    }
    
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.cloneData(item as any)) as unknown as T;
    }
    
    // Handle objects
    if (data instanceof Date) {
      return new Date(data) as unknown as T;
    }
    
    // Clone object properties
    const clone: any = {};
    Object.entries(data as Record<string, any>).forEach(([key, value]) => {
      clone[key] = this.cloneData(value as any);
    });
    
    return clone as T;
  }
  
  /**
   * Gets all optimized rules
   * 
   * @returns Map of node types to optimized rules
   */
  public getAllOptimizedRules(): Map<string, ValidationRule[]> {
    const result = new Map<string, ValidationRule[]>();
    
    this.optimizedRules.forEach((rules, nodeType) => {
      result.set(nodeType, [...rules]);
    });
    
    return result;
  }
  
  /**
   * Merges data from another instance
   * 
   * @param other The other model to merge from
   * @returns A new instance containing merged data
   */
  public merge(other: ValidationDataModelImpl<T>): ValidationDataModelImpl<T> {
    // Create a new instance with our data
    const merged = this.clone();
    
    // Merge rules
    other.getRules().forEach(rule => {
      if (!merged.hasRule(rule.id)) {
        merged.rules.push(rule);
      }
    });
    
    // Merge errors and warnings
    merged.errors.push(...other.getErrors());
    merged.warnings.push(...other.getValidationWarnings());
    
    // Merge optimized rules
    other.getAllOptimizedRules().forEach((rules, nodeType) => {
      if (!merged.optimizedRules.has(nodeType)) {
        merged.optimizedRules.set(nodeType, []);
      }
      
      // Add unique rules
      const existingRules = merged.optimizedRules.get(nodeType)!;
      const existingRuleIds = new Set(existingRules.map(rule => rule.id));
      
      rules.forEach(rule => {
        if (!existingRuleIds.has(rule.id)) {
          existingRules.push(rule);
        }
      });
    });
    
    // Merge traces
    merged.traces.push(...other.getAllTraces());
    
    // Merge metadata
    other.getAllMetadata().forEach((value, key) => {
      merged.metadata.set(key, value);
    });
    
    // Merge validation state
    // Use other's values for overlapping keys
    other.validationState.forEach((value, key) => {
      merged.validationState.set(key, value);
    });
    
    return merged;
  }
  
  /**
   * Deep equality check against another data model
   * 
   * @param other The other model to compare with
   * @returns True if the models are equivalent
   */
  public equals(other: ValidationDataModelImpl<T>): boolean {
    // Check basic properties
    if (this.rules.length !== other.rules.length ||
        this.errors.length !== other.errors.length ||
        this.warnings.length !== other.warnings.length ||
        this.traces.length !== other.traces.length ||
        this.optimizedRules.size !== other.optimizedRules.size ||
        this.metadata.size !== other.metadata.size ||
        this.validationState.size !== other.validationState.size ||
        this.equivalenceClass !== other.equivalenceClass) {
      return false;
    }
    
    // Compare rules by ID
    const thisRuleIds = new Set(this.rules.map(rule => rule.id));
    const otherRuleIds = new Set(other.rules.map(rule => rule.id));
    
    if (thisRuleIds.size !== otherRuleIds.size) {
      return false;
    }
    
    for (const ruleId of thisRuleIds) {
      if (!otherRuleIds.has(ruleId)) {
        return false;
      }
    }
    
    // Compare validation states
    for (const [key, value] of this.validationState.entries()) {
      if (!other.validationState.has(key) || 
          JSON.stringify(other.validationState.get(key)) !== JSON.stringify(value)) {
        return false;
      }
    }
    
    // Deep comparison of errors, warnings, traces would be more complex
    // This is a simplified implementation
    
    return true;
  }
  
  /**
   * Converts the data model to a plain JavaScript object
   * 
   * @returns A serializable representation of the model
   */
  public toObject(): Record<string, any> {
    return {
      data: this.data,
      rules: this.rules.map(rule => rule.toObject?.() || rule),
      errors: this.errors.map(error => error.toJSON?.() || error),
      warnings: this.warnings.map(warning => warning.toJSON?.() || warning),
      optimizedRules: Object.fromEntries(
        Array.from(this.optimizedRules.entries()).map(
          ([nodeType, rules]) => [nodeType, rules.map(rule => rule.toObject?.() || rule)]
        )
      ),
      traces: this.traces.map(trace => trace.toObject?.() || trace),
      metadata: Object.fromEntries(this.metadata),
      validationState: Object.fromEntries(this.validationState),
      equivalenceClass: this.equivalenceClass
    };
  }
  
  /**
   * Generates a minimization signature for the data model
   * Used by the automaton state minimization algorithm
   * 
   * @returns A string signature for minimization
   */
  public getMinimizationSignature(): string {
    // Create a signature that captures the core state of this model
    const parts = [
      `rules:${this.rules.length}`,
      `errors:${this.errors.length}`,
      `warnings:${this.warnings.length}`,
      `traces:${this.traces.length}`,
      `optimizedRules:${this.optimizedRules.size}`,
      `equivalenceClass:${this.equivalenceClass}`
    ];
    
    // Add rule IDs for more precise equivalence
    const ruleIds = this.rules.map(rule => rule.id).sort().join(',');
    parts.push(`ruleIds:[${ruleIds}]`);
    
    // Add basic data type information
    if (this.data !== undefined && this.data !== null) {
      const dataType = Array.isArray(this.data) ? 'array' : typeof this.data;
      parts.push(`dataType:${dataType}`);
      
      // Include object structure signature for deeper comparison
      if (typeof this.data === 'object') {
        try {
          const keys = Object.keys(this.data).sort().join(',');
          parts.push(`dataKeys:[${keys}]`);
        } catch (e) {
          // Ignore errors in signature generation
        }
      }
    }
    
    return parts.join('|');
  }
  
  /**
   * Creates a ValidationDataModelImpl from a plain object
   * 
   * @param obj The plain object
   * @returns A new ValidationDataModelImpl instance
   */
  public static fromObject<T>(obj: Record<string, any>): ValidationDataModelImpl<T> {
    let model = new ValidationDataModelImpl<T>(obj['data']);
    
    // Add rules
    if (Array.isArray(obj['rules'])) {
      // Assume ValidationRuleFactory would be used in a real implementation
      for (const ruleObj of obj['rules']) {
        // This is a placeholder - in a real implementation you'd use:
        // const rule = ValidationRuleFactory.fromObject(ruleObj);
        // model = model.addRule(rule);
        // For now, just add the rule objects as-is
        model.rules.push(ruleObj);
      }
    }
    
    // Add errors
    if (Array.isArray(obj['errors'])) {
      for (const errorObj of obj['errors']) {
        const error = ValidationError.fromObject(errorObj);
        model = model.withError(error);
      }
    }
    
    // Add warnings
    if (Array.isArray(obj['warnings'])) {
      for (const warningObj of obj['warnings']) {
        // This is a placeholder - in a real implementation you'd use:
        // const warning = ValidationError.fromObject(warningObj);
        // model = model.withWarning(warning);
        model.warnings.push(warningObj);
      }
    }
    
    // Add optimized rules
    if (obj['optimizedRules'] && typeof obj['optimizedRules'] === 'object') {
      for (const [nodeType, rulesArray] of Object.entries(obj['optimizedRules'])) {
        if (Array.isArray(rulesArray)) {
          model.optimizedRules.set(nodeType, rulesArray as ValidationRule[]);
        }
      }
    }
    
    // Add traces
    if (Array.isArray(obj['traces'])) {
      // Assuming ExecutionTrace has a fromObject method
      for (const traceObj of obj['traces']) {
        // This is a placeholder - in a real implementation you'd use:
        const trace = ExecutionTrace.fromObject(traceObj);
        model.withTrace(trace);
        model.traces.push(traceObj);
      }
    }
    
    // Add metadata
    if (obj['metadata'] && typeof obj['metadata'] === 'object') {
      for (const [key, value] of Object.entries(obj['metadata'])) {
        model.metadata.set(key, value);
      }
    }
    
    // Add validation state
    if (obj['validationState'] && typeof obj['validationState'] === 'object') {
      for (const [key, value] of Object.entries(obj['validationState'])) {
        model.validationState.set(key, value);
      }
    }
    
    // Set equivalence class
    if (typeof obj['equivalenceClass'] === 'number') {
      model.equivalenceClass = obj['equivalenceClass'];
    }
    
    return model;
  }
}