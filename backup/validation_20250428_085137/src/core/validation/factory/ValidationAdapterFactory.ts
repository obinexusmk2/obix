/**
 * ValidationAdapterFactory.ts
 * 
 * Factory for creating ValidationAdapter instances specialized for different
 * domains (HTML, CSS, JavaScript, etc). This factory encapsulates the complexity
 * of creating properly configured adapters.
 * 
 * Copyright © 2025 OBINexus Computing
 * @author OBINexus Computing - Nnamdi Michael Okpala
 * @name ValidationAdapterFactory
 * 
 */

import { ValidationAdapter } from "@/core/dop/ValidationAdapter";
import { ValidationBehaviorModel } from "@/core/dop/ValidationBehaviourModel";
import { ValidationStateMachine } from "@/core/dop/ValidationStateMachine";
import { ValidationDataModel } from "../data/ValidationDataModel";
import { ValidationErrorTracker } from "../errors/ErrorTracker";
import { ValidationRule } from "../rules/ValidationRule";
import { OptimizedValidationBehaviorModel } from "@/core/dop";



/**
 * Configuration options for validation adapters
 */
export interface ValidationAdapterOptions {
  /**
   * Implementation mode (functional or OOP)
   */
  implementationMode?: 'functional' | 'oop';
  
  /**
   * Whether to enable optimization
   */
  optimized?: boolean;
  
  /**
   * Initial validation rules
   */
  rules?: ValidationRule[];
  
  /**
   * Component name for error tracking
   */
  componentName?: string;
}

/**
 * Factory for creating validation adapters
 */
export class ValidationAdapterFactory {
  /**
   * Creates a default validation adapter
   * 
   * @param options Configuration options
   * @returns A new ValidationAdapter
   */
  public static createDefault(options: ValidationAdapterOptions = {}): ValidationAdapter {
    // Create data model
    const dataModel = new ValidationDataModel();
    
    // Register rules if provided
    if (options.rules && Array.isArray(options.rules)) {
      for (const rule of options.rules) {
        dataModel.withRule(rule);
      }
    }
    
    // Create behavior model
    const behaviorModel = options.optimized
      ? new OptimizedValidationBehaviorModel()
      : new ValidationBehaviorModel();
    
    // Create state machine
    const stateMachine = new ValidationStateMachine();
    
    // Create and return adapter
    return new ValidationAdapter(
      dataModel,
      behaviorModel,
      stateMachine,
      new ValidationErrorTracker(),
      options.implementationMode || 'functional'
    );
  }
  
  /**
   * Creates a validation adapter for HTML validation
   * 
   * @param options Configuration options
   * @returns A new ValidationAdapter for HTML
   */
  public static createForHTML(options: ValidationAdapterOptions = {}): ValidationAdapter {
    return this.createDefault({
      implementationMode: 'functional',
      optimized: true,
      componentName: 'HTMLValidationAdapter',
      ...options
    });
  }
  
  /**
   * Creates a validation adapter for CSS validation
   * 
   * @param options Configuration options
   * @returns A new ValidationAdapter for CSS
   */
  public static createForCSS(options: ValidationAdapterOptions = {}): ValidationAdapter {
    return this.createDefault({
      implementationMode: 'functional',
      optimized: true,
      componentName: 'CSSValidationAdapter',
      ...options
    });
  }
  
  /**
   * Creates a validation adapter for JavaScript validation
   * 
   * @param options Configuration options
   * @returns A new ValidationAdapter for JavaScript
   */
  public static createForJavaScript(options: ValidationAdapterOptions = {}): ValidationAdapter {
    return this.createDefault({
      implementationMode: 'functional',
      optimized: true,
      componentName: 'JSValidationAdapter',
      ...options
    });
  }
  
  /**
   * Creates a validation adapter with functional implementation mode
   * 
   * @param options Configuration options
   * @returns A new ValidationAdapter in functional mode
   */
  public static createFunctional(options: ValidationAdapterOptions = {}): ValidationAdapter {
    return this.createDefault({
      ...options,
      implementationMode: 'functional'
    });
  }
  
  /**
   * Creates a validation adapter with OOP implementation mode
   * 
   * @param options Configuration options
   * @returns A new ValidationAdapter in OOP mode
   */
  public static createOOP(options: ValidationAdapterOptions = {}): ValidationAdapter {
    return this.createDefault({
      ...options,
      implementationMode: 'oop'
    });
  }
  
  /**
   * Creates a specialized adapter based on node type
   * 
   * @param nodeType The node type to create an adapter for
   * @param options Configuration options
   * @returns A specialized ValidationAdapter
   */
  public static createForNodeType(nodeType: string, options: ValidationAdapterOptions = {}): ValidationAdapter {
    // Determine the adapter type based on node type
    switch (nodeType.toLowerCase()) {
      case 'html':
      case 'htmlelement':
      case 'document':
        return this.createForHTML(options);
        
      case 'css':
      case 'stylesheet':
      case 'cssstyle':
        return this.createForCSS(options);
        
      case 'javascript':
      case 'js':
      case 'script':
        return this.createForJavaScript(options);
        
      default:
        return this.createDefault(options);
    }
  }
  
  /**
   * Creates an adapter from a rule set
   * 
   * @param rules Validation rules
   * @param options Configuration options
   * @returns A new ValidationAdapter
   */
  public static createFromRules(rules: ValidationRule[], options: ValidationAdapterOptions = {}): ValidationAdapter {
    return this.createDefault({
      ...options,
      rules
    });
  }
}