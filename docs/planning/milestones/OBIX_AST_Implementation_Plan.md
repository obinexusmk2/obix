# OBIX Single-Pass AST Processing Architecture: Implementation Plan

## 1. Core Interfaces & Base Classes

### 1.1 Unified ASTNode Interface
```typescript
// src/core/ast/common/ASTNode.ts
export interface ASTNode<T = any> {
  id: string;
  type: string;
  parent: ASTNode | null;
  children: ASTNode[];
  metadata: StateMetadata;
  
  // Core methods
  clone(): ASTNode;
  isEquivalentTo(other: ASTNode): boolean;
  computeStateSignature(): string;
  
  // State machine methods
  getTransition(symbol: string): ASTNode | undefined;
  addTransition(symbol: string, target: ASTNode): void;
  getTransitionSymbols(): string[];
  setEquivalenceClass(classId: number): void;
  markAsMinimized(): void;
  isMinimized(): boolean;
}

export interface StateMetadata {
  equivalenceClass: number | null;
  stateSignature: string | null;
  isMinimized: boolean;
  transitions: Map<string, ASTNode>;
}
```

### 1.2 Abstract Base Node Implementation
```typescript
// src/core/ast/common/BaseNode.ts
export abstract class BaseNode implements ASTNode {
  public readonly id: string;
  public readonly type: string;
  public parent: ASTNode | null = null;
  public children: ASTNode[] = [];
  public readonly metadata: StateMetadata;
  
  constructor(type: string) {
    this.id = this.generateId();
    this.type = type;
    this.metadata = {
      equivalenceClass: null,
      stateSignature: null,
      isMinimized: false,
      transitions: new Map()
    };
  }
  
  // Implementation of ASTNode methods
  // ...
}
```

## 2. Single-Pass Processor

### 2.1 ASTProcessor Interface
```typescript
// src/core/ast/ASTProcessor.ts
export interface ASTProcessor<T, R> {
  process(source: T): ProcessedAST<R>;
}

export interface ProcessedAST<T> {
  ast: ASTNode;
  virtualDOM: T;
  validationResult: ValidationResult;
  metrics: OptimizationMetrics;
}
```

### 2.2 HTML AST Processor Implementation
```typescript
// src/core/ast/html/HTMLASTProcessor.ts
export class HTMLASTProcessor implements ASTProcessor<string, HTMLVNode> {
  private parser: HTMLParser;
  private minimizer: StateMachineMinimizer;
  private validator: HTMLAstValidator;
  private vdomBuilder: HTMLVDOMBuilder;
  
  constructor() {
    this.parser = new HTMLParser();
    this.minimizer = new StateMachineMinimizer();
    this.validator = new HTMLAstValidator();
    this.vdomBuilder = new HTMLVDOMBuilder();
  }
  
  public process(source: string): ProcessedAST<HTMLVNode> {
    // SINGLE PASS PIPELINE:
    
    // 1. Parse source to AST
    const ast = this.parser.parse(source);
    
    // 2. Apply state minimization during AST traversal
    const optimizedAST = this.minimizer.minimize(ast);
    
    // 3. Validate during the same traversal
    const validationResult = this.validator.validate(optimizedAST);
    
    // 4. Build virtual DOM representation
    const vdom = this.vdomBuilder.build(optimizedAST);
    
    // 5. Compute metrics
    const metrics = this.computeMetrics(ast, optimizedAST);
    
    return {
      ast: optimizedAST,
      virtualDOM: vdom,
      validationResult,
      metrics
    };
  }
  
  private computeMetrics(originalAST: ASTNode, optimizedAST: ASTNode): OptimizationMetrics {
    // Implementation...
  }
}
```

### 2.3 CSS AST Processor (Similar Structure)
```typescript
// src/core/ast/css/CSSASTProcessor.ts
export class CSSASTProcessor implements ASTProcessor<string, CSSVNode> {
  // Similar implementation to HTMLASTProcessor
}
```

## 3. State Machine Minimizer

```typescript
// src/core/ast/common/StateMachineMinimizer.ts
export class StateMachineMinimizer {
  private stateClasses: Map<number, Set<ASTNode>>;
  private nodeSignatures: Map<string, number>;
  private minimizedNodes: WeakMap<ASTNode, ASTNode>;
  
  constructor() {
    this.stateClasses = new Map();
    this.nodeSignatures = new Map();
    this.minimizedNodes = new WeakMap();
  }
  
  public minimize(ast: ASTNode): ASTNode {
    // Clear state
    this.stateClasses.clear();
    this.nodeSignatures.clear();
    
    // Phase 1: Build state equivalence classes
    this.buildEquivalenceClasses(ast);
    
    // Phase 2: Node reduction and optimization
    const optimizedAST = this.optimizeNode(ast);
    
    // Phase 3: Memory optimization
    this.applyMemoryOptimizations(optimizedAST);
    
    return optimizedAST;
  }
  
  private buildEquivalenceClasses(node: ASTNode): void {
    // Implementation based on Nnamdi Okpala's algorithm
  }
  
  private optimizeNode(node: ASTNode): ASTNode {
    // Implementation...
  }
  
  private applyMemoryOptimizations(node: ASTNode): void {
    // Implementation...
  }
}
```

## 4. Validator Framework

```typescript
// src/core/validation/Validator.ts
export interface Validator<T> {
  validate(target: T): ValidationResult;
}

export interface ValidationRule<T> {
  id: string;
  description: string;
  severity: ErrorSeverity;
  validate(target: T): ValidationResult;
}

export class ValidationEngine<T> {
  private rules: ValidationRule<T>[] = [];
  
  public registerRule(rule: ValidationRule<T>): void {
    this.rules.push(rule);
  }
  
  public validate(target: T): ValidationResult {
    // Implementation...
  }
}
```

## 5. Virtual DOM Builder

```typescript
// src/core/vdom/VirtualDOMBuilder.ts
export interface VirtualDOMBuilder<T, R> {
  build(ast: T): R;
}

export class HTMLVDOMBuilder implements VirtualDOMBuilder<ASTNode, HTMLVNode> {
  public build(ast: ASTNode): HTMLVNode {
    // Implementation...
  }
}

export class CSSVDOMBuilder implements VirtualDOMBuilder<ASTNode, CSSVNode> {
  public build(ast: ASTNode): CSSVNode {
    // Implementation...
  }
}
```

## 6. DOM Patching System

```typescript
// src/core/vdom/DOMPatchManager.ts
export class DOMPatchManager<T> {
  private lastVDOM: T | null = null;
  
  public applyPatches(newVDOM: T, target: Element): void {
    if (this.lastVDOM) {
      const patches = this.computeDiff(this.lastVDOM, newVDOM);
      this.applyPatchesToDOM(patches, target);
    } else {
      this.renderFull(newVDOM, target);
    }
    
    this.lastVDOM = newVDOM;
  }
  
  private computeDiff(oldVDOM: T, newVDOM: T): Patch[] {
    // Implementation using minimized states for efficient diffing
  }
  
  private applyPatchesToDOM(patches: Patch[], target: Element): void {
    // Implementation...
  }
  
  private renderFull(vdom: T, target: Element): void {
    // Implementation...
  }
}
```

## 7. Integration with OBIX Framework

```typescript
// src/core/ObixComponent.ts
export class ObixComponent {
  private htmlProcessor: HTMLASTProcessor;
  private cssProcessor: CSSASTProcessor;
  private domPatchManager: DOMPatchManager;
  
  constructor() {
    this.htmlProcessor = new HTMLASTProcessor();
    this.cssProcessor = new CSSASTProcessor();
    this.domPatchManager = new DOMPatchManager();
  }
  
  public render(htmlTemplate: string, cssStyles: string, target: Element): void {
    // Process HTML
    const processedHTML = this.htmlProcessor.process(htmlTemplate);
    
    // Process CSS
    const processedCSS = this.cssProcessor.process(cssStyles);
    
    // Combine into a composite VDOM
    const compositeVDOM = this.createCompositeVDOM(
      processedHTML.virtualDOM,
      processedCSS.virtualDOM
    );
    
    // Apply to DOM
    this.domPatchManager.applyPatches(compositeVDOM, target);
  }
  
  private createCompositeVDOM(htmlVDOM: HTMLVNode, cssVDOM: CSSVNode): CompositeVNode {
    // Implementation...
  }
}
```

## 8. Performance Optimization Features

### 8.1 Memoization of Computationally Expensive Operations
```typescript
// src/core/utils/memoize.ts
export function memoize<T, R>(fn: (arg: T) => R): (arg: T) => R {
  const cache = new Map<string, R>();
  
  return (arg: T) => {
    const key = JSON.stringify(arg);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(arg);
    cache.set(key, result);
    return result;
  };
}
```

### 8.2 LRU Cache for Components with Many States
```typescript
// src/core/utils/LRUCache.ts
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  private usage: Map<K, number>;
  private accessCount: number = 0;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
    this.usage = new Map();
  }
  
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // Update usage
    this.usage.set(key, ++this.accessCount);
    return this.cache.get(key);
  }
  
  set(key: K, value: V): void {
    if (this.cache.size >= this.capacity && !this.cache.has(key)) {
      // Evict least recently used item
      this.evictLRU();
    }
    
    this.cache.set(key, value);
    this.usage.set(key, ++this.accessCount);
  }
  
  private evictLRU(): void {
    let lruKey: K | null = null;
    let lruCount = Infinity;
    
    for (const [key, count] of this.usage.entries()) {
      if (count < lruCount) {
        lruKey = key;
        lruCount = count;
      }
    }
    
    if (lruKey !== null) {
      this.cache.delete(lruKey);
      this.usage.delete(lruKey);
    }
  }
}
```

## 9. Implementation Schedule

### Phase 1: Core Architecture (Weeks 1-2)
- Develop base interfaces and abstract classes
- Implement state machine minimizer
- Create validator framework
- Setup testing infrastructure

### Phase 2: HTML Processing (Weeks 3-4)
- Implement HTML parser integration
- Develop HTML AST processor
- Create HTML validators
- Build HTML VDOM representation

### Phase 3: CSS Processing (Weeks 5-6)
- Implement CSS parser integration
- Develop CSS AST processor
- Create CSS validators
- Build CSS VDOM representation

### Phase 4: DOM Integration (Weeks 7-8)
- Implement DOM patching system
- Develop composite VDOM
- Create ObixComponent framework integration
- Build performance optimizations

### Phase 5: Testing and Optimization (Weeks 9-10)
- Comprehensive testing
- Performance benchmarking
- Memory usage optimization
- Documentation and examples