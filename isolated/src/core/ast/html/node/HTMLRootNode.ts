import { BaseHTMLNode } from "./BaseHTMLNode";
import { HTMLNodeType, HTMLNode, HTMLNodeVisitor, Position } from "./HTMLNode";


/**
 * HTML root node representation
 */
export class HTMLRootNode extends BaseHTMLNode {
    /**
     * Create a new root node
     */
    constructor() {
      // Root node spans the entire document
      super(HTMLNodeType.ROOT, {
        start: 0,
        end: 0,
        line: 1,
        column: 1
      });
      
      // Root nodes are always accepting states
      this.stateMachine.isAccepting = true;
    }
    
    /**
     * Clone this node
     */
    clone(): HTMLNode {
      const clone = new HTMLRootNode();
      
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
      visitor.visitRoot(this);
      
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
    
    /**
     * Update position to encompass all children
     */
    updatePosition(): void {
      if (this.children.length === 0) {
        return;
      }
      
      // Find min start and max end from children
      let minStart = Number.MAX_SAFE_INTEGER;
      let maxEnd = 0;
      
      this.children.forEach(child => {
        minStart = Math.min(minStart, child.position.start);
        maxEnd = Math.max(maxEnd, child.position.end);
      });
      
      // Update position
      (this.position as Position).start = minStart;
      (this.position as Position).end = maxEnd;
    }
  }
  