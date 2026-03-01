/**
 * index.ts
 * 
 * Exports for validation registry components that manage
 * validation engines and rules.
 * 
 * Copyright © 2025 OBINexus Computing
 */

export { ValidationEngineRegistry } from './ValidationEngineRegistry';
export { ValidationRuleRegistry } from './ValidationRuleRegistry';

/**
 * Gets the global engine registry instance
 * 
 * @returns The global engine registry instance
 */
export async function getEngineRegistry(): Promise<import('./ValidationEngineRegistry').ValidationEngineRegistry> {
  const { ValidationEngineRegistry } = await import('./ValidationEngineRegistry');
  return ValidationEngineRegistry.getInstance();
}

/**
 * Creates a new rule registry
 * 
 * @param initialRules Optional initial rules
 * @returns A new rule registry
 */
export async function createRuleRegistry(initialRules: import('../rules/ValidationRule').ValidationRule[] = []): Promise<import('./ValidationRuleRegistry').ValidationRuleRegistry> {
  const { ValidationRuleRegistry } = await import('./ValidationRuleRegistry');
  const registry = new ValidationRuleRegistry();
  
  for (const rule of initialRules) {
    registry.register(rule);
  }
  
  return registry;
}