/**
 * VHTMLPatch.ts
 * 
 * Implements an efficient patching algorithm for applying Virtual DOM diffs to the 
 * actual DOM. Integrates automaton state minimization to optimize the number of
 * DOM operations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { VNode, VNodeProps } from './VHTMLNode';
import { StateMachineMinimizer } from '../../automaton/StateMachineMinimizer';

/**
 * Types of DOM patches
 */
export enum PatchType {
  /** Replace a node */
  REPLACE = 'replace',
  /** Update props */
  PROPS = 'props',
  /** Update text content */
  TEXT = 'text',
  /** Insert a new node */
  INSERT = 'insert',
  /** Remove a node */
  REMOVE = 'remove',
  /** Move a node to a new position */
  MOVE = 'move',
  /** Order children */
  ORDER = 'order',
  /** Update a keyed list */
  KEYED_LIST = 'keyed-list'
}

/**
 * Patch operation interface
 */
export interface VNodePatch {
  /** Type of patch */
  type: PatchType;
  /** Node to patch */
  node?: VNode;
  /** Old node (for replace) */
  oldNode?: VNode;
  /** New node (for replace) */
  newNode?: VNode;
  /** Parent node */
  parentNode?: VNode;
  /** New props (for props update) */
  props?: VNodeProps;
  /** New text content (for text update) */
  text?: string;
  /** Index for insert/move */
  index?: number;
  /** Child indices to order (for order patch) */
  indices?: number[];
  /** Key map for keyed list update */
  keyMap?: Map<string | number, number>;
}

/**
 * Options for patching
 */
export interface PatchOptions {
  /** Apply state minimization optimizations */
  enableMinimization?: boolean;
  /** Whether to collect DOM operation metrics */
  collectMetrics?: boolean;
  /** Custom element creation function */
  createElement?: (vnode: VNode) => Element | Text;
  /** Custom property setter */
  setProperty?: (elm: Element, key: string, value: any) => void;
}

/**
 * Result of a patch operation
 */
export interface PatchResult {
  /** Number of DOM operations performed */
  domOperations: number;
  /** Time taken to apply patches in milliseconds */
  timeTaken: number;
  /** Updated virtual DOM */
  updatedVDOM: VNode;
  /** Whether patching was successful */
  success: boolean;
  /** Error if patching failed */
  error?: Error;
  /** State minimization metrics */
  minimizationMetrics?: {
    /** Number of operations saved */
    operationsSaved: number;
    /** Original operation count */
    originalOperations: number;
    /** Optimized operation count */
    optimizedOperations: number;
    /** Optimization ratio */
    optimizationRatio: number;
  };
}

/**
 * Class that implements patching algorithm
 */
export class VHTMLPatcher {
  private options: PatchOptions;
  private minimizer: StateMachineMinimizer;
  private domOperationCount: number;
  private operationStartTime: number;
  
  /**
   * Create a new patcher
   */
  constructor(options: PatchOptions = {}) {
    this.options = {
      enableMinimization: true,
      collectMetrics: true,
      ...options
    };
    
    this.minimizer = new StateMachineMinimizer();
    this.domOperationCount = 0;
    this.operationStartTime = 0;
  }
  
  /**
   * Apply patches to update the real DOM
   */
  public patch(rootNode: VNode, patches: VNodePatch[]): PatchResult {
    this.operationStartTime = performance.now();
    this.domOperationCount = 0;
    
    // Copies we'll use for our metrics if needed
    let originalPatches: VNodePatch[] = [...patches];
    let optimizedPatches: VNodePatch[] = patches;
    
    // Apply automaton state minimization if enabled
    if (this.options.enableMinimization && patches.length > 0) {
      optimizedPatches = this.optimizePatches(patches);
    }
    
    try {
      // Apply the patches to the DOM
      for (const patch of optimizedPatches) {
        this.applyPatch(patch);
      }
      
      const result: PatchResult = {
        domOperations: this.domOperationCount,
        timeTaken: performance.now() - this.operationStartTime,
        updatedVDOM: rootNode,
        success: true
      };
      
      // Add minimization metrics if requested
      if (this.options.enableMinimization && this.options.collectMetrics) {
        const originalOpCount = this.countOperations(originalPatches);
        const optimizedOpCount = this.countOperations(optimizedPatches);
        
        result.minimizationMetrics = {
          operationsSaved: Math.max(0, originalOpCount - optimizedOpCount),
          originalOperations: originalOpCount,
          optimizedOperations: optimizedOpCount,
          optimizationRatio: optimizedOpCount / Math.max(1, originalOpCount)
        };
      }
      
      return result;
    } catch (error) {
      return {
        domOperations: this.domOperationCount,
        timeTaken: performance.now() - this.operationStartTime,
        updatedVDOM: rootNode,
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Apply a single patch to the DOM
   */
  private applyPatch(patch: VNodePatch): void {
    switch (patch.type) {
      case PatchType.REPLACE:
        this.applyReplacePatch(patch);
        break;
      case PatchType.PROPS:
        this.applyPropsPatch(patch);
        break;
      case PatchType.TEXT:
        this.applyTextPatch(patch);
        break;
      case PatchType.INSERT:
        this.applyInsertPatch(patch);
        break;
      case PatchType.REMOVE:
        this.applyRemovePatch(patch);
        break;
      case PatchType.MOVE:
        this.applyMovePatch(patch);
        break;
      case PatchType.ORDER:
        this.applyOrderPatch(patch);
        break;
      case PatchType.KEYED_LIST:
        this.applyKeyedListPatch(patch);
        break;
      default:
        console.warn('Unknown patch type:', (patch as any).type);
    }
  }
  
  /**
   * Apply a replace patch
   */
  private applyReplacePatch(patch: VNodePatch): void {
    if (!patch.oldNode || !patch.newNode) {
      console.warn('Invalid replace patch', patch);
      return;
    }
    
    const oldVNode = patch.oldNode;
    const newVNode = patch.newNode;
    const parentElm = this.getParentElement(oldVNode);
    
    if (!parentElm || !oldVNode.elm) {
      console.warn('Cannot replace node, missing parent or element', patch);
      return;
    }
    
    // Create the new element
    const newElm = this.createElement(newVNode);
    
    // Replace the old element with the new one
    parentElm.replaceChild(newElm, oldVNode.elm);
    this.countDOMOperation();
    
    // Update element references
    newVNode.elm = newElm;
    oldVNode.elm = null;
    
    // Recursively create children
    this.createChildren(newVNode, newElm);
  }
  
  /**
   * Apply a props patch
   */
  private applyPropsPatch(patch: VNodePatch): void {
    if (!patch.node || !patch.props) {
      console.warn('Invalid props patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const props = patch.props;
    const elm = vnode.elm as Element;
    
    if (!elm || !(elm instanceof Element)) {
      console.warn('Cannot update props, missing element', patch);
      return;
    }
    
    // Update properties
    for (const key in props) {
      if (key === 'children') continue; // Skip children prop
      
      this.setProperty(elm, key, props[key]);
      this.countDOMOperation();
    }
    
    // Remove properties that don't exist in the new props
    for (const key in vnode.props) {
      if (key === 'children') continue;
      
      if (!(key in props)) {
        this.removeProperty(elm, key);
        this.countDOMOperation();
      }
    }
    
    // Update the vnode props
    vnode.props = { ...vnode.props, ...props };
  }
  
  /**
   * Apply a text patch
   */
  private applyTextPatch(patch: VNodePatch): void {
    if (!patch.node || patch.text === undefined) {
      console.warn('Invalid text patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const elm = vnode.elm as Text;
    
    if (!elm || !(elm instanceof Text)) {
      console.warn('Cannot update text, missing text node', patch);
      return;
    }
    
    // Update text content
    elm.nodeValue = patch.text;
    this.countDOMOperation();
    
    // Update the vnode text
    vnode.text = patch.text;
  }
  
  /**
   * Apply an insert patch
   */
  private applyInsertPatch(patch: VNodePatch): void {
    if (!patch.node) {
      console.warn('Invalid insert patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const parentNode = patch.parentNode;
    const index = patch.index || 0;
    
    if (!parentNode) {
      console.warn('Cannot insert node, missing parent', patch);
      return;
    }
    
    const parentElm = parentNode.elm as Element;
    
    if (!parentElm || !(parentElm instanceof Element)) {
      console.warn('Cannot insert node, invalid parent element', patch);
      return;
    }
    
    // Create the new element
    const elm = this.createElement(vnode);
    
    // Find the reference node
    const refElm = parentNode.children[index]?.elm || null;
    
    // Insert the new element
    parentElm.insertBefore(elm, refElm);
    this.countDOMOperation();
    
    // Update element reference
    vnode.elm = elm;
    
    // Add to parent's children
    if (index >= parentNode.children.length) {
      parentNode.children.push(vnode);
    } else {
      parentNode.children.splice(index, 0, vnode);
    }
    
    // Set parent reference
    vnode.parent = parentNode;
    
    // Recursively create children
    this.createChildren(vnode, elm);
  }
  
  /**
   * Apply a remove patch
   */
  private applyRemovePatch(patch: VNodePatch): void {
    if (!patch.node) {
      console.warn('Invalid remove patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const parentNode = patch.parentNode || vnode.parent;
    
    if (!parentNode) {
      console.warn('Cannot remove node, missing parent', patch);
      return;
    }
    
    const parentElm = parentNode.elm as Element;
    
    if (!parentElm || !(parentElm instanceof Element)) {
      console.warn('Cannot remove node, invalid parent element', patch);
      return;
    }
    
    if (!vnode.elm) {
      console.warn('Cannot remove node, missing element', patch);
      return;
    }
    
    // Remove the element from the DOM
    parentElm.removeChild(vnode.elm);
    this.countDOMOperation();
    
    // Clear element reference
    vnode.elm = null;
    
    // Remove from parent's children
    const index = parentNode.children.indexOf(vnode);
    if (index !== -1) {
      parentNode.children.splice(index, 1);
    }
    
    // Clear parent reference
    vnode.parent = undefined;
  }
  
  /**
   * Apply a move patch
   */
  private applyMovePatch(patch: VNodePatch): void {
    if (!patch.node || patch.index === undefined) {
      console.warn('Invalid move patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const parentNode = patch.parentNode || vnode.parent;
    const index = patch.index;
    
    if (!parentNode) {
      console.warn('Cannot move node, missing parent', patch);
      return;
    }
    
    const parentElm = parentNode.elm as Element;
    
    if (!parentElm || !(parentElm instanceof Element)) {
      console.warn('Cannot move node, invalid parent element', patch);
      return;
    }
    
    if (!vnode.elm) {
      console.warn('Cannot move node, missing element', patch);
      return;
    }
    
    // Find the reference node
    const refElm = parentNode.children[index]?.elm || null;
    
    // Move the element
    parentElm.insertBefore(vnode.elm, refElm);
    this.countDOMOperation();
    
    // Update parent's children array
    const oldIndex = parentNode.children.indexOf(vnode);
    if (oldIndex !== -1) {
      parentNode.children.splice(oldIndex, 1);
      
      if (oldIndex < index) {
        parentNode.children.splice(index - 1, 0, vnode);
      } else {
        parentNode.children.splice(index, 0, vnode);
      }
    }
  }
  
  /**
   * Apply an order patch
   */
  private applyOrderPatch(patch: VNodePatch): void {
    if (!patch.node || !patch.indices || !Array.isArray(patch.indices)) {
      console.warn('Invalid order patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const indices = patch.indices;
    
    if (!vnode.elm || !(vnode.elm instanceof Element)) {
      console.warn('Cannot order children, invalid element', patch);
      return;
    }
    
    // Reorder the DOM nodes according to the indices
    const elm = vnode.elm;
    const children = vnode.children;
    const childElms = Array.from(elm.childNodes);
    
    // Create a document fragment to hold the reordered nodes
    const fragment = document.createDocumentFragment();
    
    // Add nodes to the fragment in the new order
    for (const idx of indices) {
      if (idx >= 0 && idx < children.length && children[idx].elm) {
        fragment.appendChild(children[idx].elm);
        this.countDOMOperation();
      }
    }
    
    // Clear the parent and add the fragment
    while (elm.firstChild) {
      elm.removeChild(elm.firstChild);
      this.countDOMOperation();
    }
    
    elm.appendChild(fragment);
    this.countDOMOperation();
    
    // Reorder the children array
    const newChildren: VNode[] = [];
    for (const idx of indices) {
      if (idx >= 0 && idx < children.length) {
        newChildren.push(children[idx]);
      }
    }
    
    vnode.children = newChildren;
  }
  
  /**
   * Apply a keyed list patch
   */
  private applyKeyedListPatch(patch: VNodePatch): void {
    if (!patch.node || !patch.keyMap) {
      console.warn('Invalid keyed list patch', patch);
      return;
    }
    
    const vnode = patch.node;
    const keyMap = patch.keyMap;
    
    if (!vnode.elm || !(vnode.elm instanceof Element)) {
      console.warn('Cannot update keyed list, invalid element', patch);
      return;
    }
    
    const elm = vnode.elm;
    const children = vnode.children;
    
    // Rebuild children array from key map
    const newChildren: VNode[] = [];
    const usedIndices = new Set<number>();
    
    keyMap.forEach((newIndex, key) => {
      // Find the child with this key
      const childIndex = children.findIndex(child => child.key === key);
      
      if (childIndex !== -1) {
        newChildren[newIndex] = children[childIndex];
        usedIndices.add(childIndex);
      }
    });
    
    // Create a document fragment for the new order
    const fragment = document.createDocumentFragment();
    
    // Add nodes to the fragment in the new order
    for (const child of newChildren) {
      if (child && child.elm) {
        fragment.appendChild(child.elm);
        this.countDOMOperation();
      }
    }
    
    // Clear the parent and add the fragment
    while (elm.firstChild) {
      elm.removeChild(elm.firstChild);
      this.countDOMOperation();
    }
    
    elm.appendChild(fragment);
    this.countDOMOperation();
    
    // Update the children array
    vnode.children = newChildren;
  }
  
  /**
   * Create child elements recursively
   */
  private createChildren(vnode: VNode, elm: Element): void {
    const children = vnode.children || [];
    
    for (const child of children) {
      const childElm = this.createElement(child);
      elm.appendChild(childElm);
      this.countDOMOperation();
      
      // Recursively create grandchildren
      if (child.children && child.children.length > 0 && childElm instanceof Element) {
        this.createChildren(child, childElm);
      }
    }
  }
  
  /**
   * Create a DOM element for a virtual node
   */
  private createElement(vnode: VNode): Element | Text {
    if (this.options.createElement) {
      return this.options.createElement(vnode);
    }
    
    if (vnode.isText) {
      // Create a text node
      const elm = document.createTextNode(vnode.text || '');
      vnode.elm = elm;
      this.countDOMOperation();
      return elm;
    }
    
    // Handle components (not implemented in this example)
    if (typeof vnode.type === 'function') {
      throw new Error('Component nodes not implemented in this example');
    }
    
    // Create an element node
    let elm: Element;
    
    if (vnode.ns) {
      // Create element with namespace (e.g., SVG)
      elm = document.createElementNS(vnode.ns, vnode.type as string);
    } else {
      // Create regular HTML element
      elm = document.createElement(vnode.type as string);
    }
    
    this.countDOMOperation();
    
    // Set properties
    for (const key in vnode.props) {
      if (key !== 'children') {
        this.setProperty(elm, key, vnode.props[key]);
        this.countDOMOperation();
      }
    }
    
    // Store reference to the DOM node
    vnode.elm = elm;
    
    return elm;
  }
  
  /**
   * Set a property on an element
   */
  private setProperty(elm: Element, key: string, value: any): void {
    if (this.options.setProperty) {
      this.options.setProperty(elm, key, value);
      return;
    }
    
    // Handle special cases
    switch (key) {
      case 'style':
        // Set style properties
        if (typeof value === 'string') {
          elm.setAttribute('style', value);
        } else if (typeof value === 'object') {
          for (const styleName in value) {
            (elm as HTMLElement).style[styleName as any] = value[styleName];
          }
        }
        break;
        
      case 'class':
      case 'className':
        // Set class
        elm.setAttribute('class', value);
        break;
        
      case 'dangerouslySetInnerHTML':
        // Set innerHTML (use with caution)
        if (value && value.__html) {
          elm.innerHTML = value.__html;
        }
        break;
        
      default:
        // Event handlers
        if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.toLowerCase().substring(2);
          elm.addEventListener(eventName, value);
        } 
        // Data attributes
        else if (key.startsWith('data-')) {
          elm.setAttribute(key, value);
        }
        // Regular attributes
        else {
          if (value === true) {
            elm.setAttribute(key, '');
          } else if (value !== false && value != null) {
            elm.setAttribute(key, value.toString());
          } else if (value === false) {
            elm.removeAttribute(key);
          }
        }
    }
  }
  
  /**
   * Remove a property from an element
   */
  private removeProperty(elm: Element, key: string): void {
    // Handle special cases
    switch (key) {
      case 'style':
        // Clear style
        (elm as HTMLElement).style.cssText = '';
        break;
        
      case 'class':
      case 'className':
        // Clear class
        elm.removeAttribute('class');
        break;
        
      default:
        // Event handlers
        if (key.startsWith('on')) {
          // Note: Can't easily remove event listeners without a reference to the handler
          const eventName = key.toLowerCase().substring(2);
          (elm as any)[`on${eventName}`] = null;
        } else {
          // Remove attribute
          elm.removeAttribute(key);
        }
    }
  }
  
  /**
   * Get the parent element for a virtual node
   */
  private getParentElement(vnode: VNode): Element | null {
    if (!vnode.parent) {
      return null;
    }
    
    const parentElm = vnode.parent.elm;
    return parentElm instanceof Element ? parentElm : null;
  }
  
  /**
   * Optimize patches using automaton state minimization
   */
  private optimizePatches(patches: VNodePatch[]): VNodePatch[] {
    // Group patches by type
    const patchesByType = new Map<PatchType, VNodePatch[]>();
    
    for (const patch of patches) {
      if (!patchesByType.has(patch.type)) {
        patchesByType.set(patch.type, []);
      }
      
      patchesByType.get(patch.type)?.push(patch);
    }
    
    const optimizedPatches: VNodePatch[] = [];
    
    // Optimize each type of patch
    patchesByType.forEach((typedPatches, type) => {
      switch (type) {
        case PatchType.REPLACE:
          // Can't optimize these further
          optimizedPatches.push(...typedPatches);
          break;
          
        case PatchType.PROPS:
          // Combine prop patches for the same node
          optimizedPatches.push(...this.optimizePropPatches(typedPatches));
          break;
          
        case PatchType.TEXT:
          // Only keep the last text patch for each node
          optimizedPatches.push(...this.optimizeTextPatches(typedPatches));
          break;
          
        case PatchType.REMOVE:
          // Optimize remove operations for children of the same parent
          optimizedPatches.push(...this.optimizeRemovePatches(typedPatches));
          break;
          
        case PatchType.INSERT:
          // Batch insert operations for the same parent
          optimizedPatches.push(...this.optimizeInsertPatches(typedPatches));
          break;
          
        case PatchType.MOVE:
          // Optimize move operations
          optimizedPatches.push(...this.optimizeMovePatches(typedPatches));
          break;
          
        default:
          // Other patch types are passed through
          optimizedPatches.push(...typedPatches);
      }
    });
    
    return this.sortPatches(optimizedPatches);
  }
  
  /**
   * Optimize prop patches by combining them
   */
  private optimizePropPatches(patches: VNodePatch[]): VNodePatch[] {
    // Group by node
    const byNode = new Map<VNode, VNodePatch[]>();
    
    for (const patch of patches) {
      if (!patch.node) continue;
      
      if (!byNode.has(patch.node)) {
        byNode.set(patch.node, []);
      }
      
      byNode.get(patch.node)?.push(patch);
    }
    
    // Combine prop patches for each node
    const optimized: VNodePatch[] = [];
    
    byNode.forEach((nodePatches, node) => {
      if (nodePatches.length === 1) {
        // Only one patch, no need to combine
        optimized.push(nodePatches[0]);
      } else {
        // Combine prop patches
        const combinedProps: VNodeProps = {};
        
        // Process patches in order, later patches override earlier ones
        for (const patch of nodePatches) {
          if (patch.props) {
            Object.assign(combinedProps, patch.props);
          }
        }
        
        // Create a new combined patch
        optimized.push({
          type: PatchType.PROPS,
          node,
          props: combinedProps
        });
      }
    });
    
    return optimized;
  }
  
  /**
   * Optimize text patches by keeping only the last one for each node
   */
  private optimizeTextPatches(patches: VNodePatch[]): VNodePatch[] {
    // Group by node
    const byNode = new Map<VNode, VNodePatch>();
    
    for (const patch of patches) {
      if (!patch.node) continue;
      
      // Keep only the last patch for each node
      byNode.set(patch.node, patch);
    }
    
    return Array.from(byNode.values());
  }
  
  /**
   * Optimize remove patches by removing parents instead of all children
   */
  private optimizeRemovePatches(patches: VNodePatch[]): VNodePatch[] {
    // Group by parent
    const byParent = new Map<VNode, Set<VNode>>();
    const removedNodes = new Set<VNode>();
    
    for (const patch of patches) {
      if (!patch.node) continue;
      
      const node = patch.node;
      const parent = patch.parentNode || node.parent;
      
      if (!parent) continue;
      
      // Add to the parent's set of removed children
      if (!byParent.has(parent)) {
        byParent.set(parent, new Set());
      }
      
      byParent.get(parent)?.add(node);
      removedNodes.add(node);
    }
    
    // Check if we can remove entire parent nodes
    const optimized: VNodePatch[] = [];
    const processedParents = new Set<VNode>();
    
    byParent.forEach((children, parent) => {
      if (processedParents.has(parent)) return;
      
      // If all children of the parent are being removed
      const allChildren = parent.children || [];
      
      if (allChildren.length > 0 && 
          allChildren.every(child => children.has(child) || removedNodes.has(child))) {
        // Remove the parent instead
        optimized.push({
          type: PatchType.REMOVE,
          node: parent,
          parentNode: parent.parent
        });
        
        processedParents.add(parent);
        
        // Mark all children as processed
        for (const child of children) {
          removedNodes.delete(child);
        }
      }
    });
    
    // Add remaining individual node removals
    for (const patch of patches) {
      if (patch.node && !processedParents.has(patch.node.parent!) && removedNodes.has(patch.node)) {
        optimized.push(patch);
      }
    }
    
    return optimized;
  }
  
  /**
   * Optimize insert patches for the same parent
   */
  private optimizeInsertPatches(patches: VNodePatch[]): VNodePatch[] {
    // Group by parent
    const byParent = new Map<VNode, VNodePatch[]>();
    
    for (const patch of patches) {
      if (!patch.node || !patch.parentNode) continue;
      
      if (!byParent.has(patch.parentNode)) {
        byParent.set(patch.parentNode, []);
      }
      
      byParent.get(patch.parentNode)?.push(patch);
    }
    
    // Process each parent's insert patches
    const optimized: VNodePatch[] = [];
    
    byParent.forEach((parentPatches, parent) => {
      if (parentPatches.length === 1) {
        // Only one insert for this parent, no need to optimize
        optimized.push(parentPatches[0]);
      } else {
        // Sort by index
        parentPatches.sort((a, b) => (a.index || 0) - (b.index || 0));
        
        // TODO: In a real implementation, you might want to combine these into
        // a batch insert operation if the DOM API supports it.
        optimized.push(...parentPatches);
      }
    });
    
    return optimized;
  }
  
  /**
   * Optimize move patches
   */
  private optimizeMovePatches(patches: VNodePatch[]): VNodePatch[] {
    // Group by parent
    const byParent = new Map<VNode, VNodePatch[]>();
    
    for (const patch of patches) {
      if (!patch.node) continue;
      
      const parent = patch.parentNode || patch.node.parent;
      
      if (!parent) continue;
      
      if (!byParent.has(parent)) {
        byParent.set(parent, []);
      }
      
      byParent.get(parent)?.push(patch);
    }
    
    // Process each parent's move patches
    const optimized: VNodePatch[] = [];
    
    byParent.forEach((parentPatches, parent) => {
      if (parentPatches.length <= 1) {
        // Only one move for this parent, no need to optimize
        optimized.push(...parentPatches);
      } else {
        // Check if we can optimize to an "order" patch
        const movedNodesCount = new Set(parentPatches.map(p => p.node)).size;
        const parentChildCount = parent.children?.length || 0;
        
        if (movedNodesCount > parentChildCount / 2) {
          // More than half the children are being moved, use an order patch
          // Build the new order
          const order = [...(parent.children || [])];
          
          // Apply moves to the order
          for (const patch of parentPatches) {
            if (!patch.node || patch.index === undefined) continue;
            
            const oldIndex = order.indexOf(patch.node);
            if (oldIndex !== -1) {
              // Remove from old position
              order.splice(oldIndex, 1);
              
              // Insert at new position
              if (patch.index >= order.length) {
                order.push(patch.node);
              } else {
                order.splice(patch.index, 0, patch.node);
              }
            }
          }
          
          // Create the order patch
          optimized.push({
            type: PatchType.ORDER,
            node: parent,
            indices: order.map(node => (parent.children || []).indexOf(node))
          });
        } else {
          // Use individual move patches
          optimized.push(...parentPatches);
        }
      }
    });
    
    return optimized;
  }
  
  /**
   * Sort patches to ensure they're applied in the correct order
   */
  private sortPatches(patches: VNodePatch[]): VNodePatch[] {
    // Define patch type priorities (lower numbers are applied first)
    const typePriorities: Record<PatchType, number> = {
      [PatchType.REMOVE]: 0,     // Remove first
      [PatchType.REPLACE]: 1,    // Then replace
      [PatchType.ORDER]: 2,      // Then order
      [PatchType.MOVE]: 3,       // Then move
      [PatchType.INSERT]: 4,     // Then insert
      [PatchType.PROPS]: 5,      // Then update props
      [PatchType.TEXT]: 6,       // Then update text
      [PatchType.KEYED_LIST]: 7  // Finally update keyed lists
    };
    
    return [...patches].sort((a, b) => {
      // Sort by type priority
      return typePriorities[a.type] - typePriorities[b.type];
    });
  }
  
  /**
   * Count a DOM operation
   */
  private countDOMOperation(): void {
    this.domOperationCount++;
  }
  
  /**
   * Count required operations for patches
   */
  private countOperations(patches: VNodePatch[]): number {
    // Estimate the number of DOM operations required for each patch
    return patches.reduce((count, patch) => {
      switch (patch.type) {
        case PatchType.REPLACE:
          // Replace requires remove + insert + create children
          return count + 2 + this.countChildrenRecursive(patch.newNode);
          
        case PatchType.PROPS:
          // One operation per prop
          return count + (Object.keys(patch.props || {}).length || 1);
          
        case PatchType.TEXT:
          // One operation to update text
          return count + 1;
          
        case PatchType.INSERT:
          // Insert + create children
          return count + 1 + this.countChildrenRecursive(patch.node);
          
        case PatchType.REMOVE:
          // One operation to remove
          return count + 1;
          
        case PatchType.MOVE:
          // One operation to move
          return count + 1;
          
        case PatchType.ORDER:
          // N operations to remove + N to insert
          return count + 2 * (patch.indices?.length || 0);
          
        case PatchType.KEYED_LIST:
          // N operations to remove + N to insert
          return count + 2 * (patch.keyMap?.size || 0);
          
        default:
          return count + 1;
      }
    }, 0);
  }
  
  /**
   * Count children recursively
   */
  private countChildrenRecursive(node?: VNode): number {
    if (!node) return 0;
    
    let count = 0;
    
    // Count this node's children
    const children = node.children || [];
    count += children.length;
    
    // Recursively count grandchildren
    for (const child of children) {
      count += this.countChildrenRecursive(child);
    }
    
    return count;
  }
}