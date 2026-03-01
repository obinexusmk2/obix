/**
 * VHTMLDiff.ts
 * 
 * HTML-specific diffing algorithm for the OBIX framework.
 * This module provides optimized HTML diffing using Nnamdi Okpala's 
 * automaton state minimization approach.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { Patch, PatchType, VNodeType, VirtualNode } from '../vdom/VirtualDOM';
import { VHTMLNode } from './VHTMLNode';
import { MRUCache } from '../cache/MRUCache';

/**
 * HTML diff optimization options
 */
export interface VHTMLDiffOptions {
    /** Enable state machine minimization */
    enableStateMachineMinimization?: boolean;
    /** Enable transition caching for optimized diffs */
    enableTransitionCaching?: boolean;
    /** Enable HTML-specific optimizations */
    enableHTMLOptimizations?: boolean;
    /** Debug mode */
    debug?: boolean;
}

/**
 * Cache for transition diffs to avoid redundant computation
 */
const transitionDiffCache = new MRUCache<string, Patch[]>({
    capacity: 500,
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
 * HTML-specific diffing function
 * 
 * @param oldNode Previous HTML virtual node
 * @param newNode New HTML virtual node
 * @param options Optimization options
 * @returns Array of patches to apply
 */
export function diffHTML(
    oldNode: VHTMLNode | VirtualNode,
    newNode: VHTMLNode | VirtualNode,
    options: VHTMLDiffOptions = {}
): Patch[] {
    // Default options
    const diffOptions: Required<VHTMLDiffOptions> = {
        enableStateMachineMinimization: true,
        enableTransitionCaching: true,
        enableHTMLOptimizations: true,
        debug: false,
        ...options
    };
    
    // Check for cached transition diff if both nodes have state signatures
    if (
        diffOptions.enableTransitionCaching &&
        oldNode.stateSignature && 
        newNode.stateSignature
    ) {
        const transitionKey = `${oldNode.stateSignature}=>${newNode.stateSignature}`;
        
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
    
    // Apply HTML-specific optimizations
    if (diffOptions.enableHTMLOptimizations) {
        // Skip diffing for certain scenarios
        const skipDiff = shouldSkipHTMLDiff(oldNode, newNode);
        if (skipDiff) {
            return [{
                type: PatchType.REPLACE,
                vNode: oldNode,
                domNode: oldNode.domNode,
                newVNode: newNode
            }];
        }
        
        // Apply attribute-specific optimizations
        if (
            oldNode.type === VNodeType.ELEMENT && 
            newNode.type === VNodeType.ELEMENT &&
            oldNode.tagName === newNode.tagName
        ) {
            // Check if we're only updating className - this is a common pattern in UI frameworks
            const patches = getOptimizedHTMLPatches(oldNode as VHTMLNode, newNode as VHTMLNode);
            if (patches) {
                // Cache the transition if both nodes have state signatures
                if (
                    diffOptions.enableTransitionCaching &&
                    oldNode.stateSignature && 
                    newNode.stateSignature
                ) {
                    const transitionKey = `${oldNode.stateSignature}=>${newNode.stateSignature}`;
                    transitionDiffCache.set(transitionKey, patches, transitionKey);
                    
                    // Register as a known transition for state minimization
                    if (diffOptions.enableStateMachineMinimization) {
                        knownStateTransitions.add(transitionKey);
                    }
                }
                
                return patches;
            }
        }
    }
    
    // Apply standard diff algorithm
    const patches = diffHTMLNodes(oldNode, newNode);
    
    // Cache the result if transition caching is enabled
    if (
        diffOptions.enableTransitionCaching &&
        oldNode.stateSignature && 
        newNode.stateSignature &&
        patches.length > 0
    ) {
        const transitionKey = `${oldNode.stateSignature}=>${newNode.stateSignature}`;
        transitionDiffCache.set(transitionKey, patches, transitionKey);
        
        // Register as a known transition for state minimization
        if (diffOptions.enableStateMachineMinimization) {
            knownStateTransitions.add(transitionKey);
        }
    }
    
    return patches;
}

/**
 * Check if we should skip the HTML diff and just replace the node
 * 
 * @param oldNode Previous node
 * @param newNode New node
 * @returns True if we should skip diffing
 */
function shouldSkipHTMLDiff(oldNode: VirtualNode, newNode: VirtualNode): boolean {
    // Different node types
    if (oldNode.type !== newNode.type) {
        return true;
    }
    
    // Different tag names for element nodes
    if (
        oldNode.type === VNodeType.ELEMENT && 
        newNode.type === VNodeType.ELEMENT &&
        oldNode.tagName !== newNode.tagName
    ) {
        return true;
    }
    
    // skipDiff flag is set on new node
    if (
        newNode.type === VNodeType.ELEMENT && 
        (newNode as any).skipDiff === true
    ) {
        return true;
    }
    
    // Void elements with content changes
    if (
        oldNode.type === VNodeType.ELEMENT && 
        (oldNode as any).isVoid === true &&
        newNode.type === VNodeType.ELEMENT
    ) {
        const oldHTML = oldNode as VHTMLNode;
        const newHTML = newNode as VHTMLNode;
        
        // Check for changes in critical attributes for void elements
        if (oldHTML.props.src !== newHTML.props.src ||
            oldHTML.props.href !== newHTML.props.href ||
            oldHTML.props.value !== newHTML.props.value) {
            return true;
        }
    }
    
    // Check for dangerouslySetInnerHTML changes
    if (
        oldNode.type === VNodeType.ELEMENT && 
        newNode.type === VNodeType.ELEMENT
    ) {
        const oldHTML = oldNode as VHTMLNode;
        const newHTML = newNode as VHTMLNode;
        
        if (
            (oldHTML.props.dangerouslySetInnerHTML?.['__html'] !== 
            newHTML.props.dangerouslySetInnerHTML?.['__html']) &&
            (oldHTML.props.dangerouslySetInnerHTML || newHTML.props.dangerouslySetInnerHTML)
        ) {
            return true;
        }
    }
    
    return false;
}

/**
 * Get optimized patches for HTML-specific changes
 * 
 * @param oldNode Previous HTML node
 * @param newNode New HTML node
 * @returns Optimized patches or null if standard diffing should be used
 */
function getOptimizedHTMLPatches(oldNode: VHTMLNode, newNode: VHTMLNode): Patch[] | null {
    const patches: Patch[] = [];
    
    // Check if only className is changing (common UI framework pattern)
    if (
        oldNode.props.className !== newNode.props.className &&
        Object.keys(oldNode.props).length === Object.keys(newNode.props).length &&
        Object.keys(oldNode.props).every(key => 
            key === 'className' ? true : oldNode.props[key] === newNode.props[key]
        )
    ) {
        // Only className is changing
        patches.push({
            type: PatchType.PROPS,
            vNode: oldNode,
            domNode: oldNode.domNode,
            props: { className: newNode.props.className },
            removedProps: []
        });
        
        return patches;
    }
    
    // Check if only style is changing (another common pattern)
    if (
        typeof oldNode.props.style === 'object' &&
        typeof newNode.props.style === 'object' &&
        Object.keys(oldNode.props).length === Object.keys(newNode.props).length &&
        Object.keys(oldNode.props).every(key => 
            key === 'style' ? true : oldNode.props[key] === newNode.props[key]
        )
    ) {
        // Only style is changing
        patches.push({
            type: PatchType.PROPS,
            vNode: oldNode,
            domNode: oldNode.domNode,
            props: { style: newNode.props.style },
            removedProps: []
        });
        
        return patches;
    }
    
    // Check if only a single data attribute is changing
    const changedProps: Record<string, any> = {};
    const removedProps: string[] = [];
    
    const oldKeys = Object.keys(oldNode.props);
    const newKeys = Object.keys(newNode.props);
    
    // Check for added or changed properties
    for (const key of newKeys) {
        if (!(key in oldNode.props) || oldNode.props[key] !== newNode.props[key]) {
            changedProps[key] = newNode.props[key];
        }
    }
    
    // Check for removed properties
    for (const key of oldKeys) {
        if (!(key in newNode.props)) {
            removedProps.push(key);
        }
    }
    
    // If we're only changing a few properties and children are the same,
    // we can optimize to just a single props patch
    if (
        (Object.keys(changedProps).length <= 3 || removedProps.length <= 3) && 
        areSameChildren(oldNode.children, newNode.children)
    ) {
        patches.push({
            type: PatchType.PROPS,
            vNode: oldNode,
            domNode: oldNode.domNode,
            props: changedProps,
            removedProps
        });
        
        return patches;
    }
    
    // No optimization available, use standard diffing
    return null;
}

/**
 * Check if two arrays of child nodes are the same
 * 
 * @param oldChildren Old children array
 * @param newChildren New children array
 * @returns True if the children are the same
 */
function areSameChildren(oldChildren: VirtualNode[], newChildren: VirtualNode[]): boolean {
    if (oldChildren.length !== newChildren.length) {
        return false;
    }
    
    for (let i = 0; i < oldChildren.length; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];
        
        if (oldChild.type !== newChild.type) {
            return false;
        }
        
        if (oldChild.type === VNodeType.TEXT && newChild.type === VNodeType.TEXT) {
            if (oldChild.text !== newChild.text) {
                return false;
            }
        } else if (oldChild.type === VNodeType.ELEMENT && newChild.type === VNodeType.ELEMENT) {
            if (oldChild.tagName !== newChild.tagName) {
                return false;
            }
        } else {
            // Different types or unsupported comparison
            return false;
        }
    }
    
    return true;
}

/**
 * Diff two HTML nodes
 * 
 * @param oldNode Previous node
 * @param newNode New node
 * @returns Array of patches
 */
function diffHTMLNodes(oldNode: VirtualNode, newNode: VirtualNode): Patch[] {
    const patches: Patch[] = [];
    
    // Different node types - complete replacement
    if (oldNode.type !== newNode.type) {
        patches.push({
            type: PatchType.REPLACE,
            vNode: oldNode,
            domNode: oldNode.domNode,
            newVNode: newNode
        });
        return patches;
    }
    
    // Handle each node type
    switch (oldNode.type) {
        case VNodeType.ELEMENT:
            return diffHTMLElementNodes(oldNode, newNode);
        case VNodeType.TEXT:
            return diffHTMLTextNodes(oldNode, newNode);
        case VNodeType.COMMENT:
            return diffHTMLCommentNodes(oldNode, newNode);
        case VNodeType.FRAGMENT:
            return diffHTMLFragmentNodes(oldNode, newNode);
        case VNodeType.COMPONENT:
            return diffHTMLComponentNodes(oldNode, newNode);
        default:
            return patches;
    }
}

/**
 * Diff two HTML element nodes
 * 
 * @param oldNode Previous element node
 * @param newNode New element node
 * @returns Array of patches
 */
function diffHTMLElementNodes(oldNode: VirtualNode, newNode: VirtualNode): Patch[] {
    const patches: Patch[] = [];
    
    // Different tag names - complete replacement
    if (oldNode.tagName !== newNode.tagName) {
        patches.push({
            type: PatchType.REPLACE,
            vNode: oldNode,
            domNode: oldNode.domNode,
            newVNode: newNode
        });
        return patches;
    }
    
    // Handle HTML-specific attributes
    if (oldNode.type === VNodeType.ELEMENT && newNode.type === VNodeType.ELEMENT) {
        const oldHTML = oldNode as VHTMLNode;
        const newHTML = newNode as VHTMLNode;
        
        // Diff props
        const propPatches = diffHTMLProps(oldHTML.props, newHTML.props);
        if (propPatches.changes.length > 0 || propPatches.removals.length > 0) {
            const propsToUpdate: Record<string, any> = {};
            for (const change of propPatches.changes) {
                propsToUpdate[change.key] = change.value;
            }
            
            patches.push({
                type: PatchType.PROPS,
                vNode: oldHTML,
                domNode: oldHTML.domNode,
                props: propsToUpdate,
                removedProps: propPatches.removals
            });
        }
        
        // Diff children if not a void element
        if (!oldHTML.isVoid) {
            diffHTMLChildren(oldHTML, newHTML, patches);
        }
    }
    
    return patches;
}

/**
 * Diff HTML props and attributes
 * 
 * @param oldProps Old props
 * @param newProps New props
 * @returns Changes and removals
 */
function diffHTMLProps(oldProps: Record<string, any>, newProps: Record<string, any>): {
    changes: Array<{ key: string, value: any }>;
    removals: string[];
} {
    const changes: Array<{ key: string, value: any }> = [];
    const removals: string[] = [];
    
    // Check for changed properties
    for (const [key, value] of Object.entries(newProps)) {
        // Special handling for style objects
        if (key === 'style' && typeof value === 'object' && typeof oldProps[key] === 'object') {
            const oldStyle = oldProps[key];
            const newStyle = value;
            
            // Deep compare style objects
            let styleChanged = false;
            const combinedStyleKeys = new Set([
                ...Object.keys(oldStyle || {}),
                ...Object.keys(newStyle || {})
            ]);
            
            for (const styleKey of combinedStyleKeys) {
                if (oldStyle[styleKey] !== newStyle[styleKey]) {
                    styleChanged = true;
                    break;
                }
            }
            
            if (styleChanged) {
                changes.push({ key, value });
            }
        }
        // Special handling for event handlers (by reference comparison)
        else if (key.startsWith('on') && typeof value === 'function') {
            // We always update event handlers to ensure the latest function is used
            changes.push({ key, value });
        }
        // Standard property comparison
        else if (oldProps[key] !== value) {
            changes.push({ key, value });
        }
    }
    
    // Check for removed properties
    for (const key of Object.keys(oldProps)) {
        if (!(key in newProps)) {
            removals.push(key);
        }
    }
    
    return { changes, removals };
}

/**
 * Diff HTML children using keyed or non-keyed reconciliation
 * 
 * @param oldNode Old parent node
 * @param newNode New parent node
 * @param patches Array to append patches to
 */
function diffHTMLChildren(
  oldNode: VHTMLNode,
  newNode: VHTMLNode,
  patches: Patch[]
): void {
  const oldChildren = oldNode.children;
  const newChildren = newNode.children;
  
  // Simple case: no children in both old and new
  if (oldChildren.length === 0 && newChildren.length === 0) {
      return;
  }
  
  // Case: new children, but no old children (append all)
  if (oldChildren.length === 0) {
      for (const child of newChildren) {
          patches.push({
              type: PatchType.APPEND,
              vNode: oldNode,
              domNode: oldNode.domNode,
              child
          });
      }
      return;
  }
  
  // Case: old children, but no new children (remove all)
  if (newChildren.length === 0) {
      for (const child of oldChildren) {
          patches.push({
              type: PatchType.REMOVE_CHILD,
              vNode: oldNode,
              domNode: oldNode.domNode,
              child,
              index: oldChildren.indexOf(child)
          });
      }
      return;
  }
  
  // Check if we can use key-based reconciliation
  if (hasHTMLKeys(oldChildren) && hasHTMLKeys(newChildren)) {
      diffHTMLKeyedChildren(oldNode, newNode, oldChildren, newChildren, patches);
  } else {
      diffHTMLNonKeyedChildren(oldNode, newNode, oldChildren, newChildren, patches);
  }
}

/**
* Check if all children have keys
* 
* @param children Array of children
* @returns True if all elements/fragments/components have keys
*/
function hasHTMLKeys(children: VirtualNode[]): boolean {
  return children.every(child => {
      if (child.type === VNodeType.ELEMENT) {
          return (child as any).key != null;
      } else if (child.type === VNodeType.FRAGMENT) {
          return (child as any).key != null;
      } else if (child.type === VNodeType.COMPONENT) {
          return (child as any).key != null;
      }
      return false;
  });
}

/**
* Diff keyed HTML children (more efficient)
* 
* @param oldNode Old parent node
* @param newNode New parent node
* @param oldChildren Old children array
* @param newChildren New children array
* @param patches Array to append patches to
*/
function diffHTMLKeyedChildren(
  oldNode: VHTMLNode,
  newNode: VHTMLNode,
  oldChildren: VirtualNode[],
  newChildren: VirtualNode[],
  patches: Patch[]
): void {
  // Create maps for faster lookups
  const oldKeyMap = new Map<string | number, { node: VirtualNode, index: number }>();
  const newKeyMap = new Map<string | number, { node: VirtualNode, index: number }>();
  
  // Build old map
  for (let i = 0; i < oldChildren.length; i++) {
      const child = oldChildren[i];
      const key = getNodeKey(child);
      if (key !== null) {
          oldKeyMap.set(key, { node: child, index: i });
      }
  }
  
  // Build new map
  for (let i = 0; i < newChildren.length; i++) {
      const child = newChildren[i];
      const key = getNodeKey(child);
      if (key !== null) {
          newKeyMap.set(key, { node: child, index: i });
      }
  }
  
  // Track processed old keys
  const processedKeys = new Set<string | number>();
  
  // Track the last position where a node was found
  let lastIndex = 0;
  
  // Process the new children
  for (let i = 0; i < newChildren.length; i++) {
      const newChild = newChildren[i];
      const key = getNodeKey(newChild);
      
      // Skip nodes without keys
      if (key === null) {
          continue;
      }
      
      // Find in old map
      const oldData = oldKeyMap.get(key);
      
      if (oldData) {
          // Node exists in both trees
          const oldChild = oldData.node;
          const oldIndex = oldData.index;
          
          // Mark as processed
          processedKeys.add(key);
          
          // Diff the nodes recursively to update properties
          const childPatches = diffHTMLNodes(oldChild, newChild);
          patches.push(...childPatches);
          
          // Check if we need to move the node
          if (oldIndex < lastIndex) {
              // Node needs to be moved forward
              patches.push({
                  type: PatchType.MOVE,
                  vNode: oldNode,
                  domNode: oldNode.domNode,
                  child: oldChild,
                  fromIndex: oldIndex,
                  toIndex: i
              });
          } else {
              // Node stays in place, update lastIndex
              lastIndex = oldIndex;
          }
      } else {
          // New node, needs to be inserted
          patches.push({
              type: PatchType.INSERT,
              vNode: oldNode,
              domNode: oldNode.domNode,
              child: newChild,
              index: i
          });
      }
  }
  
  // Remove old nodes that weren't processed
  for (const [key, data] of oldKeyMap.entries()) {
      if (!processedKeys.has(key)) {
          patches.push({
              type: PatchType.REMOVE_CHILD,
              vNode: oldNode,
              domNode: oldNode.domNode,
              child: data.node,
              index: data.index
          });
      }
  }
}

/**
* Diff non-keyed HTML children (fallback)
* 
* @param oldNode Old parent node
* @param newNode New parent node
* @param oldChildren Old children array
* @param newChildren New children array
* @param patches Array to append patches to
*/
function diffHTMLNonKeyedChildren(
  oldNode: VHTMLNode,
  newNode: VHTMLNode,
  oldChildren: VirtualNode[],
  newChildren: VirtualNode[],
  patches: Patch[]
): void {
  // Use the LCS algorithm to minimize DOM operations
  const operations = getLCSOperations(oldChildren, newChildren);
  
  // Apply operations
  for (const op of operations) {
      switch (op.type) {
          case 'keep':
              // Update existing node
              if (op.oldIndex !== undefined && op.newIndex !== undefined) {
                  const oldChild = oldChildren[op.oldIndex];
                  const newChild = newChildren[op.newIndex];
                  
                  // Recursively diff the nodes
                  const childPatches = diffHTMLNodes(oldChild, newChild);
                  patches.push(...childPatches);
              }
              break;
              
          case 'insert':
              // Insert new node
              if (op.newIndex !== undefined) {
                  patches.push({
                      type: PatchType.INSERT,
                      vNode: oldNode,
                      domNode: oldNode.domNode,
                      child: newChildren[op.newIndex],
                      index: op.newIndex
                  });
              }
              break;
              
          case 'remove':
              // Remove old node
              if (op.oldIndex !== undefined) {
                  patches.push({
                      type: PatchType.REMOVE_CHILD,
                      vNode: oldNode,
                      domNode: oldNode.domNode,
                      child: oldChildren[op.oldIndex],
                      index: op.oldIndex
                  });
              }
              break;
      }
  }
}

/**
* Get operations from Longest Common Subsequence algorithm
* 
* @param oldNodes Old array of nodes
* @param newNodes New array of nodes
* @returns Array of operations (keep, insert, remove)
*/
function getLCSOperations(
  oldNodes: VirtualNode[],
  newNodes: VirtualNode[]
): Array<{
  type: 'keep' | 'insert' | 'remove';
  oldIndex?: number;
  newIndex?: number;
}> {
  // Compute the LCS matrix
  const matrix = buildLCSMatrix(oldNodes, newNodes);
  
  // Backtrack to get operations
  const operations: Array<{
      type: 'keep' | 'insert' | 'remove';
      oldIndex?: number;
      newIndex?: number;
  }> = [];
  
  let i = oldNodes.length;
  let j = newNodes.length;
  
  while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && areNodesEqual(oldNodes[i-1], newNodes[j-1])) {
          // Nodes match, keep and update
          operations.unshift({
              type: 'keep',
              oldIndex: i - 1,
              newIndex: j - 1
          });
          i--;
          j--;
      } else if (j > 0 && (i === 0 || matrix[i][j-1] >= matrix[i-1][j])) {
          // Insert node
          operations.unshift({
              type: 'insert',
              newIndex: j - 1
          });
          j--;
      } else if (i > 0) {
          // Remove node
          operations.unshift({
              type: 'remove',
              oldIndex: i - 1
          });
          i--;
      }
  }
  
  return operations;
}

/**
* Build LCS matrix for two arrays of nodes
* 
* @param oldNodes First array of nodes
* @param newNodes Second array of nodes
* @returns LCS matrix
*/
function buildLCSMatrix(oldNodes: VirtualNode[], newNodes: VirtualNode[]): number[][] {
  const matrix: number[][] = Array(oldNodes.length + 1)
      .fill(0)
      .map(() => Array(newNodes.length + 1).fill(0));
  
  for (let i = 1; i <= oldNodes.length; i++) {
      for (let j = 1; j <= newNodes.length; j++) {
          if (areNodesEqual(oldNodes[i-1], newNodes[j-1])) {
              matrix[i][j] = matrix[i-1][j-1] + 1;
          } else {
              matrix[i][j] = Math.max(matrix[i-1][j], matrix[i][j-1]);
          }
      }
  }
  
  return matrix;
}

/**
* Diff two HTML text nodes
* 
* @param oldNode Previous text node
* @param newNode New text node
* @returns Array of patches
*/
function diffHTMLTextNodes(oldNode: VirtualNode, newNode: VirtualNode): Patch[] {
  const patches: Patch[] = [];
  
  // Text nodes only differ in their text content
  if (oldNode.text !== newNode.text) {
      patches.push({
          type: PatchType.TEXT,
          vNode: oldNode,
          domNode: oldNode.domNode,
          text: newNode.text
      });
  }
  
  return patches;
}

/**
* Diff two HTML comment nodes
* 
* @param oldNode Previous comment node
* @param newNode New comment node
* @returns Array of patches
*/
function diffHTMLCommentNodes(oldNode: VirtualNode, newNode: VirtualNode): Patch[] {
  const patches: Patch[] = [];
  
  // Comment nodes only differ in their text content
  if (oldNode.text !== newNode.text) {
      patches.push({
          type: PatchType.TEXT,
          vNode: oldNode,
          domNode: oldNode.domNode,
          text: newNode.text
      });
  }
  
  return patches;
}

/**
* Diff two HTML fragment nodes
* 
* @param oldNode Previous fragment node
* @param newNode New fragment node
* @returns Array of patches
*/
function diffHTMLFragmentNodes(oldNode: VirtualNode, newNode: VirtualNode): Patch[] {
  const patches: Patch[] = [];
  
  // For fragments, we only need to diff children
  if (oldNode.type === VNodeType.FRAGMENT && newNode.type === VNodeType.FRAGMENT) {
      diffHTMLChildren(oldNode as any, newNode as any, patches);
  }
  
  return patches;
}

/**
* Diff two HTML component nodes
* 
* @param oldNode Previous component node
* @param newNode New component node
* @returns Array of patches
*/
function diffHTMLComponentNodes(oldNode: VirtualNode, newNode: VirtualNode): Patch[] {
  const patches: Patch[] = [];
  
  // Different component types - replace entirely
  if (
      oldNode.type === VNodeType.COMPONENT && 
      newNode.type === VNodeType.COMPONENT
  ) {
      const oldComponent = oldNode.component;
      const newComponent = newNode.component;
      
      if (
          (typeof oldComponent !== typeof newComponent) ||
          (typeof oldComponent === 'string' && oldComponent !== newComponent) ||
          (typeof oldComponent === 'function' && typeof newComponent === 'function' && 
           oldComponent.name !== newComponent.name)
      ) {
          patches.push({
              type: PatchType.REPLACE,
              vNode: oldNode,
              domNode: oldNode.domNode,
              newVNode: newNode
          });
          return patches;
      }
      
      // Same component type, different props - update component
      const oldProps = oldNode.props || {};
      const newProps = newNode.props || {};
      
      // Check if props have changed
      const propsChanged = !shallowEqual(oldProps, newProps);
      
      // Check if state has changed
      const oldState = oldNode.state;
      const newState = newNode.state;
      const stateChanged = newState && (!oldState || !shallowEqual(oldState, newState));
      
      if (propsChanged || stateChanged) {
          patches.push({
              type: PatchType.COMPONENT,
              vNode: oldNode,
              domNode: oldNode.domNode,
              props: newProps,
              state: newState
          });
      }
      
      // Diff the rendered output if available
      if (oldNode.rendered && newNode.rendered) {
          const renderedPatches = diffHTMLNodes(oldNode.rendered, newNode.rendered);
          patches.push(...renderedPatches);
      } else if (newNode.rendered && !oldNode.rendered) {
          patches.push({
              type: PatchType.RERENDER,
              vNode: oldNode,
              domNode: oldNode.domNode,
              newVNode: newNode.rendered
          });
      }
  }
  
  return patches;
}

/**
* Get a key from a node
* 
* @param node The node to get a key from
* @returns The key or null if none
*/
function getNodeKey(node: VirtualNode): string | number | null {
  if (node.type === VNodeType.ELEMENT) {
      return (node as any).key || null;
  } else if (node.type === VNodeType.FRAGMENT) {
      return (node as any).key || null;
  } else if (node.type === VNodeType.COMPONENT) {
      return (node as any).key || null;
  }
  return null;
}

/**
* Check if two nodes are equal for diffing purposes
* 
* @param nodeA First node
* @param nodeB Second node
* @returns True if nodes are equal
*/
function areNodesEqual(nodeA: VirtualNode, nodeB: VirtualNode): boolean {
  // Different types are not equal
  if (nodeA.type !== nodeB.type) {
      return false;
  }
  
  // Check equality based on node type
  switch (nodeA.type) {
      case VNodeType.ELEMENT:
          return (
              nodeA.tagName === nodeB.tagName &&
              getNodeKey(nodeA) === getNodeKey(nodeB)
          );
          
      case VNodeType.TEXT:
          return nodeA.text === nodeB.text;
          
      case VNodeType.COMMENT:
          return nodeA.text === nodeB.text;
          
      case VNodeType.COMPONENT:
          const oldComponent = nodeA.component;
          const newComponent = nodeB.component;
          
          return (
              (typeof oldComponent === typeof newComponent) &&
              (typeof oldComponent === 'string' ? 
                  oldComponent === newComponent : 
                  oldComponent.name === newComponent.name) &&
              getNodeKey(nodeA) === getNodeKey(nodeB)
          );
          
      case VNodeType.FRAGMENT:
          return getNodeKey(nodeA) === getNodeKey(nodeB);
          
      default:
          return false;
  }
}

/**
* Shallow equality check for objects
* 
* @param a First object
* @param b Second object
* @returns True if objects are shallowly equal
*/
function shallowEqual(a: any, b: any): boolean {
  if (a === b) {
      return true;
  }
  
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
      return false;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) {
      return false;
  }
  
  for (const key of keysA) {
      if (!b.hasOwnProperty(key) || a[key] !== b[key]) {
          return false;
      }
  }
  
  return true;
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
export function clearHTMLDiffCache(): void {
  transitionDiffCache.clear();
  knownStateTransitions.clear();
  minimizedTransitionMap.clear();
}