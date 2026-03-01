// src/parser/css/vcss/CSSPatch.ts

import { CSSVNode } from './VCSSNode.js';
import { CSSPatch } from './CSSDiff.js';

/**
 * Custom error class for patch operations
 */
export class CSSPatchError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'CSSPatchError';
  }
}

/**
 * Interface for tracking patch application statistics
 */
export interface PatchStats {
  rulesAdded: number;
  rulesRemoved: number;
  rulesUpdated: number;
  atRulesAdded: number;
  atRulesRemoved: number;
  atRulesUpdated: number;
  errors: Array<{ code: string; message: string }>;
}

/**
 * CSS Patch Manager
 * Applies CSS patches to the DOM with state minimization
 */
export class CSSPatchList {
  public patches: Map<number, CSSPatch[]>;
  public stats!: PatchStats;

  constructor() {
    this.patches = new Map();
    this.resetStats();
  }

  /**
   * Reset patch application statistics
   */
  public resetStats(): void {
    this.stats = {
      rulesAdded: 0,
      rulesRemoved: 0,
      rulesUpdated: 0,
      atRulesAdded: 0,
      atRulesRemoved: 0,
      atRulesUpdated: 0,
      errors: []
    };
  }

  /**
   * Add a patch to the list
   */
  public addPatch(index: number, patch: CSSPatch): void {
    if (!Number.isInteger(index) || index < 0) {
      throw new CSSPatchError('Invalid patch index', 'INVALID_INDEX');
    }

    if (!this.validatePatch(patch)) {
      throw new CSSPatchError('Invalid patch structure', 'INVALID_PATCH');
    }

    if (!this.patches.has(index)) {
      this.patches.set(index, []);
    }
    this.patches.get(index)!.push(patch);
  }

  /**
   * Validate a patch's structure
   */
  public validatePatch(patch: CSSPatch): boolean {
    switch (patch.type) {
      case 'RULE_UPDATE':
        return Boolean(patch.selector && patch.declarations);
      case 'RULE_REMOVE':
        return Boolean(patch.selector);
      case 'RULE_ADD':
        return Boolean(patch.node && patch.node instanceof CSSVNode);
      case 'AT_RULE_UPDATE':
        return Boolean(patch.name && patch.prelude);
      case 'AT_RULE_REMOVE':
        return Boolean(patch.name && patch.prelude);
      case 'AT_RULE_ADD':
        return Boolean(patch.node && patch.node instanceof CSSVNode);
      default:
        return false;
    }
  }

  /**
   * Add patches from a diff result
   */
  public addPatches(diffResult: Map<number, CSSPatch[]>): void {
    for (const [index, patches] of diffResult.entries()) {
      for (const patch of patches) {
        this.addPatch(index, patch);
      }
    }
  }

  /**
   * Get all patches
   */
  public getPatches(): Map<number, CSSPatch[]> {
    return new Map(this.patches);
  }

  /**
   * Get patch application statistics
   */
  public getPatchStats(): PatchStats {
    return { ...this.stats };
  }

  /**
   * Apply patches to a DOM style element
   */
  public applyPatches(node: Node): Node {
    this.resetStats();
    let styleElement: HTMLStyleElement;
    let styleSheet: CSSStyleSheet;

    try {
      if (node instanceof HTMLStyleElement) {
        styleElement = node;
        styleSheet = node.sheet as CSSStyleSheet;
      } else {
        styleElement = document.createElement('style');
        document.head.appendChild(styleElement);
        styleSheet = styleElement.sheet as CSSStyleSheet;
      }

      if (!styleSheet) {
        throw new CSSPatchError('Failed to access stylesheet', 'STYLESHEET_ACCESS_ERROR');
      }

      const rules = Array.from(styleSheet.cssRules);
      const sortedIndices = Array.from(this.patches.keys()).sort((a, b) => a - b);

      for (const index of sortedIndices) {
        const currentPatches = this.patches.get(index);
        if (!currentPatches) continue;

        for (const patch of currentPatches) {
          try {
            this.applyPatch(styleSheet, rules, patch);
          } catch (error) {
            this.stats.errors.push({
              code: 'PATCH_APPLICATION_ERROR',
              message: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      return styleElement;
    } catch (error) {
      if (error instanceof CSSPatchError) {
        throw error;
      }
      throw new CSSPatchError(
        'Failed to apply patches: ' + (error instanceof Error ? error.message : 'Unknown error'),
        'PATCH_APPLICATION_FAILED'
      );
    }
  }

  /**
   * Apply a single patch to a stylesheet
   */
  public applyPatch(styleSheet: CSSStyleSheet, rules: CSSRule[], patch: CSSPatch): void {
    switch (patch.type) {
      case 'RULE_ADD':
        this.applyRuleAdd(styleSheet, rules, patch as any);
        break;
      case 'RULE_REMOVE':
        this.applyRuleRemove(styleSheet, rules, patch as any);
        break;
      case 'RULE_UPDATE':
        this.applyRuleUpdate(styleSheet, rules, patch as any);
        break;
      case 'AT_RULE_ADD':
        this.applyAtRuleAdd(styleSheet, rules, patch as any);
        break;
      case 'AT_RULE_REMOVE':
        this.applyAtRuleRemove(styleSheet, rules, patch as any);
        break;
      case 'AT_RULE_UPDATE':
        this.applyAtRuleUpdate(styleSheet, rules, patch as any);
        break;
    }
  }

  /**
   * Apply a rule addition patch
   */
  public applyRuleAdd(
    styleSheet: CSSStyleSheet, 
    rules: CSSRule[], 
    patch: CSSPatch & { type: 'RULE_ADD' }
  ): void {
    try {
      styleSheet.insertRule(patch.node.toCSS(), rules.length);
      this.stats.rulesAdded++;
    } catch (error) {
      throw new CSSPatchError(
        `Failed to add rule: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        'RULE_ADD_ERROR'
      );
    }
  }

  /**
   * Apply a rule removal patch
   */
  public applyRuleRemove(
    styleSheet: CSSStyleSheet, 
    rules: CSSRule[], 
    patch: CSSPatch & { type: 'RULE_REMOVE' }
  ): void {
    const ruleIndex = this.findRuleIndex(rules, patch.selector);
    if (ruleIndex !== -1) {
      try {
        styleSheet.deleteRule(ruleIndex);
        this.stats.rulesRemoved++;
      } catch (error) {
        throw new CSSPatchError(
          `Failed to remove rule: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          'RULE_REMOVE_ERROR'
        );
      }
    }
  }

  /**
   * Apply a rule update patch
   */
  public applyRuleUpdate(
    styleSheet: CSSStyleSheet, 
    rules: CSSRule[], 
    patch: CSSPatch & { type: 'RULE_UPDATE' }
  ): void {
    const updateIndex = this.findRuleIndex(rules, patch.selector);
    if (updateIndex !== -1) {
      try {
        styleSheet.deleteRule(updateIndex);
        styleSheet.insertRule(
          new CSSVNode('rule', {
            selector: patch.selector,
            declarations: patch.declarations
          }).toCSS(),
          updateIndex
        );
        this.stats.rulesUpdated++;
      } catch (error) {
        throw new CSSPatchError(
          `Failed to update rule: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          'RULE_UPDATE_ERROR'
        );
      }
    }
  }

  /**
   * Apply an at-rule addition patch
   */
  public applyAtRuleAdd(
    styleSheet: CSSStyleSheet, 
    rules: CSSRule[], 
    patch: CSSPatch & { type: 'AT_RULE_ADD' }
  ): void {
    try {
      styleSheet.insertRule(patch.node.toCSS(), rules.length);
      this.stats.atRulesAdded++;
    } catch (error) {
      throw new CSSPatchError(
        `Failed to add at-rule: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        'AT_RULE_ADD_ERROR'
      );
    }
  }

  /**
   * Apply an at-rule removal patch
   */
  public applyAtRuleRemove(
    styleSheet: CSSStyleSheet, 
    rules: CSSRule[], 
    patch: CSSPatch & { type: 'AT_RULE_REMOVE' }
  ): void {
    const atRuleIndex = this.findAtRuleIndex(rules, patch.name, patch.prelude);
    if (atRuleIndex !== -1) {
      try {
        styleSheet.deleteRule(atRuleIndex);
        this.stats.atRulesRemoved++;
      } catch (error) {
        throw new CSSPatchError(
          `Failed to remove at-rule: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          'AT_RULE_REMOVE_ERROR'
        );
      }
    }
  }
/**
   * Apply an at-rule update patch
   */
public applyAtRuleUpdate(
    styleSheet: CSSStyleSheet, 
    rules: CSSRule[], 
    patch: CSSPatch & { type: 'AT_RULE_UPDATE' }
  ): void {
    const atUpdateIndex = this.findAtRuleIndex(rules, patch.name, patch.prelude);
    if (atUpdateIndex !== -1) {
      try {
        styleSheet.deleteRule(atUpdateIndex);
        styleSheet.insertRule(
          new CSSVNode('at-rule', {
            name: patch.name,
            prelude: patch.prelude,
            block: patch.block
          }).toCSS(),
          atUpdateIndex
        );
        this.stats.atRulesUpdated++;
      } catch (error) {
        throw new CSSPatchError(
          `Failed to update at-rule: ${error instanceof Error ? error.message : 'Unknown error'}`, 
          'AT_RULE_UPDATE_ERROR'
        );
      }
    }
  }

  /**
   * Find the index of a rule by selector
   */
  public findRuleIndex(rules: CSSRule[], selector: string): number {
    return Array.from(rules).findIndex(rule => 
      rule instanceof CSSStyleRule && rule.selectorText === selector
    );
  }

  /**
   * Find the index of an at-rule by name and prelude
   */
  public findAtRuleIndex(rules: CSSRule[], name: string, prelude: string): number {
    return Array.from(rules).findIndex(rule =>
      rule instanceof CSSGroupingRule && 
      rule.constructor.name === `CSS${name.charAt(0).toUpperCase() + name.slice(1)}Rule` &&
      (rule as any).cssText.includes(`@${name} ${prelude}`)
    );
  }

  /**
   * Clear all patches
   */
  public clear(): void {
    this.patches.clear();
    this.resetStats();
  }
}