/**
 * CSSVirtualStylesheet.ts
 * 
 * Core implementation of the CSS Virtual Stylesheet for OBIX framework.
 * This module provides mechanisms for efficient CSS diffing and patching
 * using Nnamdi Okpala's automaton state minimization approach.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { MRUCache } from '../cache/MRUCache';
import { CSSVNode, CSSVNodeProps, CSSVNodeState } from './CSSVNode';

/**
 * CSS Patch types for stylesheet modifications
 */
export enum CSSPatchType {
    /** Add a new rule */
    ADD_RULE = 'add_rule',
    /** Remove an existing rule */
    REMOVE_RULE = 'remove_rule',
    /** Update an existing rule's declarations */
    UPDATE_RULE = 'update_rule',
    /** Update a rule's selector */
    UPDATE_SELECTOR = 'update_selector',
    /** Add a declaration to a rule */
    ADD_DECLARATION = 'add_declaration',
    /** Remove a declaration from a rule */
    REMOVE_DECLARATION = 'remove_declaration',
    /** Update a declaration value */
    UPDATE_DECLARATION = 'update_declaration',
    /** Replace the entire stylesheet */
    REPLACE_STYLESHEET = 'replace_stylesheet',
    /** No changes (optimization) */
    NONE = 'none'
}

/**
 * Base interface for CSS patches
 */
export interface CSSBasePatch {
    /** Type of patch */
    type: CSSPatchType;
    /** Optional context information */
    context?: Record<string, any>;
}

/**
 * Patch to add a new rule
 */
export interface CSSAddRulePatch extends CSSBasePatch {
    type: CSSPatchType.ADD_RULE;
    /** Rule to add */
    rule: CSSVNode;
    /** Position to insert at (end if omitted) */
    position?: number;
}

/**
 * Patch to remove a rule
 */
export interface CSSRemoveRulePatch extends CSSBasePatch {
    type: CSSPatchType.REMOVE_RULE;
    /** Rule to remove */
    rule: CSSVNode;
    /** Rule's index in the stylesheet */
    index: number;
}

/**
 * Patch to update an existing rule's declarations
 */
export interface CSSUpdateRulePatch extends CSSBasePatch {
    type: CSSPatchType.UPDATE_RULE;
    /** Rule to update */
    rule: CSSVNode;
    /** Updated declarations */
    declarations: Record<string, string>;
    /** Rule's index in the stylesheet */
    index: number;
}

/**
 * Patch to update a rule's selector
 */
export interface CSSUpdateSelectorPatch extends CSSBasePatch {
    type: CSSPatchType.UPDATE_SELECTOR;
    /** Rule to update */
    rule: CSSVNode;
    /** New selector */
    selector: string;
    /** Rule's index in the stylesheet */
    index: number;
}

/**
 * Patch to add a declaration to a rule
 */
export interface CSSAddDeclarationPatch extends CSSBasePatch {
    type: CSSPatchType.ADD_DECLARATION;
    /** Rule to update */
    rule: CSSVNode;
    /** Property name */
    property: string;
    /** Property value */
    value: string;
    /** Whether the declaration is important */
    important?: boolean;
    /** Rule's index in the stylesheet */
    index: number;
}

/**
 * Patch to remove a declaration from a rule
 */
export interface CSSRemoveDeclarationPatch extends CSSBasePatch {
    type: CSSPatchType.REMOVE_DECLARATION;
    /** Rule to update */
    rule: CSSVNode;
    /** Property name */
    property: string;
    /** Rule's index in the stylesheet */
    index: number;
}

/**
 * Patch to update a declaration value
 */
export interface CSSUpdateDeclarationPatch extends CSSBasePatch {
    type: CSSPatchType.UPDATE_DECLARATION;
    /** Rule to update */
    rule: CSSVNode;
    /** Property name */
    property: string;
    /** New property value */
    value: string;
    /** Whether the declaration is important */
    important?: boolean;
    /** Rule's index in the stylesheet */
    index: number;
}

/**
 * Patch to replace the entire stylesheet
 */
export interface CSSReplaceStylesheetPatch extends CSSBasePatch {
    type: CSSPatchType.REPLACE_STYLESHEET;
    /** New stylesheet */
    stylesheet: CSSVNode;
}

/**
 * Patch indicating no changes
 */
export interface CSSNonePatch extends CSSBasePatch {
    type: CSSPatchType.NONE;
}

/**
 * Union type for all CSS patch types
 */
export type CSSPatch = 
    | CSSAddRulePatch
    | CSSRemoveRulePatch
    | CSSUpdateRulePatch
    | CSSUpdateSelectorPatch
    | CSSAddDeclarationPatch
    | CSSRemoveDeclarationPatch
    | CSSUpdateDeclarationPatch
    | CSSReplaceStylesheetPatch
    | CSSNonePatch;

/**
 * CSS Virtual Stylesheet configuration options
 */
export interface CSSVirtualStylesheetOptions {
    /** Enable state transition minimization */
    enableStateMachineMinimization?: boolean;
    /** Cache size for optimized rules */
    ruleCacheSize?: number;
    /** Enable transition tracking for optimization */
    trackStateTransitions?: boolean;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Virtual Stylesheet class for efficient CSS updates using automaton state minimization
 */
export class CSSVirtualStylesheet {
    /** Stylesheet root node */
    private stylesheet: CSSVNode;
    /** Configuration options */
    private options: CSSVirtualStylesheetOptions;
    /** Cache for rule nodes */
    private ruleCache: MRUCache<string, CSSVNode>;
    /** Map of state transition signatures to pre-computed patches */
    private transitionPatches: Map<string, CSSPatch[]>;
    /** Set of currently active transition signatures */
    private activeTransitions: Set<string>;
    /** Style element for DOM updates */
    private styleElement: HTMLStyleElement | null = null;
    /** Map of rule selectors to their virtual node references */
    private selectorMap: Map<string, CSSVNode> = new Map();
    /** Flag indicating if we're in patching mode */
    private isPatching: boolean = false;
    /** Counter for transition IDs */
    private transitionCounter: number = 0;
    
    /**
     * Create a new CSSVirtualStylesheet
     * 
     * @param stylesheet Initial stylesheet (empty if omitted)
     * @param options Configuration options
     */
    constructor(
        stylesheet?: CSSVNode,
        options: CSSVirtualStylesheetOptions = {}
    ) {
        this.options = {
            enableStateMachineMinimization: true,
            ruleCacheSize: 500,
            trackStateTransitions: true,
            debug: false,
            ...options
        };
        
        // Create empty stylesheet if none provided
        this.stylesheet = stylesheet || CSSVNode.createStylesheet([]);
        
        // Initialize cache
        this.ruleCache = new MRUCache<string, CSSVNode>({
            capacity: this.options.ruleCacheSize,
            trackTransitions: this.options.trackStateTransitions,
            cleanupInterval: 60000 // Cleanup every minute
        });
        
        this.transitionPatches = new Map<string, CSSPatch[]>();
        this.activeTransitions = new Set<string>();
        
        // Build initial selector map
        this.rebuildSelectorMap();
    }
    
    /**
     * Rebuild the selector map from current stylesheet
     * 
     * @private
     */
    private rebuildSelectorMap(): void {
        this.selectorMap.clear();
        
        for (const rule of this.stylesheet.children) {
            if (rule.type === 'rule' && rule.props.selector) {
                this.selectorMap.set(rule.props.selector, rule);
            }
        }
    }
    
    /**
     * Get the current stylesheet VNode
     * 
     * @returns The stylesheet VNode
     */
    public getStylesheet(): CSSVNode {
        return this.stylesheet;
    }
    
    /**
     * Get a transition signature for the current stylesheet state
     * 
     * @returns A unique signature representing the current state
     */
    public getStateSignature(): string {
        return `css_${this.transitionCounter}_${this.stylesheet.getStateSignature()}`;
    }
    
    /**
     * Create a rule
     * 
     * @param selector CSS selector
     * @param declarations Property-value pairs
     * @returns The created rule VNode
     */
    public createRule(
        selector: string,
        declarations: Record<string, string>
    ): CSSVNode {
        const rule = CSSVNode.createStyleRule(selector, declarations);
        
        // Cache the rule if enabled
        if (this.options.trackStateTransitions) {
            const key = rule.getStateSignature();
            this.ruleCache.set(key, rule);
        }
        
        return rule;
    }
    
    /**
     * Add a rule to the stylesheet
     * 
     * @param rule Rule to add
     * @param position Position to insert at (end if omitted)
     * @returns This stylesheet for chaining
     */
    public addRule(rule: CSSVNode, position?: number): CSSVirtualStylesheet {
        // Clone the current stylesheet
        const newStylesheet = this.stylesheet.clone();
        
        // Insert at specified position or end
        if (position !== undefined && position >= 0 && position <= newStylesheet.children.length) {
            newStylesheet.children.splice(position, 0, rule);
        } else {
            newStylesheet.children.push(rule);
        }
        
        // Apply state transition
        this.transitionTo(newStylesheet);
        
        // Update selector map
        if (rule.type === 'rule' && rule.props.selector) {
            this.selectorMap.set(rule.props.selector, rule);
        }
        
        return this;
    }
    
    /**
     * Remove a rule from the stylesheet
     * 
     * @param selectorOrIndex Selector string or index
     * @returns This stylesheet for chaining
     */
    public removeRule(selectorOrIndex: string | number): CSSVirtualStylesheet {
        // Clone the current stylesheet
        const newStylesheet = this.stylesheet.clone();
        
        let index: number;
        
        if (typeof selectorOrIndex === 'string') {
            // Find by selector
            index = newStylesheet.children.findIndex(
                rule => rule.type === 'rule' && rule.props.selector === selectorOrIndex
            );
            
            // Remove from selector map
            this.selectorMap.delete(selectorOrIndex);
        } else {
            // Use direct index
            index = selectorOrIndex;
        }
        
        // Remove if found
        if (index >= 0 && index < newStylesheet.children.length) {
            newStylesheet.children.splice(index, 1);
            
            // Apply state transition
            this.transitionTo(newStylesheet);
        }
        
        return this;
    }
    
    /**
     * Get a rule by selector
     * 
     * @param selector CSS selector
     * @returns The rule node or null if not found
     */
    public getRule(selector: string): CSSVNode | null {
        return this.selectorMap.get(selector) || null;
    }
    
    /**
     * Update a rule's declarations
     * 
     * @param selectorOrIndex Selector string or index
     * @param declarations New declarations (will be merged with existing)
     * @param replace Whether to replace all declarations (true) or merge (false)
     * @returns This stylesheet for chaining
     */
    public updateRule(
        selectorOrIndex: string | number,
        declarations: Record<string, string>,
        replace: boolean = false
    ): CSSVirtualStylesheet {
        // Clone the current stylesheet
        const newStylesheet = this.stylesheet.clone();
        
        let index: number;
        let rule: CSSVNode | undefined;
        
        if (typeof selectorOrIndex === 'string') {
            // Find by selector
            index = newStylesheet.children.findIndex(
                rule => rule.type === 'rule' && rule.props.selector === selectorOrIndex
            );
            
            if (index >= 0) {
                rule = newStylesheet.children[index];
            }
        } else {
            // Use direct index
            index = selectorOrIndex;
            rule = newStylesheet.children[index];
        }
        
        // Update if found
        if (rule && index >= 0) {
            const currentDeclarations = rule.props.declarations || {};
            const newDeclarations = replace ? 
                { ...declarations } : 
                { ...currentDeclarations, ...declarations };
            
            // Create updated rule
            const updatedRule = rule.clone({
                declarations: newDeclarations
            });
            
            // Replace in the stylesheet
            newStylesheet.children[index] = updatedRule;
            
            // Update selector map
            if (updatedRule.type === 'rule' && updatedRule.props.selector) {
                this.selectorMap.set(updatedRule.props.selector, updatedRule);
            }
            
            // Apply state transition
            this.transitionTo(newStylesheet);
        }
        
        return this;
    }
    
    /**
     * Set a specific CSS property value for a rule
     * 
     * @param selector CSS selector
     * @param property CSS property name
     * @param value CSS property value
     * @returns This stylesheet for chaining
     */
    public setProperty(
        selector: string,
        property: string,
        value: string
    ): CSSVirtualStylesheet {
        // Find the rule
        const rule = this.getRule(selector);
        
        if (rule) {
            // Update existing rule
            return this.updateRule(selector, { [property]: value });
        } else {
            // Create new rule
            const newRule = this.createRule(selector, { [property]: value });
            return this.addRule(newRule);
        }
    }
    
    /**
     * Remove a specific CSS property from a rule
     * 
     * @param selector CSS selector
     * @param property CSS property name
     * @returns This stylesheet for chaining
     */
    public removeProperty(
        selector: string,
        property: string
    ): CSSVirtualStylesheet {
        // Find the rule
        const rule = this.getRule(selector);
        
        if (rule && rule.props.declarations) {
            // Clone declarations without the property
            const { [property]: removed, ...declarations } = rule.props.declarations;
            
            // Update rule with new declarations
            return this.updateRule(selector, declarations, true);
        }
        
        return this;
    }
    
    /**
     * Update a rule's selector
     * 
     * @param oldSelector Current selector
     * @param newSelector New selector
     * @returns This stylesheet for chaining
     */
    public updateSelector(
        oldSelector: string,
        newSelector: string
    ): CSSVirtualStylesheet {
        // Find the rule
        const rule = this.getRule(oldSelector);
        
        if (rule) {
            // Clone the current stylesheet
            const newStylesheet = this.stylesheet.clone();
            
            // Find the rule index
            const index = newStylesheet.children.findIndex(
                r => r.type === 'rule' && r.props.selector === oldSelector
            );
            
            if (index >= 0) {
                // Create updated rule
                const updatedRule = rule.clone({
                    selector: newSelector
                });
                
                // Replace in the stylesheet
                newStylesheet.children[index] = updatedRule;
                
                // Update selector map
                this.selectorMap.delete(oldSelector);
                this.selectorMap.set(newSelector, updatedRule);
                
                // Apply state transition
                this.transitionTo(newStylesheet);
            }
        }
        
        return this;
    }
    
    /**
     * Diff two stylesheets
     * 
     * @param oldStylesheet Previous stylesheet
     * @param newStylesheet New stylesheet
     * @returns Array of patches to apply
     */
    public diff(
        oldStylesheet: CSSVNode,
        newStylesheet: CSSVNode
    ): CSSPatch[] {
        // Check if we have a cached transition between these two state signatures
        const oldSignature = oldStylesheet.getStateSignature();
        const newSignature = newStylesheet.getStateSignature();
        
        if (
            this.options.enableStateMachineMinimization &&
            oldSignature && 
            newSignature
        ) {
            const transitionKey = `${oldSignature}=>${newSignature}`;
            
            // If we have cached patches for this transition, return them
            if (this.transitionPatches.has(transitionKey)) {
                if (this.options.debug) {
                    console.log(`Using cached transition patches for ${transitionKey}`);
                }
                return this.transitionPatches.get(transitionKey)!;
            }
        }
        
        const patches: CSSPatch[] = [];
        
        // If types don't match or are not stylesheets, replace entire stylesheet
        if (
            oldStylesheet.type !== newStylesheet.type ||
            oldStylesheet.type !== 'stylesheet'
        ) {
            patches.push({
                type: CSSPatchType.REPLACE_STYLESHEET,
                stylesheet: newStylesheet
            });
            
            // Cache the transition
            this.cacheTransition(oldSignature, newSignature, patches);
            
            return patches;
        }
        
        // Maps for more efficient lookups
        const oldRuleMap = new Map<string, { rule: CSSVNode, index: number }>();
        const newRuleMap = new Map<string, { rule: CSSVNode, index: number }>();
        
        // Build maps
        for (let i = 0; i < oldStylesheet.children.length; i++) {
            const rule = oldStylesheet.children[i];
            if (rule.type === 'rule' && rule.props.selector) {
                oldRuleMap.set(rule.props.selector, { rule, index: i });
            }
        }
        
        for (let i = 0; i < newStylesheet.children.length; i++) {
            const rule = newStylesheet.children[i];
            if (rule.type === 'rule' && rule.props.selector) {
                newRuleMap.set(rule.props.selector, { rule, index: i });
            }
        }
        
        // Find removed rules
        for (const [selector, { rule, index }] of oldRuleMap.entries()) {
            if (!newRuleMap.has(selector)) {
                patches.push({
                    type: CSSPatchType.REMOVE_RULE,
                    rule,
                    index
                });
            }
        }
        
        // Find added rules
        for (const [selector, { rule, index }] of newRuleMap.entries()) {
            if (!oldRuleMap.has(selector)) {
                patches.push({
                    type: CSSPatchType.ADD_RULE,
                    rule,
                    position: index
                });
            }
        }
        
        // Find updated rules (same selector, different declarations)
        for (const [selector, newRuleData] of newRuleMap.entries()) {
            const oldRuleData = oldRuleMap.get(selector);
            
            if (oldRuleData) {
                const oldRule = oldRuleData.rule;
                const newRule = newRuleData.rule;
                
                // Check if declarations are different
                const oldDecls = oldRule.props.declarations || {};
                const newDecls = newRule.props.declarations || {};
                
                const oldDeclKeys = Object.keys(oldDecls);
                const newDeclKeys = Object.keys(newDecls);
                
                // If declaration count differs, update the whole rule
                if (oldDeclKeys.length !== newDeclKeys.length) {
                    patches.push({
                        type: CSSPatchType.UPDATE_RULE,
                        rule: oldRule,
                        declarations: newDecls,
                        index: oldRuleData.index
                    });
                    continue;
                }
                
                // Check for changed declarations
                const changedDecls: Record<string, string> = {};
                let hasChanges = false;
                
                for (const key of newDeclKeys) {
                    if (!oldDecls[key] || oldDecls[key] !== newDecls[key]) {
                        changedDecls[key] = newDecls[key];
                        hasChanges = true;
                    }
                }
                
                // Find removed declarations
                for (const key of oldDeclKeys) {
                    if (!newDecls[key]) {
                        // Add null to mark for removal
                        changedDecls[key] = null as any;
                        hasChanges = true;
                    }
                }
                
                if (hasChanges) {
                    // Generate individual declaration patches
                    for (const [property, value] of Object.entries(changedDecls)) {
                        if (value === null) {
                            // Remove declaration
                            patches.push({
                                type: CSSPatchType.REMOVE_DECLARATION,
                                rule: oldRule,
                                property,
                                index: oldRuleData.index
                            });
                        } else if (oldDecls[property] === undefined) {
                            // Add declaration
                            patches.push({
                                type: CSSPatchType.ADD_DECLARATION,
                                rule: oldRule,
                                property,
                                value,
                                index: oldRuleData.index
                            });
                        } else {
                            // Update declaration
                            patches.push({
                                type: CSSPatchType.UPDATE_DECLARATION,
                                rule: oldRule,
                                property,
                                value,
                                index: oldRuleData.index
                            });
                        }
                    }
                }
            }
        }
        
        // Check rule order changes and generate move operations
        // TODO: Add move operations if needed
        
        // If no patches, add a NONE patch for caching
        if (patches.length === 0) {
            patches.push({ type: CSSPatchType.NONE });
        }
        
        // Cache the transition
        this.cacheTransition(oldSignature, newSignature, patches);
        
        return patches;
    }
    
    /**
     * Cache a transition for future reference
     * 
     * @param oldSignature Old state signature
     * @param newSignature New state signature
     * @param patches Array of patches
     */
    private cacheTransition(
        oldSignature: string,
        newSignature: string,
        patches: CSSPatch[]
    ): void {
        if (
            !this.options.enableStateMachineMinimization ||
            !oldSignature || 
            !newSignature ||
            patches.length === 0
        ) {
            return;
        }
        
        const transitionKey = `${oldSignature}=>${newSignature}`;
        this.transitionPatches.set(transitionKey, patches);
        
        // Update active transitions
        if (this.activeTransitions.has(oldSignature)) {
            this.activeTransitions.delete(oldSignature);
        }
        this.activeTransitions.add(newSignature);
    }
    
    /**
     * Apply a state transition to a new stylesheet
     * 
     * @param newStylesheet New stylesheet state
     */
    private transitionTo(newStylesheet: CSSVNode): void {
        // Increment transition counter
        this.transitionCounter++;
        
        // Get state signatures
        const oldSignature = this.stylesheet.getStateSignature();
        const newSignature = newStylesheet.getStateSignature();
        
        // Diff stylesheets
        const patches = this.diff(this.stylesheet, newStylesheet);
        
        // Apply patches
        this.applyPatches(patches);
        
        // Update stylesheet reference
        this.stylesheet = newStylesheet;
        
        // Optimize by minimizing if enabled
        if (this.options.enableStateMachineMinimization) {
            this.minimizeStates();
        }
    }
    
    /**
     * Apply CSS patches
     * 
     * @param patches Array of patches to apply
     */
    public applyPatches(patches: CSSPatch[]): void {
        // Set patching flag
        this.isPatching = true;
        
        // Apply each patch
        for (const patch of patches) {
            this.applyPatch(patch);
        }
        
        // Update the actual DOM style element if present
        this.updateDOMStyles();
        
        // Reset patching flag
        this.isPatching = false;
    }
    
    /**
     * Apply a single CSS patch
     * 
     * @param patch Patch to apply
     */
    private applyPatch(patch: CSSPatch): void {
        switch (patch.type) {
            case CSSPatchType.ADD_RULE:
                this.applyAddRulePatch(patch);
                break;
                
            case CSSPatchType.REMOVE_RULE:
                this.applyRemoveRulePatch(patch);
                break;
                
            case CSSPatchType.UPDATE_RULE:
                this.applyUpdateRulePatch(patch);
                break;
                
            case CSSPatchType.UPDATE_SELECTOR:
                this.applyUpdateSelectorPatch(patch);
                break;
                
            case CSSPatchType.ADD_DECLARATION:
                this.applyAddDeclarationPatch(patch);
                break;
                
            case CSSPatchType.REMOVE_DECLARATION:
                this.applyRemoveDeclarationPatch(patch);
                break;
                
            case CSSPatchType.UPDATE_DECLARATION:
                this.applyUpdateDeclarationPatch(patch);
                break;
                
            case CSSPatchType.REPLACE_STYLESHEET:
                this.applyReplaceStylesheetPatch(patch);
                break;
                
            case CSSPatchType.NONE:
                // No changes needed
                break;
        }
    }
    
    /**
     * Apply an add rule patch
     * 
     * @param patch Add rule patch
     */
    private applyAddRulePatch(patch: CSSAddRulePatch): void {
        const { rule, position } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Add the rule
        this.addRule(rule, position);
    }
    
    /**
     * Apply a remove rule patch
     * 
     * @param patch Remove rule patch
     */
    private applyRemoveRulePatch(patch: CSSRemoveRulePatch): void {
        const { rule, index } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Remove the rule
        if (rule.type === 'rule' && rule.props.selector) {
            this.removeRule(rule.props.selector);
        } else {
            this.removeRule(index);
        }
    }
    
    /**
     * Apply an update rule patch
     * 
     * @param patch Update rule patch
     */
    private applyUpdateRulePatch(patch: CSSUpdateRulePatch): void {
        const { rule, declarations, index } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Update the rule
        if (rule.type === 'rule' && rule.props.selector) {
            this.updateRule(rule.props.selector, declarations, true);
        } else {
            this.updateRule(index, declarations, true);
        }
    }
    
    /**
     * Apply an update selector patch
     * 
     * @param patch Update selector patch
     */
    private applyUpdateSelectorPatch(patch: CSSUpdateSelectorPatch): void {
        const { rule, selector } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Update the selector
        if (rule.type === 'rule' && rule.props.selector) {
            this.updateSelector(rule.props.selector, selector);
        }
    }
    
    /**
     * Apply an add declaration patch
     * 
     * @param patch Add declaration patch
     */
    private applyAddDeclarationPatch(patch: CSSAddDeclarationPatch): void {
        const { rule, property, value } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Add the declaration
        if (rule.type === 'rule' && rule.props.selector) {
            this.setProperty(rule.props.selector, property, value);
        }
    }
    
    /**
     * Apply a remove declaration patch
     * 
     * @param patch Remove declaration patch
     */
    private applyRemoveDeclarationPatch(patch: CSSRemoveDeclarationPatch): void {
        const { rule, property } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Remove the declaration
        if (rule.type === 'rule' && rule.props.selector) {
            this.removeProperty(rule.props.selector, property);
        }
    }
    
    /**
     * Apply an update declaration patch
     * 
     * @param patch Update declaration patch
     */
    private applyUpdateDeclarationPatch(patch: CSSUpdateDeclarationPatch): void {
        const { rule, property, value } = patch;
        
        // Don't apply directly during isPatching mode - this is handled by transitionTo()
        if (this.isPatching) {
            return;
        }
        
        // Update the declaration
        if (rule.type === 'rule' && rule.props.selector) {
            this.setProperty(rule.props.selector, property, value);
        }
    }
    
    /**
     * Apply a replace stylesheet patch
     * 
     * @param patch Replace stylesheet patch
     */
    private applyReplaceStylesheetPatch(patch: CSSReplaceStylesheetPatch): void {
        const { stylesheet } = patch;
        
        // Update stylesheet reference
        this.stylesheet = stylesheet;
        
        // Rebuild selector map
        this.rebuildSelectorMap();
        
        // Update DOM styles
        this.updateDOMStyles();
    }
    
    /**
     * Update DOM styles by regenerating the stylesheet text
     */
    private updateDOMStyles(): void {
        if (!this.styleElement) {
            return;
        }
        
        // Generate CSS text
        const css = this.stylesheet.toCSS();
        
        // Update style element
        this.styleElement.textContent = css;
    }
    
    /**
     * Render the stylesheet to a DOM style element
     * 
     * @param styleElement Style element to render to (creates one if omitted)
     * @returns The style element
     */
    public render(styleElement?: HTMLStyleElement): HTMLStyleElement {
        // Use provided element or create a new one
        this.styleElement = styleElement || document.createElement('style');
        
        // Generate CSS text
        const css = this.stylesheet.toCSS();
        
        // Update style element
        this.styleElement.textContent = css;
        
        // Add to document if not already added
        if (!this.styleElement.parentNode) {
            document.head.appendChild(this.styleElement);
        }
        
        return this.styleElement;
    }
    
    /**
     * Minimize states using Nnamdi Okpala's automaton state minimization algorithm
     */
    private minimizeStates(): void {
        // Skip if no transitions or minimization disabled
        if (
            !this.options.enableStateMachineMinimization ||
            this.activeTransitions.size < 2
        ) {
            return;
        }
        
        // Get an array of active transitions
        const transitions = Array.from(this.activeTransitions);
        
        // Build state equivalence classes
        // This is a simplified implementation of Hopcroft's algorithm
        
        // Start with two classes: empty states and non-empty states
        let partition: Set<string>[] = [
            new Set(transitions.filter(sig => this.getStateRuleCount(sig) === 0)),
            new Set(transitions.filter(sig => this.getStateRuleCount(sig) > 0))
        ];
        
        // Filter out empty sets
        partition = partition.filter(p => p.size > 0);
        
        // Iteratively refine partition until no more refinement is possible
        let changed = true;
        while (changed) {
            changed = false;
            
            // For each class in the partition
            for (let i = 0; i < partition.length; i++) {
                const currentClass = partition[i];
                
                // Try to split the class based on transitions
                const subclasses = this.splitStateClass(currentClass);
                
                // If we split the class, replace it with the new subclasses
                if (subclasses.length > 1) {
                    partition.splice(i, 1, ...subclasses);
                    changed = true;
                    break;
                }
            }
        }
        
        // Now we have the minimal state partition
        // For each class, pick a representative and map others to it
        for (const equivalenceClass of partition) {
            if (equivalenceClass.size <= 1) {
                continue;
            }
            
            // Pick the first state as representative
            const representative = Array.from(equivalenceClass)[0];
            
            // For each other state in this class
            for (const state of equivalenceClass) {
                if (state === representative) {
                    continue;
                }
                
                // Map all transitions from this state to the representative
                for (const [transitionKey, patches] of this.transitionPatches.entries()) {
                    const [fromState, toState] = transitionKey.split('=>');
                    
                    // If this is a transition from the current state
                    if (fromState === state) {
                        // Create a new transition key from the representative
                        const newTransitionKey = `${representative}=>${toState}`;
                        
                        // If we don't already have this transition, add it
                        if (!this.transitionPatches.has(newTransitionKey)) {
                            this.transitionPatches.set(newTransitionKey, patches);
                        }
                    }
                    
                    // If this is a transition to the current state
                    if (toState === state) {
                        // Create a new transition key to the representative
                        const newTransitionKey = `${fromState}=>${representative}`;
                        
                        // If we don't already have this transition, add it
                        if (!this.transitionPatches.has(newTransitionKey)) {
                            this.transitionPatches.set(newTransitionKey, patches);
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Get the number of rules in a state
     * 
     * @param stateSignature State signature
     * @returns Number of rules
     */
    private getStateRuleCount(stateSignature: string): number {
        // Parse the signature to extract rule count
        // This is a simplification - in a real implementation, we'd
        // maintain a map of signatures to rule counts
        const parts = stateSignature.split('_');
        const lastPart = parts[parts.length - 1];
        const childrenPart = lastPart.split('|')[3] || '';
        
        return childrenPart.split(',').filter(Boolean).length;
    }
    
    /**
     * Split a state class based on transition patterns
     * 
     * @param stateClass Set of state signatures
     * @returns Array of new subclasses
     */
    private splitStateClass(stateClass: Set<string>): Set<string>[] {
        // Map to collect states by transition patterns
        const subclasses = new Map<string, Set<string>>();
        
        // For each state in the class
        for (const state of stateClass) {
            // Compute a signature based on outgoing transitions
            const transitionSignature = this.getStateTransitionSignature(state);
            
            // Add to appropriate subclass
            if (!subclasses.has(transitionSignature)) {
                subclasses.set(transitionSignature, new Set<string>());
            }
            
            subclasses.get(transitionSignature)!.add(state);
        }
        
        // Convert map to array of sets
        return Array.from(subclasses.values());
    }
    
    /**
     * Get a signature for a state's transition pattern
     * 
     * @param stateSignature State signature
     * @returns Transition pattern signature
     */
    private getStateTransitionSignature(stateSignature: string): string {
        // Collect all transitions from this state
        const transitions: string[] = [];
        
        for (const transitionKey of this.transitionPatches.keys()) {
            const [fromState, toState] = transitionKey.split('=>');
            
            if (fromState === stateSignature && toState !== undefined) {
                transitions.push(toState);
            }
        }
        
        // Sort and join for consistent comparison
        return transitions.sort().join(',');
    }
    
    /**
     * Get the CSS text representation of the stylesheet
     * 
     * @returns CSS text
     */
    public toCSS(): string {
        return this.stylesheet.toCSS();
    }
    
    /**
     * Clear all cached data
     */
    public clearCache(): void {
        this.ruleCache.clear();
        this.transitionPatches.clear();
        this.activeTransitions.clear();
        this.transitionCounter = 0;
    }
    
    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Remove style element from DOM
        if (this.styleElement && this.styleElement.parentNode) {
            this.styleElement.parentNode.removeChild(this.styleElement);
        }
        
        // Clear caches
        this.clearCache();
        
        // Release references
        this.styleElement = null;
        this.selectorMap.clear();
    }
}