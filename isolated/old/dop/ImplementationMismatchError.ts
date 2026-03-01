/**
 * ImplementationMismatchError.ts
 * 
 * Comprehensive implementation of the ImplementationMismatchError class for the OBIX validation system.
 * This class represents errors that occur when there is a mismatch between functional and OOP implementations,
 * which is critical for the DOP Adapter pattern to ensure 1:1 correspondence between paradigms.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ErrorSeverity } from '../../../src/core/validation/errors/ErrorHandler';
import {  ValidationError } from '../../../src/core/validation/errors/ValidationError';


/**
 * Interface for diff entries that represent differences between implementations
 */
export interface DiffEntry {
  /**
   * Path to the property or method with the difference
   */
  path: string;
  
  /**
   * Expected value (from functional implementation)
   */
  expected: any;
  
  /**
   * Actual value (from OOP implementation)
   */
  actual: any;
}

/**
 * Interface for behavior description in implementation comparison
 */
export interface BehaviorDescription {
  /**
   * Value of the behavior
   */
  value: any;
  
  /**
   * Path where the behavior was observed
   */
  path: string;
  
  /**
   * Method name associated with the behavior
   */
  methodName?: string;
  
  /**
   * Input parameters provided
   */
  inputs?: any[];
  
  /**
   * Context of execution
   */
  context?: Record<string, any>;
}

/**
 * Interface for detailed fix suggestions
 */
export interface FixSuggestion {
  /**
   * Description of the suggested fix
   */
  description: string;
  
  /**
   * Code snippet for the suggestion
   */
  code?: string;
  
  /**
   * The path this suggestion applies to
   */
  path: string;
  
  /**
   * Whether this is for the functional implementation
   */
  forFunctional: boolean;
}

/**
 * Error representing a mismatch between functional and OOP implementations
 */
export class ImplementationMismatchError extends ValidationError {
  /**
   * Reference to the functional implementation
   */
  public override functionalImplementation: string;

  /**
   * Reference to the OOP implementation
   */
  public override oopImplementation: string;

  /**
   * Expected behavior description
   */
  public expectedBehavior: Record<string, any>;

  /**
   * Actual behavior description
   */
  public actualBehavior: Record<string, any>;

  /**
   * Map of differences between expected and actual behavior
   * Key is the path, value is [expected, actual]
   */
  public diff: Map<string, [any, any]>;
  
  /**
   * Type of mismatch (e.g., "state", "output", "transition")
   */
  public mismatchType: string;
  
  /**
   * Detailed fix suggestions
   */
  public fixSuggestions: FixSuggestion[];
  
  /**
   * The AST-minimized path where the mismatch was detected
   */
  public minimizedPath: string | null;

  /**
   * Creates a new ImplementationMismatchError instance
   * 
   * @param errorCode Unique error code
   * @param message Human-readable error message
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @param expectedBehavior Expected behavior
   * @param actualBehavior Actual behavior
   * @param diff Map of differences between expected and actual behavior
   * @param mismatchType Type of mismatch (e.g., "state", output", "transition")
   * @param metadata Additional metadata for the error
   * @param trace Trace of locations where the error passed through
   * @param fixSuggestions Detailed fix suggestions
   * @param minimizedPath The AST-minimized path where the mismatch was detected
   */
  constructor(
    errorCode: string,
    message: string,
    component: string,
    functionalImplementation: string,
    oopImplementation: string,
    expectedBehavior: Record<string, any>,
    actualBehavior: Record<string, any>,
    diff: Map<string, [any, any]>,
    mismatchType: string = 'output',
    metadata: Record<string, any> = {},
    trace: string[] = [],
    fixSuggestions: FixSuggestion[] = [],
    minimizedPath: string | null = null
  ) {
    super(errorCode, message, component, 'dop_adapter', ErrorSeverity.ERROR, metadata, trace);
    
    this.functionalImplementation = functionalImplementation;
    this.oopImplementation = oopImplementation;
    this.expectedBehavior = { ...expectedBehavior };
    this.actualBehavior = { ...actualBehavior };
    this.diff = new Map(diff);
    this.mismatchType = mismatchType;
    this.fixSuggestions = [...fixSuggestions];
    this.minimizedPath = minimizedPath;
  }

  /**
   * Identifies the specific discrepancy that caused the mismatch
   * 
   * @returns Description of the discrepancy
   */
  public identifyDiscrepancy(): string {
    const discrepancies: string[] = [];
    
    for (const [path, [expected, actual]] of this.diff.entries()) {
      discrepancies.push(`At ${path}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
    
    if (this.minimizedPath) {
      discrepancies.push(`AST-minimized path: ${this.minimizedPath}`);
    }
    
    return discrepancies.join('\n');
  }

  /**
   * Suggests a fix for the implementation mismatch
   * 
   * @returns Suggested fix
   */
  public suggestFix(): string {
    if (this.fixSuggestions.length > 0) {
      const parts: string[] = ["Suggested fixes:"];
      
      for (const suggestion of this.fixSuggestions) {
        parts.push(`\nFor ${suggestion.forFunctional ? 'functional' : 'OOP'} implementation at ${suggestion.path}:`);
        parts.push(`  ${suggestion.description}`);
        
        if (suggestion.code) {
          parts.push("\nSuggested code:");
          parts.push("```typescript");
          parts.push(suggestion.code);
          parts.push("```");
        }
      }
      
      return parts.join('\n');
    }
    
    // Generate generic suggestions based on diff
    const suggestions: string[] = [];
    
    for (const [path, [expected, actual]] of this.diff.entries()) {
      if (typeof expected === 'function' && typeof actual === 'function') {
        suggestions.push(`Ensure that the ${path} function in the OOP implementation returns the same result as in the functional implementation.`);
      } else if (typeof expected === 'object' && typeof actual === 'object') {
        suggestions.push(`Make sure the ${path} object structure is identical between implementations.`);
      } else {
        suggestions.push(`Update the ${path} value in one implementation to match the other.`);
      }
    }
    
    if (suggestions.length === 0) {
      return "Ensure both implementations follow the same logic and produce the same results for equivalent inputs.";
    }
    
    return suggestions.join('\n');
  }
  
  /**
   * Adds a fix suggestion
   * 
   * @param suggestion The fix suggestion to add
   * @returns This error for method chaining
   */
  public addFixSuggestion(suggestion: FixSuggestion): ImplementationMismatchError {
    this.fixSuggestions.push(suggestion);
    return this;
  }
  
  /**
   * Gets all fix suggestions
   * 
   * @returns Array of fix suggestions
   */
  public getFixSuggestions(): FixSuggestion[] {
    return [...this.fixSuggestions];
  }
  
  /**
   * Gets the minimized AST path where the mismatch was detected
   * 
   * @returns The minimized path or null if not available
   */
  public getMinimizedPath(): string | null {
    return this.minimizedPath;
  }
  
  /**
   * Sets the minimized AST path where the mismatch was detected
   * 
   * @param path The minimized path
   * @returns This error for method chaining
   */
  public setMinimizedPath(path: string): ImplementationMismatchError {
    this.minimizedPath = path;
    return this;
  }
  
  /**
   * Adds a diff entry
   * 
   * @param path Path to the property or method with the difference
   * @param expected Expected value (from functional implementation)
   * @param actual Actual value (from OOP implementation)
   * @returns This error for method chaining
   */
  public addDiff(path: string, expected: any, actual: any): ImplementationMismatchError {
    this.diff.set(path, [expected, actual]);
    return this;
  }
  
  /**
   * Gets all diff entries
   * 
   * @returns Array of diff entries
   */
  public getDiffEntries(): DiffEntry[] {
    return Array.from(this.diff.entries()).map(([path, [expected, actual]]) => ({
      path,
      expected,
      actual
    }));
  }
  
  /**
   * Gets the mismatch category based on the diff entries
   * 
   * @returns Category of the mismatch (e.g., "state", "method-return", "property-value")
   */
  public getMismatchCategory(): string {
    if (this.diff.size === 0) {
      return 'unknown';
    }
    
    // Check if all diffs are for methods
    const allMethodPaths = Array.from(this.diff.keys()).every(path => 
      path.includes('(') && path.includes(')') || 
      path.endsWith('.call') || 
      path.endsWith('.apply')
    );
    
    if (allMethodPaths) {
      return 'method-return';
    }
    
    // Check if all diffs are for state properties
    const allStatePaths = Array.from(this.diff.keys()).every(path => 
      path.startsWith('state.') || 
      path === 'state'
    );
    
    if (allStatePaths) {
      return 'state';
    }
    
    return 'property-value';
  }

  /**
   * Converts the error to a JSON object
   * 
   * @returns JSON representation of the error
   */
  public override toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      functionalImplementation: this.functionalImplementation,
      oopImplementation: this.oopImplementation,
      expectedBehavior: this.expectedBehavior,
      actualBehavior: this.actualBehavior,
      diff: Object.fromEntries(this.diff),
      mismatchType: this.mismatchType,
      fixSuggestions: this.fixSuggestions,
      minimizedPath: this.minimizedPath
    };
  }
  
  /**
   * Converts the error to a string with detailed comparison
   * 
   * @returns Detailed string representation of the error
   */
  public toDetailedString(): string {
    const parts: string[] = [
      super.toString(),
      `\nImplementation Mismatch Type: ${this.mismatchType}`,
      `Functional Implementation: ${this.functionalImplementation}`,
      `OOP Implementation: ${this.oopImplementation}`,
      '\nDiscrepancies:',
      this.identifyDiscrepancy(),
      '\nFix Suggestions:',
      this.suggestFix()
    ];
    
    return parts.join('\n');
  }

  /**
   * Creates an ImplementationMismatchError from a plain object
   * 
   * @param obj The plain object
   * @returns A new ImplementationMismatchError instance
   */
  public static override fromObject(obj: any): ImplementationMismatchError {
    // Convert diff from object to Map
    const diff = new Map<string, [any, any]>();
    if (obj.diff && typeof obj.diff === 'object') {
      for (const [key, value] of Object.entries(obj.diff)) {
        if (Array.isArray(value) && value.length === 2) {
          diff.set(key, [value[0], value[1]]);
        }
      }
    }
    
    return new ImplementationMismatchError(
      obj.errorCode || 'IMPLEMENTATION_MISMATCH',
      obj.message || 'Implementation mismatch between functional and OOP code',
      obj.component || 'unknown',
      obj.functionalImplementation || 'unknown',
      obj.oopImplementation || 'unknown',
      obj.expectedBehavior || {},
      obj.actualBehavior || {},
      diff,
      obj.mismatchType || 'output',
      obj.metadata || {},
      obj.trace || [],
      obj.fixSuggestions || [],
      obj.minimizedPath || null
    );
  }
  
  /**
   * Creates an ImplementationMismatchError from diff entries
   * 
   * @param errorCode Unique error code
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @param diffEntries Array of diff entries
   * @returns A new ImplementationMismatchError instance
   */
  public static fromDiffEntries(
    errorCode: string,
    component: string,
    functionalImplementation: string,
    oopImplementation: string,
    diffEntries: DiffEntry[]
  ): ImplementationMismatchError {
    const diff = new Map<string, [any, any]>();
    
    for (const entry of diffEntries) {
      diff.set(entry.path, [entry.expected, entry.actual]);
    }
    
    const message = diffEntries.length === 0
    ? "Implementation mismatch with no specific differences"
    : diffEntries[0]
      ? `Implementation mismatch at ${diffEntries[0].path}: expected ${JSON.stringify(diffEntries[0].expected)}, got ${JSON.stringify(diffEntries[0].actual)}`
      : `Implementation mismatch found in ${diffEntries.length} locations`;
      
    return new ImplementationMismatchError(
      errorCode,
      message,
      component,
      functionalImplementation,
      oopImplementation,
      { diffEntries },
      { diffEntries },
      diff
    );
  }
  
  /**
   * Factory method to create an error for state mismatch
   * 
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation 
   * @param functionalState Expected state from functional implementation
   * @param oopState Actual state from OOP implementation
   * @returns A new ImplementationMismatchError instance
   */
  public static createStateMismatch(
    component: string,
    functionalImplementation: string,
    oopImplementation: string,
    functionalState: Record<string, any>,
    oopState: Record<string, any>
  ): ImplementationMismatchError {
    const diff = new Map<string, [any, any]>();
    
    // Find differences in state properties
    const allKeys = new Set([...Object.keys(functionalState), ...Object.keys(oopState)]);
    for (const key of allKeys) {
      if (!Object.prototype.hasOwnProperty.call(functionalState, key)) {
        diff.set(`state.${key}`, [undefined, oopState[key]]);
      } else if (!Object.prototype.hasOwnProperty.call(oopState, key)) {
        diff.set(`state.${key}`, [functionalState[key], undefined]);
      } else if (JSON.stringify(functionalState[key]) !== JSON.stringify(oopState[key])) {
        diff.set(`state.${key}`, [functionalState[key], oopState[key]]);
      }
    }
    
    // If no individual property differences but states are different overall,
    // add a diff for the entire state
    if (diff.size === 0 && JSON.stringify(functionalState) !== JSON.stringify(oopState)) {
      diff.set('state', [functionalState, oopState]);
    }
    
    return new ImplementationMismatchError(
      'STATE_MISMATCH',
      `State mismatch between functional and OOP implementations`,
      component,
      functionalImplementation,
      oopImplementation,
      { state: functionalState },
      { state: oopState },
      diff,
      'state'
    );
  }
  
  /**
   * Factory method to create an error for method return value mismatch
   * 
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @param methodName Name of the method with mismatched return values
   * @param functionalReturn Return value from functional implementation
   * @param oopReturn Return value from OOP implementation
   * @param args Method arguments
   * @returns A new ImplementationMismatchError instance
   */
  public static createMethodReturnMismatch(
    component: string,
    functionalImplementation: string,
    oopImplementation: string,
    methodName: string,
    functionalReturn: any,
    oopReturn: any,
    args: any[] = []
  ): ImplementationMismatchError {
    const path = `${methodName}(${args.map(arg => JSON.stringify(arg)).join(', ')})`;
    const diff = new Map<string, [any, any]>();
    diff.set(path, [functionalReturn, oopReturn]);
    
    return new ImplementationMismatchError(
      'METHOD_RETURN_MISMATCH',
      `Method return value mismatch for ${methodName}`,
      component,
      functionalImplementation,
      oopImplementation,
      { methodName, return: functionalReturn, args },
      { methodName, return: oopReturn, args },
      diff,
      'method-return'
    );
  }
  
  /**
   * Factory method to create an error for transition mismatch
   * 
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @param transitionName Name of the transition
   * @param functionalNextState Next state from functional implementation
   * @param oopNextState Next state from OOP implementation
   * @param input Input that triggered the transition
   * @returns A new ImplementationMismatchError instance
   */
  public static createTransitionMismatch(
    component: string,
    functionalImplementation: string,
    oopImplementation: string,
    transitionName: string,
    functionalNextState: any,
    oopNextState: any,
    input: any
  ): ImplementationMismatchError {
    const path = `transition.${transitionName}`;
    const diff = new Map<string, [any, any]>();
    diff.set(path, [functionalNextState, oopNextState]);
    
    return new ImplementationMismatchError(
      'TRANSITION_MISMATCH',
      `Transition mismatch for ${transitionName}`,
      component,
      functionalImplementation,
      oopImplementation,
      { transitionName, nextState: functionalNextState, input },
      { transitionName, nextState: oopNextState, input },
      diff,
      'transition'
    );
  }
  
  /**
   * Factory method to create an error for AST structure mismatch
   * 
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @param functionalAST AST from functional implementation
   * @param oopAST AST from OOP implementation
   * @param astDifferences Specific differences in the AST
   * @returns A new ImplementationMismatchError instance
   */
  public static createASTMismatch(
    component: string,
    functionalImplementation: string,
    oopImplementation: string,
    functionalAST: any,
    oopAST: any,
    astDifferences: Record<string, [any, any]>
  ): ImplementationMismatchError {
    const diff = new Map<string, [any, any]>();
    
    for (const [path, [expected, actual]] of Object.entries(astDifferences)) {
      diff.set(`ast.${path}`, [expected, actual]);
    }
    
    return new ImplementationMismatchError(
      'AST_STRUCTURE_MISMATCH',
      `AST structure mismatch between functional and OOP implementations`,
      component,
      functionalImplementation,
      oopImplementation,
      { ast: functionalAST },
      { ast: oopAST },
      diff,
      'ast-structure'
    );
  }
}

/**
 * Factory for creating implementation mismatch errors
 */
export class ImplementationMismatchErrorFactory {
  /**
   * Creates a mismatch error from validation results
   * 
   * @param functionalResult Validation result from functional implementation
   * @param oopResult Validation result from OOP implementation
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @returns A new ImplementationMismatchError or null if no mismatch
   */
  public static createFromValidationResults(
    functionalResult: any,
    oopResult: any,
    component: string,
    functionalImplementation: string,
    oopImplementation: string
  ): ImplementationMismatchError | null {
    // If both results are valid or invalid, no mismatch
    if (functionalResult.isValid === oopResult.isValid) {
      return null;
    }
    
    return new ImplementationMismatchError(
      'VALIDATION_RESULT_MISMATCH',
      `Validation result mismatch: functional=${functionalResult.isValid}, OOP=${oopResult.isValid}`,
      component,
      functionalImplementation,
      oopImplementation,
      { isValid: functionalResult.isValid, errors: functionalResult.errors?.length || 0 },
      { isValid: oopResult.isValid, errors: oopResult.errors?.length || 0 },
      new Map([['isValid', [functionalResult.isValid, oopResult.isValid]]]),
      'validation-result'
    );
  }
  
  /**
   * Creates a collection of mismatch errors from test results
   * 
   * @param testResults Array of test results with both implementations
   * @param component Component where the error occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @returns Array of ImplementationMismatchError instances
   */
  public static createFromTestResults(
    testResults: Array<{
      testName: string;
      functionalResult: any;
      oopResult: any;
      input?: any;
    }>,
    component: string,
    functionalImplementation: string,
    oopImplementation: string
  ): ImplementationMismatchError[] {
    const errors: ImplementationMismatchError[] = [];
    
    for (const test of testResults) {
      if (JSON.stringify(test.functionalResult) !== JSON.stringify(test.oopResult)) {
        errors.push(
          new ImplementationMismatchError(
            'TEST_RESULT_MISMATCH',
            `Test result mismatch for "${test.testName}"`,
            component,
            functionalImplementation,
            oopImplementation,
            { testName: test.testName, result: test.functionalResult, input: test.input },
            { testName: test.testName, result: test.oopResult, input: test.input },
            new Map([
              [`test.${test.testName}`, [test.functionalResult, test.oopResult]]
            ]),
            'test-result'
          )
        );
      }
    }
    
    return errors;
  }
}