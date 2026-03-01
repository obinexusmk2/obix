/**
 * VHTMLNodeImpl.ts
 * 
 * Implementation of the HTML-specific virtual node for the OBIX framework.
 * This module provides the concrete implementation of VHTMLNode with factory methods
 * for creating HTML virtual nodes.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { CreateVNodeOptions, VNodeType, VirtualNode } from '../vdom/VirtualDOM';
import { isVoidElement, VHTMLAttributes, VHTMLComponentProps, VHTMLNode } from './VHTMLNode';
import { MRUCache } from '../cache/MRUCache';

/**
 * Configuration options for creating VHTMLNodes
 */
export interface VHTMLCreateOptions extends CreateVNodeOptions {
    /** Original HTML source (for debugging) */
    sourceHTML?: string;
    /** Flag indicating whether this is a void element (self-closing) */
    isVoid?: boolean;
    /** Component state transitions */
    stateTransitions?: Map<string, string>;
    /** Whether to optimize rendering */
    optimize?: boolean;
    /** Namespace URI for SVG elements */
    namespace?: string;
}

/**
 * HTML node cache for optimization
 */
const htmlNodeCache = new MRUCache<string, VHTMLNode>({
    capacity: 1000,
    trackTransitions: true,
    cleanupInterval: 60000
});

/**
 * Counter for generating unique IDs
 */
let idCounter = 0;

/**
 * Generate a unique ID for HTML nodes
 * 
 * @param prefix Optional prefix for the ID
 * @returns A unique ID string
 */
function generateId(prefix: string = 'html'): string {
    return `${prefix}-${(idCounter++).toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a new VHTMLNode
 * 
 * @param tagName HTML tag name
 * @param props Node properties/attributes
 * @param children Child nodes or text
 * @param options Additional options
 * @returns The created VHTMLNode
 */
export function createVHTMLNode(
    tagName: string,
    props: VHTMLAttributes = {},
    children: (VHTMLNode | VirtualNode | string)[] = [],
    options: VHTMLCreateOptions = {}
): VHTMLNode {
    // Check if this is a void element
    const isVoid = options.isVoid ?? isVoidElement(tagName);
    
    // Generate a unique ID for the node
    const id = options.key ? `html-${tagName}-${options.key}` : generateId(`html-${tagName}`);
    
    // Process children (convert strings to text nodes and validate void elements)
    const processedChildren: VirtualNode[] = [];
    
    if (!isVoid) {
        for (const child of children) {
            if (typeof child === 'string') {
                processedChildren.push({
                    id: generateId('text'),
                    type: VNodeType.TEXT,
                    text: child,
                    parent: null
                });
            } else {
                processedChildren.push(child);
            }
        }
    } else if (children.length > 0 && options.optimize !== false) {
        console.warn(`Void element <${tagName}> cannot have children. Children will be ignored.`);
    }
    
    // Process className/class for consistency
    if (props.class && !props.className) {
        props.className = props.class;
        delete props.class;
    }
    
    // Extract classes for optimization
    let classes: string[] | undefined;
    if (props.className) {
        classes = props.className.split(/\s+/).filter(Boolean);
    }
    
    // Create the node
    const node: VHTMLNode = {
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
        eventListeners: [],
        sourceHTML: options.sourceHTML,
        isVoid,
        stateTransitions: options.stateTransitions ? new Map(options.stateTransitions) : undefined
    };
    
    // Set parent reference for children
    processedChildren.forEach(child => {
        child.parent = node;
    });
    
    // Convert event handlers in props to eventListeners array
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            node.eventListeners!.push({
                eventName,
                handler: value
            });
        }
    }
    
    // Cache the node if state signature is provided
    if (options.stateSignature && options.optimize !== false) {
        htmlNodeCache.set(id, node, options.stateSignature);
    }
    
    return node;
}

/**
 * Creates a fragment of VHTMLNodes
 * 
 * @param children Child nodes or text
 * @param options Additional options
 * @returns A fragment virtual node
 */
export function createVHTMLFragment(
    children: (VHTMLNode | VirtualNode | string)[] = [],
    options: VHTMLCreateOptions = {}
): VirtualNode {
    // Generate a unique ID for the fragment
    const id = options.key ? `html-fragment-${options.key}` : generateId('html-fragment');
    
    // Process children (convert strings to text nodes)
    const processedChildren: VirtualNode[] = children.map(child => {
        if (typeof child === 'string') {
            return {
                id: generateId('text'),
                type: VNodeType.TEXT,
                text: child,
                parent: null
            };
        }
        return child;
    });
    
    // Create the fragment node
    const fragmentNode: VirtualNode = {
        id,
        type: VNodeType.FRAGMENT,
        children: processedChildren,
        key: options.key || null,
        stateSignature: options.stateSignature,
        domNode: null,
        parent: null
    };
    
    // Set parent reference for children
    processedChildren.forEach(child => {
        child.parent = fragmentNode;
    });
    
    return fragmentNode;
}

/**
 * Creates a text node
 * 
 * @param text Text content
 * @param options Additional options
 * @returns A text virtual node
 */
export function createVHTMLText(
    text: string,
    options: VHTMLCreateOptions = {}
): VirtualNode {
    // Generate a unique ID for the text node
    const id = options.key ? `html-text-${options.key}` : generateId('html-text');
    
    // Create the text node
    const textNode: VirtualNode = {
        id,
        type: VNodeType.TEXT,
        text,
        stateSignature: options.stateSignature,
        domNode: null,
        parent: null
    };
    
    return textNode;
}

/**
 * Creates a comment node
 * 
 * @param text Comment text
 * @param options Additional options
 * @returns A comment virtual node
 */
export function createVHTMLComment(
    text: string,
    options: VHTMLCreateOptions = {}
): VirtualNode {
    // Generate a unique ID for the comment node
    const id = options.key ? `html-comment-${options.key}` : generateId('html-comment');
    
    // Create the comment node
    const commentNode: VirtualNode = {
        id,
        type: VNodeType.COMMENT,
        text,
        stateSignature: options.stateSignature,
        domNode: null,
        parent: null
    };
    
    return commentNode;
}

/**
 * Factory for creating HTML nodes with a specific tag
 * 
 * @param tagName HTML tag name
 * @returns A function that creates nodes with that tag
 */
export function createTagFactory(tagName: string) {
    return (
        props: VHTMLAttributes = {},
        children: (VHTMLNode | VirtualNode | string)[] = [],
        options: VHTMLCreateOptions = {}
    ) => createVHTMLNode(tagName, props, children, options);
}

/**
 * Get a node from the cache if it exists
 * 
 * @param id Node ID
 * @returns Cached node or null if not found
 */
export function getVHTMLNodeFromCache(id: string): VHTMLNode | null {
    return htmlNodeCache.get(id) || null;
}

/**
 * Check if a node is cached
 * 
 * @param id Node ID
 * @returns True if the node is cached
 */
export function isVHTMLNodeCached(id: string): boolean {
    return htmlNodeCache.has(id);
}

/**
 * Clear the HTML node cache
 */
export function clearVHTMLNodeCache(): void {
    htmlNodeCache.clear();
}

// Common HTML tag factories
export const div = createTagFactory('div');
export const span = createTagFactory('span');
export const p = createTagFactory('p');
export const a = createTagFactory('a');
export const button = createTagFactory('button');
export const input = createTagFactory('input');
export const img = createTagFactory('img');
export const h1 = createTagFactory('h1');
export const h2 = createTagFactory('h2');
export const h3 = createTagFactory('h3');
export const h4 = createTagFactory('h4');
export const h5 = createTagFactory('h5');
export const h6 = createTagFactory('h6');
export const ul = createTagFactory('ul');
export const ol = createTagFactory('ol');
export const li = createTagFactory('li');
export const table = createTagFactory('table');
export const tr = createTagFactory('tr');
export const td = createTagFactory('td');
export const th = createTagFactory('th');
export const form = createTagFactory('form');
export const label = createTagFactory('label');
export const select = createTagFactory('select');
export const option = createTagFactory('option');
export const textarea = createTagFactory('textarea');