/**
 * IValidationEngine.ts
 * 
 * Core interface for the unified ValidationEngine system in OBIX.
 * This interface provides a unified API for validation operations
 * that bridges the DOP pattern with validation functionality.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ImplementationComparisonResult } from "@/core/dop";
import { ErrorTracker } from "../../errors/ErrorTracker";
import { ValidationError } from "../../errors/ValidationError";
import { ValidationRule } from "../../rules/ValidationRule";
import { ValidationResult } from "../../../../../old/dop/dop/ValidationResult";



/**
 * Configuration options for the validation engine
 */
export interface ValidationEngineOptions {
  /**
   * Whether to enable state minimization for improved performance
   */
  enableMinimization?: boolean;
  
  /**
   * Whether to enable execution tracing for debugging
   */
  enableTracing?: boolean;
  
  /**
   * Whether to automatically validate implementations
   */
  autoValidateImplementations?: boolean;
  
  /**
   * Component name for error tracking
   */
  componentName?: string;
  
  /**
   * Strategy for error handling
   */
  errorHandlingStrategy?: string;
  
  /**
   * Whether to optimize rule execution
   */
  optimizeRuleExecution?: boolean;
  
  /**
   * Maximum number of rules to apply per node
   */
  maxRulesPerNode?: number;
}

/**
 * Core interface for the validation engine
 * Provides a unified API for validation operations
 */
export interface IValidationEngine {
  /**
   * Validates a node against registered rules
   * 
   * @param node The node to validate
   * @returns Validation result
   */
  validateNode(node: any): ValidationResult<any>;
  
  /**
   * Validates an entire AST by traversing all nodes
   * 
   * @param ast The abstract syntax tree to validate
   * @returns Validation result
   */
  validateAST(ast: any): ValidationResult<any>;
  
  /**
   * Registers a validation rule with the engine
   * 
   * @param rule The validation rule to register
   * @returns This engine instance for chaining
   */
  registerRule(rule: ValidationRule): IValidationEngine;
  
  /**
   * Registers multiple validation rules with the engine
   * 
   * @param rules The validation rules to register
   * @returns This engine instance for chaining
   */
  registerRules(rules: ValidationRule[]): IValidationEngine;
  
  /**
   * Compares implementations from different paradigms
   * 
   * @param funcImpl Functional implementation
   * @param oopImpl OOP implementation
   * @returns Implementation comparison result
   */
  compareImplementations(funcImpl: any, oopImpl: any): ImplementationComparisonResult;
  
  /**
   * Handles a validation error
   * 
   * @param error The validation error to handle
   */
  handleError(error: ValidationError): void;
  
  /**
   * Gets the error tracker
   * 
   * @returns The error tracker
   */
  getErrorTracker(): ErrorTracker;
  
  /**
   * Gets the current configuration
   * 
   * @returns Current configuration
   */
  getConfiguration(): ValidationEngineOptions;
  
  /**
   * Updates the configuration
   * 
   * @param options New configuration options
   * @returns This engine instance for chaining
   */
  configure(options: Partial<ValidationEngineOptions>): IValidationEngine;
  
  /**
   * Optimizes the engine for improved performance
   * This includes state minimization and rule optimization
   * 
   * @returns This engine instance for chaining
   */
  optimize(): IValidationEngine;
  
  /**
   * Resets the engine to its initial state
   * 
   * @returns This engine instance for chaining
   */
  reset(): IValidationEngine;
}

/**
 * Type for validation engine lifecycle hooks
 */
export interface ValidationEngineHooks {
  /**
   * Called before validation starts
   */
  beforeValidation?: (node: any) => void;
  
  /**
   * Called after validation completes
   */
  afterValidation?: (result: ValidationResult<any>) => void;
  
  /**
   * Called when an error occurs
   */
  onError?: (error: ValidationError) => void;
  
  /**
   * Called before implementation comparison
   */
  beforeComparison?: (funcImpl: any, oopImpl: any) => void;
  
  /**
   * Called after implementation comparison
   */
  afterComparison?: (result: ImplementationComparisonResult) => void;
}

/**
 * Extended validation engine interface with hooks
 */
export interface IValidationEngineWithHooks extends IValidationEngine {
  /**
   * Registers lifecycle hooks
   * 
   * @param hooks The hooks to register
   * @returns This engine instance for chaining
   */
  registerHooks(hooks: ValidationEngineHooks): IValidationEngineWithHooks;
  
  /**
   * Removes all registered hooks
   * 
   * @returns This engine instance for chaining
   */
  clearHooks(): IValidationEngineWithHooks;
}