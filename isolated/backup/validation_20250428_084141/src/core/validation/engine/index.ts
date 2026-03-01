/**
 * index.ts
 * 
 * Exports for the validation engine components that define the interface,
 * implementation, and configuration for the validation system.
 * 
 * Copyright © 2025 OBINexus Computing
 */

export { ValidationEngine } from './ValidationEngine';
export { ValidationEngineConfiguration } from './config/ValidationEngineConfiguration';
export type { ValidationEngineOptions } from './core/IValidationEngine';
export type { IValidationEngine, IValidationEngineWithHooks, ValidationEngineHooks } from './core/IValidationEngine';
export { ValidationEngineImpl } from './core/ValidationEngineImpl';