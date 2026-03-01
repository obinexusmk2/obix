import { HTMLTokenType, TokenType, BaseToken, StartTagToken, EndTagToken, TextToken, CommentToken, ConditionalCommentToken, DoctypeToken, CDATAToken, EOFToken } from './HTMLTokenType.js';

/**
 * Metadata for tracking state machine information
 */
export interface TokenMetadata {
  /** Equivalence class for state minimization */
  equivalenceClass: number | null;
  /** Computed signature for state comparison */
  stateSignature: string | null;
  /** Whether this token has been minimized */
  isMinimized: boolean;
  /** Custom metadata properties */
  [key: string]: any;
}

/**
 * Token state for automaton representation
 */
export interface TokenState {
  /** Available transitions from this token state */
  transitions: Map<string, TokenState>;
  /** Whether this is an accepting state */
  isAccepting: boolean;
  /** Equivalence class for minimization */
  equivalenceClass: number | null;
}

/**
 * HTML token interface
 */
export interface IHTMLToken {
  type: TokenType;
  line: number;
  column: number;
  end: number;
}

/**
 * HTMLToken class - Implements token operations with state transition capabilities 
 * for the automaton-based parser
 */
export class HTMLToken {
  /** Counter for generating unique token IDs */
  public static idCounter = 0;
  
  /** Token unique identifier */
  public readonly _id: number;
  
  /** Token type from HTMLTokenType */
  public readonly _type: TokenType;
  
  /** Token properties based on type */
  public readonly _properties: Record<string, any>;
  
  /** Token position information */
  public readonly _position: {
    start: number;
    end: number;
    line: number;
    column: number;
  };
  
  /** State machine metadata for optimization */
  public _metadata: TokenMetadata;
  
  /** Available transitions from this token */
  public _transitions: Map<string, HTMLToken>;
  
  /** Whether this token represents an accepting state */
  public _isAccepting: boolean;
  
  /**
   * Create a new HTML token
   * 
   * @param options Token initialization options
   */
  constructor(options: {
    type: TokenType;
    properties?: Record<string, any>;
    position: {
      start: number;
      end: number;
      line: number;
      column: number;
    };
    metadata?: Partial<TokenMetadata>;
    isAccepting?: boolean;
  }) {
    this._id = HTMLToken.generateId();
    this._type = options.type;
    this._properties = Object.freeze(options.properties || {});
    this._position = Object.freeze(options.position);
    this._transitions = new Map();
    this._isAccepting = options.isAccepting || options.type === 'EOF';
    
    // Initialize metadata with defaults
    this._metadata = {
      equivalenceClass: null,
      stateSignature: null,
      isMinimized: false,
      ...(options.metadata || {})
    };
    
    // Validate token type
    if (!Object.values(HTMLTokenType).includes(this._type)) {
      throw new TypeError(`Invalid token type: ${this._type}`);
    }
  }
  
  /**
   * Generate a unique token ID
   */
  static generateId(): number {
    return HTMLToken.idCounter++;
  }
  
  /**
   * Get token ID
   */
  get id(): number {
    return this._id;
  }
  
  /**
   * Get token type
   */
  get type(): TokenType {
    return this._type;
  }
  
  /**
   * Get token properties
   */
  get properties(): Record<string, any> {
    return this._properties;
  }
  
  /**
   * Get token position
   */
  get position(): {start: number; end: number; line: number; column: number} {
    return this._position;
  }
  
  /**
   * Get token metadata
   */
  get metadata(): TokenMetadata {
    return {...this._metadata};
  }
  
  /**
   * Check if this token is an accepting state
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
   * Get token transitions
   */
  get transitions(): Map<string, HTMLToken> {
    return new Map(this._transitions);
  }
  
  /**
   * Get a property value
   * 
   * @param name Property name
   * @returns Property value or undefined
   */
  getProperty<T = any>(name: string): T | undefined {
    return this._properties[name] as T;
  }
  
  /**
   * Set metadata value
   * 
   * @param key Metadata key
   * @param value Metadata value
   */
  setMetadata(key: string, value: any): void {
    this._metadata[key] = value;
  }
  
  /**
   * Get metadata value
   * 
   * @param key Metadata key
   * @returns Metadata value or undefined
   */
  getMetadata<T = any>(key: string): T | undefined {
    return this._metadata[key] as T;
  }
  
  /**
   * Add a state transition
   * 
   * @param symbol Input symbol for the transition
   * @param target Target token state
   * @returns Updated token (immutable operation)
   */
  addTransition(symbol: string, target: HTMLToken): HTMLToken {
    const token = this.clone();
    token._transitions.set(symbol, target);
    return token;
  }
  
  /**
   * Process a transition
   * 
   * @param symbol Input symbol
   * @returns Target token or undefined if transition doesn't exist
   */
  transition(symbol: string): HTMLToken | undefined {
    return this._transitions.get(symbol);
  }
  
  /**
   * Check if token has a transition for a given symbol
   * 
   * @param symbol Input symbol
   * @returns True if transition exists
   */
  hasTransition(symbol: string): boolean {
    return this._transitions.has(symbol);
  }
  
  /**
   * Get all input symbols for this token's transitions
   * 
   * @returns Array of input symbols
   */
  getInputSymbols(): string[] {
    return Array.from(this._transitions.keys());
  }
  
  /**
   * Set the token's equivalence class
   * 
   * @param classId Equivalence class ID
   * @returns Updated token (immutable operation)
   */
  setEquivalenceClass(classId: number): HTMLToken {
    const token = this.clone();
    token._metadata.equivalenceClass = classId;
    return token;
  }
  
  /**
   * Compute state signature for equivalence comparison
   * 
   * @param equivalenceClasses Current equivalence classes map
   * @returns Computed signature string
   */
  computeStateSignature(equivalenceClasses: Map<number, Set<HTMLToken>>): string {
    const components = [
      this._type,
      Object.entries(this._properties)
        .map(([k, v]) => `${k}:${v}`)
        .sort()
        .join(','),
      Array.from(this._transitions.entries())
        .map(([symbol, target]) => {
          const targetClass = findEquivalenceClass(target, equivalenceClasses);
          return `${symbol}:${targetClass}`;
        })
        .sort()
        .join('|'),
      this._isAccepting ? '1' : '0'
    ];
    
    const signature = components.join('::');
    this._metadata.stateSignature = signature;
    return signature;
  }
  
  /**
   * Create a clone of this token
   * 
   * @returns Cloned token
   */
  clone(): HTMLToken {
    return new HTMLToken({
      type: this._type,
      properties: {...this._properties},
      position: {...this._position},
      metadata: {...this._metadata},
      isAccepting: this._isAccepting
    });
  }
  
  /**
   * Minimize this token using equivalence class information
   * 
   * @returns Minimized token (immutable operation)
   */
  minimize(): HTMLToken {
    if (this._metadata.isMinimized) {
      return this;
    }
    
    const token = this.clone();
    token._metadata.isMinimized = true;
    
    return token;
  }
  
  /**
   * Check if this token is equivalent to another token
   * 
   * @param other Other token to compare with
   * @param alphabet Complete set of input symbols
   * @param visited Set of already visited token pairs (prevents infinite recursion)
   * @returns True if tokens are equivalent
   */
  isEquivalentTo(
    other: HTMLToken,
    alphabet: Set<string>,
    visited: Set<string> = new Set()
  ): boolean {
    // Different types are never equivalent
    if (this._type !== other._type) {
      return false;
    }
    
    // Different accepting states are never equivalent
    if (this._isAccepting !== other._isAccepting) {
      return false;
    }
    
    // Check for recursion
    const pairKey = `${this._id},${other._id}`;
    if (visited.has(pairKey)) {
      return true; // Assume equivalent if we're in a cycle
    }
    visited.add(pairKey);
    
    // Check transitions for all symbols in the alphabet
    for (const symbol of alphabet) {
      const thisHasTransition = this.hasTransition(symbol);
      const otherHasTransition = other.hasTransition(symbol);
      
      if (thisHasTransition !== otherHasTransition) {
        return false; // Different transition structure
      }
      
      if (thisHasTransition && otherHasTransition) {
        const thisNext = this.transition(symbol);
        const otherNext = other.transition(symbol);
        
        if (thisNext && otherNext && !thisNext.isEquivalentTo(otherNext, alphabet, visited)) {
          return false; // Transitions lead to non-equivalent states
        }
      }
    }
    
    return true; // All checks passed
  }
  
  /**
   * Convert token to string representation
   * 
   * @returns String representation of the token
   */
  toString(): string {
    const props = Object.entries(this._properties)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join(' ');
    
    return `${this._type}(${props}) @ ${this._position.line}:${this._position.column}`;
  }
  
  /**
   * Convert to a specialized token type based on the token's type
   * 
   * @returns Specialized token interface
   */
  toSpecializedToken(): BaseToken {
    switch (this._type) {
      case 'StartTag':
        return {
          type: 'StartTag',
          name: this._properties['name'],
          attributes: this._properties['attributes'],
          selfClosing: this._properties['selfClosing'],
          namespace: this._properties['namespace'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as StartTagToken;
        
      case 'EndTag':
        return {
          type: 'EndTag',
          name: this._properties['name'],
          namespace: this._properties['namespace'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as EndTagToken;
        
      case 'Text':
        return {
          type: 'Text',
          content: this._properties['content'],
          isWhitespace: this._properties['isWhitespace'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as TextToken;
        
      case 'Comment':
        return {
          type: 'Comment',
          data: this._properties['data'],
          isConditional: this._properties['isConditional'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as CommentToken;
        
      case 'ConditionalComment':
        return {
          type: 'ConditionalComment',
          condition: this._properties['condition'],
          content: this._properties['content'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as ConditionalCommentToken;
        
      case 'Doctype':
        return {
          type: 'Doctype',
          name: this._properties['name'],
          publicId: this._properties['publicId'],
          systemId: this._properties['systemId'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as DoctypeToken;
        
      case 'CDATA':
        return {
          type: 'CDATA',
          content: this._properties['content'],
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as CDATAToken;
        
      case 'EOF':
        return {
          type: 'EOF',
          start: this._position.start,
          end: this._position.end,
          line: this._position.line,
          column: this._position.column
        } as EOFToken;
        
      default:
        throw new Error(`Unsupported token type: ${this._type}`);
    }
  }
}

/**
 * Helper function to find the equivalence class for a token
 * 
 * @param token Token to find class for
 * @param classes Current equivalence classes
 * @returns Class ID or -1 if not found
 */
export function findEquivalenceClass(
  token: HTMLToken,
  classes: Map<number, Set<HTMLToken>>
): number {
  // Check if token already has an assigned class
  const tokenClass = token.getMetadata<number>('equivalenceClass');
  if (tokenClass !== null && tokenClass !== undefined) {
    return tokenClass;
  }
  
  // Search through classes
  for (const [classId, tokenSet] of classes.entries()) {
    if (tokenSet.has(token)) {
      return classId;
    }
  }
  
  return -1; // Not found in any class
}