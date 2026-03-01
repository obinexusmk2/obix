/**
 * VHTMLConverters.ts
 * 
 * Converters between VNode and HTML AST representations for OBIX framework.
 * These converters enable automaton state minimization techniques to be applied
 * to virtual DOM structures by mapping between representations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { VNode, VNodeProps, createVNode } from './VHTMLNode';
import { HTMLAst } from '../../ast/html/optimizers/HTMLAst';
import { HTMLNode, HTMLNodeType } from '../../ast/html/node/HTMLNode';
import { HTMLElementNode } from '../../ast/html/node/HTMLElementNode';
import { HTMLTextNode } from '../../ast/html/node/HTMLTextNode';
import { HTMLRootNode } from '../../ast/html/node/HTMLRootNode';
import { HTMLCommentNode } from '../../ast/html/node/HTMLCommentNode';
import { Position } from '../../ast/html/node/HTMLNode';

/**
 * Converter from VNode to HTML AST
 */
export class VNodeToAstConverter {
  /** Counter for generating node positions */
  private positionCounter: number;
  /** Map from VNodes to HTML nodes for reference tracking */
  private nodeMap: WeakMap<VNode, HTMLNode>;
  
  /**
   * Create a new converter
   */
  constructor() {
    this.positionCounter = 0;
    this.nodeMap = new WeakMap();
  }
  
  /**
   * Convert a VNode tree to an HTML AST
   */
  public convert(vnode: VNode): HTMLAst {
    // Create root node
    const rootNode = new HTMLRootNode();
    
    // Convert the VNode tree
    const htmlNode = this.convertVNode(vnode);
    
    // Add converted node to root
    if (htmlNode) {
      rootNode.appendChild(htmlNode);
    }
    
    // Create AST with metadata
    const ast: HTMLAst = {
      root: rootNode,
      metadata: {
        nodeCount: this.countNodes(rootNode),
        elementCount: this.countNodesByType(rootNode, HTMLNodeType.ELEMENT),
        textCount: this.countNodesByType(rootNode, HTMLNodeType.TEXT),
        commentCount: this.countNodesByType(rootNode, HTMLNodeType.COMMENT)
      }
    };
    
    return ast;
  }
  
  /**
   * Convert a single VNode to an HTML node
   */
  private convertVNode(vnode: VNode): HTMLNode | null {
    if (!vnode) {
      return null;
    }
    
    let htmlNode: HTMLNode;
    
    // Create appropriate HTML node based on VNode type
    if (vnode.isText) {
      // Text node
      const position = this.nextPosition();
      htmlNode = new HTMLTextNode(vnode.text || '', position);
    } else if (typeof vnode.type === 'string') {
      // Element node
      const position = this.nextPosition();
      const attributes = new Map();
      
      // Convert props to attributes
      for (const key in vnode.props) {
        if (key !== 'children') {
          const value = vnode.props[key];
          if (value !== undefined && value !== null) {
            attributes.set(key, {
              name: key,
              value: typeof value === 'object' ? JSON.stringify(value) : String(value),
              quoted: true
            });
          }
        }
      }
      
      htmlNode = new HTMLElementNode(
        vnode.type,
        attributes,
        position,
        false, // selfClosing
        undefined as any // sourceToken
      );
      
      // Convert children
      if (vnode.children) {
        for (const child of vnode.children) {
          const childNode = this.convertVNode(child);
          if (childNode) {
            htmlNode.appendChild(childNode);
          }
        }
      }
    } else {
      // Unsupported node type (e.g., component)
      return null;
    }
    
    // Set up state machine data
    if (vnode.stateMachine) {
      // Copy equivalence class information
      htmlNode.stateMachine.equivalenceClass = vnode.stateMachine.equivalenceClass;
      
      // Copy transition information if available
      if (vnode.stateMachine.transitions) {
        for (const [symbol, targetNode] of vnode.stateMachine.transitions.entries()) {
          // Check if we have already converted the target node
          const targetHtmlNode = this.nodeMap.get(targetNode);
          if (targetHtmlNode) {
            htmlNode.addTransition(symbol, targetHtmlNode);
          }
        }
      }
    }
    
    // Store mapping from VNode to HTML node
    this.nodeMap.set(vnode, htmlNode);
    
    return htmlNode;
  }
  
  /**
   * Generate a unique position for a node
   */
  private nextPosition(): Position {
    this.positionCounter += 10;
    return {
      start: this.positionCounter - 10,
      end: this.positionCounter,
      line: Math.floor(this.positionCounter / 80) + 1,
      column: this.positionCounter % 80
    };
  }
  
  /**
   * Count total nodes in an HTML AST
   */
  private countNodes(node: HTMLNode): number {
    let count = 1; // Count this node
    
    // Count children recursively
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    
    return count;
  }
  
  /**
   * Count nodes of a specific type in an HTML AST
   */
  private countNodesByType(node: HTMLNode, type: HTMLNodeType): number {
    let count = node.type === type ? 1 : 0;
    
    // Count children recursively
    for (const child of node.children) {
      count += this.countNodesByType(child, type);
    }
    
    return count;
  }
}

/**
 * Converter from HTML AST to VNode
 */
export class AstToVNodeConverter {
  /** Map from HTML nodes to VNodes for reference tracking */
  private nodeMap: WeakMap<HTMLNode, VNode>;
  /** Counter for generating unique keys */
  private keyCounter: number;
  
  /**
   * Create a new converter
   */
  constructor() {
    this.nodeMap = new WeakMap();
    this.keyCounter = 0;
  }
  
  /**
   * Convert an HTML AST to a VNode tree
   */
  public convert(ast: HTMLAst): VNode {
    // Start with the root's first child as our root VNode
    if (ast.root.children.length === 0) {
      // Empty AST, return a placeholder div
      return createVNode('div', { key: 'empty-root' }, []);
    }
    
    // Convert the first child of the root
    return this.convertHtmlNode(ast.root.children[0]);
  }
  
  /**
   * Convert a single HTML node to a VNode
   */
  private convertHtmlNode(htmlNode: HTMLNode): VNode {
    // Check if we've already converted this node
    const existingVNode = this.nodeMap.get(htmlNode);
    if (existingVNode) {
      return existingVNode;
    }
    
    let vnode: VNode;
    
    if (htmlNode.type === HTMLNodeType.TEXT) {
      // Text node
      const textNode = htmlNode as HTMLTextNode;
      vnode = {
        type: '',
        props: {},
        isText: true,
        text: textNode.content,
        children: [],
        isComponent: false,
        isMinimized: false,
        stateMachine: {
          equivalenceClass: htmlNode.stateMachine.equivalenceClass,
          isMinimized: htmlNode.stateMachine.isMinimized,
          stateSignature: htmlNode.stateMachine.stateSignature,
          transitions: new Map(),
          transitionCount: 0
        },
        computeSignature: () => htmlNode.computeStateSignature(),
        markAsMinimized: () => { vnode.isMinimized = true; },
        clone: (deep = false) => this.cloneVNode(vnode, deep),
        isEquivalentTo: (other: VNode) => this.areVNodesEquivalent(vnode, other),
        attachElement: (elm) => { vnode.elm = elm; },
        detachElement: () => { vnode.elm = null; }
      };
    } else if (htmlNode.type === HTMLNodeType.ELEMENT) {
      // Element node
      const elementNode = htmlNode as HTMLElementNode;
      const tagName = elementNode.tagName;
      
      // Convert attributes to props
      const props: VNodeProps = {};
      
      elementNode.attributes.forEach((attr, key) => {
        // Parse JSON values if possible
        let value: any = attr.value;
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        } else if (value === 'true') {
          value = true;
        } else if (value === 'false') {
          value = false;
        } else if (!isNaN(Number(value)) && !value.startsWith('0') && value.trim() !== '') {
          value = Number(value);
        }
        
        props[key] = value;
      });
      
      // Add unique key if none exists
      if (!props.key) {
        props.key = `ast-node-${this.keyCounter++}`;
      }
      
      // Convert children
      const children: VNode[] = [];
      for (const child of htmlNode.children) {
        children.push(this.convertHtmlNode(child));
      }
      
      // Create the VNode
      vnode = {
        type: tagName,
        props,
        children,
        isText: false,
        isComponent: false,
        isMinimized: htmlNode.stateMachine.isMinimized || false,
        tagName,
        htmlType: HTMLNodeType.ELEMENT,
        stateMachine: {
          equivalenceClass: htmlNode.stateMachine.equivalenceClass,
          isMinimized: htmlNode.stateMachine.isMinimized,
          stateSignature: htmlNode.stateMachine.stateSignature,
          transitions: new Map(),
          transitionCount: 0
        },
        computeSignature: () => htmlNode.computeStateSignature(),
        markAsMinimized: () => { vnode.isMinimized = true; },
        clone: (deep = false) => this.cloneVNode(vnode, deep),
        isEquivalentTo: (other: VNode) => this.areVNodesEquivalent(vnode, other),
        attachElement: (elm) => { vnode.elm = elm; },
        detachElement: () => { vnode.elm = null; }
      };
      
      // Set parent references for children
      for (const child of children) {
        child.parent = vnode;
      }
    } else {
      // Unsupported node type, create placeholder
      vnode = {
        type: 'div',
        props: { key: `unsupported-${this.keyCounter++}` },
        children: [],
        isText: false,
        isComponent: false,
        isMinimized: false,
        stateMachine: {
          equivalenceClass: null,
          isMinimized: false,
          stateSignature: null,
          transitions: new Map(),
          transitionCount: 0
        },
        computeSignature: () => `unsupported-${vnode.props.key}`,
        markAsMinimized: () => { vnode.isMinimized = true; },
        clone: (deep = false) => this.cloneVNode(vnode, deep),
        isEquivalentTo: (other: VNode) => false,
        attachElement: (elm) => { vnode.elm = elm; },
        detachElement: () => { vnode.elm = null; }
      };
    }
    
    // Store mapping from HTML node to VNode
    this.nodeMap.set(htmlNode, vnode);
    
    // Copy transitions
    if (htmlNode.stateMachine) {
      const symbols = htmlNode.getTransitionSymbols();
      for (const symbol of symbols) {
        const targetHtmlNode = htmlNode.getTransition(symbol);
        if (targetHtmlNode) {
          // Check if target has been converted yet
          if (this.nodeMap.has(targetHtmlNode)) {
            const targetVNode = this.nodeMap.get(targetHtmlNode)!;
            vnode.stateMachine.transitions.set(symbol, targetVNode);
            vnode.stateMachine.transitionCount++;
          }
        }
      }
    }
    
    return vnode;
  }
  
  /**
   * Clone a VNode
   */
  private cloneVNode(vnode: VNode, deep: boolean): VNode {
    const clone: VNode = {
      ...vnode,
      props: { ...vnode.props },
      children: deep ? vnode.children.map(child => this.cloneVNode(child, deep)) : [...vnode.children],
      stateMachine: {
        ...vnode.stateMachine,
        transitions: new Map(vnode.stateMachine.transitions)
      }
    };
    
    // Update parent references if deep cloning
    if (deep) {
      for (const child of clone.children) {
        child.parent = clone;
      }
    }
    
    return clone;
  }
  
  /**
   * Check if two VNodes are equivalent
   */
  private areVNodesEquivalent(a: VNode, b: VNode): boolean {
    // Quick equality checks
    if (a === b) return true;
    if (a.type !== b.type) return false;
    if (a.isText !== b.isText) return false;
    
    // Check text content for text nodes
    if (a.isText && b.isText) {
      return a.text === b.text;
    }
    
    // Check equivalence class if available
    if (a.stateMachine.equivalenceClass !== null && 
        b.stateMachine.equivalenceClass !== null) {
      return a.stateMachine.equivalenceClass === b.stateMachine.equivalenceClass;
    }
    
    // Check key if available
    if (a.props.key && b.props.key) {
      return a.props.key === b.props.key;
    }
    
    // Advanced property comparison
    const aKeys = Object.keys(a.props).filter(k => k !== 'children');
    const bKeys = Object.keys(b.props).filter(k => k !== 'children');
    
    if (aKeys.length !== bKeys.length) return false;
    
    for (const key of aKeys) {
      if (!bKeys.includes(key)) return false;
      if (a.props[key] !== b.props[key]) return false;
    }
    
    // Children comparison (shallow)
    if (a.children.length !== b.children.length) return false;
    
    return true;
  }
}