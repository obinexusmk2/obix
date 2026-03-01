import { HTMLToken } from "@/core/parser/html/tokens";
import { HTMLNode, HTMLNodeType, Position, StateMachineData, HTMLNodeVisitor } from "./HTMLNode";

/**
 * Abstract base class for all HTML nodes
 */
export abstract class BaseHTMLNode implements HTMLNode {
  // Static counter for generating unique IDs
  public static idCounter = 0;
  
  // Node properties
  public readonly id: number;
  public readonly type: HTMLNodeType;
  public parent: HTMLNode | null = null;
  public children: HTMLNode[] = [];
  public readonly position: Position;
  public readonly sourceToken: HTMLToken | undefined = undefined;
  // State machine data for minimization algorithm
  public readonly stateMachine: StateMachineData;
  
  /**
   * Create a new HTML node
   */
  constructor(
    type: HTMLNodeType,
    position: Position,
    sourceToken?: HTMLToken
  ) {
    this.id = BaseHTMLNode.generateId();
    this.type = type;
    this.position = position;
    this.sourceToken = sourceToken;
    
    // Initialize state machine data
    this.stateMachine = {
      stateId: this.id,
      isAccepting: false,
      transitions: new Map<string, HTMLNode>(),
      equivalenceClass: null,
      stateSignature: null,
      isMinimized: false
    };
  }
  
  /**
   * Generate a unique node ID
   */
  public static generateId(): number {
    return BaseHTMLNode.idCounter++;
  }
  
  /**
   * Abstract method to clone this node
   */
  abstract clone(): HTMLNode;
  
  /**
   * Abstract method to accept a visitor
   */
  abstract accept(visitor: HTMLNodeVisitor): void;
  
  /**
   * Abstract method to convert to HTML string
   */
  abstract toHTML(): string;
  
  /**
   * Add a child node
   */
  appendChild(child: HTMLNode): HTMLNode {
    this.children.push(child);
    if (child.parent !== this) {
      child.parent = this;
    }
    return child;
  }
  
  /**
   * Remove a child node
   */
  removeChild(child: HTMLNode): boolean {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
      return true;
    }
    return false;
  }
  
  /**
   * Replace a child node
   */
  replaceChild(oldChild: HTMLNode, newChild: HTMLNode): boolean {
    const index = this.children.indexOf(oldChild);
    if (index !== -1) {
      this.children[index] = newChild;
      oldChild.parent = null;
      newChild.parent = this;
      return true;
    }
    return false;
  }
  
  /**
   * Check if this node is equivalent to another for minimization
   */
  isEquivalentTo(other: HTMLNode): boolean {
    // Different types are never equivalent
    if (this.type !== other.type) {
      return false;
    }
    
    // Compare state machine accepting status
    if (this.stateMachine.isAccepting !== other.stateMachine.isAccepting) {
      return false;
    }
    
    // Get all transition symbols from both nodes
    const thisSymbols = this.getTransitionSymbols();
    const otherSymbols = other.getTransitionSymbols();
    
    // Nodes must have the same set of transitions
    if (thisSymbols.length !== otherSymbols.length) {
      return false;
    }
    
    // Ensure all symbols are shared
    for (const symbol of thisSymbols) {
      if (!otherSymbols.includes(symbol)) {
        return false;
      }
    }
    
    // For complete equivalence checking, we would recursively check target states
    // But this would create circular dependencies, so we rely on the signature instead
    return this.computeStateSignature() === other.computeStateSignature();
  }
  
  /**
   * Compute state signature for minimization
   */
  computeStateSignature(): string {
    // Components of the signature
    const components: string[] = [
      // Node type
      `type:${this.type}`,
      // Accepting state
      `accepting:${this.stateMachine.isAccepting ? '1' : '0'}`,
      // Transitions (using equivalence classes if available)
      ...Array.from(this.stateMachine.transitions.entries()).map(([symbol, target]) => {
        const targetClass = target.stateMachine.equivalenceClass ?? target.id;
        return `transition:${symbol}->${targetClass}`;
      }).sort()
    ];
    
    // Create and store signature
    this.stateMachine.stateSignature = components.join('|');
    return this.stateMachine.stateSignature;
  }
  
  /**
   * Get transition for a symbol
   */
  getTransition(symbol: string): HTMLNode | undefined {
    return this.stateMachine.transitions.get(symbol);
  }
  
  /**
   * Add a transition to another node
   */
  addTransition(symbol: string, target: HTMLNode): void {
    this.stateMachine.transitions.set(symbol, target);
  }
  
  /**
   * Get all symbols for transitions from this node
   */
  getTransitionSymbols(): string[] {
    return Array.from(this.stateMachine.transitions.keys());
  }
  
  /**
   * Set the equivalence class for this node
   */
  setEquivalenceClass(classId: number): void {
    this.stateMachine.equivalenceClass = classId;
  }
  
  /**
   * Mark this node as minimized
   */
  markAsMinimized(): void {
    this.stateMachine.isMinimized = true;
  }
  
  /**
   * Check if this node is minimized
   */
  isMinimized(): boolean {
    return this.stateMachine.isMinimized;
  }
}
