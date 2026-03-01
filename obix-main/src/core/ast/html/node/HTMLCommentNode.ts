import { HTMLToken } from "@/core/parser/html/tokens";
import {  Position, HTMLNodeType, HTMLNode, HTMLNodeVisitor } from "./HTMLNode";
import { BaseHTMLNode } from "./BaseHTMLNode";

/**
 * HTML comment node representation
 */
export class HTMLCommentNode extends BaseHTMLNode {
    override accept(visitor: HTMLNodeVisitor): void {
        visitor.visitComment(this);
    }

    override toHTML(): string {
        if (this.isConditional && this.condition) {
            return `<!--[if ${this.condition}]>${this.data}<![endif]-->`;
        }
        return `<!--${this.data}-->`;
    }

    /**
     * Comment data
     */
    public readonly data: string;
    
    /**
     * Whether this is a conditional comment
     */
    public readonly isConditional: boolean;
    
    /**
     * Condition expression (for conditional comments)
     */
    public readonly condition: string | undefined;
    
    /**
     * Create a new comment node
     */
    constructor(
      data: string,
      position: Position,
      isConditional: boolean = false,
      condition?: string,
      sourceToken?: HTMLToken
    ) {
      super(HTMLNodeType.COMMENT, position, sourceToken);
      this.data = data;
      this.isConditional = isConditional;
      this.condition = condition;
    }
    
    
      /**
       * Clone this node
       */
      clone(): HTMLNode {
        const clone = new HTMLCommentNode(
          this.data,
          { ...this.position },
          this.isConditional,
          this.condition,
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
}

