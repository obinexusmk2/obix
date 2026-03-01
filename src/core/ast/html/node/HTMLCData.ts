import { HTMLToken } from "@/core/parser/html/tokens";
import { Position, HTMLNodeType, HTMLNode, HTMLNodeVisitor } from "./HTMLNode";
import { BaseHTMLNode } from "./BaseHTMLNode";

/**
 * HTML CDATA section node representation
 */
export class HTMLCDATANode extends BaseHTMLNode {
  /**
   * CDATA content
   */
  public readonly content: string;
  
  /**
   * Create a new CDATA node
   */
  constructor(
    content: string,
    position: Position,
    sourceToken?: HTMLToken
  ) {
    super(HTMLNodeType.CDATA, position, sourceToken);
    this.content = content;
  }
  
  
  /**
   * Clone this node
   */
  clone(): HTMLNode {
    const clone = new HTMLCDATANode(
      this.content,
      { ...this.position },
      this.sourceToken
    );
    
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
    visitor.visitCDATA(this);
  }
  
  /**
   * Convert to HTML string
   */
  toHTML(): string {
    return `<![CDATA[${this.content}]]>`;
  }
}