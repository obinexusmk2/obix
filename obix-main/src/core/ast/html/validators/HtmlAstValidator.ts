/**
 * HTMLAstValidator.ts
 * 
 * Validator for HTML ASTs that ensures structural correctness and semantic validity.
 * Uses automaton state minimization for efficient validation operations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { EquivalenceClassComputer } from "@/core/automaton";
import { StateMachineValidationRule } from "@/core/automaton/validation/StateMachineValidationRule";
import { ValidationResult } from "@/core/dop/ValidationResult";
import { ValidationStateMachine } from "@/core/dop/ValidationStateMachine";
import { ValidationEngineOptions } from "@/core/validation/core";
import { ValidationEngine } from "@/core/validation/engine";
import { ExecutionTrace } from "@/core/validation/errors/ExecutionTrace";
import { ValidationError, ErrorSeverity, ParserError } from "@/core/validation/errors/ValidationError";
import { ValidationRule } from "@/core/validation/rules/ValidationRule";
import { HTMLNode, HTMLNodeType, HTMLElementNode } from "../node";
import { HTMLAst } from "../optimizers/HTMLAst";
import { AttributeValidationRule } from "./AttributeValidationRule";
import { HTMLStructureRule } from "./HTMLStructureRule";

export interface HTMLAstValidatorOptions {
  enableMinimization?: boolean;
  enableTracing?: boolean;
  rules?: ValidationRule[];
  engineOptions?: ValidationEngineOptions;
}

export class HTMLAstValidator {
  private validationEngine: ValidationEngine;
  private stateMachine: ValidationStateMachine;
  private ruleRegistry: Map<string, ValidationRule>;
  private equivalenceClassComputer: EquivalenceClassComputer;
  private enableMinimization: boolean;
  private enableTracing: boolean;
  
  constructor(options: HTMLAstValidatorOptions = {}) {
    this.enableMinimization = options.enableMinimization !== false;
    this.enableTracing = options.enableTracing === true;
    this.ruleRegistry = new Map<string, ValidationRule>();
    this.equivalenceClassComputer = new EquivalenceClassComputer();
    
    this.stateMachine = new ValidationStateMachine();
    this.initializeStateMachine();
    
    this.validationEngine = new ValidationEngine({
      enableMinimization: this.enableMinimization,
      enableTracing: this.enableTracing,
      componentName: 'HTMLAstValidator',
      stateMachine: this.stateMachine,
      ...(options.engineOptions || {})
    });
    
    this.registerDefaultRules();
    
    if (options.rules?.length) {
      options.rules.forEach(rule => this.registerRule(rule));
    }
  }
  
  private initializeStateMachine(): void {
    const phases = [
      { id: 'html_parsing', phase: 'parsing' },
      { id: 'structure_validation', phase: 'structure' },
      { id: 'attribute_validation', phase: 'attributes' },
      { id: 'semantic_validation', phase: 'semantics' },
      { id: 'state_minimization', phase: 'minimization' }
    ];
    
    // Add states to state machine
    phases.forEach(phase => {
      const state = {
        stateId: phase.id,
        active: false,
        metadata: { phase: phase.phase },
        transitions: new Map(),
        equivalenceClass: null,
        validationRules: [],
        errorRecoveryActions: new Map(),
        
        getId: () => phase.id,
        isActive: () => false,
        getMetadata: () => ({ phase: phase.phase }),
        setActive: (isActive) => { this.active = isActive; },
        setMetadata: (metadata) => { this.metadata = metadata; },
        setEquivalenceClass: (equivalenceClass) => { this.equivalenceClass = equivalenceClass; },
        getAllTransitions: () => new Map(),
        addTransition: (event, targetState) => { this.transitions.set(event, targetState); },
        clone: function() { return { ...this }; },
        getErrorRecoveryAction: () => null,
        getAllErrorRecoveryActions: () => new Map(),
        getRules: () => [],
        containsRule: () => false,
        addRule: () => {},
        toObject: () => ({}),
        removeTransition: () => {},
        addErrorRecoveryAction: () => {},
        removeErrorRecoveryAction: () => {},
        removeRule: () => {},
        clearRules: () => {}
      };
      this.stateMachine.addState(state);
    });
    
    // Add normal flow transitions
    const transitions = [
      ['initial', 'begin_html_parsing', 'html_parsing'],
      ['html_parsing', 'parsing_complete', 'structure_validation'],
      ['structure_validation', 'structure_valid', 'attribute_validation'],
      ['attribute_validation', 'attributes_valid', 'semantic_validation'],
      ['semantic_validation', 'semantics_valid', 'state_minimization'],
      ['state_minimization', 'minimization_complete', 'validated']
    ];
    
    transitions.forEach(([from, symbol, to]) => {
      if (from && symbol && to) {
        this.stateMachine.addTransition(from, symbol, to);
      }
    });
    
    // Add error transitions
    phases.forEach(phase => {
      this.stateMachine.addTransition(phase.id, `${phase.phase}_error`, 'error');
    });
  }
  
  private registerDefaultRules(): void {
    [
      new HTMLStructureRule(),
      new AttributeValidationRule(),
      new StateMachineValidationRule() as unknown as ValidationRule
    ].forEach(rule => this.registerRule(rule));
  }
  
  public registerRule(rule: ValidationRule): HTMLAstValidator {
    this.ruleRegistry.set(rule.id, rule);
    this.validationEngine.registerRule(rule);
    return this;
  }
  
  public validateAst(ast: HTMLAst): ValidationResult<HTMLAst> {
    try {
      this.stateMachine.reset();
      
      let trace = this.enableTracing ? 
        ExecutionTrace.start('html-ast-validation', { 
          nodeCount: ast.metadata.nodeCount,
          hasOptimizationMetrics: !!ast.metadata.optimizationMetrics
        }) : undefined;
      
      this.stateMachine.transition('begin_html_parsing');
      this.stateMachine.transition('parsing_complete');
      
      const result = new ValidationResult<HTMLAst>(true, ast);
      const rootValidationResult = this.validateNode(ast.root);
      
      result.merge(rootValidationResult as unknown as ValidationResult<HTMLAst>);
      
      if (this.enableMinimization) {
        this.stateMachine.transition('semantics_valid');
        this.minimizeValidationStateMachine();
      }
      
      if (trace) {
        trace.end({ 
          isValid: result.isValid,
          errorCount: result.errors.length,
          warningCount: result.warnings.length
        });
        result.addTrace(trace);
      }
      
      this.stateMachine.transition('minimization_complete');
      return result;
    } catch (error) {
      this.stateMachine.transition('validation_error');
      
      const errorResult = new ValidationResult<HTMLAst>(false, ast);
      errorResult.addError(new ValidationError(
        'HTML_AST_VALIDATION_ERROR',
        error instanceof Error ? error.message : String(error),
        'HTMLAstValidator'
      ));
      
      return errorResult;
    }
  }
  
  public validateNode(node: HTMLNode): ValidationResult<HTMLNode> {
    try {
      const result = new ValidationResult<HTMLNode>(true, node);
      
      this.stateMachine.transition('structure_validation');
      result.merge(this.validateNodeHierarchy(node));
      result.merge(this.validateNodeStructure(node));
      
      this.stateMachine.transition('structure_valid');
      if (node.type === HTMLNodeType.ELEMENT) {
        const elementNode = node as unknown as HTMLElementNode;
        const attributeResult = this.validateNodeAttributes(elementNode);
        result.merge(attributeResult as unknown as ValidationResult<HTMLNode>);
      }
      
      this.stateMachine.transition('attributes_valid');
      result.merge(this.validateStateMachineData(node));
      
      this.stateMachine.transition('semantic_validation');
      result.merge(this.validationEngine.validateNode(node));
      
      // Recursively validate children
      node.children.forEach(child => {
        result.merge(this.validateNode(child));
      });
      
      return result;
    } catch (error) {
      const errorResult = new ValidationResult<HTMLNode>(false, node);
      errorResult.addError(new ValidationError(
        'HTML_NODE_VALIDATION_ERROR',
        error instanceof Error ? error.message : String(error),
        'HTMLAstValidator'
      ));
      
      return errorResult;
    }
  }
  
  private validateNodeHierarchy(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    node.children.forEach(child => {
      if (child.parent !== node) {
        result.addError(new ValidationError(
          'INVALID_PARENT_REFERENCE',
          `Invalid parent reference: Child node ${child.id} has incorrect parent reference`,
          'HTMLAstValidator',
          'validator',
          ErrorSeverity.ERROR,
          {
            childId: child.id,
            parentId: node.id,
            actualParentId: child.parent?.id
          }
        ));
      }
    });
    
    return result;
  }
  
  private validateNodeStructure(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    if (node.type === HTMLNodeType.ELEMENT) {
      const elementNode = node as unknown as HTMLElementNode;
      if (!elementNode.tagName?.length) {
        result.addError(new ValidationError(
          'INVALID_TAG_NAME',
          'Element node has empty tag name',
          'HTMLAstValidator'
        ));
      }
    }
    
    return result;
  }
  
  private validateNodeAttributes(node: HTMLElementNode): ValidationResult<HTMLElementNode> {
    const result = new ValidationResult<HTMLElementNode>(true, node);
    
    const classAttr = node.getAttribute('class');
    if (classAttr) {
      const classes = classAttr.split(/\s+/).filter(c => c.length > 0);
      const uniqueClasses = new Set(classes);
      
      if (uniqueClasses.size !== classes.length) {
        result.addWarning(new ParserError(
          'DUPLICATE_CLASS_NAME',
          'Element contains duplicate class names',
          'HTMLAstValidator',
          node.position,
          `class="${classAttr}"`
        ));
      }
    }
    
    return result;
  }
  
  private validateStateMachineData(node: HTMLNode): ValidationResult<HTMLNode> {
    const result = new ValidationResult<HTMLNode>(true, node);
    
    if (!node.stateMachine) {
      result.addError(new ValidationError(
        'MISSING_STATE_MACHINE_DATA',
        `Node ${node.id} is missing state machine data`,
        'HTMLAstValidator'
      ));
      return result;
    }
    
    if (node.stateMachine.isMinimized && !node.stateMachine.stateSignature) {
      result.addError(new ValidationError(
        'MISSING_STATE_SIGNATURE',
        `Minimized node ${node.id} is missing state signature`,
        'HTMLAstValidator'
      ));
    }
    
    if (node.stateMachine.transitions) {
      node.stateMachine.transitions.forEach((targetNode, symbol) => {
        if (!targetNode) {
          result.addError(new ValidationError(
            'INVALID_TRANSITION_TARGET',
            `Node ${node.id} has a transition with symbol '${symbol}' to a null target`,
            'HTMLAstValidator'
          ));
        }
      });
    }
    
    return result;
  }
  
  private minimizeValidationStateMachine(): void {
    try {
      this.stateMachine.minimize();
      this.validationEngine.minimize();
    } catch (error) {
      this.stateMachine.transition('minimization_error');
      console.error('Error during state machine minimization:', error);
    }
  }
}
