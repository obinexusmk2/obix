/**
 * index.ts
 * 
 * Exports for validation engine configuration components
 * that define how the validation engine behaves.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ValidationEngineConfiguration } from './ValidationEngineConfiguration';

export {
  

} from './ValidationEngineConfiguration'

/**
 * Default configuration for the validation engine
 */
export const DEFAULT_CONFIG = new ValidationEngineConfiguration();

/**
 * HTML validation configuration
 */
export const HTML_CONFIG = ValidationEngineConfiguration.forHTML();

/**
 * CSS validation configuration
 */
export const CSS_CONFIG = ValidationEngineConfiguration.forCSS();

/**
 * JavaScript validation configuration
 */
export const JS_CONFIG = ValidationEngineConfiguration.forJavaScript();

/**
 * Debug configuration with tracing enabled
 */
export const DEBUG_CONFIG = ValidationEngineConfiguration.forDebugging();