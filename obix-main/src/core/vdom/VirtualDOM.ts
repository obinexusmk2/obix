/**
 * VirtualDOM.ts
 * 
 * Core implementation of the Virtual DOM system for OBIX framework.
 * This system provides the foundation for efficient DOM diffing and patching
 * with state machine minimization following Nnamdi Okpala's approach.
 * 
 * The Virtual DOM implementation acts as a lightweight abstraction over the actual DOM,
 * enabling efficient updates and state transitions without excessive DOM manipulation.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { MRUCache } from '../cache/MRUCache';

/**
 * Types of virtual nodes supported in the system
 */
export enum VNodeType {
    ELEMENT = 'element',
    TEXT = 'text',
    COMMENT = 'comment',
    FRAGMENT = 'fragment',
    COMPONENT = 'component'
}

/**
 * Attributes/properties for a virtual node
 */
export interface VNodeProps {
    [key: string]: any;
}

/**
 * Event listener attached to a virtual node
 */
export interface VNodeEventListener {
    /** Event name (e.g., 'click', 'input') */
    eventName: string;
    /** Event handler function */
    handler: (event: Event) => void;
    /** Capture phase flag */
    capture?: boolean;
    /** Passive flag */
    passive?: boolean;
    /** Once flag (auto-remove after firing) */
    once?: boolean;
}

/**
 * Base interface for all virtual nodes
 */
export interface VNode {
    /** Unique identifier for the node */
    id: string;
    /** Type of virtual node */
    type: VNodeType;
    /** Reference to actual DOM node (if rendered) */
    domNode?: Node | null;
    /** Parent virtual node (if any) */
    parent?: VNode | null;
    /** State transition signature for optimization */
    stateSignature?: string;
}

/**
 * Virtual element node (represents HTML elements)
 */
export interface VElementNode extends VNode {
    /** Override type to be element */
    type: VNodeType.ELEMENT;
    /** Tag name (e.g., 'div', 'span') */
    tagName: string;
    /** Node properties/attributes */
    props: VNodeProps;
    /** Child nodes */
    children: VNode[];
    /** CSS classes (for optimization) */
    classes?: string[];
    /** DOM reference as Element */
    domNode?: Element | null;
    /** Event listeners */
    eventListeners?: VNodeEventListener[];
    /** Namespace URI (for SVG elements) */
    namespaceURI?: string;
    /** Key for list reconciliation */
    key?: string | number | null;
    /** Flag to skip diffing for performance optimization */
    skipDiff?: boolean;
}

/**
 * Virtual text node
 */
export interface VTextNode extends VNode {
    /** Override type to be text */
    type: VNodeType.TEXT;
    /** Text content */
    text: string;
    /** DOM reference as Text */
    domNode?: Text | null;
}

/**
 * Virtual comment node
 */
export interface VCommentNode extends VNode {
    /** Override type to be comment */
    type: VNodeType.COMMENT;
    /** Comment text */
    text: string;
    /** DOM reference as Comment */
    domNode?: Comment | null;
}

/**
 * Virtual fragment node (container for multiple nodes)
 */
export interface VFragmentNode extends VNode {
    /** Override type to be fragment */
    type: VNodeType.FRAGMENT;
    /** Child nodes */
    children: VNode[];
    /** DOM reference as DocumentFragment */
    domNode?: DocumentFragment | null;
    /** Key for list reconciliation */
    key?: string | number | null;
}

/**
 * Virtual component node (custom component)
 */
export interface VComponentNode extends VNode {
    /** Override type to be component */
    type: VNodeType.COMPONENT;
    /** Component name or constructor */
    component: string | Function;
    /** Component properties */
    props: VNodeProps;
    /** Rendered virtual node tree */
    rendered?: VNode | null;
    /** Internal component state */
    state?: any;
    /** Component lifecycle hooks */
    hooks?: {
        /** Called before component updates */
        beforeUpdate?: () => void;
        /** Called after component updates */
        afterUpdate?: () => void;
        /** Called before component is removed */
        beforeRemove?: () => void;
    };
    /** DOM reference to root element */
    domNode?: Element | null;
}

/**
 * Union type for all virtual node types
 */
export type VirtualNode = VElementNode | VTextNode | VCommentNode | VFragmentNode | VComponentNode;

/**
 * Options for creating a virtual node
 */
export interface CreateVNodeOptions {
    /** Node key for reconciliation */
    key?: string | number;
    /** Skip diffing for this node (performance optimization) */
    skipDiff?: boolean;
    /** Namespace URI (for SVG elements) */
    namespace?: string;
    /** Initial state signature */
    stateSignature?: string;
}

/**
 * Types of patches that can be applied to the DOM
 */
export enum PatchType {
    /** Replace node entirely */
    REPLACE = 'replace',
    /** Update node attributes/properties */
    PROPS = 'props',
    /** Update text content */
    TEXT = 'text',
    /** Remove node */
    REMOVE = 'remove',
    /** Add child node */
    APPEND = 'append',
    /** Insert child node at position */
    INSERT = 'insert',
    /** Remove child node */
    REMOVE_CHILD = 'removeChild',
    /** Move child node to new position */
    MOVE = 'move',
    /** Update component */
    COMPONENT = 'component',
    /** Re-render node subtree */
    RERENDER = 'rerender',
    /** No changes (optimization) */
    NONE = 'none'
}

/**
 * Base interface for all DOM patches
 */
export interface BasePatch {
    /** Type of patch */
    type: PatchType;
    /** Target virtual node */
    vNode: VirtualNode;
    /** Target DOM node */
    domNode?: Node | null;
}

/**
 * Patch to replace a node entirely
 */
export interface ReplacePatch extends BasePatch {
    type: PatchType.REPLACE;
    /** New virtual node */
    newVNode: VirtualNode;
}

/**
 * Patch to update node properties
 */
export interface PropsPatch extends BasePatch {
    type: PatchType.PROPS;
    /** Properties to set */
    props: VNodeProps;
    /** Properties to remove */
    removedProps: string[];
}

/**
 * Patch to update text content
 */
export interface TextPatch extends BasePatch {
    type: PatchType.TEXT;
    /** New text content */
    text: string;
}

/**
 * Patch to remove a node
 */
export interface RemovePatch extends BasePatch {
    type: PatchType.REMOVE;
}

/**
 * Patch to append a child node
 */
export interface AppendPatch extends BasePatch {
    type: PatchType.APPEND;
    /** Child node to append */
    child: VirtualNode;
}

/**
 * Patch to insert a child at specific position
 */
export interface InsertPatch extends BasePatch {
    type: PatchType.INSERT;
    /** Child node to insert */
    child: VirtualNode;
    /** Position to insert at */
    index: number;
}

/**
 * Patch to remove a child node
 */
export interface RemoveChildPatch extends BasePatch {
    type: PatchType.REMOVE_CHILD;
    /** Child node to remove */
    child: VirtualNode;
    /** Position of child */
    index: number;
}

/**
 * Patch to move a child node
 */
export interface MovePatch extends BasePatch {
    type: PatchType.MOVE;
    /** Child node to move */
    child: VirtualNode;
    /** From position */
    fromIndex: number;
    /** To position */
    toIndex: number;
}

/**
 * Patch to update a component
 */
export interface ComponentPatch extends BasePatch {
    type: PatchType.COMPONENT;
    /** New properties */
    props: VNodeProps;
    /** New state */
    state?: any;
}

/**
 * Patch to re-render a subtree
 */
export interface RerenderPatch extends BasePatch {
    type: PatchType.RERENDER;
    /** New root node for subtree */
    newVNode: VirtualNode;
}

/**
 * No changes required (optimization)
 */
export interface NonePatch extends BasePatch {
    type: PatchType.NONE;
}

/**
 * Union type for all patch types
 */
export type Patch = 
    | ReplacePatch
    | PropsPatch
    | TextPatch
    | RemovePatch
    | AppendPatch
    | InsertPatch
    | RemoveChildPatch
    | MovePatch
    | ComponentPatch
    | RerenderPatch
    | NonePatch;

/**
 * Virtual DOM diffing and patching configuration options
 */
export interface VirtualDOMOptions {
    /** Enable state transition minimization */
    enableStateMachineMinimization?: boolean;
    /** Cache size for rendered nodes */
    nodeCacheSize?: number;
    /** Enable transition tracking for optimization */
    trackStateTransitions?: boolean;
    /** Debug mode */
    debug?: boolean;
    /** Custom event handling */
    eventHandler?: (event: Event, listener: VNodeEventListener, vNode: VirtualNode) => void;
}

/**
 * VirtualDOM class for efficient DOM updates using automaton state minimization
 */
export class VirtualDOM {
    /** Configuration options */
    private options: VirtualDOMOptions;
    /** Cache for rendered nodes */
    private nodeCache: MRUCache<string, VirtualNode>;
    /** Map of state transition signatures to pre-computed patches */
    private transitionPatches: Map<string, Patch[]>;
    /** Set of currently active transition signatures */
    private activeTransitions: Set<string>;
    /** Flag indicating if we're in patching mode */
    private isPatching: boolean = false;
    /** Flag indicating if we're in paused state (no updates) */
    private isPaused: boolean = false;
    /** Pending node changes */
    private pendingChanges: Map<string, VirtualNode> = new Map();
    
    /**
     * Create a new VirtualDOM instance
     * 
     * @param options Configuration options
     */
    constructor(options: VirtualDOMOptions = {}) {
        this.options = {
            enableStateMachineMinimization: true,
            nodeCacheSize: 1000,
            trackStateTransitions: true,
            debug: false,
            ...options
        };
        
        this.nodeCache = new MRUCache<string, VirtualNode>({
            capacity: this.options.nodeCacheSize,
            trackTransitions: this.options.trackStateTransitions,
            cleanupInterval: 60000 // Cleanup every minute
        });
        
        this.transitionPatches = new Map<string, Patch[]>();
        this.activeTransitions = new Set<string>();
    }
    
    /**
     * Create a new virtual element node
     * 
     * @param tagName HTML tag name
     * @param props Element properties/attributes
     * @param children Child nodes
     * @param options Additional options
     * @returns The created virtual element node
     */
    public createElement(
        tagName: string,
        props: VNodeProps = {},
        children: (VirtualNode | string)[] = [],
        options: CreateVNodeOptions = {}
    ): VElementNode {
        // Generate a unique ID for the element
        const id = `el-${tagName}-${this.generateId()}`;
        
        // Process classes for optimization
        let classes: string[] | undefined;
        if (props.className) {
            classes = props.className.split(/\s+/).filter(Boolean);
        } else if (props.class) {
            classes = props.class.split(/\s+/).filter(Boolean);
            // Normalize to className for DOM compatibility
            props.className = props.class;
            delete props.class;
        }
        
        // Convert string children to text nodes
        const processedChildren = children.map(child => 
            typeof child === 'string' ? this.createText(child) : child
        );
        
        // Create the element node
        const elementNode: VElementNode = {
            id,
            type: VNodeType.ELEMENT,
            tagName: tagName.toLowerCase(),
            props,
            children: processedChildren,
            classes,
            key: options.key || null,
            skipDiff: options.skipDiff || false,
            namespaceURI: options.namespace,
            stateSignature: options.stateSignature,
            domNode: null,
            eventListeners: []
        };
        
        // Set parent references for children
        processedChildren.forEach(child => {
            child.parent = elementNode;
        });
        
        // Convert event handlers in props to eventListeners array
        for (const [key, value] of Object.entries(props)) {
            if (key.startsWith('on') && typeof value === 'function') {
                const eventName = key.slice(2).toLowerCase();
                elementNode.eventListeners!.push({
                    eventName,
                    handler: value
                });
                
                // Remove from props (will be handled separately)
                delete props[key];
            }
        }
        
        // Cache the node if requested
        if (options.stateSignature && this.options.trackStateTransitions) {
            this.nodeCache.set(id, elementNode, options.stateSignature);
        }
        
        return elementNode;
    }
    
    /**
     * Create a new virtual text node
     * 
     * @param text Text content
     * @param options Additional options
     * @returns The created virtual text node
     */
    public createText(text: string, options: CreateVNodeOptions = {}): VTextNode {
        // Generate a unique ID for the text node
        const id = `text-${this.generateId()}`;
        
        // Create the text node
        const textNode: VTextNode = {
            id,
            type: VNodeType.TEXT,
            text,
            stateSignature: options.stateSignature,
            domNode: null
        };
        
        // Cache the node if requested
        if (options.stateSignature && this.options.trackStateTransitions) {
            this.nodeCache.set(id, textNode, options.stateSignature);
        }
        
        return textNode;
    }
    
    /**
     * Create a new virtual comment node
     * 
     * @param text Comment text
     * @param options Additional options
     * @returns The created virtual comment node
     */
    public createComment(text: string, options: CreateVNodeOptions = {}): VCommentNode {
        // Generate a unique ID for the comment node
        const id = `comment-${this.generateId()}`;
        
        // Create the comment node
        const commentNode: VCommentNode = {
            id,
            type: VNodeType.COMMENT,
            text,
            stateSignature: options.stateSignature,
            domNode: null
        };
        
        // Cache the node if requested
        if (options.stateSignature && this.options.trackStateTransitions) {
            this.nodeCache.set(id, commentNode, options.stateSignature);
        }
        
        return commentNode;
    }
    
    /**
     * Create a new virtual fragment node
     * 
     * @param children Child nodes
     * @param options Additional options
     * @returns The created virtual fragment node
     */
    public createFragment(
        children: (VirtualNode | string)[] = [],
        options: CreateVNodeOptions = {}
    ): VFragmentNode {
        // Generate a unique ID for the fragment
        const id = `fragment-${this.generateId()}`;
        
        // Convert string children to text nodes
        const processedChildren = children.map(child => 
            typeof child === 'string' ? this.createText(child) : child
        );
        
        // Create the fragment node
        const fragmentNode: VFragmentNode = {
            id,
            type: VNodeType.FRAGMENT,
            children: processedChildren,
            key: options.key || null,
            stateSignature: options.stateSignature,
            domNode: null
        };
        
        // Set parent references for children
        processedChildren.forEach(child => {
            child.parent = fragmentNode;
        });
        
        // Cache the node if requested
        if (options.stateSignature && this.options.trackStateTransitions) {
            this.nodeCache.set(id, fragmentNode, options.stateSignature);
        }
        
        return fragmentNode;
    }
    
    /**
     * Create a new virtual component node
     * 
     * @param component Component constructor or name
     * @param props Component properties
     * @param options Additional options
     * @returns The created virtual component node
     */
    public createComponent(
        component: string | Function,
        props: VNodeProps = {},
        options: CreateVNodeOptions = {}
    ): VComponentNode {
        // Generate a unique ID for the component
        const componentName = typeof component === 'string' ? component : component.name || 'Component';
        const id = `component-${componentName}-${this.generateId()}`;
        
        // Create the component node
        const componentNode: VComponentNode = {
            id,
            type: VNodeType.COMPONENT,
            component,
            props,
            stateSignature: options.stateSignature,
            domNode: null
        };
        
        // Cache the node if requested
        if (options.stateSignature && this.options.trackStateTransitions) {
            this.nodeCache.set(id, componentNode, options.stateSignature);
        }
        
        return componentNode;
    }
    
    /**
     * Render a virtual node to a DOM element
     * 
     * @param vNode Virtual node to render
     * @param container DOM element to render into
     * @returns The rendered DOM node
     */
    public render(vNode: VirtualNode, container: Element): Node {
        // Create the DOM node from the virtual node
        const domNode = this.createDOMNode(vNode);
        
        // Clear container before appending
        container.innerHTML = '';
        
        // Append to container
        container.appendChild(domNode);
        
        // Store DOM reference
        vNode.domNode = domNode;
        
        // If we're tracking state transitions, register this as an active transition
        if (this.options.trackStateTransitions && vNode.stateSignature) {
            this.activeTransitions.add(vNode.stateSignature);
        }
        
        return domNode;
    }
    
    /**
     * Update a previously rendered virtual node with a new virtual node
     * 
     * @param oldVNode Previously rendered virtual node
     * @param newVNode New virtual node
     * @returns Array of patches to apply
     */
    public diff(oldVNode: VirtualNode, newVNode: VirtualNode): Patch[] {
        // Check if we have a cached transition between these two state signatures
        if (
            this.options.enableStateMachineMinimization &&
            oldVNode.stateSignature && 
            newVNode.stateSignature
        ) {
            const transitionKey = `${oldVNode.stateSignature}=>${newVNode.stateSignature}`;
            
            // If we have cached patches for this transition, return them
            if (this.transitionPatches.has(transitionKey)) {
                return this.transitionPatches.get(transitionKey)!;
            }
        }
        
        // Perform the diff
        const patches = this.diffNodes(oldVNode, newVNode);
        
        // Cache the transition if state signatures are available
        if (
            this.options.enableStateMachineMinimization &&
            oldVNode.stateSignature && 
            newVNode.stateSignature
        ) {
            const transitionKey = `${oldVNode.stateSignature}=>${newVNode.stateSignature}`;
            this.transitionPatches.set(transitionKey, patches);
            
            // Update active transitions
            if (this.activeTransitions.has(oldVNode.stateSignature)) {
                this.activeTransitions.delete(oldVNode.stateSignature);
            }
            this.activeTransitions.add(newVNode.stateSignature);
        }
        
        return patches;
    }
    
    /**
     * Apply patches to the DOM
     * 
     * @param patches Array of patches to apply
     */
    public patch(patches: Patch[]): void {
        // Set patching flag
        this.isPatching = true;
        
        // Apply each patch
        for (const patch of patches) {
            this.applyPatch(patch);
        }
        
        // Reset patching flag
        this.isPatching = false;
        
        // Apply any pending changes
        if (this.pendingChanges.size > 0) {
            const changes = Array.from(this.pendingChanges.values());
            this.pendingChanges.clear();
            
            // Apply changes (recursive patches)
            for (const vNode of changes) {
                if (vNode.parent && vNode.parent.domNode) {
                    // Find the old version of this node
                    const oldVNode = this.findChildInParent(vNode.parent, vNode.id);
                    if (oldVNode) {
                        const patches = this.diff(oldVNode, vNode);
                        this.patch(patches);
                    }
                }
            }
        }
    }
    
    /**
     * Update a virtual node tree and apply changes to DOM
     * 
     * @param oldVNode Previously rendered virtual node
     * @param newVNode New virtual node
     */
    public update(oldVNode: VirtualNode, newVNode: VirtualNode): void {
        // Skip if paused
        if (this.isPaused) {
            return;
        }
        
        // Calculate differences
        const patches = this.diff(oldVNode, newVNode);
        
        // Apply patches
        this.patch(patches);
    }
    
    /**
     * Pause updates to the DOM (useful for batch updates)
     */
    public pause(): void {
        this.isPaused = true;
    }
    
    /**
     * Resume updates to the DOM
     */
    public resume(): void {
        this.isPaused = false;
    }
    
    /**
     * Generate a unique ID
     * 
     * @returns A unique ID string
     */
    private generateId(): string {
        return Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Create a DOM node from a virtual node
     * 
     * @param vNode Virtual node to create a DOM node from
     * @returns The created DOM node
     */
    private createDOMNode(vNode: VirtualNode): Node {
        switch (vNode.type) {
            case VNodeType.ELEMENT:
                return this.createElementNode(vNode);
            case VNodeType.TEXT:
                return this.createTextNode(vNode);
            case VNodeType.COMMENT:
                return this.createCommentNode(vNode);
            case VNodeType.FRAGMENT:
                return this.createFragmentNode(vNode);
            case VNodeType.COMPONENT:
                return this.createComponentNode(vNode);
            default:
                throw new Error(`Unknown node type: ${(vNode as any).type}`);
        }
    }
    
    /**
     * Create a DOM element node
     * 
     * @param vNode Virtual element node
     * @returns DOM element
     */
    private createElementNode(vNode: VElementNode): Element {
        let element: Element;
        
        // Create element with namespace if provided
        if (vNode.namespaceURI) {
            element = document.createElementNS(vNode.namespaceURI, vNode.tagName);
        } else {
            element = document.createElement(vNode.tagName);
        }
        
        // Set properties and attributes
        this.setProps(element, vNode.props);
        
        // Add event listeners
        if (vNode.eventListeners) {
            for (const listener of vNode.eventListeners) {
                this.addEventListenerToElement(element, listener, vNode);
            }
        }
        
        // Append children
        for (const child of vNode.children) {
            element.appendChild(this.createDOMNode(child));
        }
        
        // Store DOM reference
        vNode.domNode = element;
        
        return element;
    }
    
    /**
     * Create a DOM text node
     * 
     * @param vNode Virtual text node
     * @returns DOM text node
     */
    private createTextNode(vNode: VTextNode): Text {
        const text = document.createTextNode(vNode.text);
        vNode.domNode = text;
        return text;
    }
    
    /**
     * Create a DOM comment node
     * 
     * @param vNode Virtual comment node
     * @returns DOM comment node
     */
    private createCommentNode(vNode: VCommentNode): Comment {
        const comment = document.createComment(vNode.text);
        vNode.domNode = comment;
        return comment;
    }
    
    /**
     * Create a DOM fragment node
     * 
     * @param vNode Virtual fragment node
     * @returns DOM fragment
     */
    private createFragmentNode(vNode: VFragmentNode): DocumentFragment {
        const fragment = document.createDocumentFragment();
        
        // Append children
        for (const child of vNode.children) {
            fragment.appendChild(this.createDOMNode(child));
        }
        
        vNode.domNode = fragment;
        return fragment;
    }
    
    /**
     * Create a DOM node for a component
     * 
     * @param vNode Virtual component node
     * @returns DOM node
     */
    private createComponentNode(vNode: VComponentNode): Node {
        // This is a placeholder implementation, as components would need
        // a more sophisticated rendering system. For now, we just create a div.
        const element = document.createElement('div');
        element.setAttribute('data-component', typeof vNode.component === 'string' ? 
            vNode.component : vNode.component.name || 'Component');
        
        // Store reference
        vNode.domNode = element;
        return element;
    }
    
    /**
     * Set properties on a DOM element
     * 
     * @param element DOM element
     * @param props Properties to set
     */
    private setProps(element: Element, props: VNodeProps): void {
        for (const [key, value] of Object.entries(props)) {
            if (key === 'style' && typeof value === 'object') {
                // Handle style object
                Object.assign(element.style, value);
            } else if (key === 'className') {
                // Special case for className
                element.setAttribute('class', value);
            } else if (key === 'dangerouslySetInnerHTML' && typeof value === 'object') {
                // Special case for innerHTML
                element.innerHTML = value.__html || '';
            } else if (key.startsWith('data-')) {
                // Handle data attributes
                element.setAttribute(key, value);
            } else if (typeof value === 'boolean') {
                // Handle boolean attributes
                if (value) {
                    element.setAttribute(key, '');
                } else {
                    element.removeAttribute(key);
                }
            } else if (value === null || value === undefined) {
                // Remove attribute
                element.removeAttribute(key);
            } else {
                // Set regular attribute
                element.setAttribute(key, value.toString());
                
                // Also set as property if possible (for inputs, etc.)
                if (key in element) {
                    (element as any)[key] = value;
                }
            }
        }
    }
    
    /**
     * Add an event listener to a DOM element
     * 
     * @param element DOM element
     * @param listener Event listener definition
     * @param vNode Virtual node (for context)
     */
    private addEventListenerToElement(
        element: Element, 
        listener: VNodeEventListener,
        vNode: VirtualNode
    ): void {
        // If a custom event handler is provided, use it
        if (this.options.eventHandler) {
            const eventHandler = (event: Event) => {
                this.options.eventHandler!(event, listener, vNode);
            };
            
            element.addEventListener(
                listener.eventName,
                eventHandler,
                {
                    capture: listener.capture,
                    passive: listener.passive,
                    once: listener.once
                }
            );
        } else {
            // Standard event handling
            element.addEventListener(
                listener.eventName,
                listener.handler,
                {
                    capture: listener.capture,
                    passive: listener.passive,
                    once: listener.once
                }
            );
        }
    }
    
    /**
     * Remove an event listener from a DOM element
     * 
     * @param element DOM element
     * @param listener Event listener to remove
     */
    private removeEventListenerFromElement(
        element: Element,
        listener: VNodeEventListener
    ): void {
        // If a custom event handler is provided, we need to check
        // Currently, we don't track the wrapped handlers, so we can't remove cleanly
        // In a real implementation, we would maintain a map of original to wrapped handlers
        
        // Standard event handling
        element.removeEventListener(
            listener.eventName,
            listener.handler,
            {
                capture: listener.capture
            }
        );
    }
    
    /**
     * Diff two virtual nodes
     * 
     * @param oldVNode Old virtual node
     * @param newVNode New virtual node
     * @returns Array of patches
     */
    private diffNodes(oldVNode: VirtualNode, newVNode: VirtualNode): Patch[] {
        const patches: Patch[] = [];
        
        // Different node types - complete replacement
        if (oldVNode.type !== newVNode.type) {
            patches.push({
                type: PatchType.REPLACE,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                newVNode
            });
            return patches;
        }
        
        // Handle each node type
        switch (oldVNode.type) {
            case VNodeType.ELEMENT:
                return this.diffElementNodes(oldVNode as VElementNode, newVNode as VElementNode);
            case VNodeType.TEXT:
                return this.diffTextNodes(oldVNode as VTextNode, newVNode as VTextNode);
            case VNodeType.COMMENT:
                return this.diffCommentNodes(oldVNode as VCommentNode, newVNode as VCommentNode);
            case VNodeType.FRAGMENT:
                return this.diffFragmentNodes(oldVNode as VFragmentNode, newVNode as VFragmentNode);
            case VNodeType.COMPONENT:
                return this.diffComponentNodes(oldVNode as VComponentNode, newVNode as VComponentNode);
            default:
                return patches;
        }
    }
    
    /**
     * Diff two virtual element nodes
     * 
     * @param oldVNode Old virtual element node
     * @param newVNode New virtual element node
     * @returns Array of patches
     */
    private diffElementNodes(oldVNode: VElementNode, newVNode: VElementNode): Patch[] {
        const patches: Patch[] = [];
        
        // Skip diffing if requested (performance optimization)
        if (newVNode.skipDiff) {
            patches.push({
                type: PatchType.REPLACE,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                newVNode
            });
            return patches;
        }
        
        // Different tag names - complete replacement
        if (oldVNode.tagName !== newVNode.tagName) {
            patches.push({
                type: PatchType.REPLACE,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                newVNode
            });
            return patches;
        }
        
        // Diff props
        const propsPatch = this.diffProps(oldVNode.props, newVNode.props);
        if (propsPatch.props.length > 0 || propsPatch.removedProps.length > 0) {
            patches.push({
                type: PatchType.PROPS,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                props: propsPatch.props,
                removedProps: propsPatch.removedProps
            });
        }
        
        // Diff event listeners
        this.diffEventListeners(oldVNode, newVNode, patches);
        
        // Diff children
        this.diffChildren(oldVNode, newVNode, patches);
        
        return patches;
    }
    
    /**
     * Diff two virtual text nodes
     * 
     * @param oldVNode Old virtual text node
     * @param newVNode New virtual text node
     * @returns Array of patches
     */
    private diffTextNodes(oldVNode: VTextNode, newVNode: VTextNode): Patch[] {
        const patches: Patch[] = [];
        
        // Different text content
        if (oldVNode.text !== newVNode.text) {
            patches.push({
                type: PatchType.TEXT,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                text: newVNode.text
            });
        }
        
        return patches;
    }
    
    /**
     * Diff two virtual comment nodes
     * 
     * @param oldVNode Old virtual comment node
     * @param newVNode New virtual comment node
     * @returns Array of patches
     */
    private diffCommentNodes(oldVNode: VCommentNode, newVNode: VCommentNode): Patch[] {
        const patches: Patch[] = [];
        
        // Different comment text
        if (oldVNode.text !== newVNode.text) {
            patches.push({
                type: PatchType.TEXT,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                text: newVNode.text
            });
        }
        
        return patches;
    }
    
    /**
     * Diff two virtual fragment nodes
     * 
     * @param oldVNode Old virtual fragment node
     * @param newVNode New virtual fragment node
     * @returns Array of patches
     */
    private diffFragmentNodes(oldVNode: VFragmentNode, newVNode: VFragmentNode): Patch[] {
        const patches: Patch[] = [];
        
        // Diff children
        this.diffChildren(oldVNode, newVNode, patches);
        
        return patches;
    }
    
    /**
     * Diff two virtual component nodes
     * 
     * @param oldVNode Old virtual component node
     * @param newVNode New virtual component node
     * @returns Array of patches
     */
    private diffComponentNodes(oldVNode: VComponentNode, newVNode: VComponentNode): Patch[] {
        const patches: Patch[] = [];
        
        // Different component types - complete replacement
        if (
            (typeof oldVNode.component !== typeof newVNode.component) ||
            (typeof oldVNode.component === 'string' && oldVNode.component !== newVNode.component) ||
            (typeof oldVNode.component === 'function' && typeof newVNode.component === 'function' && 
             oldVNode.component.name !== newVNode.component.name)
        ) {
            patches.push({
                type: PatchType.REPLACE,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                newVNode
            });
            return patches;
        }
        
        // Same component type, different props - update component
        const propsChanged = !this.shallowEqual(oldVNode.props, newVNode.props);
        const stateChanged = newVNode.state && (!oldVNode.state || !this.shallowEqual(oldVNode.state, newVNode.state));
        
        if (propsChanged || stateChanged) {
            patches.push({
                type: PatchType.COMPONENT,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                props: newVNode.props,
                state: newVNode.state
            });
        }
        
        return patches;
    }
    
    /**
     * Diff props (attributes/properties)
     * 
     * @param oldProps Old props
     * @param newProps New props
     * @returns Object with props to set and props to remove
     */
    private diffProps(oldProps: VNodeProps, newProps: VNodeProps): { 
        props: VNodeProps, 
        removedProps: string[] 
    } {
        const result: { props: VNodeProps, removedProps: string[] } = {
            props: {},
            removedProps: []
        };
        
        // Find props to update or add
        for (const [key, value] of Object.entries(newProps)) {
            if (!(key in oldProps) || oldProps[key] !== value) {
                result.props[key] = value;
            }
        }
        
        // Find props to remove
        for (const key of Object.keys(oldProps)) {
            if (!(key in newProps)) {
                result.removedProps.push(key);
            }
        }
        
        return result;
    }
    
    /**
     * Diff event listeners
     * 
     * @param oldVNode Old virtual element node
     * @param newVNode New virtual element node
     * @param patches Array of patches to append to
     */
    private diffEventListeners(
        oldVNode: VElementNode,
        newVNode: VElementNode,
        patches: Patch[]
    ): void {
        // If either node doesn't have event listeners, handle as prop changes
        if (!oldVNode.eventListeners || !newVNode.eventListeners) {
            return;
        }
        
        // This is a simplified implementation:
        // For a complete solution, we would need to track the actual event listener functions
        // and compare them. But for simplicity, we'll just assume a change if the event names
        // or counts have changed.
        
        const oldEvents = new Set(oldVNode.eventListeners.map(l => l.eventName));
        const newEvents = new Set(newVNode.eventListeners.map(l => l.eventName));
        
        // If the event sets are different, we need to update listeners
        if (
            oldEvents.size !== newEvents.size ||
            oldVNode.eventListeners.length !== newVNode.eventListeners.length ||
            !Array.from(oldEvents).every(e => newEvents.has(e))
        ) {
            // We'll handle this by doing a full replace of event listeners later
            // in the patching phase, no special patch needed here
        }
    }
    
 /**
     * Diff children of two virtual nodes
     * 
     * @param oldVNode Old virtual node with children
     * @param newVNode New virtual node with children
     * @param patches Array of patches to append to
     */
 private diffChildren(
    oldVNode: VElementNode | VFragmentNode,
    newVNode: VElementNode | VFragmentNode,
    patches: Patch[]
): void {
    const oldChildren = oldVNode.children;
    const newChildren = newVNode.children;
    
    // Simple case: no children in both old and new
    if (oldChildren.length === 0 && newChildren.length === 0) {
        return;
    }
    
    // Case: new children, but no old children
    if (oldChildren.length === 0) {
        for (const child of newChildren) {
            patches.push({
                type: PatchType.APPEND,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                child
            });
        }
        return;
    }
    
    // Case: old children, but no new children
    if (newChildren.length === 0) {
        for (const child of oldChildren) {
            patches.push({
                type: PatchType.REMOVE_CHILD,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                child,
                index: oldChildren.indexOf(child)
            });
        }
        return;
    }
    
    // Key-based reconciliation for more efficient updates
    if (this.hasKeys(oldChildren) && this.hasKeys(newChildren)) {
        this.diffChildrenWithKeys(oldVNode, newVNode, oldChildren, newChildren, patches);
        return;
    }
    
    // Fallback to position-based reconciliation
    this.diffChildrenByPosition(oldVNode, newVNode, oldChildren, newChildren, patches);
}

/**
 * Check if an array of virtual nodes has keys defined
 * 
 * @param children Array of virtual nodes
 * @returns True if all nodes have keys
 */
private hasKeys(children: VirtualNode[]): boolean {
    return children.every(child => {
        if (child.type === VNodeType.ELEMENT) {
            return (child as VElementNode).key != null;
        } else if (child.type === VNodeType.FRAGMENT) {
            return (child as VFragmentNode).key != null;
        } else if (child.type === VNodeType.COMPONENT) {
            return (child as VComponentNode).key != null;
        }
        return false;
    });
}

/**
 * Diff children using key-based reconciliation (more efficient)
 * 
 * @param oldVNode Old parent node
 * @param newVNode New parent node
 * @param oldChildren Old children array
 * @param newChildren New children array
 * @param patches Array of patches to append to
 */
private diffChildrenWithKeys(
    oldVNode: VElementNode | VFragmentNode,
    newVNode: VElementNode | VFragmentNode,
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
        const key = this.getNodeKey(child);
        if (key !== null) {
            oldKeyMap.set(key, { node: child, index: i });
        }
    }
    
    // Build new map
    for (let i = 0; i < newChildren.length; i++) {
        const child = newChildren[i];
        const key = this.getNodeKey(child);
        if (key !== null) {
            newKeyMap.set(key, { node: child, index: i });
        }
    }
    
    // Array to track processed old keys
    const processedKeys = new Set<string | number>();
    
    // Track the last position where a node was found or inserted
    let lastIndex = 0;
    
    // Process the new children
    for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i];
        const key = this.getNodeKey(newChild);
        
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
            const childPatches = this.diffNodes(oldChild, newChild);
            patches.push(...childPatches);
            
            // Check if we need to move the node
            if (oldIndex < lastIndex) {
                // Node needs to be moved forward
                patches.push({
                    type: PatchType.MOVE,
                    vNode: oldVNode,
                    domNode: oldVNode.domNode,
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
                vNode: oldVNode,
                domNode: oldVNode.domNode,
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
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                child: data.node,
                index: data.index
            });
        }
    }
}

/**
 * Diff children using position-based reconciliation (fallback)
 * 
 * @param oldVNode Old parent node
 * @param newVNode New parent node
 * @param oldChildren Old children array
 * @param newChildren New children array
 * @param patches Array of patches to append to
 */
private diffChildrenByPosition(
    oldVNode: VElementNode | VFragmentNode,
    newVNode: VElementNode | VFragmentNode,
    oldChildren: VirtualNode[],
    newChildren: VirtualNode[],
    patches: Patch[]
): void {
    // Use Longest Common Subsequence algorithm for minimizing operations
    const lcsMatrix = this.buildLCSMatrix(oldChildren, newChildren);
    
    // Backtrack through the LCS matrix to determine operations
    let i = oldChildren.length;
    let j = newChildren.length;
    
    // Temporary array to hold operations
    const operations: Array<{
        type: 'keep' | 'remove' | 'insert',
        oldIndex?: number,
        newIndex?: number
    }> = [];
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && this.areNodesEqual(oldChildren[i-1], newChildren[j-1])) {
            // Nodes are the same, keep and update if needed
            operations.unshift({ type: 'keep', oldIndex: i-1, newIndex: j-1 });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || lcsMatrix[i][j-1] >= lcsMatrix[i-1][j])) {
            // Insert node from new children
            operations.unshift({ type: 'insert', newIndex: j-1 });
            j--;
        } else if (i > 0 && (j === 0 || lcsMatrix[i][j-1] < lcsMatrix[i-1][j])) {
            // Remove node from old children
            operations.unshift({ type: 'remove', oldIndex: i-1 });
            i--;
        }
    }
    
    // Apply operations to create patches
    for (const op of operations) {
        if (op.type === 'keep') {
            // Update node if needed
            const oldChild = oldChildren[op.oldIndex!];
            const newChild = newChildren[op.newIndex!];
            const childPatches = this.diffNodes(oldChild, newChild);
            patches.push(...childPatches);
        } else if (op.type === 'remove') {
            // Remove node
            patches.push({
                type: PatchType.REMOVE_CHILD,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                child: oldChildren[op.oldIndex!],
                index: op.oldIndex!
            });
        } else if (op.type === 'insert') {
            // Insert node
            patches.push({
                type: PatchType.INSERT,
                vNode: oldVNode,
                domNode: oldVNode.domNode,
                child: newChildren[op.newIndex!],
                index: op.newIndex!
            });
        }
    }
}

/**
 * Build a Longest Common Subsequence matrix for two arrays of nodes
 * 
 * @param oldNodes First array of nodes
 * @param newNodes Second array of nodes
 * @returns LCS matrix
 */
private buildLCSMatrix(oldNodes: VirtualNode[], newNodes: VirtualNode[]): number[][] {
    const matrix: number[][] = Array(oldNodes.length + 1)
        .fill(0)
        .map(() => Array(newNodes.length + 1).fill(0));
    
    for (let i = 1; i <= oldNodes.length; i++) {
        for (let j = 1; j <= newNodes.length; j++) {
            if (this.areNodesEqual(oldNodes[i-1], newNodes[j-1])) {
                matrix[i][j] = matrix[i-1][j-1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i-1][j], matrix[i][j-1]);
            }
        }
    }
    
    return matrix;
}

/**
 * Get the key from a virtual node
 * 
 * @param node Virtual node
 * @returns Key or null if none
 */
private getNodeKey(node: VirtualNode): string | number | null {
    if (node.type === VNodeType.ELEMENT) {
        return (node as VElementNode).key || null;
    } else if (node.type === VNodeType.FRAGMENT) {
        return (node as VFragmentNode).key || null;
    } else if (node.type === VNodeType.COMPONENT) {
        return (node as VComponentNode).key || null;
    }
    return null;
}

/**
 * Check if two nodes are considered equal for diffing
 * 
 * @param nodeA First node
 * @param nodeB Second node
 * @returns True if nodes are considered equal
 */
private areNodesEqual(nodeA: VirtualNode, nodeB: VirtualNode): boolean {
    // Different types are not equal
    if (nodeA.type !== nodeB.type) {
        return false;
    }
    
    // Check equality based on node type
    switch (nodeA.type) {
        case VNodeType.ELEMENT:
            return (
                (nodeA as VElementNode).tagName === (nodeB as VElementNode).tagName &&
                this.getNodeKey(nodeA) === this.getNodeKey(nodeB)
            );
        case VNodeType.TEXT:
            return (nodeA as VTextNode).text === (nodeB as VTextNode).text;
        case VNodeType.COMMENT:
            return (nodeA as VCommentNode).text === (nodeB as VCommentNode).text;
        case VNodeType.COMPONENT:
            return (
                (nodeA as VComponentNode).component === (nodeB as VComponentNode).component &&
                this.getNodeKey(nodeA) === this.getNodeKey(nodeB)
            );
        case VNodeType.FRAGMENT:
            return this.getNodeKey(nodeA) === this.getNodeKey(nodeB);
        default:
            return false;
    }
}

/**
 * Find a child in a parent node by ID
 * 
 * @param parentNode Parent node
 * @param childId Child ID to find
 * @returns Child node or null if not found
 */
private findChildInParent(parentNode: VNode, childId: string): VirtualNode | null {
    if (parentNode.type === VNodeType.ELEMENT || parentNode.type === VNodeType.FRAGMENT) {
        const children = (parentNode as VElementNode | VFragmentNode).children;
        for (const child of children) {
            if (child.id === childId) {
                return child;
            }
        }
    }
    return null;
}

/**
 * Apply a patch to the DOM
 * 
 * @param patch Patch to apply
 */
private applyPatch(patch: Patch): void {
    if (!patch.vNode.domNode) {
        // Can't apply patch without a DOM node reference
        if (this.options.debug) {
            console.warn('Cannot apply patch to node without DOM reference', patch);
        }
        return;
    }
    
    // Handle different patch types
    switch (patch.type) {
        case PatchType.REPLACE:
            this.applyReplacePatch(patch as ReplacePatch);
            break;
        case PatchType.PROPS:
            this.applyPropsPatch(patch as PropsPatch);
            break;
        case PatchType.TEXT:
            this.applyTextPatch(patch as TextPatch);
            break;
        case PatchType.REMOVE:
            this.applyRemovePatch(patch as RemovePatch);
            break;
        case PatchType.APPEND:
            this.applyAppendPatch(patch as AppendPatch);
            break;
        case PatchType.INSERT:
            this.applyInsertPatch(patch as InsertPatch);
            break;
        case PatchType.REMOVE_CHILD:
            this.applyRemoveChildPatch(patch as RemoveChildPatch);
            break;
        case PatchType.MOVE:
            this.applyMovePatch(patch as MovePatch);
            break;
        case PatchType.COMPONENT:
            this.applyComponentPatch(patch as ComponentPatch);
            break;
        case PatchType.RERENDER:
            this.applyRerenderPatch(patch as RerenderPatch);
            break;
        case PatchType.NONE:
            // No changes needed
            break;
    }
}

/**
 * Apply a replace patch
 * 
 * @param patch Replace patch
 */
private applyReplacePatch(patch: ReplacePatch): void {
    const { vNode, domNode, newVNode } = patch;
    
    if (!domNode || !domNode.parentNode) {
        return;
    }
    
    // Create new DOM node
    const newDomNode = this.createDOMNode(newVNode);
    
    // Replace in parent
    domNode.parentNode.replaceChild(newDomNode, domNode);
    
    // Update DOM reference
    newVNode.domNode = newDomNode;
    
    // Update parent reference
    newVNode.parent = vNode.parent;
    
    // If parent has children, update the reference in the children array
    if (vNode.parent && (vNode.parent.type === VNodeType.ELEMENT || vNode.parent.type === VNodeType.FRAGMENT)) {
        const parent = vNode.parent as VElementNode | VFragmentNode;
        const index = parent.children.indexOf(vNode);
        if (index !== -1) {
            parent.children[index] = newVNode;
        }
    }
}

/**
 * Apply a props patch
 * 
 * @param patch Props patch
 */
private applyPropsPatch(patch: PropsPatch): void {
    const { vNode, domNode, props, removedProps } = patch;
    
    if (!domNode || !(domNode instanceof Element)) {
        return;
    }
    
    // Remove props
    for (const key of removedProps) {
        domNode.removeAttribute(key);
        
        // Also remove property if possible
        if (key in domNode) {
            (domNode as any)[key] = null;
        }
    }
    
    // Set new/updated props
    this.setProps(domNode, props);
    
    // Update props in the virtual node
    if (vNode.type === VNodeType.ELEMENT) {
        const elementNode = vNode as VElementNode;
        
        // Remove properties
        for (const key of removedProps) {
            delete elementNode.props[key];
        }
        
        // Update/add properties
        for (const [key, value] of Object.entries(props)) {
            elementNode.props[key] = value;
        }
        
        // Update classes if className was changed
        if ('className' in props || 'class' in props) {
            const className = props.className || props.class;
            if (typeof className === 'string') {
                elementNode.classes = className.split(/\s+/).filter(Boolean);
            }
        }
    }
}

/**
 * Apply a text patch
 * 
 * @param patch Text patch
 */
private applyTextPatch(patch: TextPatch): void {
    const { vNode, domNode, text } = patch;
    
    // Update DOM node text
    if (domNode) {
        if (domNode.nodeType === Node.TEXT_NODE) {
            (domNode as Text).nodeValue = text;
        } else if (domNode.nodeType === Node.COMMENT_NODE) {
            (domNode as Comment).nodeValue = text;
        } else if (domNode instanceof Element) {
            domNode.textContent = text;
        }
    }
    
    // Update virtual node
    if (vNode.type === VNodeType.TEXT) {
        (vNode as VTextNode).text = text;
    } else if (vNode.type === VNodeType.COMMENT) {
        (vNode as VCommentNode).text = text;
    }
}

/**
 * Apply a remove patch
 * 
 * @param patch Remove patch
 */
private applyRemovePatch(patch: RemovePatch): void {
    const { vNode, domNode } = patch;
    
    if (!domNode || !domNode.parentNode) {
        return;
    }
    
    // Call beforeRemove hook if it exists
    if (vNode.type === VNodeType.COMPONENT) {
        const componentNode = vNode as VComponentNode;
        if (componentNode.hooks?.beforeRemove) {
            componentNode.hooks.beforeRemove();
        }
    }
    
    // Remove from DOM
    domNode.parentNode.removeChild(domNode);
    
    // Clear DOM reference
    vNode.domNode = null;
    
    // Remove from parent's children if possible
    if (vNode.parent && (vNode.parent.type === VNodeType.ELEMENT || vNode.parent.type === VNodeType.FRAGMENT)) {
        const parent = vNode.parent as VElementNode | VFragmentNode;
        const index = parent.children.indexOf(vNode);
        if (index !== -1) {
            parent.children.splice(index, 1);
        }
    }
}

/**
 * Apply an append patch
 * 
 * @param patch Append patch
 */
private applyAppendPatch(patch: AppendPatch): void {
    const { vNode, domNode, child } = patch;
    
    if (!domNode) {
        return;
    }
    
    // Create DOM node for child
    const childDomNode = this.createDOMNode(child);
    
    // Append to parent
    domNode.appendChild(childDomNode);
    
    // Update DOM reference
    child.domNode = childDomNode;
    
    // Update parent reference
    child.parent = vNode;
    
    // Add to parent's children if possible
    if (vNode.type === VNodeType.ELEMENT || vNode.type === VNodeType.FRAGMENT) {
        (vNode as VElementNode | VFragmentNode).children.push(child);
    }
}

/**
 * Apply an insert patch
 * 
 * @param patch Insert patch
 */
private applyInsertPatch(patch: InsertPatch): void {
    const { vNode, domNode, child, index } = patch;
    
    if (!domNode) {
        return;
    }
    
    // Create DOM node for child
    const childDomNode = this.createDOMNode(child);
    
    // Insert at specified position
    const children = Array.from(domNode.childNodes);
    if (index < children.length) {
        domNode.insertBefore(childDomNode, children[index]);
    } else {
        domNode.appendChild(childDomNode);
    }
    
    // Update DOM reference
    child.domNode = childDomNode;
    
    // Update parent reference
    child.parent = vNode;
    
    // Add to parent's children at the specified index if possible
    if (vNode.type === VNodeType.ELEMENT || vNode.type === VNodeType.FRAGMENT) {
        const parentNode = vNode as VElementNode | VFragmentNode;
        parentNode.children.splice(index, 0, child);
    }
}

/**
 * Apply a remove child patch
 * 
 * @param patch Remove child patch
 */
private applyRemoveChildPatch(patch: RemoveChildPatch): void {
    const { vNode, domNode, child, index } = patch;
    
    if (!domNode || !child.domNode) {
        return;
    }
    
    // Call beforeRemove hook if it exists
    if (child.type === VNodeType.COMPONENT) {
        const componentNode = child as VComponentNode;
        if (componentNode.hooks?.beforeRemove) {
            componentNode.hooks.beforeRemove();
        }
    }
    
    // Remove from DOM
    domNode.removeChild(child.domNode);
    
    // Clear DOM reference
    child.domNode = null;
    
    // Remove from parent's children
    if (vNode.type === VNodeType.ELEMENT || vNode.type === VNodeType.FRAGMENT) {
        const parentNode = vNode as VElementNode | VFragmentNode;
        parentNode.children.splice(index, 1);
    }
}

/**
 * Apply a move patch
 * 
 * @param patch Move patch
 */
private applyMovePatch(patch: MovePatch): void {
    const { vNode, domNode, child, fromIndex, toIndex } = patch;
    
    if (!domNode || !child.domNode) {
        return;
    }
    
    // Remove from current position
    domNode.removeChild(child.domNode);
    
    // Insert at new position
    const children = Array.from(domNode.childNodes);
    
    // Adjust index for insertion based on whether the moved node was before or after the target
    const adjustedIndex = fromIndex < toIndex ? toIndex : toIndex;
    
    if (adjustedIndex < children.length) {
        domNode.insertBefore(child.domNode, children[adjustedIndex]);
    } else {
        domNode.appendChild(child.domNode);
    }
    
    // Update parent's children array
    if (vNode.type === VNodeType.ELEMENT || vNode.type === VNodeType.FRAGMENT) {
        const parentNode = vNode as VElementNode | VFragmentNode;
        
        // Remove from old position
        parentNode.children.splice(fromIndex, 1);
        
        // Insert at new position
        parentNode.children.splice(toIndex, 0, child);
    }
}

/**
 * Apply a component patch
 * 
 * @param patch Component patch
 */
private applyComponentPatch(patch: ComponentPatch): void {
    const { vNode, domNode, props, state } = patch;
    
    if (!domNode) {
        return;
    }
    
    // Only applicable to component nodes
    if (vNode.type !== VNodeType.COMPONENT) {
        return;
    }
    
    const componentNode = vNode as VComponentNode;
    
    // Call beforeUpdate hook if it exists
    if (componentNode.hooks?.beforeUpdate) {
        componentNode.hooks.beforeUpdate();
    }
    
    // Update props
    componentNode.props = { ...componentNode.props, ...props };
    
    // Update state if provided
    if (state) {
        componentNode.state = state;
    }
    
    // This would typically trigger a re-render of the component
    // For this implementation, we just update the props and state
    
    // Call afterUpdate hook if it exists
    if (componentNode.hooks?.afterUpdate) {
        componentNode.hooks.afterUpdate();
    }
}

/**
 * Apply a re-render patch
 * 
 * @param patch Re-render patch
 */
private applyRerenderPatch(patch: RerenderPatch): void {
    const { vNode, domNode, newVNode } = patch;
    
    if (!domNode || !domNode.parentNode) {
        return;
    }
    
    // Similar to replace, but specifically for subtree re-renders
    // Create new DOM node
    const newDomNode = this.createDOMNode(newVNode);
    
    // Replace in parent
    domNode.parentNode.replaceChild(newDomNode, domNode);
    
    // Update DOM reference
    newVNode.domNode = newDomNode;
    
    // Update parent reference
    newVNode.parent = vNode.parent;
    
    // If parent has children, update the reference in the children array
    if (vNode.parent && (vNode.parent.type === VNodeType.ELEMENT || vNode.parent.type === VNodeType.FRAGMENT)) {
        const parent = vNode.parent as VElementNode | VFragmentNode;
        const index = parent.children.indexOf(vNode);
        if (index !== -1) {
            parent.children[index] = newVNode;
        }
    }
}

/**
 * Perform a shallow equality check on two objects
 * 
 * @param objA First object
 * @param objB Second object
 * @returns True if objects have the same keys and values
 */
private shallowEqual(objA: any, objB: any): boolean {
    if (objA === objB) {
        return true;
    }
    
    if (typeof objA !== 'object' || objA === null || 
        typeof objB !== 'object' || objB === null) {
        return false;
    }
    
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    
    if (keysA.length !== keysB.length) {
        return false;
    }
    
    for (const key of keysA) {
        if (!objB.hasOwnProperty(key) || objA[key] !== objB[key]) {
            return false;
        }
    }
    
    return true;
}
}