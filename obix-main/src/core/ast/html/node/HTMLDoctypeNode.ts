import { HTMLToken } from "@/core/parser/html/tokens";
import { BaseHTMLNode } from "./BaseHTMLNode";
import { Position, HTMLNodeType, HTMLNode, HTMLNodeVisitor } from "./HTMLNode";

/**
 * HTML doctype node representation
 */
export class HTMLDoctypeNode extends BaseHTMLNode {
  /**
   * Doctype name
   */
  public readonly name: string;
  
  /**
   * Public identifier
   */
  public readonly publicId?: string;
  
  /**
   * System identifier
   */
  public readonly systemId?: string;
  
  /**
   * Create a new doctype node
   */
  constructor(
    name: string,
    position: Position,
    publicId?: string,
    systemId?: string,
    sourceToken?: HTMLToken
  ) {
    super(HTMLNodeType.DOCTYPE, position, sourceToken);
    this.name = name;
    this.publicId = publicId ?? '';
    this.systemId = systemId ?? '';
  }
  
  /**
   * Clone this node
   */
  clone(): HTMLNode {
    const clone = new HTMLDoctypeNode(
      this.name,
      { ...this.position },
      this.publicId,
      this.systemId,
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
    visitor.visitDoctype(this);
  }
  
  /**
   * Convert to HTML string
   */
  toHTML(): string {
    let html = `<!DOCTYPE ${this.name}`;
    
    if (this.publicId && this.systemId) {
      html += ` PUBLIC "${this.publicId}" "${this.systemId}"`;
    } else if (this.systemId) {
      html += ` SYSTEM "${this.systemId}"`;
    }
    
    html += '>';
    return html;
  }
}