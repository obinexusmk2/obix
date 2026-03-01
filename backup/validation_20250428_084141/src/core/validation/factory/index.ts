/**
 * index.ts
 * 
 * Exports for validation factory components that create
 * validation engines and adapters.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { IValidationEngine } from '../../core';

export { ValidationEngineFactory } from './ValidationEngineFactory';
export { ValidationAdapterFactory, type ValidationAdapterOptions } from './ValidationAdapterFactory';

/**
 * Creates a default validation engine
 * 
 * @returns A new validation engine
 */

export async function createDefaultEngine(): Promise<IValidationEngine> {
  const factory = await import('./ValidationEngineFactory');
  return factory.ValidationEngineFactory.createDefault();
}
/**
 * Creates a validation engine for HTML validation
 * 
 * @returns A new validation engine
 */
export async function createHTMLEngine(): Promise<import('../../core/IValidationEngine').IValidationEngine> {
  const factory = await import('./ValidationEngineFactory');
  return factory.ValidationEngineFactory.createForHTML();
}

/**
 * Creates a validation engine for CSS validation
 * 
 * @returns A new validation engine
 */
export function createCSSEngine(): import('../../core/IValidationEngine').IValidationEngine {
  return import('./ValidationEngineFactory').ValidationEngineFactory.createForCSS();
}

/**
 * Creates a validation engine for JavaScript validation
 * 
 * @returns A new validation engine
 */
export function createJSEngine(): import('../../core/IValidationEngine').IValidationEngine {
  return import('./ValidationEngineFactory').ValidationEngineFactory.createForJS();
}

/**
 * Creates a validation adapter for HTML validation
 * 
 * @returns A new validation adapter
 */
export function createHTMLAdapter(): import('../../ValidationAdapter').ValidationAdapter {
  return import('./ValidationAdapterFactory').ValidationAdapterFactory.createForHTML();
}

/**
 * Creates a validation adapter for CSS validation
 * 
 * @returns A new validation adapter
 */
export function createCSSAdapter(): import('../../ValidationAdapter').ValidationAdapter {
  return import('./ValidationAdapterFactory').ValidationAdapterFactory.createForCSS();
}

/**
 * Creates a validation adapter for JavaScript validation
 * 
 * @returns A new validation adapter
 */
export function createJSAdapter(): import('../../ValidationAdapter').ValidationAdapter {
  return import('./ValidationAdapterFactory').ValidationAdapterFactory.createForJavaScript();
}