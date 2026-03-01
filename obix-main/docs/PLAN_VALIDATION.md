# OBIX Error Validation Integration Plan

## 1. Introduction

This document outlines the implementation plan for integrating the Error Validation module with the Data-Oriented Programming (DOP) Adapter pattern in the OBIX framework. The integration will ensure that validation is applied consistently across both functional and object-oriented programming paradigms, leveraging automaton state minimization for optimized performance.

## 2. Core Components

### 2.1 ValidationAdapter

The `ValidationAdapter` will serve as the central bridge between the DOP pattern and validation functionality:

```typescript
// src/core/parser/adapter/ValidationAdapter.ts
export class ValidationAdapter {
  public dataModel: ValidationDataModel;
  public behaviorModel: ValidationBehaviorModel;
  public stateMachine: ValidationStateMachine;
  
  constructor() {
    this.dataModel = new ValidationDataModel();
    this.behaviorModel = new ValidationBehaviorModel();
    this.stateMachine = new ValidationStateMachine();
    this.initializeStateMachine();
  }
  
  // Initialize validation state machine with standard states and transitions
  public initializeStateMachine(): void {
    // Create states for validation workflow: initial, validating, valid, invalid
    // Add transitions between states
    // Apply state minimization
  }
  
  // Register a validation rule
  public registerRule(rule: ValidationRule): void {
    this.dataModel = this.dataModel.withRule(rule);
    
    // Optimize rules based on node type
    const optimizedRules = this.behaviorModel.optimizeRules(this.dataModel.rules);
    
    for (const [nodeType, rules] of optimizedRules.entries()) {
      this.dataModel = this.dataModel.withOptimizedRules(nodeType, rules);
    }
  }
  
  // Validate an AST or component state
  public validate(node: any): ValidationResult {
    // Reset the state machine
    this.stateMachine.reset();
    
    // Transition to validating state
    this.stateMachine.transition('start');
    
    // Track errors and warnings
    const errors: ParserError[] = [];
    const warnings: ParserError[] = [];
    
    // Traverse the node and validate
    this.traverseNode(node, errors, warnings);
    
    // Determine if valid (no errors)
    const isValid = errors.length === 0;
    
    // Transition to final state
    this.stateMachine.transition(isValid ? 'valid' : 'invalid');
    
    return {
      isValid,
      errors,
      warnings,
      metadata: {
        ruleCount: this.dataModel.rules.length,
        finalState: this.stateMachine.currentState?.id
      }
    };
  }
  
  // Recursive function to traverse and validate nodes
  public traverseNode(node: any, errors: ParserError[], warnings: ParserError[]): void {
    // Validate current node
    // Recursively validate children
  }
  
  // Static factory methods for creating adapters from functional and OOP configs
  public static createFromFunctional(config: any): ValidationAdapter {
    // Create adapter from functional configuration
  }
  
  public static createFromClass(validatorClass: any): ValidationAdapter {
    // Create adapter from class configuration
  }
}
```

### 2.2 ValidationDataModel

The immutable data model for validation state:

```typescript
// src/core/parser/validation/ValidationDataModel.ts
export class ValidationDataModel {
  public _rules: ValidationRule[] = [];
  public _validationState: Map<string, any> = new Map();
  public _errors: ParserError[] = [];
  public _optimizedRules: Map<string, ValidationRule[]> = new Map();
  
  // Immutable getters
  get rules(): ValidationRule[] {
    return [...this._rules];
  }
  
  get errors(): ParserError[] {
    return [...this._errors];
  }
  
  // Methods to create new instances with updates
  withRule(rule: ValidationRule): ValidationDataModel {
    const newModel = this.clone();
    newModel._rules.push(rule);
    return newModel;
  }
  
  withValidationState(key: string, value: any): ValidationDataModel {
    const newModel = this.clone();
    newModel._validationState.set(key, value);
    return newModel;
  }
  
  withError(error: ParserError): ValidationDataModel {
    const newModel = this.clone();
    newModel._errors.push(error);
    return newModel;
  }
  
  withOptimizedRules(nodeType: string, rules: ValidationRule[]): ValidationDataModel {
    const newModel = this.clone();
    newModel._optimizedRules.set(nodeType, rules);
    return newModel;
  }
  
  // Helper method to clone the model
  public clone(): ValidationDataModel {
    const newModel = new ValidationDataModel();
    newModel._rules = [...this._rules];
    newModel._validationState = new Map(this._validationState);
    newModel._errors = [...this._errors];
    newModel._optimizedRules = new Map(this._optimizedRules);
    return newModel;
  }
  
  // State access methods
  getState(key: string): any {
    return this._validationState.get(key);
  }
  
  getOptimizedRules(nodeType: string): ValidationRule[] {
    return this._optimizedRules.get(nodeType) || [];
  }
  
  hasOptimizedRules(nodeType: string): boolean {
    return this._optimizedRules.has(nodeType);
  }
}
```

### 2.3 ValidationBehaviorModel

The behavior model for validation operations:

```typescript
// src/core/parser/validation/ValidationBehaviorModel.ts
export class ValidationBehaviorModel {
  // Find applicable rules for a node
  findApplicableRules(node: any, rules: ValidationRule[]): ValidationRule[] {
    if (!node || !node.type) {
      return [];
    }
    
    return rules.filter(rule => {
      // For HTML rule
      if ('targetNodeTypes' in rule) {
        return (rule as any).targetNodeTypes.includes(node.type);
      }
      
      // For generic rule
      return true;
    });
  }
  
  // Apply a validation rule to a node
  applyRule(rule: ValidationRule, node: any): ValidationResult {
    try {
      return rule.validate(node);
    } catch (error) {
      // Create a validation error if rule execution fails
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        isValid: false,
        errors: [
          new BaseParserError({
            code: ErrorCode.VALIDATION_ERROR,
            message: `Rule execution failed: ${errorMessage}`,
            position: this.getNodePosition(node),
            severity: ErrorSeverity.ERROR,
            metadata: {
              ruleId: rule.id,
              nodeType: node.type
            }
          })
        ],
        warnings: [],
        metadata: {
          ruleId: rule.id,
          executionError: true
        }
      };
    }
  }
  
  // Helper to get node position
  getNodePosition(node: any): Position {
    if (node && node.position) {
      return node.position;
    }
    
    return {
      line: 0,
      column: 0,
      start: 0,
      end: 0
    };
  }
  
  // Optimize rules by grouping them by node type
  optimizeRules(rules: ValidationRule[]): Map<string, ValidationRule[]> {
    const optimizedRules = new Map<string, ValidationRule[]>();
    
    for (const rule of rules) {
      if ('targetNodeTypes' in rule) {
        const targetTypes = (rule as any).targetNodeTypes;
        
        for (const type of targetTypes) {
          if (!optimizedRules.has(type)) {
            optimizedRules.set(type, []);
          }
          
          optimizedRules.get(type)!.push(rule);
        }
      } else {
        // Generic rules that apply to all types
        if (!optimizedRules.has('*')) {
          optimizedRules.set('*', []);
        }
        
        optimizedRules.get('*')!.push(rule);
      }
    }
    
    return optimizedRules;
  }
}
```

### 2.4 ValidationStateMachine

The state machine for validation workflows:

```typescript
// src/core/parser/validation/ValidationStateMachine.ts
export class ValidationStateMachine {
  public _states: Map<string, ValidationState> = new Map();
  public _currentState: ValidationState | null = null;
  public _transitions: Map<string, Map<string, string>> = new Map();
  
  addState(state: ValidationState): void {
    this._states.set(state.id, state);
    
    // Initialize transitions map for this state
    if (!this._transitions.has(state.id)) {
      this._transitions.set(state.id, new Map());
    }
    
    // Set as current state if first state added
    if (!this._currentState) {
      this._currentState = state;
    }
  }
  
  addTransition(fromStateId: string, onInput: string, toStateId: string): void {
    if (!this._states.has(fromStateId) || !this._states.has(toStateId)) {
      throw new Error(`Cannot add transition: state does not exist`);
    }
    
    const stateTransitions = this._transitions.get(fromStateId)!;
    stateTransitions.set(onInput, toStateId);
  }
  
  transition(input: string): ValidationState {
    if (!this._currentState) {
      throw new Error('No current state set');
    }
    
    const stateTransitions = this._transitions.get(this._currentState.id);
    if (!stateTransitions) {
      throw new Error(`No transitions defined for state ${this._currentState.id}`);
    }
    
    const nextStateId = stateTransitions.get(input);
    if (!nextStateId) {
      throw new Error(`No transition defined for input '${input}' from state ${this._currentState.id}`);
    }
    
    const nextState = this._states.get(nextStateId);
    if (!nextState) {
      throw new Error(`Invalid transition: target state ${nextStateId} not found`);
    }
    
    this._currentState = nextState;
    return nextState;
  }
  
  reset(): void {
    // Reset to the first added state
    if (this._states.size > 0) {
      this._currentState = this._states.values().next().value;
    }
  }
  
  minimize(): ValidationStateMachine {
    // Create the minimizer
    const minimizer = new StateMachineMinimizer();
    
    // Get minimized machine
    const minimizedMachine = minimizer.minimizeStates(this);
    
    // Return the minimized machine
    return minimizedMachine;
  }
  
  // Getters for states and transitions
  get states(): Map<string, ValidationState> {
    return new Map(this._states);
  }
  
  get transitions(): Map<string, Map<string, string>> {
    return new Map(this._transitions);
  }
  
  get currentState(): ValidationState | null {
    return this._currentState;
  }
}
```

## 3. Integration with DOP Adapter

### 3.1 Extending DOPAdapter

The main DOP Adapter will be extended to support validation:

```typescript
// src/api/shared/dop-adapter.ts
export class DOPAdapter {
  public dataModel: DataModel;
  public behaviorModel: BehaviorModel;
  public validationAdapter: ValidationAdapter;
  
  constructor(options?: DOPAdapterOptions) {
    this.dataModel = new DataModel();
    this.behaviorModel = new BehaviorModel();
    this.validationAdapter = new ValidationAdapter();
    
    // Initialize with options if provided
    if (options) {
      this.initialize(options);
    }
  }
  
  // Initialize adapter with options
  public initialize(options: DOPAdapterOptions): void {
    // Set up state and transitions
    
    // Set up validation rules if provided
    if (options.validation && Array.isArray(options.validation)) {
      for (const rule of options.validation) {
        this.validationAdapter.registerRule(rule);
      }
    }
  }
  
  // Create component from functional config
  public static createFromFunctional(config: FunctionalConfig): Component {
    const adapter = new DOPAdapter();
    
    // Set up state model
    if (config.initialState) {
      adapter.dataModel = adapter.dataModel.withState(config.initialState);
    }
    
    // Set up transitions
    if (config.transitions) {
      for (const [name, fn] of Object.entries(config.transitions)) {
        adapter.dataModel = adapter.dataModel.withTransitionMap(name, fn);
      }
    }
    
    // Set up validation
    if (config.validation) {
      for (const rule of config.validation) {
        adapter.validationAdapter.registerRule(rule);
      }
    }
    
    // Create and return the functional component
    return new FunctionalComponent(adapter, config);
  }
  
  // Create component from class
  public static createFromClass(componentClass: any): Component {
    const instance = new componentClass();
    const adapter = new DOPAdapter();
    
    // Extract state
    if (instance.initialState) {
      adapter.dataModel = adapter.dataModel.withState(instance.initialState);
    }
    
    // Extract methods as transitions
    const methods = Object.getOwnPropertyNames(componentClass.prototype)
      .filter(name => 
        name !== 'constructor' && 
        name !== 'render' && 
        typeof instance[name] === 'function'
      );
    
    for (const method of methods) {
      adapter.dataModel = adapter.dataModel.withTransitionMap(
        method, 
        instance[method].bind(instance)
      );
    }
    
    // Extract validation method if exists
    if (typeof instance.validate === 'function') {
      const validationAdapter = ValidationAdapter.createFromClass(componentClass);
      adapter.validationAdapter = validationAdapter;
    }
    
    // Return the OOP component
    return new OOPComponent(adapter, instance);
  }
  
  // Validate current state
  public validate(state?: any): ValidationResult {
    const stateToValidate = state || this.dataModel.getState();
    return this.validationAdapter.validate(stateToValidate);
  }
  
  // Other DOP adapter methods
  // ...
}
```

### 3.2 Component Interface Updates

The Component interface will be updated to include validation:

```typescript
// src/api/shared/component-interface.ts
export interface Component {
  // Existing component interface methods
  state: any;
  trigger(event: string, payload?: any): void;
  getState(): any;
  setState(newState: any): void;
  
  // New validation method
  validate(state?: any): ValidationResult;
}
```

### 3.3 Functional Component Implementation

```typescript
// src/api/functional/FunctionalComponent.ts
export class FunctionalComponent implements Component {
  public adapter: DOPAdapter;
  public config: FunctionalConfig;
  
  constructor(adapter: DOPAdapter, config: FunctionalConfig) {
    this.adapter = adapter;
    this.config = config;
  }
  
  // Implement component interface
  get state(): any {
    return this.adapter.getState();
  }
  
  trigger(event: string, payload?: any): void {
    this.adapter.applyTransition(event, payload);
  }
  
  getState(): any {
    return this.adapter.getState();
  }
  
  setState(newState: any): void {
    this.adapter.setState(newState);
  }
  
  // Implement validation
  validate(state?: any): ValidationResult {
    return this.adapter.validate(state);
  }
  
  // Render method
  render(): any {
    if (typeof this.config.render === 'function') {
      return this.config.render(
        this.getState(), 
        this.trigger.bind(this)
      );
    }
    return null;
  }
}
```

### 3.4 OOP Component Implementation

```typescript
// src/api/oop/OOPComponent.ts
export class OOPComponent implements Component {
  public adapter: DOPAdapter;
  public instance: any;
  
  constructor(adapter: DOPAdapter, instance: any) {
    this.adapter = adapter;
    this.instance = instance;
    
    // Bind methods from instance to this component
    this.bindInstanceMethods();
  }
  
  public bindInstanceMethods(): void {
    // Find methods that should be bound
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.instance))
      .filter(name => 
        name !== 'constructor' && 
        typeof this.instance[name] === 'function'
      );
    
    // Bind each method
    for (const method of methods) {
      if (!(method in this)) {
        (this as any)[method] = (...args: any[]) => {
          return this.instance[method](...args);
        };
      }
    }
  }
  
  // Implement component interface
  get state(): any {
    return this.adapter.getState();
  }
  
  trigger(event: string, payload?: any): void {
    this.adapter.applyTransition(event, payload);
  }
  
  getState(): any {
    return this.adapter.getState();
  }
  
  setState(newState: any): void {
    this.adapter.setState(newState);
  }
  
  // Implement validation
  validate(state?: any): ValidationResult {
    // Use instance's validate method if available, otherwise use adapter
    if (typeof this.instance.validate === 'function') {
      return this.instance.validate(state || this.getState());
    }
    return this.adapter.validate(state);
  }
  
  // Render method
  render(): any {
    if (typeof this.instance.render === 'function') {
      return this.instance.render(this.getState());
    }
    return null;
  }
}
```

## 4. Error Types and Handling

### 4.1 ParserError Interface and Implementation

```typescript
// src/core/common/errors/error-types.ts
export interface Position {
  line: number;
  column: number;
  start: number;
  end: number;
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCode {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  SEMANTIC_ERROR = 'SEMANTIC_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INCOMPLETE_ELEMENT = 'INCOMPLETE_ELEMENT',
  UNEXPECTED_TOKEN = 'UNEXPECTED_TOKEN',
  MISSING_REQUIRED = 'MISSING_REQUIRED',
  INVALID_ATTRIBUTE = 'INVALID_ATTRIBUTE',
  INVALID_SELECTOR = 'INVALID_SELECTOR',
  INVALID_PROPERTY = 'INVALID_PROPERTY',
  UNCLOSED_BLOCK = 'UNCLOSED_BLOCK'
}

export interface ParserError {
  code: ErrorCode;
  message: string;
  position: Position;
  context?: string;
  severity: ErrorSeverity;
  toString(): string;
  toJSON(): Record<string, any>;
}

// src/core/common/errors/error-factory.ts
export class BaseParserError implements ParserError {
  code: ErrorCode;
  message: string;
  position: Position;
  context?: string;
  severity: ErrorSeverity;
  metadata: Record<string, any>;

  constructor(options: {
    code: ErrorCode;
    message: string;
    position: Position;
    context?: string;
    severity?: ErrorSeverity;
    metadata?: Record<string, any>;
  }) {
    this.code = options.code;
    this.message = options.message;
    this.position = options.position;
    this.context = options.context;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.metadata = options.metadata || {};
  }

  toString(): string {
    return `${this.severity.toUpperCase()} [${this.code}]: ${this.message} at line ${this.position.line}, column ${this.position.column}`;
  }

  toJSON(): Record<string, any> {
    return {
      code: this.code,
      message: this.message,
      position: this.position,
      context: this.context,
      severity: this.severity,
      metadata: this.metadata
    };
  }
}
```

### 4.2 Error Tracker Interface and Implementation

```typescript
// src/core/parser/errors/index.ts
export interface ErrorTracker {
  errors: ParserError[];
  addError(error: ParserError): void;
  getErrors(): ParserError[];
  hasErrors(): boolean;
  getErrorTypeCounts(): Map<ErrorCode, number>;
  generateSummary(): string;
}

export class BaseErrorTracker implements ErrorTracker {
  public _errors: ParserError[] = [];

  get errors(): ParserError[] {
    return [...this._errors];
  }

  addError(error: ParserError): void {
    this._errors.push(error);
  }

  getErrors(): ParserError[] {
    return [...this._errors];
  }

  hasErrors(): boolean {
    return this._errors.length > 0;
  }

  getErrorTypeCounts(): Map<ErrorCode, number> {
    const counts = new Map<ErrorCode, number>();
    
    for (const error of this._errors) {
      const count = counts.get(error.code) || 0;
      counts.set(error.code, count + 1);
    }
    
    return counts;
  }

  generateSummary(): string {
    if (this._errors.length === 0) {
      return "No errors found.";
    }
    
    const counts = this.getErrorTypeCounts();
    const summary = ['Error Summary:'];
    
    for (const [code, count] of counts.entries()) {
      summary.push(`  • ${code}: ${count} occurrence${count !== 1 ? 's' : ''}`);
    }
    
    summary.push(`\nTotal: ${this._errors.length} error${this._errors.length !== 1 ? 's' : ''}`);
    
    return summary.join('\n');
  }

  clearErrors(): void {
    this._errors = [];
  }
}
```

### 4.3 Language-Specific Error Trackers

```typescript
// src/core/parser/html/HTMLErrorTracker.ts
export class HTMLErrorTracker extends BaseErrorTracker {
  categorizeErrors(): Map<string, HTMLParserError[]> {
    const categories = new Map<string, HTMLParserError[]>();
    
    for (const error of this.errors) {
      if (error instanceof HTMLParserError) {
        const category = error.code;
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(error);
      }
    }
    
    return categories;
  }
  
  getSyntaxErrors(): HTMLParserError[] {
    return this.errors.filter(e => 
      e instanceof HTMLParserError && 
      (e.code === ErrorCode.SYNTAX_ERROR || e.code === ErrorCode.UNEXPECTED_TOKEN)
    ) as HTMLParserError[];
  }
  
  getSemanticErrors(): HTMLParserError[] {
    return this.errors.filter(e => 
      e instanceof HTMLParserError && 
      (e.code === ErrorCode.SEMANTIC_ERROR || e.code === ErrorCode.INVALID_ATTRIBUTE)
    ) as HTMLParserError[];
  }
}

// src/core/parser/css/CSSErrorTracker.ts
export class CSSErrorTracker extends BaseErrorTracker {
  categorizeErrors(): Map<string, CSSParserError[]> {
    const categories = new Map<string, CSSParserError[]>();
    
    for (const error of this.errors) {
      if (error instanceof CSSParserError) {
        const category = error.code;
        if (!categories.has(category)) {
          categories.set(category, []);
        }
        categories.get(category)!.push(error);
      }
    }
    
    return categories;
  }
  
  getSyntaxErrors(): CSSParserError[] {
    return this.errors.filter(e => 
      e instanceof CSSParserError && 
      (e.code === ErrorCode.SYNTAX_ERROR || e.code === ErrorCode.UNEXPECTED_TOKEN)
    ) as CSSParserError[];
  }
  
  getSemanticErrors(): CSSParserError[] {
    return this.errors.filter(e => 
      e instanceof CSSParserError && 
      (e.code === ErrorCode.SEMANTIC_ERROR || e.code === ErrorCode.INVALID_PROPERTY)
    ) as CSSParserError[];
  }
}
```

## 5. Validation Rules

### 5.1 ValidationRule Interface

```typescript
// src/core/parser/validation/index.ts
export interface ValidationRule {
  id: string;
  description: string;
  severity: ErrorSeverity;
  validate(node: any): ValidationResult;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ParserError[];
  warnings: ParserError[];
  metadata: Record<string, any>;
}
```

### 5.2 HTML Validation Rules

```typescript
// src/core/parser/html/validation/HTMLValidationRule.ts
export class HTMLValidationRule implements ValidationRule {
  id: string;
  description: string;
  severity: ErrorSeverity;
  targetNodeTypes: string[];
  
  constructor(options: {
    id: string;
    description: string;
    severity?: ErrorSeverity;
    targetNodeTypes: string[];
  }) {
    this.id = options.id;
    this.description = options.description;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.targetNodeTypes = options.targetNodeTypes;
  }
  
  validate(node: HTMLNode): ValidationResult {
    // Base implementation to be overridden
    return {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: { ruleId: this.id }
    };
  }
}

// src/core/parser/html/validation/rules/RequiredAttributeRule.ts
export class RequiredAttributeRule extends HTMLValidationRule {
  public attributeName: string;
  
  constructor(attributeName: string, targetNodeTypes: string[]) {
    super({
      id: `required_attribute_${attributeName}`,
      description: `Validates that ${attributeName} attribute is present`,
      severity: ErrorSeverity.ERROR,
      targetNodeTypes
    });
    
    this.attributeName = attributeName;
  }
  
  validate(node: HTMLNode): ValidationResult {
    // Check if the node has the required attribute
    const hasAttribute = node.attributes && 
                         node.attributes.has(this.attributeName);
    
    if (hasAttribute) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: { ruleId: this.id }
      };
    }
    
    // Create error for missing attribute
    return {
      isValid: false,
      errors: [
        new HTMLParserError({
          code: ErrorCode.MISSING_REQUIRED,
          message: `Required attribute "${this.attributeName}" missing on ${node.type} element`,
          position: node.position,
          severity: this.severity,
          tokenType: node.type,
          metadata: {
            attributeName: this.attributeName,
            nodeType: node.type
          }
        })
      ],
      warnings: [],
      metadata: { ruleId: this.id }
    };
  }
}
```

### 5.3 CSS Validation Rules

```typescript
// src/core/parser/css/validation/CSSValidationRule.ts
export class CSSValidationRule implements ValidationRule {
  id: string;
  description: string;
  severity: ErrorSeverity;
  targetNodeTypes: string[];
  
  constructor(options: {
    id: string;
    description: string;
    severity?: ErrorSeverity;
    targetNodeTypes: string[];
  }) {
    this.id = options.id;
    this.description = options.description;
    this.severity = options.severity || ErrorSeverity.ERROR;
    this.targetNodeTypes = options.targetNodeTypes;
  }
  
  validate(node: CSSNode): ValidationResult {
    // Base implementation to be overridden
    return {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: { ruleId: this.id }
    };
  }
}
```

## 6. Validation Engine

```typescript
// src/core/parser/validation/engine.ts
export class ValidationEngine {
  public rules: ValidationRule[] = [];
  public errorTracker: ErrorTracker;
  
  constructor(errorTracker?: ErrorTracker) {
    this.errorTracker = errorTracker || new BaseErrorTracker();
  }
  
  registerRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }
  
  validate(ast: any): ValidationResult {
    // Reset error tracker
    if (this.errorTracker instanceof BaseErrorTracker) {
      (this.errorTracker as BaseErrorTracker).clearErrors();
    }
    
    const errors: ParserError[] = [];
    const warnings: ParserError[] = [];
    
    // Traverse and validate the AST
    this.traverseNode(ast, errors, warnings);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        ruleCount: this.rules.length,
        totalIssues: errors.length + warnings.length
      }
    };
  }
  
  validateNode(node: any): ValidationResult {
    const errors: ParserError[] = [];
    const warnings: ParserError[] = [];
    
    if (!node) {
      return { isValid: true, errors, warnings, metadata: {} };
    }
    
    // Apply all applicable rules to this node
    for (const rule of this.rules) {
      try {
        let isApplicable = true;
        
        // Check if rule targets specific node types
        if ('targetNodeTypes' in rule) {
          isApplicable = (rule as any).targetNodeTypes.includes(node.type);
        }
        
        if (isApplicable) {
          const result = rule.validate(node);
          
          // Collect errors and warnings
          errors.push(...result.errors);
          warnings.push(...result.warnings);
          
          // Track errors with the error tracker
          for (const error of result.errors) {
            this.errorTracker.addError(error);
          }
        }
      } catch (error) {
        // Handle rule execution errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        const parserError = new BaseParserError({
          code: ErrorCode.VALIDATION_ERROR,
          message: `Rule execution error: ${errorMessage}`,
          position: this.getNodePosition(node),
          severity: ErrorSeverity.ERROR,
          metadata: {
            ruleId: rule.id,
            nodeType: node.type
          }
        });
        
        errors.push(parserError);
        this.errorTracker.addError(parserError);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        nodeType: node.type
      }
    };
  }
  
  public traverseNode(node: any, errors: ParserError[], warnings: ParserError[]): void {
    if (!node) return;
    
    // Validate the current node
    const result = this.validateNode(node);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    
    // Recursively validate children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.traverseNode(child, errors, warnings);
      }
    }
  }
  
  public getNodePosition(node: any): Position {
    if (node && node.position) {
      return node.position;
    }
    
    return {
      line: 0,
      column: 0,
      start: 0,
      end: 0
    };
  }
}
```

## 7. Validation Manager

```typescript
// src/core/parser/validation/manager.ts
export class ValidationManager {
  public htmlValidator: ValidationEngine;
  public cssValidator: ValidationEngine;
  public adapter: ValidationAdapter;
  public stateMachine: ValidationStateMachine;
  
  constructor() {
    const htmlErrorTracker = new HTMLErrorTracker();
    const cssErrorTracker = new CSSErrorTracker();
    
    this.htmlValidator = new ValidationEngine(htmlErrorTracker);
    this.cssValidator = new ValidationEngine(cssErrorTracker);
    this.adapter = new ValidationAdapter();
    this.stateMachine = new ValidationStateMachine();
    
    // Initialize state machine with optimization
    this.initializeStateMachine();
  }
  
  public initializeStateMachine(): void {
    // Define states for the validation workflow
    const states = [
      {
        id: 'idle',
        isAccepting: false,
        metadata: {},
        equivalenceClass: null,
        getSignature: () => 'idle'
      },
      {
        id: 'validating_html',
        isAccepting: false,
        metadata: { contentType: 'html' },
        equivalenceClass: null,
        getSignature: () => 'validating_html'
      },
      {
        id: 'validating_css',
        isAccepting: false,
        metadata: { contentType: 'css' },
        equivalenceClass: null,
        getSignature: () => 'validating_css'
      },
      {
        id: 'validating_combined',
        isAccepting: false,
        metadata: { contentType: 'combined' },
        equivalenceClass: null,
        getSignature: () => 'validating_combined'
      },
      {
        id: 'completed',
        isAccepting: true,
        metadata: {},
        equivalenceClass: null,
        getSignature: () => 'completed|accepting'
      }
    ];
    
    // Add states to machine
    for (const state of states) {
      this.stateMachine.addState(state);
    }
    
    // Define transitions
    const transitions = [
      { from: 'idle', on: 'validate_html', to: 'validating_html' },
      { from: 'idle', on: 'validate_css', to: 'validating_css' },
      { from: 'idle', on: 'validate_combined', to: 'validating_combined' },
      { from: 'validating_html', on: 'complete', to: 'completed' },
      { from: 'validating_css', on: 'complete', to: 'completed' },
      { from: 'validating_combined', on: 'complete', to: 'completed' },
      { from: 'completed', on: 'reset', to: 'idle' }
    ];
    
    // Add transitions to machine
    for (const t of transitions) {
      this.stateMachine.addTransition(t.from, t.on, t.to);
    }
    
    // Apply state minimization
    this.stateMachine = this.stateMachine.minimize();
  }
  
  validateHTML(html: string): ValidationResult {
    this.stateMachine.reset();
    this.stateMachine.transition('validate_html');
    
    try {
      // Parse HTML into an AST and validate
      // For now, we'll use a placeholder AST
      const mockAst = { type: 'document', children: [], position: { line: 1, column: 1, start: 0, end: html.length } };
      
      const result = this.htmlValidator.validate(mockAst);
      
      this.stateMachine.transition('complete');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const result: ValidationResult = {
        isValid: false,
        errors: [
          new BaseParserError({
            code: ErrorCode.VALIDATION_ERROR,
            message: `HTML validation error: ${errorMessage}`,
            position: { line: 1, column: 1, start: 0, end: 0 },
            severity: ErrorSeverity.ERROR
          })
        ],
        warnings: [],
        metadata: { failed: true }
      };
      
      this.stateMachine.transition('complete');
      return result;
    }
  }
  
  validateCSS(css: string): ValidationResult {
    this.stateMachine.reset();
    this.stateMachine.transition('validate_css');
    
    try {
      // Parse CSS into an AST and validate
      // For now, we'll use a placeholder AST
      const mockAst = { type: 'stylesheet', children: [], position: { line: 1, column: 1, start: 0, end: css.length } };
      
      const result = this.cssValidator.validate(mockAst);
      
      this.stateMachine.transition('complete');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const result: ValidationResult = {
        isValid: false,
        errors: [
          new BaseParserError({
            code: ErrorCode.VALIDATION_ERROR,
            message: `CSS validation error: ${errorMessage}`,
            position: { line: 1, column: 1, start: 0, end: 0 },
            severity: ErrorSeverity.ERROR
          })
        ],
        warnings: [],
        metadata: { failed: true }
      };
      
      this.stateMachine.transition('complete');
      return result;
    }
  }
  
  validateCombined(source: string): ValidationResult {
    this.stateMachine.reset();
    this.stateMachine.transition('validate_combined');
    
    try {
      // In a real implementation, we would extract HTML and CSS from the source
      // and validate each separately
      
      // For now, use the adapter for validation
      const result = this.adapter.validate({ type: 'combined', children: [] });
      
      this.stateMachine.transition('complete');
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const result: ValidationResult = {
        isValid: false,
        errors: [
          new BaseParserError({
            code: ErrorCode.VALIDATION_ERROR,
            message: `Combined validation error: ${errorMessage}`,
            position: { line: 1, column: 1, start: 0, end: 0 },
            severity: ErrorSeverity.ERROR
          })
        ],
        warnings: [],
        metadata: { failed: true }
      };
      
      this.stateMachine.transition('complete');
      return result;
    }
  }
  
  registerRule(rule: ValidationRule): void {
    // Register with the appropriate validator based on rule type
    if (rule instanceof HTMLValidationRule) {
      this.htmlValidator.registerRule(rule);
    } else if (rule instanceof CSSValidationRule) {
      this.cssValidator.registerRule(rule);
    } else {
      // Register with adapter for generic rules
      this.adapter.registerRule(rule);
    }
  }
}
```

## 8. Public Validation API

```typescript
// src/core/parser/validation/ValidationAPI.ts
export class ValidationAPI {
  public manager: ValidationManager;
  
  constructor() {
    this.manager = new ValidationManager();
  }
  
  validate(source: string, options: { type?: 'html' | 'css' | 'combined' } = {}): ValidationResult {
    const type = options.type || this.detectType(source);
    
    switch (type) {
      case 'html':
        return this.validateHTML(source);
      case 'css':
        return this.validateCSS(source);
      case 'combined':
        return this.validateCombined(source);
      default:
        return {
          isValid: false,
          errors: [
            new BaseParserError({
              code: ErrorCode.VALIDATION_ERROR,
              message: `Unknown content type: ${type}`,
              position: { line: 1, column: 1, start: 0, end: 0 },
              severity: ErrorSeverity.ERROR
            })
          ],
          warnings: [],
          metadata: { invalidType: true }
        };
    }
  }
  
  validateHTML(html: string, options: any = {}): ValidationResult {
    return this.manager.validateHTML(html);
  }
  
  validateCSS(css: string, options: any = {}): ValidationResult {
    return this.manager.validateCSS(css);
  }
  
  validateCombined(source: string, options: any = {}): ValidationResult {
    return this.manager.validateCombined(source);
  }
  
  registerRule(rule: ValidationRule): void {
    this.manager.registerRule(rule);
  }
  
  public detectType(source: string): 'html' | 'css' | 'combined' {
    // Simple detection based on content
    if (source.trim().startsWith('<!DOCTYPE') || source.includes('<html')) {
      return 'html';
    } else if (source.includes('{') && source.includes('}')) {
      return 'css';
    } else {
      return 'combined';
    }
  }
}
```

## 9. Factory Functions for Validation

```typescript
// src/factory/functional/createHTMLValidator.ts
export function createHTMLValidator(options: {
  rules?: HTMLValidationRule[];
  strictMode?: boolean;
  errorTracker?: HTMLErrorTracker;
}): ValidationEngine {
  const errorTracker = options.errorTracker || new HTMLErrorTracker();
  const validator = new ValidationEngine(errorTracker);
  
  // Register default rules
  registerDefaultHTMLRules(validator, options.strictMode);
  
  // Register custom rules
  if (options.rules && Array.isArray(options.rules)) {
    for (const rule of options.rules) {
      validator.registerRule(rule);
    }
  }
  
  return validator;
}

function registerDefaultHTMLRules(validator: ValidationEngine, strictMode = false): void {
  // Register standard HTML5 validation rules
  validator.registerRule(
    new RequiredAttributeRule('src', ['img', 'iframe', 'script'])
  );
  
  validator.registerRule(
    new RequiredAttributeRule('href', ['a', 'link'])
  );
  
  // Add more rules based on strictMode flag
  if (strictMode) {
    validator.registerRule(
      new RequiredAttributeRule('alt', ['img'])
    );
    
    // Add more strict validation rules...
  }
}
```

## 10. Integration Testing

Here's how we can create a test file to verify the integration:

```typescript
// tests/integration/validation-dop-adapter/integration.test.ts
describe('DOP Adapter with Validation Integration', () => {
  // Test functional component validation
  describe('Functional Component Validation', () => {
    it('should validate component state correctly', () => {
      // Create a functional component with validation
      const counter = FunctionalComponent.create({
        initialState: { count: 0 },
        transitions: {
          increment: (state) => ({ count: state.count + 1 }),
          decrement: (state) => ({ count: state.count - 1 })
        },
        validation: [
          // Custom validation rule
          {
            id: 'count_range',
            description: 'Ensures count stays within valid range',
            severity: ErrorSeverity.ERROR,
            validate: (state) => {
              const isValid = state.count >= 0 && state.count <= 100;
              return {
                isValid,
                errors: isValid ? [] : [
                  new BaseParserError({
                    code: ErrorCode.VALIDATION_ERROR,
                    message: 'Count must be between 0 and 100',
                    position: { line: 0, column: 0, start: 0, end: 0 },
                    severity: ErrorSeverity.ERROR
                  })
                ],
                warnings: [],
                metadata: { propertyName: 'count' }
              };
            }
          }
        ]
      });
      
      // Validate initial state
      let result = counter.validate();
      expect(result.isValid).toBe(true);
      
      // Increment to valid state
      counter.trigger('increment');
      result = counter.validate();
      expect(result.isValid).toBe(true);
      
      // Set to invalid state
      counter.setState({ count: 101 });
      result = counter.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toContain('between 0 and 100');
    });
  });
  
  // Test OOP component validation
  describe('OOP Component Validation', () => {
    it('should validate component state using class validate method', () => {
      // Create OOP component class with validation
      class Counter extends OBIXComponent {
        initialState = { count: 0 };
        
        increment(state) {
          return { count: state.count + 1 };
        }
        
        decrement(state) {
          return { count: state.count - 1 };
        }
        
        validate(state) {
          const isValid = state.count >= 0 && state.count <= 100;
          return {
            isValid,
            errors: isValid ? [] : [
              new BaseParserError({
                code: ErrorCode.VALIDATION_ERROR,
                message: 'Count must be between 0 and 100',
                position: { line: 0, column: 0, start: 0, end: 0 },
                severity: ErrorSeverity.ERROR
              })
            ],
            warnings: [],
            metadata: { propertyName: 'count' }
          };
        }
      }
      
      // Create and test the component
      const counter = DOPAdapter.createFromClass(Counter);
      
      // Validate initial state
      let result = counter.validate();
      expect(result.isValid).toBe(true);
      
      // Increment to valid state
      counter.trigger('increment');
      result = counter.validate();
      expect(result.isValid).toBe(true);
      
      // Set to invalid state
      counter.setState({ count: 101 });
      result = counter.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toContain('between 0 and 100');
    });
  });
  
  // Test integration with HTML validation
  describe('HTML Validation Integration', () => {
    it('should validate HTML using the integrated validation system', () => {
      const api = new ValidationAPI();
      
      // Valid HTML
      const validHTML = `<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</hea