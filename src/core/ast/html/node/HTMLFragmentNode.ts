import { BaseHTMLNode } from "./BaseHTMLNode";
import {  Position, HTMLNodeType, HTMLNode, HTMLNodeVisitor } from "./HTMLNode";

/**
 * HTML document fragment node representation
 */
export class HTMLFragmentNode extends BaseHTMLNode {
    /**
     * Create a new fragment node
     */
    constructor(
      position: Position = {
        start: 0,
        end: 0,
        line: 1,
        column: 1
      }
    ) {
      super(HTMLNodeType.FRAGMENT, position);
    }
    
    /**
     * Clone this node
     */
    clone(): HTMLNode {
      const clone = new HTMLFragmentNode({ ...this.position });
      
      // Clone children and set parent
      this.children.forEach(child => {
        const childClone = child.clone();
        childClone.parent = clone;
        clone.children.push(childClone);
      });
      
      // Clone state machine data
      clone.stateMachine.isAccepting = this.stateMachine.isAccepting;
      clone.stateMachine.equivalenceClass = this.stateMachine.equivalenceClass;
      clone.stateMachine.stateSignature = this.stateMachine.stateSignature;
      clone.stateMachine.isMinimized = this.stateMachine.isMinimized;
      
      // Clone transitions (shallow copy)
      this.stateMachine.transitions.forEach((target, symbol) => {
        clone.stateMachine.transitions.set(symbol, target);
      });
      
      return clone;
    }
    
    /**
     * Accept a visitor
     */
    accept(visitor: HTMLNodeVisitor): void {
      visitor.visitFragment(this);
      
      // Visit children
      this.children.forEach(child => child.accept(visitor));
    }
    
    /**
     * Convert to HTML string
     */
    toHTML(): string {
      let html = '';
      
      // Add children
      this.children.forEach(child => {
        html += child.toHTML();
      });
  
      return html;
      }
  
      
      }
  
  

    