/**
 * DataModelFactory.ts
 * 
 * Factory class for creating data models from plain objects in the DOP (Data-Oriented Programming) 
 * pattern within the OBIX framework. This module provides a registry and creation mechanism for 
 * various data models, ensuring seamless integration and extensibility.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationRule } from "../validation/rules/ValidationRule";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";


/**
 * Factory class for creating data models from plain objects
 */
export class DataModelFactory {
    /**
     * Registry of model constructors by type
     */
    public static modelConstructors = new Map<string, any>();
    
    /**
     * Registers a model constructor
     * 
     * @param type The type identifier
     * @param constructor The constructor function
     */
    public static register<T>(type: string, constructor: { fromObject: (obj: any) => T }): void {
        this.modelConstructors.set(type, constructor);
    }
    
    /**
     * Creates a data model from a plain object
     * 
     * @param obj The object containing data and type information
     * @returns An instance of the appropriate data model
     */
    public static create<T>(obj: Record<string, any>): T {
        if (!obj['type']) {
            throw new Error("Object must have a 'type' property to determine the model class");
        }
        
        const constructor = this.modelConstructors.get(obj['type']);
        if (!constructor) {
            throw new Error(`No model constructor registered for type '${obj['type']}'`);
        }
        
        return constructor.fromObject(obj);
    }
    
    /**
     * Creates a ValidationDataModelImpl from a plain object
     * 
     * @param obj The plain object
     * @returns A new ValidationDataModelImpl instance
     */
    public static createValidationDataModel<T>(obj: any): ValidationDataModelImpl {
        const data = obj.data as T;
        let rules: ValidationRule[] = [];
        
        // If rules are provided, create them
        if (Array.isArray(obj.rules)) {
            // We would import a ValidationRuleFactory here in a real implementation
            // For this example, we'll assume the rules are already in the right format
            rules = obj.rules;
        }
        
        const model = new ValidationDataModelImpl<T>(data, rules);
        
        // Add errors and warnings if provided
        if (Array.isArray(obj.errors)) {
            obj.errors.forEach((error: string) => {
                model.withError(error);
            });
        }
        
        if (Array.isArray(obj.warnings)) {
            obj.warnings.forEach((warning: string) => {
                model.withWarning(warning);
            });
        }
        
        // Add optimized rules if provided
        if (obj.optimizedRules && typeof obj.optimizedRules === 'object') {
            Object.entries(obj.optimizedRules).forEach(([nodeType, rules]) => {
                if (Array.isArray(rules)) {
                    model.withOptimizedRules(nodeType, rules as ValidationRule[]);
                }
            });
        }
        
        // Add traces if provided
        if (Array.isArray(obj.traces)) {
            obj.traces.forEach((trace: any) => {
                model.withTrace(trace);
            });
        }
        
        // Add metadata if provided
        if (obj.metadata && typeof obj.metadata === 'object') {
            Object.entries(obj.metadata).forEach(([key, value]) => {
                model.setMetadata(key, value);
            });
        }
        
        // Set equivalence class if provided
        if (typeof obj.equivalenceClass === 'number') {
            model.setEquivalenceClass(obj.equivalenceClass);
        }
        
        return model;
    }
}

// Register the ValidationDataModelImpl with the factory
DataModelFactory.register('ValidationDataModel', {
    fromObject: (obj: any) => DataModelFactory.createValidationDataModel(obj)
});