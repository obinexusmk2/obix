import { HTMLToken } from "@/core/parser/html/tokens";
import { BaseHTMLNode } from "./BaseHTMLNode";
import { HTMLNode, HTMLAttribute, Position, HTMLNodeType, HTMLNodeVisitor } from "./HTMLNode";

/**
 * HTML element node representation
 */
export class HTMLElementNode extends BaseHTMLNode {

  /**
   * Tag name
   */
  public readonly tagName: string;
  
  /**
   * Attributes
   */
  public readonly attributes: Map<string, HTMLAttribute>;
  
  /**
   * Namespace
   */
  public readonly namespace?: string;
  

  /**
   * Create a new element node
   */
  public selfClosing: boolean;

  constructor(
    tagName: string,
    attributes: Map<string, HTMLAttribute> = new Map(),
    public override position: Position,
    selfClosing: boolean = false,
    public override sourceToken: HTMLToken,
    namespace?: string
  ) {
    super(HTMLNodeType.ELEMENT, position, sourceToken);
    this.tagName = tagName.toLowerCase();
    this.attributes = attributes;
    this.selfClosing = selfClosing;
    this.namespace = namespace ?? '';
  }

   
    /**
   * Clone this node
   */
    override clone(): HTMLNode {
      const clone = new HTMLElementNode(
        this.tagName,
        new Map(this.attributes),
        { ...this.position },
        this.selfClosing,
        this.namespace as unknown as HTMLToken,
        this.sourceToken as unknown as string
      );
      
      // Clone children and set parent
      this.children.forEach((child: HTMLNode) => {
        const childClone = child.clone();
        childClone.parent = clone;
        clone.children.push(childClone);
      });
      
      // Clone state machine data
      clone.stateMachine.isAccepting = this.stateMachine.isAccepting;
      clone.stateMachine.equivalenceClass = this.stateMachine.equivalenceClass;
      clone.stateMachine.stateSignature = this.stateMachine.stateSignature;
      clone.stateMachine.isMinimized = this.stateMachine.isMinimized;
      clone.stateMachine.transitions = new Map(this.stateMachine.transitions);
      
      return clone;
    }
  
  /**
   * Accept a visitor
   */
  accept(visitor: HTMLNodeVisitor): void {
    visitor.visitElement(this);
    
    // Visit children
    this.children.forEach(child => child.accept(visitor));
  }
  
  /**
   * Convert to HTML string
   */
  toHTML(): string {
    // Opening tag
    let html = `<${this.tagName}`;
    
    // Add attributes
    this.attributes.forEach(attr => {
      const value = attr.value.replace(/"/g, '&quot;');
      html += ` ${attr.name}="${value}"`;
    });
    
    if (this.selfClosing) {
      // Self-closing tag
      html += ' />';
      return html;
    }
    
    // Close opening tag
    html += '>';
    
    // Add children
    this.children.forEach(child => {
      html += child.toHTML();
    });
    
    // Add closing tag
    html += `</${this.tagName}>`;
    
    return html;
  }
  
  /**
   * Get an attribute value
   */
  getAttribute(name: string): string | null {
    const attr = this.attributes.get(name.toLowerCase());
    return attr ? attr.value : null;
  }
  
  /**
   * Check if element has an attribute
   */
  hasAttribute(name: string): boolean {
    return this.attributes.has(name.toLowerCase());
  }
  
  /**
   * Generate the automaton state signature for this element
   */
  override computeStateSignature(): string {
    // For element nodes, we include tag name and attributes in the signature
    const components: string[] = [
      // Basic components from base class
      `type:${this.type}`,
      `accepting:${this.stateMachine.isAccepting ? '1' : '0'}`,
      
      // Element-specific components
      `tagName:${this.tagName}`,
      `selfClosing:${this.selfClosing ? '1' : '0'}`,
      
      // Add key attributes that affect equivalence
      // For optimization, we only include structurally important attributes
      ...(this.hasAttribute('id') ? [`id:${this.getAttribute('id')!}`] : []),
      ...(this.hasAttribute('name') ? [`name:${this.getAttribute('name')!}`] : []),
      ...(this.hasAttribute('type') ? [`type:${this.getAttribute('type')!}`] : []),
      ...(this.hasAttribute('role') ? [`role:${this.getAttribute('role')!}`] : []),
      
      // Add transitions
      ...Array.from(this.stateMachine.transitions?.entries() || []).map(([symbol, target]: [any, any]) => {
        const targetClass = target.stateMachine.equivalenceClass ?? target.id;
        return `transition:${symbol}->${targetClass}`;
      }).sort()
    ];
    
    // Create and store signature
    if (this.stateMachine) {
      this.stateMachine.stateSignature = components.join('|');
      return this.stateMachine.stateSignature;
    }
    return '';
  }
  
  /**
   * Check equivalence specific to element nodes
   */
  override isEquivalentTo(other: HTMLNode): boolean {
    if (!super.isEquivalentTo(other) || !(other instanceof HTMLElementNode)) {
      return false;
    }
    
    // Element-specific equivalence checks
    if (this.tagName !== other.tagName || this.selfClosing !== other.selfClosing) {
      return false;
    }
    
    // Compare important attributes (for full structural equivalence)
    const keyAttrs = ['id', 'name', 'type', 'role'];
    for (const attr of keyAttrs) {
      if (this.getAttribute(attr) !== other.getAttribute(attr)) {
        return false;
      }
    }
    
    return true;
  }
  
}