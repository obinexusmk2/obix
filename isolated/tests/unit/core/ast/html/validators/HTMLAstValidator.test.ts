import { HTMLAstValidator } from '@/core/ast/html/validators/HTMLAstValidator';
import { HTMLAst } from '@/core/ast/html/optimizers/HTMLAst';
import { HTMLNode, HTMLNodeType, HTMLElementNode } from '@/core/ast/html/node';
import { ValidationRule } from '@/core/validation/rules/ValidationRule';
import { ValidationResult } from '@/core/dop/ValidationResult';
import { ErrorSeverity, ValidationError } from '@/core/validation/errors/ValidationError';

// Mock HTMLAst class
class MockHTMLAst implements HTMLAst {
  public root: HTMLNode;
  public metadata: any;
  
  constructor(root: HTMLNode) {
    this.root = root;
    this.metadata = { nodeCount: this.countNodes(root) };
  }
  
  private countNodes(node: HTMLNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }
}

// Mock HTML Node
class MockHTMLNode implements HTMLNode {
  public id: string;
  public type: HTMLNodeType;
  public children: HTMLNode[];
  public parent: HTMLNode | null;
  public position: any;
  public stateMachine?: any;
  
  constructor(
    id: string,
    type: HTMLNodeType,
    children: HTMLNode[] = [],
    parent: HTMLNode | null = null,
    stateMachine: any = { isMinimized: false, transitions: new Map() }
  ) {
    this.id = id;
    this.type = type;
    this.children = children;
    this.parent = parent;
    this.position = { line: 1, column: 1, start: 0, end: 0 };
    this.stateMachine = stateMachine;
    
    // Set parent reference for children
    for (const child of children) {
      child.parent = this;
    }
  }
  
  public addChild(child: HTMLNode): void {
    this.children.push(child);
    child.parent = this;
  }
}

// Mock HTML Element Node
class MockHTMLElementNode extends MockHTMLNode implements HTMLElementNode {
  public tagName: string;
  private attributes: Map<string, string>;
  
  constructor(
    id: string,
    tagName: string,
    attributes: Record<string, string> = {},
    children: HTMLNode[] = [],
    parent: HTMLNode | null = null
  ) {
    super(id, HTMLNodeType.ELEMENT, children, parent);
    this.tagName = tagName;
    this.attributes = new Map(Object.entries(attributes));
  }
  
  public getAttribute(name: string): string | null {
    return this.attributes.get(name) || null;
  }
  
  public hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  
  public setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }
  
  public removeAttribute(name: string): void {
    this.attributes.delete(name);
  }
  
  public getAttributes(): Map<string, string> {
    return new Map(this.attributes);
  }
}

// Mock custom validation rule
class MockValidationRule implements ValidationRule {
  public readonly id: string;
  public readonly description: string;
  public readonly severity: ErrorSeverity;
  public readonly compatibilityMarkers: string[];
  public readonly dependencies: string[];
  public mockValidateResult: ValidationResult<any>;
  
  constructor(
    id: string = 'mock-rule',
    description: string = 'Mock validation rule for testing',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    compatibilityMarkers: string[] = ['mock', 'test'],
    dependencies: string[] = [],
    mockValidateResult?: ValidationResult<any>
  ) {
    this.id = id;
    this.description = description;
    this.severity = severity;
    this.compatibilityMarkers = compatibilityMarkers;
    this.dependencies = dependencies;
    this.mockValidateResult = mockValidateResult || ValidationResult.createValid({});
  }
  
  public getId(): string {
    return this.id;
  }
  
  public getDependencies(): string[] {
    return this.dependencies;
  }
  
  public validate(node: any): ValidationResult<any> {
    return this.mockValidateResult;
  }
  
  public isCompatibleWith(other: ValidationRule): boolean {
    return true;
  }
  
  public toObject(): Record<string, any> {
    return {
      id: this.id,
      description: this.description,
      severity: this.severity,
      compatibilityMarkers: this.compatibilityMarkers,
      dependencies: this.dependencies
    };
  }
  
  public fromObject(obj: Record<string, any>): ValidationRule {
    return this;
  }
}

describe('HTMLAstValidator', () => {
  describe('Initialization', () => {
    test('should initialize with default rules', () => {
      const validator = new HTMLAstValidator();
      
      expect(validator.getAllRules().length).toBeGreaterThanOrEqual(3);
    });
    
    test('should register custom rules', () => {
      const customRule = new MockValidationRule('custom-rule');
      const validator = new HTMLAstValidator({
        rules: [customRule]
      });
      
      expect(validator.getRule('custom-rule')).toBe(customRule);
    });
  });
  
  describe('Validation', () => {
    let validator: HTMLAstValidator;
    let rootNode: HTMLElementNode;
    let childNode: HTMLElementNode;
    let ast: HTMLAst;
    
    beforeEach(() => {
      validator = new HTMLAstValidator();
      
      // Create test HTML structure
      childNode = new MockHTMLElementNode(
        'child1',
        'div',
        { class: 'container' }
      );
      
      rootNode = new MockHTMLElementNode(
        'root',
        'html',
        {},
        [childNode]
      );
      
      ast = new MockHTMLAst(rootNode);
    });
    
    test('should validate valid HTML AST successfully', () => {
      const result = validator.validateAst(ast);
      
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
    
    test('should detect invalid parent references', () => {
      // Break parent reference
      childNode.parent = null;
      
      const result = validator.validateAst(ast);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Invalid parent reference');
    });
    
    test('should detect empty tag names', () => {
      // Create element with empty tag name
      const invalidElement = new MockHTMLElementNode('invalid', '');
      rootNode.addChild(invalidElement);
      
      const result = validator.validateAst(ast);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('empty tag name'))).toBe(true);
    });
    
    test('should detect duplicate class names', () => {
      // Add element with duplicate class names
      const elementWithDupeClasses = new MockHTMLElementNode(
        'dupe-classes',
        'div',
        { class: 'container container sidebar' }
      );
      rootNode.addChild(elementWithDupeClasses);
      
      const result = validator.validateAst(ast);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.message.includes('duplicate class names'))).toBe(true);
    });
    
    test('should validate state machine data', () => {
      // Add node with invalid state machine data
      const nodeWithInvalidStateMachine = new MockHTMLElementNode(
        'invalid-state-machine',
        'div'
      );
      
      // Set invalid state machine properties
      nodeWithInvalidStateMachine.stateMachine = {
        isMinimized: true,
        stateSignature: null,
        transitions: new Map([['click', null]])
      };
      
      rootNode.addChild(nodeWithInvalidStateMachine);
      
      const result = validator.validateAst(ast);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('missing state signature'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('null target'))).toBe(true);
    });
    
    test('should incorporate results from custom rules', () => {
      // Create custom rule that always fails
      const errorResult = new ValidationResult<any>(false, {});
      errorResult.addError(new ValidationError(
        'CUSTOM_ERROR',
        'Custom validation error',
        'MockValidationRule'
      ));
      
      const customRule = new MockValidationRule(
        'custom-rule',
        'Custom rule that always fails',
        ErrorSeverity.ERROR,
        ['html'],
        [],
        errorResult
      );
      
      validator.registerRule(customRule);
      
      const result = validator.validateAst(ast);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === 'CUSTOM_ERROR')).toBe(true);
    });
    
    test('should handle exceptions during validation', () => {
      // Create a node that will cause an exception
      const throwingNode = new MockHTMLElementNode(
        'throwing-node',
        'div'
      );
      
      // Override method to throw exception
      throwingNode.getAttribute = () => {
        throw new Error('Test exception');
      };
      
      rootNode.addChild(throwingNode);
      
      const result = validator.validateAst(ast);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.message.includes('Test exception'))).toBe(true);
    });
  });
  
  describe('State Minimization', () => {
    test('should perform state minimization when enabled', () => {
      const validator = new HTMLAstValidator({
        enableMinimization: true
      });
      
      // Create test HTML structure
      const rootNode = new MockHTMLElementNode('root', 'html');
      const ast = new MockHTMLAst(rootNode);
      
      validator.validateAst(ast);
      
      const metrics = validator.getOptimizationMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.stateMachine).toBeDefined();
      expect(metrics.validationEngine).toBeDefined();
    });
    
    test('should skip state minimization when disabled', () => {
      const validator = new HTMLAstValidator({
        enableMinimization: false
      });
      
      // Create spy on minimize method
      const minimizeSpy = jest.spyOn(validator as any, 'minimizeValidationStateMachine');
      
      // Create test HTML structure
      const rootNode = new MockHTMLElementNode('root', 'html');
      const ast = new MockHTMLAst(rootNode);
      
      validator.validateAst(ast);
      
      expect(minimizeSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('Execution Tracing', () => {
    test('should add execution trace when enabled', () => {
      const validator = new HTMLAstValidator({
        enableTracing: true
      });
      
      // Create test HTML structure
      const rootNode = new MockHTMLElementNode('root', 'html');
      const ast = new MockHTMLAst(rootNode);
      
      const result = validator.validateAst(ast);
      
      expect(result.traces.length).toBeGreaterThan(0);
      expect(result.traces[0].name).toBe('html-ast-validation');
    });
    
    test('should skip execution tracing when disabled', () => {
      const validator = new HTMLAstValidator({
        enableTracing: false
      });
      
      // Create test HTML structure
      const rootNode = new MockHTMLElementNode('root', 'html');
      const ast = new MockHTMLAst(rootNode);
      
      const result = validator.validateAst(ast);
      
      expect(result.traces.length).toBe(0);
    });
  });
});