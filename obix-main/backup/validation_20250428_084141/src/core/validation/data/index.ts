/**
 * index.ts
 * 
 * Exports for domain-specific validation adapters that provide
 * specialized validation functionality for different domains.
 * 
 * Copyright © 2025 OBINexus Computing
 */

// We'll re-export the domain-specific adapters when they're implemented.
// For now, we'll forward to the adapter factory

import { ValidationAdapterFactory } from '../factory/ValidationAdapterFactory';

/**
 * Creates an HTML validation adapter
 */
export const createHTMLAdapter = ValidationAdapterFactory.createForHTML;

/**
 * Creates a CSS validation adapter
 */
export const createCSSAdapter = ValidationAdapterFactory.createForCSS;

/**
 * Creates a JavaScript validation adapter
 */
export const createJSAdapter = ValidationAdapterFactory.createForJavaScript;

/**
 * Creates a default validation adapter
 */
export const createDefaultAdapter = ValidationAdapterFactory.createDefault;
