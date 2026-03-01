/**
 * VHTMLNode.ts
 * 
 * HTML-specific virtual node interface for the OBIX framework.
 * This extends the core VirtualDOM system with HTML-specific functionality.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { VElementNode, VNodeProps, VNodeType } from '../vdom/VirtualDOM';

/**
 * HTML-specific node attributes
 */
export interface VHTMLAttributes extends VNodeProps {
    // Core HTML attributes
    id?: string;
    class?: string;
    className?: string;
    style?: string | { [key: string]: string | number };
    title?: string;
    tabIndex?: number;
    contentEditable?: boolean | 'true' | 'false';
    draggable?: boolean | 'true' | 'false';
    hidden?: boolean;
    
    // HTML event handlers
    onClick?: (event: MouseEvent) => void;
    onDblClick?: (event: MouseEvent) => void;
    onMouseDown?: (event: MouseEvent) => void;
    onMouseUp?: (event: MouseEvent) => void;
    onMouseOver?: (event: MouseEvent) => void;
    onMouseOut?: (event: MouseEvent) => void;
    onMouseMove?: (event: MouseEvent) => void;
    onKeyDown?: (event: KeyboardEvent) => void;
    onKeyUp?: (event: KeyboardEvent) => void;
    onKeyPress?: (event: KeyboardEvent) => void;
    onFocus?: (event: FocusEvent) => void;
    onBlur?: (event: FocusEvent) => void;
    onChange?: (event: Event) => void;
    onInput?: (event: Event) => void;
    onSubmit?: (event: Event) => void;
    
    // Form attributes
    name?: string;
    value?: string | number | string[] | undefined;
    disabled?: boolean;
    checked?: boolean;
    selected?: boolean;
    readOnly?: boolean;
    placeholder?: string;
    required?: boolean;
    
    // Link attributes
    href?: string;
    target?: string;
    rel?: string;
    
    // Media attributes
    src?: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    
    // Table attributes
    colSpan?: number;
    rowSpan?: number;
    
    // Misc attributes
    role?: string;
    ariaLabel?: string;
    ariaDescribedby?: string;
    ariaLabelledby?: string;
    ariaHidden?: boolean | 'true' | 'false';
    type?: string;
    
    // Data attributes - allow any data-* attribute
    [dataAttr: `data-${string}`]: string | number | boolean;
    
    // ARIA attributes - allow any aria-* attribute
    [ariaAttr: `aria-${string}`]: string | number | boolean;
    
    // Dangerous HTML content
    dangerouslySetInnerHTML?: { __html: string };
}

/**
 * HTML-specific virtual node interface
 */
export interface VHTMLNode extends VElementNode {
    /** Override type to be element */
    type: VNodeType.ELEMENT;
    /** HTML-specific attributes */
    props: VHTMLAttributes;
    /** DOM reference as HTMLElement */
    domNode?: HTMLElement | null;
    /** Original HTML source (for debugging) */
    sourceHTML?: string;
    /** Flag indicating whether this is a void element (self-closing) */
    isVoid?: boolean;
    /** Component state transitions */
    stateTransitions?: Map<string, string>;
}

/**
 * HTML-specific component props
 */
export interface VHTMLComponentProps {
    /** Component properties */
    props: VHTMLAttributes;
    /** Children nodes or text */
    children?: (VHTMLNode | string)[];
    /** Component state */
    state?: any;
    /** Key for reconciliation */
    key?: string | number;
    /** Ref for DOM access */
    ref?: (element: HTMLElement | null) => void;
    /** State transition signature */
    stateSignature?: string;
}

/**
 * Check if a tag name represents a void element (self-closing)
 * 
 * @param tagName HTML tag name
 * @returns True if the tag is a void element
 */
export function isVoidElement(tagName: string): boolean {
    const voidElements = new Set([
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ]);
    
    return voidElements.has(tagName.toLowerCase());
}