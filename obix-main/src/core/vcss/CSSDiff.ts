/**
 * CSSDiff.ts
 * 
 * CSS-specific diffing algorithm for the OBIX framework.
 * This module provides optimized CSS diffing using Nnamdi Okpala's 
 * automaton state minimization approach.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { MRUCache } from '../cache/MRUCache';
import { CSSPatch, CSSPatchType } from './VCSSirtualStylesheet';
import { VCSSNode } from './VCSSNode';

/**
 * CSS diff optimization options
 */
export interface CSSDiffOptions {
    /** Enable state machine minimization */
    enableStateMachineMinimization?: boolean;
    /** Enable transition caching for optimized diffs */
    enableTransitionCaching?: boolean;
    /** Enable CSS-specific optimizations */
    enableCSSOptimizations?: boolean;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Cache for transition diffs to avoid redundant computation
 */
const transitionDiffCache = new MRUCache<string, CSSPatch[]>({
    capacity: 300,
    trackTransitions: true,
    cleanupInterval: 300000 // 5 minutes
});

/**
 * Set of known state transition patterns
 * This is used for automaton state minimization
 */
const knownStateTransitions = new Set<string>();

/**
 * Map of transition patterns to their minimized equivalents
 * This implements Nnamdi Okpala's automaton state minimization
 */
const minimizedTransitionMap = new Map<string, string>();

/**
 * CSS-specific diffing function
 * 
 * @param oldStylesheet Previous CSS virtual node
 * @param newStylesheet New CSS virtual node
 * @param options Optimization options
 * @returns Array of patches to apply
 */
export function diffCSS(
    oldStylesheet: VCSSNode,
    newStylesheet: VCSSNode,
    options: CSSDiffOptions = {}
): CSSPatch[] {
    // Default options
    const diffOptions: Required<CSSDiffOptions> = {
        enableStateMachineMinimization: true,
        enableTransitionCaching: true,
        enableCSSOptimizations: true,
        debug: false,
        ...options
    };
    
    // Check for cached transition diff if both nodes have state signatures
    const oldSignature = oldStylesheet.getStateSignature();
    const newSignature = newStylesheet.getStateSignature();
    
    if (
        diffOptions.enableTransitionCaching &&
        oldSignature && 
        newSignature
    ) {
        const transitionKey = `${oldSignature}=>${newSignature}`;
        
        if (transitionDiffCache.has(transitionKey)) {
            if (diffOptions.debug) {
                console.log(`Using cached transition diff for ${transitionKey}`);
            }
            return transitionDiffCache.get(transitionKey)!;
        }
        
        // Check for known minimized transition if state minimization is enabled
        if (
            diffOptions.enableStateMachineMinimization &&
            knownStateTransitions.has(transitionKey)
        ) {
            // Get the minimized transition if available
            const minimizedTransition = minimizedTransitionMap.get(transitionKey);
            if (minimizedTransition && transitionDiffCache.has(minimizedTransition)) {
                if (diffOptions.debug) {
                    console.log(`Using minimized transition ${minimizedTransition} for ${transitionKey}`);
                }
                return transitionDiffCache.get(minimizedTransition)!;
            }
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
        cacheTransition(oldSignature, newSignature, patches, diffOptions);
        
        return patches;
    }
    
    // Apply CSS-specific optimizations
    if (diffOptions.enableCSSOptimizations) {
        // Check if stylesheets are identical
        if (oldStylesheet.equals(newStylesheet)) {
            patches.push({ type: CSSPatchType.NONE });
            
            // Cache the transition
            cacheTransition(oldSignature, newSignature, patches, diffOptions);
            
            return patches;
        }
        
        // Check if we can use selector-based optimizations
        const optimizedPatches = getOptimizedCSSPatches(oldStylesheet, newStylesheet);
        if (optimizedPatches) {
            // Cache the transition
            cacheTransition(oldSignature, newSignature, optimizedPatches, diffOptions);
            
            return optimizedPatches;
        }
    }
    
    // Maps for more efficient lookups
    const oldRuleMap = new Map<string, { rule: VCSSNode, index: number }>();
    const newRuleMap = new Map<string, { rule: VCSSNode, index: number }>();
    
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
    
    // If no patches, add a NONE patch for caching
    if (patches.length === 0) {
        patches.push({ type: CSSPatchType.NONE });
    }
    
    // Cache the transition
    cacheTransition(oldSignature, newSignature, patches, diffOptions);
    
    return patches;
}

/**
 * Cache a transition for future reference
 * 
 * @param oldSignature Old state signature
 * @param newSignature New state signature
 * @param patches Array of patches
 * @param options Diff options
 */
function cacheTransition(
    oldSignature: string,
    newSignature: string,
    patches: CSSPatch[],
    options: Required<CSSDiffOptions>
): void {
    if (
        !options.enableTransitionCaching ||
        !oldSignature || 
        !newSignature ||
        patches.length === 0
    ) {
        return;
    }
    
    const transitionKey = `${oldSignature}=>${newSignature}`;
    transitionDiffCache.set(transitionKey, patches, transitionKey);
    
    // Register as a known transition for state minimization
    if (options.enableStateMachineMinimization) {
        knownStateTransitions.add(transitionKey);
    }
}

/**
 * Get optimized patches for CSS-specific changes
 * 
 * @param oldStylesheet Previous stylesheet
 * @param newStylesheet New stylesheet
 * @returns Optimized patches or null if standard diffing should be used
 */
function getOptimizedCSSPatches(
    oldStylesheet: VCSSNode,
    newStylesheet: VCSSNode
): CSSPatch[] | null {
    // Check if we're only changing a single rule
    if (
        oldStylesheet.children.length === newStylesheet.children.length &&
        oldStylesheet.children.length > 0
    ) {
        // Find the single rule that's different
        let differentRuleIndex = -1;
        let differentCount = 0;
        
        for (let i = 0; i < oldStylesheet.children.length; i++) {
            if (!oldStylesheet.children[i].equals(newStylesheet.children[i])) {
                differentRuleIndex = i;
                differentCount++;
            }
        }
        
        // If exactly one rule is different, create an optimized patch
        if (differentCount === 1 && differentRuleIndex >= 0) {
            const oldRule = oldStylesheet.children[differentRuleIndex];
            const newRule = newStylesheet.children[differentRuleIndex];
            
            // Check if rule types match
            if (oldRule.type !== newRule.type) {
                return null;
            }
            
            // Handle rule changes
            if (oldRule.type === 'rule') {
                const oldSelector = oldRule.props.selector;
                const newSelector = newRule.props.selector;
                
                // If selectors different, update selector
                if (oldSelector !== newSelector) {
                    return [
                        {
                            type: CSSPatchType.UPDATE_SELECTOR,
                            rule: oldRule,
                            selector: newSelector || '',
                            index: differentRuleIndex
                        }
                    ];
                }
                
                // Check declarations
                const oldDecls = oldRule.props.declarations || {};
                const newDecls = newRule.props.declarations || {};
                
                // Just update the whole rule if it's more efficient
                return [
                    {
                        type: CSSPatchType.UPDATE_RULE,
                        rule: oldRule,
                        declarations: newDecls,
                        index: differentRuleIndex
                    }
                ];
            }
            
            // At-rule changes aren't currently optimized
            return null;
        }
    }
    
    // Check if we're only adding a single rule at the end
    if (
        newStylesheet.children.length === oldStylesheet.children.length + 1 &&
        oldStylesheet.children.every((rule, i) => 
            rule.equals(newStylesheet.children[i])
        )
    ) {
        const newRule = newStylesheet.children[newStylesheet.children.length - 1];
        
        return [
            {
                type: CSSPatchType.ADD_RULE,
                rule: newRule,
                position: newStylesheet.children.length - 1
            }
        ];
    }
    
    // No optimization available
    return null;
}

/**
 * Apply automaton state minimization to a set of known transitions
 * This is the core implementation of Nnamdi Okpala's algorithm
 * 
 * @param options Minimization options
 */
export function minimizeStateTransitions(
    options: { debug?: boolean } = {}
): void {
    if (knownStateTransitions.size < 2) {
        // Not enough transitions to minimize
        return;
    }
    
    // Build transition matrix
    const transitions = Array.from(knownStateTransitions);
    const transitionStates = new Set<string>();
    
    // Collect all states
    for (const transition of transitions) {
        const [fromState, toState] = transition.split('=>');
        transitionStates.add(fromState);
        transitionStates.add(toState);
    }
    
    const states = Array.from(transitionStates);
    const stateIndices = new Map<string, number>();
    
    // Build state indices for faster lookups
    states.forEach((state, index) => {
        stateIndices.set(state, index);
    });
    
    // Build adjacency matrix for state transitions
    const adjacencyMatrix: boolean[][] = Array(states.length)
        .fill(false)
        .map(() => Array(states.length).fill(false));
    
    // Fill adjacency matrix
    for (const transition of transitions) {
        const [fromState, toState] = transition.split('=>');
        const fromIndex = stateIndices.get(fromState)!;
        const toIndex = stateIndices.get(toState)!;
        
        adjacencyMatrix[fromIndex][toIndex] = true;
    }
    
    // Find equivalent states (states with same transition patterns)
    const equivalenceClasses: number[][] = [];
    const stateToClass = new Map<number, number>();
    
    // Initialize with all states in separate classes
    for (let i = 0; i < states.length; i++) {
        equivalenceClasses.push([i]);
        stateToClass.set(i, i);
    }
    
    // Iteratively refine equivalence classes
    let changed = true;
    while (changed) {
        changed = false;
        
        const newEquivalenceClasses: number[][] = [];
        const newStateToClass = new Map<number, number>();
        
        for (const eqClass of equivalenceClasses) {
            const subclasses = new Map<string, number[]>();
            
            for (const stateIdx of eqClass) {
                // Build signature based on transitions to other classes
                const signature: string[] = [];
                
                for (let toIdx = 0; toIdx < states.length; toIdx++) {
                    if (adjacencyMatrix[stateIdx][toIdx]) {
                        const toClass = stateToClass.get(toIdx)!;
                        signature.push(`${toClass}`);
                    }
                }
                
                const key = signature.sort().join(',');
                
                if (!subclasses.has(key)) {
                    subclasses.set(key, []);
                }
                
                subclasses.get(key)!.push(stateIdx);
            }
            
            // If we found more than one subclass, we need to refine
            if (subclasses.size > 1) {
                changed = true;
                
                // Add each subclass as a new equivalence class
                for (const subclass of subclasses.values()) {
                    const classIdx = newEquivalenceClasses.length;
                    newEquivalenceClasses.push(subclass);
                    
                    for (const stateIdx of subclass) {
                        newStateToClass.set(stateIdx, classIdx);
                    }
                }
            } else {
                // Keep the original class
                const classIdx = newEquivalenceClasses.length;
                newEquivalenceClasses.push(eqClass);
                
                for (const stateIdx of eqClass) {
                    newStateToClass.set(stateIdx, classIdx);
                }
            }
        }
        
        // Update equivalence classes
        equivalenceClasses.length = 0;
        equivalenceClasses.push(...newEquivalenceClasses);
        
        // Update state to class mapping
        stateToClass.clear();
        for (const [stateIdx, classIdx] of newStateToClass.entries()) {
            stateToClass.set(stateIdx, classIdx);
        }
    }
    
    if (options.debug) {
        console.log(`Found ${equivalenceClasses.length} equivalence classes for ${states.length} states`);
    }
    
    // Create minimized transition map
    for (const transition of transitions) {
        const [fromState, toState] = transition.split('=>');
        const fromIdx = stateIndices.get(fromState)!;
        const toIdx = stateIndices.get(toState)!;
        
        const fromClassIdx = stateToClass.get(fromIdx)!;
        const toClassIdx = stateToClass.get(toIdx)!;
        
        // Create representative states for each class
        const fromClassStates = equivalenceClasses[fromClassIdx];
        const toClassStates = equivalenceClasses[toClassIdx];
        
        if (fromClassStates.length > 1 || toClassStates.length > 1) {
            // This transition can be minimized
            const representativeFromState = states[fromClassStates[0]];
            const representativeToState = states[toClassStates[0]];
            
            const representativeTransition = `${representativeFromState}=>${representativeToState}`;
            
            // Map the original transition to the representative one
            if (transitionDiffCache.has(representativeTransition)) {
                minimizedTransitionMap.set(transition, representativeTransition);
                
                if (options.debug) {
                    console.log(`Minimized transition ${transition} -> ${representativeTransition}`);
                }
            }
        }
    }
}

/**
 * Get the current state machine information for debugging
 * 
 * @returns State machine statistics
 */
export function getStateMachineInfo(): {
    transitionCount: number;
    cachedTransitionCount: number;
    minimizedTransitionCount: number;
    activeMinimizationMapping: Record<string, string>;
    cacheStats: any;
} {
    return {
        transitionCount: knownStateTransitions.size,
        cachedTransitionCount: transitionDiffCache.size(),
        minimizedTransitionCount: minimizedTransitionMap.size,
        activeMinimizationMapping: Object.fromEntries(minimizedTransitionMap),
        cacheStats: transitionDiffCache.getStats()
    };
}

/**
 * Clear the diff cache and state transition information
 */
export function clearCSSDiffCache(): void {
    transitionDiffCache.clear();
    knownStateTransitions.clear();
    minimizedTransitionMap.clear();
}