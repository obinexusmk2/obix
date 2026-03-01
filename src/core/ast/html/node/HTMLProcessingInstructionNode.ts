import { HTMLToken } from "@/core/parser/html/tokens/HTMLToken";
import { BaseHTMLNode } from "./BaseHTMLNode";
import { HTMLNode, HTMLNodeType, HTMLNodeVisitor, Position } from "./HTMLNode";

/**
 * HTML processing instruction node representation
 */
export class HTMLProcessingInstructionNode extends BaseHTMLNode {
  /**
   * Target of the processing instruction
   */
  public readonly target: string;

  /**
   * Data of the processing instruction
   */
  public readonly data: string;

  /**
   * Create a new processing instruction node
   */
  constructor(
    target: string,
    data: string,
    position: Position,
    sourceToken?: HTMLToken
  ) {
    super(HTMLNodeType.PROCESSING_INSTRUCTION, position, sourceToken);
    this.target = target;
    this.data = data;
  }

  /**
   * Clone this node
   */
  clone(): HTMLNode {
    const clone = new HTMLProcessingInstructionNode(
      this.target,
      this.data,
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
    visitor.visitProcessingInstruction(this);
  }

  /**
   * Convert to HTML string
   */
  toHTML(): string {
    return `<?${this.target} ${this.data}?>`;
  }
}