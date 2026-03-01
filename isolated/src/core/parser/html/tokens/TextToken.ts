// src/parser/html/tokens/TextToken.ts

import { TokenPosition } from '../../css/tokenizer/CSSTokenType.js';


import { HTMLToken, TokenMetadata } from './HTMLToken.js';
import { HTMLTokenType } from './HTMLTokenType.js';
/**
 * Class representing a text token in HTML
 * Implements automaton state interface for minimization
 */
export class TextToken implements HTMLToken {
  _type: IHTMLTokenType;
  _properties: Map<string, any>;
  _position: TokenPosition;
  _metadata: TokenMetadata = { equivalenceClass: null, stateSignature: null, isMinimized: false };
  public static idCounter = 0;
  
  /** Token type */
  readonly type = HTMLTokenType.Text;
  
  /** Token content */
  readonly content: string;
  
  /** Whether the token is whitespace-only */
  readonly isWhitespace: boolean;
  
  /** Token position data */
  readonly start: number;
  readonly end: number;
  readonly line: number;
  readonly column: number;
  
  /** Automaton state data */
  public _equivalenceClass: number | null = null;
  public _stateSignature: string | null = null;
  public _isMinimized: boolean = false;
  public _transitions: Map<string, HTMLToken> = new Map();
  public _isAccepting: boolean = false;
  public _id: number;
  
  /**
   * Create a new text token
   * 
   * @param content Text content
   * @param isWhitespace Whether the content is whitespace-only
   * @param start Start position in source
   * @param end End position in source
   * @param line Line number
   * @param column Column number
   */
  constructor(
    content: string,
    isWhitespace: boolean,
    start: number,
    end: number,
    line: number,
    column: number
  ) {
    this.content = content;
    this.isWhitespace = isWhitespace;
    this.start = start;
    this.end = end;
    this.line = line;
    this.column = column;
    this._id = TextToken.idCounter++;
  }
  
  /**
   * Get token position information
   */
  get position(): TokenPosition {
    return {
      start: this.start ?? 0,
      end: this.end ?? 0,
      line: this.line ?? 0,
      column: this.column ?? 0
    };
  }
  
  /**
   * Get token metadata
   */
  get metadata(): TokenMetadata {
    return {
      equivalenceClass: this._equivalenceClass,
      stateSignature: this._stateSignature,
      isMinimized: this._isMinimized
    };
  }
  
  /**
   * Get token ID (for automaton)
   */
  get id(): number {
    return this._id;
  }
  
  /**
   * Check if token is an accepting state
   */
  get isAccepting(): boolean {
    return this._isAccepting;
  }
  
  /**
   * Set accepting state
   */
  set isAccepting(value: boolean) {
    this._isAccepting = value;
  }
  
  /**
   * Get transitions to other states
   */
  get transitions(): Map<string, HTMLToken> {
    return this._transitions;
  }
  
  /**
   * Add a transition to another state
   * 
   * @param symbol Input symbol
   * @param target Target state
   * @returns Target state
   */
  addTransition(symbol: string, target: HTMLToken): HTMLToken {
    this._transitions.set(symbol, target);
    return target;
  }
  
  /**
   * Get the target state for an input symbol
   * 
   * @param symbol Input symbol
   * @returns Target state or undefined
   */
  transition(symbol: string): HTMLToken | undefined {
    return this._transitions.get(symbol);
  }
  
  /**
   * Check if state has a transition for a symbol
   * 
   * @param symbol Input symbol
   * @returns Whether transition exists
   */
  hasTransition(symbol: string): boolean {
    return this._transitions.has(symbol);
  }
  
  /**
   * Get all input symbols for this state
   * 
   * @returns Array of input symbols
   */
  getInputSymbols(): string[] {
    return Array.from(this._transitions.keys());
  }
  
  /**
   * Set the equivalence class for this state
   * 
   * @param classId Equivalence class ID
   * @returns This token
   */
  setEquivalenceClass(classId: number): HTMLToken {
    this._equivalenceClass = classId;
    return this as HTMLToken;
  }
  
  /**
   * Compute a state signature for minimization
   * 
   * @param equivalenceClasses Map of equivalence classes
   * @returns Signature string
   */
  computeStateSignature(equivalenceClasses: Map<number, Set<HTMLToken>>): string {
    // Generate components for the signature
    const components: string[] = [];
    
    // Add type and content hash
    components.push(`type:${this.type}`);
    components.push(`content:${this.content.length}`);
    components.push(`whitespace:${this.isWhitespace}`);
    
    // Add transitions with their target equivalence classes
    for (const [symbol, target] of this._transitions.entries()) {
      const targetClass = target.metadata.equivalenceClass;
      components.push(`${symbol}:${targetClass}`);
    }
    
    // Generate and store the signature
    this._stateSignature = components.join('|');
    return this._stateSignature;
  }
  
  /**
   * Clone this token
   * 
   * @returns New token with same properties
   */
  clone(): HTMLToken {
    const cloned = new TextToken(
      this.content,
      this.isWhitespace,
      this.start,
      this.end,
      this.line,
      this.column
    );
    
    // Copy automaton state properties
    cloned._equivalenceClass = this._equivalenceClass;
    cloned._stateSignature = this._stateSignature;
    cloned._isMinimized = this._isMinimized;
    cloned._isAccepting = this._isAccepting;
    cloned._type = this._type;
    cloned._properties = new Map(this._properties);
    cloned._position = { ...this._position };
    cloned._metadata = { ...this._metadata };
    return cloned;
    // Clone transitions (shallow copy)
    cloned._transitions = new Map(this._transitions);
    
    return cloned;
  }
  
  /**
   * Minimize this token (used in automaton minimization)
   * 
   * @returns Minimized token
   */
  minimize(): HTMLToken {
    if (this.metadata.isMinimized) {
      return this;
    }
    
    const minimized = this.clone();
    minimized.setMetadata('isMinimized', true);
    
    return minimized;
  }
  
  /**
   * Check if this token is equivalent to another token
   * 
   * @param other Other token to compare
   * @param alphabet Set of all input symbols
   * @param visited Set of already visited token pairs
   * @returns Whether tokens are equivalent
   */
  isEquivalentTo(
    other: HTMLToken, 
    alphabet: Set<string>,
    visited: Set<string> = new Set()
  ): boolean {
    // Different types or accepting states mean not equivalent
    if (this.type !== other.type || this.isAccepting !== other.isAccepting) {
      return false;
    }
    
    // Different text properties mean not equivalent
    if (this.isWhitespace !== (other as unknown as TextToken).isWhitespace) {
      return false;
    }
    
    // Check for circular references
    const key = `${this.id},${other.id}`;
    if (visited.has(key)) {
      return true;
    }
    visited.add(key);
    
    // Check all transitions
    for (const symbol of alphabet) {
      const thisNext = this.transition(symbol);
      const otherNext = other.transition(symbol);
      
      // Both have transition or both don't have transition
      if (!!thisNext !== !!otherNext) {
        return false;
      }
      
      // If both have transitions, check if target states are equivalent
      if (thisNext && otherNext && !thisNext.isEquivalentTo(otherNext, alphabet, visited)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Get a property value
   * 
   * @param name Property name
   * @returns Property value or undefined
   */
  getProperty<T = any>(name: string): T | undefined {
    switch (name) {
      case 'content':
        return this.content as unknown as T;
      case 'isWhitespace':
        return this.isWhitespace as unknown as T;
      default:
        return undefined;
    }
  }
  
  /**
   * Set a metadata value
   * 
   * @param key Metadata key
   * @param value Metadata value
   */
  setMetadata(key: string, value: any): void {
    switch (key) {
      case 'equivalenceClass':
        this._equivalenceClass = value;
        break;
      case 'stateSignature':
        this._stateSignature = value;
        break;
      case 'isMinimized':
        this._isMinimized = value;
        break;
    }
  }
  
  /**
   * Get a metadata value
   * 
   * @param key Metadata key
   * @returns Metadata value or undefined
   */
  getMetadata<T = any>(key: string): T | undefined {
    switch (key) {
      case 'equivalenceClass':
        return this._equivalenceClass as unknown as T;
      case 'stateSignature':
        return this._stateSignature as unknown as T;
      case 'isMinimized':
        return this._isMinimized as unknown as T;
      default:
        return undefined;
    }
  }
  
  /**
   * Convert to string representation
   * 
   * @returns String representation
   */
  toString(): string {
    return `TextToken("${this.content.substring(0, 20)}${this.content.length > 20 ? '...' : ''}", isWhitespace: ${this.isWhitespace}) @ ${this.line}:${this.column}`;
  }
}