# OBIX Parser Module Architecture Plan
## 1. Token and TokenType System

### TokenType Implementation

The token type system should be implemented separately from the tokens themselves to ensure compile-time safety and easy extension:

```typescript
// HTMLTokenType.ts
export const HTMLTokenType = {
  StartTag: 'StartTag',
  EndTag: 'EndTag',
  Text: 'Text',
  Comment: 'Comment',
  ConditionalComment: 'ConditionalComment',
  Doctype: 'Doctype',
  CDATA: 'CDATA',
  EOF: 'EOF'
} as const;

export type TokenType = typeof HTMLTokenType[keyof typeof HTMLTokenType];

// Base token interface with required metadata
export interface BaseToken {
  type: TokenType;
  start: number;
  end: number;
  line: number;
  column: number;
}

// Strong typing for each token variant
export interface StartTagToken extends BaseToken {
  type: 'StartTag';
  name: string;
  attributes: Map<string, string>;
  selfClosing: boolean;
  namespace?: string;
}

export interface EndTagToken extends BaseToken {
  type: 'EndTag';
  name: string;
  namespace?: string;
}

// Additional token interfaces...

// Type union for all token types
export type HTMLToken = 
  | StartTagToken 
  | EndTagToken 
  | TextToken 
  | CommentToken 
  | DoctypeToken 
  | CDATAToken 
  | EOFToken;

// Token builder for type-safe token creation
export class HTMLTokenBuilder {
  static createStartTag(name: string, attributes: Map<string, string>, selfClosing: boolean,
                       start: number, end: number, line: number, column: number): StartTagToken {
    // Implementation with validation
  }
  
  // Additional builder methods...
}
```

## 2. Tokenizer Implementation (Shift-Reduce Algorithm)

The tokenizer will implement a shift-reduce algorithm as specified in the requirements:

```typescript
// HTMLTokenizer.ts
import { HTMLToken, TokenType, HTMLTokenBuilder } from './HTMLTokenType';

export interface TokenizerOptions {
  xmlMode?: boolean;
  recognizeCDATA?: boolean;
  recognizeConditionalComments?: boolean;
  preserveWhitespace?: boolean;
  allowUnclosedTags?: boolean;
}

export interface TokenizerResult {
  tokens: HTMLToken[];
  errors: TokenizerError[];
}

export class HTMLTokenizer {
  public input: string;
  public position: number;
  public line: number;
  public column: number;
  public tokens: HTMLToken[];
  public stack: string[];
  public options: TokenizerOptions;

  constructor(input: string, options: TokenizerOptions = {}) {
    this.input = input;
    this.position = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
    this.stack = [];
    this.options = {
      xmlMode: false,
      recognizeCDATA: true,
      recognizeConditionalComments: true,
      preserveWhitespace: false,
      allowUnclosedTags: true,
      ...options
    };
  }

  // Shift-reduce implementation
  tokenize(): TokenizerResult {
    while (this.position < this.input.length || this.stack.length > 0) {
      // Try to reduce the stack to a token
      if (!this.reduce()) {
        // If reduction fails, shift next character onto stack
        if (!this.shift()) {
          // Handle end of input
          this.handleRemainingStack();
        }
      }
    }

    // Add EOF token
    this.tokens.push(HTMLTokenBuilder.createEOF(
      this.position,
      this.position,
      this.line,
      this.column
    ));

    return { 
      tokens: this.tokens,
      errors: this.errors
    };
  }

  // Shift operation moves the next character onto the stack
  public shift(): boolean {
    if (this.position < this.input.length) {
      this.stack.push(this.input[this.position]);
      this.advancePosition();
      return true;
    }
    return false;
  }

  // Reduce operation attempts to match stack contents to token patterns
  public reduce(): boolean {
    const stackContent = this.stack.join('');
    
    // Try to match patterns from most specific to least specific
    if (this.matchStartTag(stackContent)) return true;
    if (this.matchEndTag(stackContent)) return true;
    if (this.matchComment(stackContent)) return true;
    if (this.matchDoctype(stackContent)) return true;
    if (this.matchCDATA(stackContent)) return true;
    if (this.matchText(stackContent)) return true;
    
    return false;
  }
  
  // Token pattern matching methods
  public matchStartTag(content: string): boolean {
    // Implementation
  }
  
  // Other matching methods...
}
```

## 3. Parser Implementation (State Machine)

The parser will take tokenizer output and build an AST using a state machine approach:

```typescript
// HTMLParser.ts
import { HTMLToken, HTMLTokenizer } from './HTMLTokenizer';
import { State } from '../core/State';
import { StateMachine } from '../core/StateMachine';
import { StateMachineMinimizer } from '../core/StateMachineMinimizer';

export class HTMLParser {
  public states: Set<State>;
  public currentState: State | null;
  public equivalenceClasses: Map<number, Set<State>>;
  public optimizedStateMap: Map<State, State>;
  
  constructor() {
    this.states = new Set();
    this.currentState = null;
    this.equivalenceClasses = new Map();
    this.optimizedStateMap = new Map();
    this.initializeStates();
  }
  
  // Initialize the parser state machine
  public initializeStates(): void {
    // Define states: Initial, InTag, InContent, InComment, etc.
    const initialState = this.createState('Initial', false);
    const inTagState = this.createState('InTag', false);
    const inContentState = this.createState('InContent', true);
    // Additional states...
    
    // Define transitions between states
    this.addTransition(initialState, '<', inTagState);
    this.addTransition(initialState, 'text', inContentState);
    // Additional transitions...
    
    this.currentState = initialState;
  }
  
  // Parse HTML content into an AST
  parse(input: string): HTMLAst {
    const tokenizer = new HTMLTokenizer(input);
    const { tokens } = tokenizer.tokenize();
    
    // Apply state machine minimization
    this.minimizeStates();
    
    // Build optimized AST
    const ast = this.buildOptimizedAST(tokens);
    
    // Apply AST optimizations
    return this.optimizeAST(ast);
  }
  
  // State minimization using automaton theory
  public minimizeStates(): void {
    // Implementation of state minimization algorithm
    // This creates equivalence classes of states
  }
  
  // Build AST using minimized state machine
  public buildOptimizedAST(tokens: HTMLToken[]): HTMLAst {
    // Implementation
  }
  
  // Optimize the AST structure
  public optimizeAST(ast: HTMLAst): HTMLAst {
    // Apply optimizations like merging text nodes
    // and removing redundant nodes
  }
}
```

## 4. AST Optimization

The AST optimizer will use state minimization techniques to reduce memory footprint:

```typescript
// HTMLAstOptimizer.ts
import { HTMLAst, HTMLNode } from './HTMLAst';

export class HTMLAstOptimizer {
  public stateClasses: Map<number, Set<HTMLNode>>;
  public nodeSignatures: Map<string, number>;
  public minimizedNodes: WeakMap<HTMLNode, HTMLNode>;
  
  constructor() {
    this.stateClasses = new Map();
    this.nodeSignatures = new Map();
    this.minimizedNodes = new WeakMap();
  }
  
  optimize(ast: HTMLAst): HTMLAst {
    // Phase 1: Build state equivalence classes
    this.buildStateClasses(ast);
    
    // Phase 2: Node reduction and path optimization
    const optimizedRoot = this.optimizeNode(ast.root);
    
    // Phase 3: Memory optimization
    this.applyMemoryOptimizations(optimizedRoot);
    
    // Compute optimization metrics
    const metrics = this.computeOptimizationMetrics(ast.root, optimizedRoot);
    
    return {
      root: optimizedRoot,
      metadata: {
        ...ast.metadata,
        optimizationMetrics: metrics
      }
    };
  }
  
  // Find equivalent nodes by computing state signatures
  public buildStateClasses(ast: HTMLAst): void {
    // Implementation
  }
  
  // Generate signature for node comparison
  public computeNodeSignature(node: HTMLNode): string {
    // Implementation
  }
  
  // Optimize a single node
  public optimizeNode(node: HTMLNode): HTMLNode {
    // Implementation
  }
  
  // Apply memory optimizations
  public applyMemoryOptimizations(node: HTMLNode): void {
    // Implementation
  }
  
  // Calculate optimization metrics
  public computeOptimizationMetrics(
    originalRoot: HTMLNode, 
    optimizedRoot: HTMLNode
  ): OptimizationMetrics {
    // Implementation
  }
}
```

## 5. Virtual DOM Components

The AST gets transformed into virtual DOM nodes with diffing capabilities:

```typescript
// VHTMLNode.ts
import { VNodeBase } from "../core/base";
import { HTMLToken, HTMLTokenizer } from "../tokenizer";
import { HTMLParser } from "../parser";
import { HTMLAst } from "../ast";

export interface VHTMLNodeProps {
  // Props definition
}

export interface HTMLNodeMetadata {
  // Metadata definition
}

export class VHTMLNode extends VNodeBase {
  public readonly type: string;
  public readonly props: VHTMLNodeProps;
  public readonly children: VNodeBase[];
  public readonly key: string | number;
  public readonly state: VHTMLNodeState;
  
  constructor(
    type: string,
    props: VHTMLNodeProps = {},
    children: VNodeBase[] = [],
    key: string | number = VHTMLNode.generateKey()
  ) {
    super();
    this.type = type;
    this.props = Object.freeze({ ...props });
    this.children = [...children];
    this.key = key;
    
    this.state = {
      id: VHTMLNode.nodeCounter++,
      transitions: new Map(),
      isMinimized: false,
      equivalenceClass: null
    };
  }
  
  // Factory methods
  public static createText(content: string): VHTMLNode {
    // Implementation
  }
  
  public static createElement(
    type: string,
    props: VHTMLNodeProps = {},
    ...children: (VHTMLNode | string | VHTMLNode[])[]
  ): VHTMLNode {
    // Implementation
  }
  
  public static fromHTML(html: string): VHTMLNode {
    // Implementation
  }
  
  // State management methods
  public getStateSignature(): string {
    // Implementation
  }
  
  public minimize(): VHTMLNode {
    // Implementation
  }
  
  // DOM rendering
  public toDOM(): Node {
    // Implementation
  }
  
  // VNodeBase implementation
  public clone(): VNodeBase {
    // Implementation
  }
  
  public equals(other: VNodeBase): boolean {
    // Implementation
  }
}
```

## 6. Diff and Patch Implementation

```typescript
// VHTMLDiff.ts
import { DiffBase } from "../core/base";

export type HTMLPatch = {
  // Patch type definitions
};

export class HTMLDiff extends DiffBase {
  public patches: Map<number, HTMLPatch[]>;
  public index: number;
  
  constructor() {
    super();
    this.patches = new Map();
    this.index = 0;
  }
  
  public diff(oldTree: HTMLVNode | null, newTree: HTMLVNode | null): Map<number, HTMLPatch[]> {
    // Implementation
  }
  
  public patch(node: Node, patches: Map<number, HTMLPatch[]>): Node {
    // Implementation
  }
  
  public diffProps(oldProps: Record<string, any>, newProps: Record<string, any>): Record<string, any> {
    // Implementation
  }
  
  public diffChildren(oldChildren: HTMLVNode[], newChildren: HTMLVNode[]): HTMLPatch[] {
    // Implementation
  }
}
```

## 7. DOP Adapter Integration

The DOP (Data-Oriented Programming) Adapter connects the parser components to the application:

```typescript
// DOPAdapter.ts
export class DOPAdapter {
  public dataModel: DataModel;
  public behaviorModel: BehaviorModel;
  public stateMachineMinimizer: StateMachineMinimizer;
  public renderStrategy: RenderStrategy;
  
  constructor() {
    this.dataModel = new DataModel();
    this.behaviorModel = new BehaviorModel();
    this.stateMachineMinimizer = new StateMachineMinimizer();
    this.renderStrategy = new DefaultRenderStrategy();
  }
  
  // Create component from functional configuration
  createFromFunctional(config: FunctionalConfig): Component {
    // Implementation
  }
  
  // Create component from class
  createFromClass(componentClass: any): Component {
    // Implementation
  }
  
  // State management
  getState(): State {
    // Implementation
  }
  
  setState(newState: State): void {
    // Implementation
  }
  
  // Transition application
  applyTransition(name: string, payload: any): void {
    // Implementation
  }
  
  // State machine optimization
  optimizeStateMachine(): void {
    // Implementation
  }
  
  // Precomputation for common transitions
  precomputeTransition(name: string, pattern: Object): void {
    // Implementation
  }
}
```

## Implementation Phases

### Phase 1: Core Token and Type System
- Implement HTMLTokenType and token interfaces
- Develop token builder for type-safe token creation
- Implement base token validation logic

### Phase 2: Tokenizer Development
- Implement shift-reduce algorithm
- Create pattern-matching functions for token types
- Add error handling and reporting

### Phase 3: Parser State Machine
- Define parser states and transitions
- Implement state minimization algorithm
- Build the optimized AST generator

### Phase 4: AST Optimization
- Implement node equivalence class computation
- Create node signature generation
- Develop memory optimization techniques

### Phase 5: Virtual DOM
- Implement VHTMLNode with state tracking
- Create DOM generation methods
- Add HTML-to-VDOM conversion utilities

### Phase 6: Diffing and Patching
- Implement efficient diff algorithm using equivalence classes
- Create patch application system
- Optimize for minimal DOM operations

### Phase 7: DOP Adapter
- Connect parser components to application
- Implement dual API support (functional and OOP)
- Add state transition optimization

## Type Safety and Extension Points

The architecture ensures compile-time type safety through:

1. Strict token type definitions separate from implementation
2. Builder pattern for validated token creation
3. Immutable data structures with frozen objects
4. Clear interfaces for each component with minimal dependencies
5. Generic extension points using TypeScript generics

## Extension Points for OBIX Users

1. Custom token types can be added by extending HTMLTokenType
2. Parser states can be customized by implementing custom state transitions
3. AST optimization can be extended with custom node signatures
4. Virtual DOM can be extended with custom node types
5. Component API can be extended through the DOP Adapter

This architecture fulfills all requirements for a shift-reduce parser with separate token and type systems, state machine-based parsing, and AST optimization using automaton theory.