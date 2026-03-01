import { HTMLToken } from "@/core/parser/html/tokens";
import { Position, HTMLNodeType, HTMLNode, HTMLNodeVisitor } from "./HTMLNode";
import { BaseHTMLNode } from "./BaseHTMLNode";

/**
 * HTML text node representation
 */
export class HTMLTextNode extends BaseHTMLNode {
  public override stateMachine: any;
  /**
   * Node type
   */
  public override readonly type: HTMLNodeType = HTMLNodeType.TEXT;

  /**
   * Text content
   */
  public readonly content: string;
  
  /**
   * Whether the text is whitespace-only
   */
  public readonly isWhitespace: boolean;
  
  /**
   * Source token
   */
  public override readonly sourceToken?: HTMLToken;
  /**
   * Create a new text node
   */
  constructor(
    content: string,
    position: Position,
    sourceToken?: HTMLToken
  ) {
    super(HTMLNodeType.TEXT, position, sourceToken);
    this.content = content;
    this.isWhitespace = /^\s*$/.test(content);
    this.sourceToken = sourceToken;
  }
  
  /**
   * Clone this node
   */
  clone(): HTMLNode {
    const clone = new HTMLTextNode(
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
    this.stateMachine.transitions.forEach((target: HTMLNode, symbol: string) => {
      clone.stateMachine.transitions.set(symbol, target);
    });
    
    return clone;
  }
  
  /**
   * Accept a visitor
   */
  accept(visitor: HTMLNodeVisitor): void {
    visitor.visitText(this);
  }
  
  /**
   * Convert to HTML string
   */
  toHTML(): string {
    // Escape special characters for safe HTML output
    return this.content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  
  /**
   * Generate state signature for text nodes
   */
  override computeStateSignature(): string {
    // For text nodes, we include a hash of the content
    const contentHash = this.getContentHash();
    
    const components: string[] = [
      // Basic components from base class
      `type:${this.type}`,
      `accepting:${this.stateMachine.isAccepting ? '1' : '0'}`,
      
      // Text-specific components
      `contentHash:${contentHash}`,
      `isWhitespace:${this.isWhitespace ? '1' : '0'}`,
      
      // Add transitions
      ...Array.from(this.stateMachine.transitions.entries() as [string, any][]).map(([symbol, target]) => {
        const targetClass = target.stateMachine.equivalenceClass ?? target.id;
        return `transition:${symbol}->${targetClass}`;
      }).sort()
    ];
    
    // Create and store signature
    this.stateMachine.stateSignature = components.join('|');
    return this.stateMachine.stateSignature;
  }
  
  /**
   * Generate a simple hash of the text content
   */
  public getContentHash(): string {
    let hash = 0;
    for (let i = 0; i < this.content.length; i++) {
      hash = ((hash << 5) - hash) + this.content.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
  
  /**
   * Check text-specific equivalence
   */
  override isEquivalentTo(other: HTMLNode): boolean {
    if (!super.isEquivalentTo(other) || !(other instanceof HTMLTextNode)) {
      return false;
    }
    
    // For optimization, we can consider whitespace-only text nodes equivalent
    if (this.isWhitespace && other.isWhitespace) {
      return true;
    }
    
    // Otherwise, compare content
    return this.content === other.content;
  }

    /**
     * Check if this node is empty
     */
    get isEmpty(): boolean {
      return this.content.trim() === '';
    }

    /**
     * Check if this node is a comment
     */
    get isComment(): boolean {
      return false;
    }


    /**
     * Check if this node is an element
     */

    get isElement(): boolean {
      return false;
    }


    /**
     * Check if this node is a text node
     */
    get isText(): boolean {

        return true;
        }

    }
    