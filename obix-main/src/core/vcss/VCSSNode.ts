// src/parser/css/vcss/VCSSNode.ts

import { CSSNode } from '../../../ast/node/CSSNode.js';

/**
 * Properties interface for CSS virtual nodes
 */
export interface VCSSNodeProps {
  [key: string]: any;
  selector?: string;
  property?: string;
  value?: string;
  important?: boolean;
  name?: string;
  prelude?: string;
  declarations?: Record<string, string>;
}

/**
 * State information for CSS virtual nodes
 */
export interface VCSSNodeState {
  id: number;
  transitions: Map<string, VCSSNodeState>;
  isMinimized: boolean;
  equivalenceClass: number | null;
}

/**
 * CSS Virtual Node
 * Implements virtual DOM representation for CSS with state minimization
 */
export class VCSSNode {
  public static nodeCounter = 0;

  public readonly type: string;
  public readonly props: VCSSNodeProps;
  public readonly children: VCSSNode[];
  public readonly key: string | number | undefined;
  public readonly state: VCSSNodeState;

  constructor(
    type: string,
    props: VCSSNodeProps = {},
    children: VCSSNode[] = [],
    key?: string | number
  ) {
    this.type = type;
    this.props = Object.freeze({ ...props });
    this.children = [...children];
    this.key = key;
    
    this.state = {
      id: VCSSNode.nodeCounter++,
      transitions: new Map(),
      isMinimized: false,
      equivalenceClass: null
    };
  }

  /**
   * Create a CSS rule node
   */
  public static createStyleRule(selector: string, declarations: Record<string, string>): VCSSNode {
    return new VCSSNode('rule', {
      selector,
      declarations: Object.freeze({ ...declarations })
    });
  }

  /**
   * Create an at-rule node
   */
  public static createAtRule(name: string, prelude: string, block?: VCSSNode): VCSSNode {
    return new VCSSNode('at-rule', {
      name,
      prelude,
      block
    });
  }

  /**
   * Create a stylesheet node from multiple rules
   */
  public static createStylesheet(rules: VCSSNode[]): VCSSNode {
    return new VCSSNode('stylesheet', {}, rules);
  }

  /**
   * Convert from AST node to VNode
   */
  public static fromASTNode(node: CSSNode): VCSSNode {
    // Implementation that converts from AST to VNode
    const props: VCSSNodeProps = {};
    
    if (node.value) {
      props.value = node.value;
    }
    
    // Extract type-specific properties
    switch (node.type) {
      case 'rule':
        if (node.selector) props.selector = node.selector;
        props.declarations = {};
        
        // Extract declarations from children
        for (const child of node.children) {
          if (child.type === 'declaration') {
            const property = child.children.find(c => c.type === 'property');
            const value = child.children.find(c => c.type === 'value');
            
            if (property?.value && value?.value) {
              props.declarations[property.value] = value.value;
            }
          }
        }
        break;
        
      case 'at-rule':
        if (node.name) props.name = node.name;
        if (node.prelude) props.prelude = node.prelude;
        break;
    }
    
    // Build children recursively
    const children = node.children
      .filter(child => ['rule', 'at-rule'].includes(child.type))
      .map(child => VCSSNode.fromASTNode(child));
    
    return new VCSSNode(node.type, props, children);
  }

  /**
   * Clone this node with optional new props and children
   */
  public clone(
    props: Partial<VCSSNodeProps> = {},
    children: VCSSNode[] = this.children
  ): VCSSNode {
    return new VCSSNode(
      this.type,
      { ...this.props, ...props },
      children,
      this.key
    );
  }

  /**
   * Compare with another node for equality
   */
  public equals(other: VCSSNode): boolean {
    if (this.type !== other.type) return false;
    if (this.key !== other.key) return false;
    
    // Compare props
    const thisPropsKeys = Object.keys(this.props);
    const otherPropsKeys = Object.keys(other.props);
    
    if (thisPropsKeys.length !== otherPropsKeys.length) return false;
    
    for (const key of thisPropsKeys) {
      if (key === 'declarations') {
        const thisDecls = this.props.declarations || {};
        const otherDecls = other.props.declarations || {};
        const thisKeys = Object.keys(thisDecls);
        const otherKeys = Object.keys(otherDecls);
        
        if (thisKeys.length !== otherKeys.length) return false;
        
        for (const declKey of thisKeys) {
          if (thisDecls[declKey] !== otherDecls[declKey]) return false;
        }
      } else if (this.props[key] !== other.props[key]) {
        return false;
      }
    }
    
    // Compare children
    if (this.children.length !== other.children.length) return false;
    
    for (let i = 0; i < this.children.length; i++) {
      if (!other.children[i] || !this.children[i].equals(other.children[i])) return false;
    }
    
    return true;
  }

  /**
   * Generate a state signature for optimizations
   */
  public getStateSignature(): string {
    const components = [
      this.type,
      this.key?.toString() || '',
      this.getPropsSignature(),
      this.children.map(child => child.state.id).join(',')
    ];
    
    return components.join('|');
  }

  /**
   * Get a signature for this node's props
   */
  public getPropsSignature(): string {
    const { declarations, ...otherProps } = this.props;
    const sortedProps = Object.entries(otherProps).sort();
    
    if (declarations) {
      const sortedDeclarations = Object.entries(declarations)
        .sort()
        .map(([k, v]) => `${k}:${v}`)
        .join(';');
      sortedProps.push(['declarations', sortedDeclarations]);
    }
    
    return sortedProps.map(([k, v]) => `${k}=${v}`).join(',');
  }

  /**
   * Convert to CSS string
   */
  public toCSS(): string {
    switch (this.type) {
      case 'stylesheet':
        return this.children.map(child => child.toCSS()).join('\n\n');
        
      case 'rule':
        const { selector, declarations } = this.props;
        if (!selector || !declarations) return '';
        
        const rules = Object.entries(declarations)
          .map(([property, value]) => `  ${property}: ${value};`)
          .join('\n');
          
        return `${selector} {\n${rules}\n}`;
        
      case 'at-rule':
        const { name, prelude, block } = this.props;
        if (!name) return '';
        
        const blockCSS = block ? ` {\n${block.toCSS()}\n}` : ';';
        return `@${name} ${prelude || ''}${blockCSS}`;
        
      default:
        return '';
    }
  }

  /**
   * Set equivalence class for this node
   */
  public setEquivalenceClass(classId: number): void {
    (this.state as any).equivalenceClass = classId;
  }

  /**
   * Apply optimization by flagging as minimized
   */
  public minimize(): VCSSNode {
    if (this.state.isMinimized) return this;
    
    // Clone with minimized state
    const minimized = this.clone();
    (minimized.state as any).isMinimized = true;
    
    // Recursively minimize children
    minimized.children.forEach((child, index) => {
      minimized.children[index] = child.minimize();
    });
    
    return minimized;
  }
}