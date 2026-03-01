// src/parser/css/vcss/index.ts

/**
 * VCSS Module
 * 
 * Virtual CSS implementation with automaton state minimization and AST optimization
 * for efficient diffing and patching of CSS stylesheets.
 */

// Export the VCSS components
export { CSSVNode } from './VCSSNode';
export { CSSDiff, type CSSPatch } from './CSSDiff';
export { CSSPatchList, CSSPatchError, type PatchStats } from './CSSPatch';
export { 
  CSSVirtualStylesheet, 
  type VirtualStylesheetOptions, 
  type StylesheetMetrics
} from './CSSVirtualStylesheet';

// Convenience functions
/**
 * Create a virtual CSS stylesheet
 * 
 * @param css Initial CSS content
 * @param options Configuration options
 */
export function createVirtualStylesheet(css: string = '', options = {}) {
  return new CSSVirtualStylesheet(css, options);
}

/**
 * Apply CSS changes to the DOM using state minimization
 * 
 * @param oldCSS Previous CSS
 * @param newCSS New CSS
 * @param target Optional target element selector
 */
export function applyStyleChanges(
  oldCSS: string,
  newCSS: string,
  target?: string
): void {
  const sheet = new CSSVirtualStylesheet(oldCSS, {
    targetSelector: target,
    autoPatch: true
  });
  
  sheet.updateCSS(newCSS);
}

/**
 * Create a rule with the specified selector and declarations
 * 
 * @param selector CSS selector
 * @param declarations CSS property-value pairs
 */
export function createRule(
  selector: string,
  declarations: Record<string, string>
): CSSVNode {
  return CSSVNode.createStyleRule(selector, declarations);
}

/**
 * Create an at-rule with the specified name and prelude
 * 
 * @param name At-rule name (like 'media')
 * @param prelude At-rule prelude (like 'screen and (min-width: 768px)')
 * @param block Optional block content
 */
export function createAtRule(
  name: string,
  prelude: string,
  block?: CSSVNode
): CSSVNode {
  return CSSVNode.createAtRule(name, prelude, block);
}