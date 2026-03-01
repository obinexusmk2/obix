/**
 * ImplementationComparisonResult.ts
 * 
 * Implementation of the ImplementationComparisonResult class for the OBIX validation system.
 * This class represents the outcome of comparing implementations across different paradigms
 * (functional and OOP), supporting the DOP Adapter pattern's validation logic.
 * 
 * The ImplementationComparisonResult is designed to be compatible with ValidationResult while
 * maintaining its own distinct interface for detailed implementation comparison analysis.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { ExecutionTrace } from "./ExecutionTrace";
import { ImplementationMismatchError } from "./ImplementationMismatchError";
import { ValidationResult } from "./ValidationResult";


/**
 * Interface for detailed implementation difference information
 */
export interface ImplementationDifference {
  /**
   * Path where the difference was found
   */
  path: string;
  
  /**
   * Expected value from functional implementation
   */
  expected: any;
  
  /**
   * Actual value from OOP implementation
   */
  actual: any;
  
  /**
   * Human-readable message describing the difference
   */
  message: string;
  
  /**
   * Severity of the difference
   */
  severity: ErrorSeverity;
  
  /**
   * Additional context about the difference
   */
  context?: Record<string, any>;
}

/**
 * Type for detailed implementation comparison metrics
 */
export interface ImplementationComparisonMetrics {
  /**
   * Total number of function calls compared
   */
  totalFunctionsCalled: number;
  
  /**
   * Total number of state mutations compared
   */
  totalStateMutations: number;
  
  /**
   * Total number of property accesses compared
   */
  totalPropertyAccesses: number;
  
  /**
   * Total number of differences found
   */
  totalDifferences: number;
  
  /**
   * Time taken for comparison (in milliseconds)
   */
  comparisonTime: number;
  
  /**
   * Number of execution traces compared
   */
  tracesCompared: number;
  
  /**
   * Number of execution traces with divergences
   */
  tracesDiverged: number;
}

export interface ImplementationDifference {
  path: string;
  expected: any;
  actual: any;
  message: string;
  severity: ErrorSeverity;
}

/**
 * Represents the result of comparing implementations across paradigms
 */
export class ImplementationComparisonResult {
  /**
   * Whether the implementations are equivalent
   */
  public equivalent: boolean;
  
  /**
   * Collection of mismatches between implementations
   */
  public mismatches: ImplementationDifference[];
  
  /**
   * Summary information about the comparison
   */
  public summary: Record<string, any>;
  
  /**
   * Detailed metrics about the comparison process
   */
  public metrics: ImplementationComparisonMetrics;
  
  /**
   * Trace comparison results
   */
  public traceComparisons: Array<{
    index: number;
    comparison: TraceComparisonResult;
  }>;
  
  /**
   * Creates a new ImplementationComparisonResult instance
   */
  constructor(
    equivalent: boolean = true,
    mismatches: ImplementationDifference[] = [],
    summary: Record<string, any> = {},
    metrics: Partial<ImplementationComparisonMetrics> = {},
    traceComparisons: Array<{ index: number; comparison: TraceComparisonResult }> = []
  ) {
    this.equivalent = equivalent;
    this.mismatches = [...mismatches];
    this.summary = { ...summary };
    this.traceComparisons = [...traceComparisons];
    
    // Initialize metrics with defaults
    this.metrics = {
      totalFunctionsCalled: 0,
      totalStateMutations: 0,
      totalPropertyAccesses: 0,
      totalDifferences: mismatches.length,
      comparisonTime: 0,
      tracesCompared: 0,
      tracesDiverged: 0,
      ...metrics
    };
  }
  
  /**
   * Generates a detailed report of the comparison
   * 
   * @returns Formatted report string
   */
  public generateReport(): string {
    if (this.equivalent) {
      return "Implementation comparison passed: Functional and OOP implementations are equivalent.";
    }
    
    const parts: string[] = [
      "Implementation comparison failed: Functional and OOP implementations differ.",
      `Found ${this.mismatches.length} mismatch(es):`
    ];
    
     // Add details for each mismatch
     for (let i = 0; i < this.mismatches.length; i++) {
      const mismatch = this.mismatches[i];
      if (!mismatch) continue;
      
      parts.push(`${i + 1}. ${mismatch.message || 'Unspecified mismatch'}`);
      
      if (mismatch.path) {
        parts.push(`   - Path: ${mismatch.path}`);
      }
      
      parts.push(`   - Expected: ${JSON.stringify(mismatch.expected)}`);
      parts.push(`   - Actual: ${JSON.stringify(mismatch.actual)}`);
      
      const severityName = ErrorSeverity[mismatch.severity] || 'UNKNOWN';
      parts.push(`   - Severity: ${severityName}`);
    }
    
    // Add summary information if available
    if (Object.keys(this.summary).length > 0) {
      parts.push("\nSummary:");
      
      if (this.summary['thisResult']) {
        parts.push("First implementation:");
        for (const [key, value] of Object.entries(this.summary['thisResult'])) {
          parts.push(`  - ${key}: ${JSON.stringify(value)}`);
        }
      }
      
      if (this.summary['otherResult']) {
        parts.push("Second implementation:");
        for (const [key, value] of Object.entries(this.summary['otherResult'])) {
          parts.push(`  - ${key}: ${JSON.stringify(value)}`);
        }
      }
    }
    
    // Add metrics information
    parts.push("\nMetrics:");
    parts.push(`  - Functions called: ${this.metrics.totalFunctionsCalled}`);
    parts.push(`  - State mutations: ${this.metrics.totalStateMutations}`);
    parts.push(`  - Property accesses: ${this.metrics.totalPropertyAccesses}`);
    parts.push(`  - Total differences: ${this.metrics.totalDifferences}`);
    parts.push(`  - Comparison time: ${this.metrics.comparisonTime}ms`);
    parts.push(`  - Traces compared: ${this.metrics.tracesCompared}`);
    parts.push(`  - Traces diverged: ${this.metrics.tracesDiverged}`);
    
    return parts.join("\n");
  }
  
  /**
   * Visualizes the differences between implementations
   * 
   * @returns Visualization string (currently text-based)
   */
  public visualizeDifferences(): string {
    if (this.equivalent) {
      return "No differences to visualize.";
    }
    
    const parts: string[] = [
      "Implementation Difference Visualization:",
      "-----------------------------------"
    ];
    
    // Process each mismatch into a visual representation
    this.mismatches.forEach((mismatch, i) => {
      if (!mismatch) return;
      
      parts.push(`\n[Mismatch #${i + 1}]: ${mismatch.path || 'Unspecified path'}`);
      parts.push("-----------------------------------");
      
      // Create a visual diff representation
      parts.push("Functional: " + JSON.stringify(mismatch.expected));
      parts.push("OOP:        " + JSON.stringify(mismatch.actual));
      
      // For string values, create a character-by-character comparison
      if (typeof mismatch.expected === 'string' && typeof mismatch.actual === 'string') {
        const maxLength = Math.max(mismatch.expected.length, mismatch.actual.length);
        const diffIndicator = Array(maxLength).fill(' ');
        
        for (let j = 0; j < maxLength; j++) {
          if (j >= mismatch.expected.length) {
            diffIndicator[j] = '+'; // Extra character in actual
          } else if (j >= mismatch.actual.length) {
            diffIndicator[j] = '-'; // Missing character in actual
          } else if (mismatch.expected[j] !== mismatch.actual[j]) {
            diffIndicator[j] = '^'; // Different character
          }
        }
        
        parts.push("Diff:       " + diffIndicator.join(''));
      }
    });
    
    // Add trace divergence visualization if available
    if (this.traceComparisons.length > 0) {
      parts.push("\nExecution Trace Divergences:");
      parts.push("-----------------------------------");
      
      for (const traceComparison of this.traceComparisons) {
        parts.push(`\n[Trace #${traceComparison.index + 1}]`);
        
        if (traceComparison.comparison) {
          parts.push("Divergence points:");
          
          for (const point of traceComparison.comparison.divergencePoints) {
            parts.push(`  - ${point}`);
            
            // If value differences are available for this point
            const diff = traceComparison.comparison.valueDifferences.get(point);
            
            if (diff) {
              parts.push(`    Functional: ${JSON.stringify(diff[0])}`);
              parts.push(`    OOP:        ${JSON.stringify(diff[1])}`);
            }
          }
        }
      }
    }
    
    return parts.join("\n");
  }
  /**
   * 
   */
  /**
   * Converts the implementation mismatches into ValidationError objects
   * 
   * @param component The component where the mismatches occurred
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @returns Array of ImplementationMismatchError objects
   */
  public toValidationErrors(
    oopImplementation: string
  ): ImplementationMismatchError[] {
    if (this.equivalent) {
      return [];
    }
    
    return this.mismatches.map(mismatch => {
      // Extract expected and actual behavior from the mismatch
      const expectedBehavior: Record<string, any> = {
        value: mismatch.expected,
        path: mismatch.path
      };
      
      const actualBehavior: Record<string, any> = {
        value: mismatch.actual,
        path: mismatch.path
      };
      
      // Create a Map for the diff
      const diff = new Map<string, any>();
      diff.set(mismatch.path, [mismatch.expected, mismatch.actual]);
      
      return new ImplementationMismatchError(
        'IMPLEMENTATION_MISMATCH',
        mismatch.message,
        '',
        '',
        oopImplementation,
        expectedBehavior,
        actualBehavior,
        diff,
        JSON.stringify(mismatch.context || {})
      );
    });
  }
  
  /**
   * Converts the implementation comparison result to a ValidationResult
   * This is a critical method to ensure compatibility with ValidationResult
   * 
   * @param component The component where the comparison was performed
   * @param functionalImplementation Reference to the functional implementation
   * @param oopImplementation Reference to the OOP implementation
   * @returns A ValidationResult containing the comparison outcomes
   */
  public toValidationResult(
    component: string,
    functionalImplementation: string,
    oopImplementation: string
  ): ValidationResult<any> {

    // Create a new ValidationResult
    const result = new ValidationResult(
      this.equivalent,
      this.equivalent,
      component as any,
      undefined,
      undefined,
      true,
      functionalImplementation,
      oopImplementation
    );
    
    // If not equivalent, convert mismatches to validation errors
    if (!this.equivalent) {
      const errors = this.toValidationErrors(oopImplementation);
      for (const error of errors) {
        result.addError(error);
      }
    }
    
    // Add trace information if available
    for (const traceComparison of this.traceComparisons) {
      const trace = new ExecutionTrace(
        `comparison_${traceComparison.index}`,
        Date.now() - this.metrics.comparisonTime,
        Date.now(),
        traceComparison.index,
        { result: traceComparison.comparison.equivalent },
        traceComparison.comparison.divergencePoints
      );
      
      result.addTrace(trace);
    }
    
    // Add comparison metadata to the validation result
    result.addMetadata('implementationComparison', {
      equivalent: this.equivalent,
      summary: this.summary,
      metrics: this.metrics,
      mismatches: this.mismatches.map(m => ({
        path: m.path,
        message: m.message,
        severity: m.severity
      }))
    });
    
    return result;
  }
  
  /**
   * Creates an ImplementationComparisonResult from a ValidationResult
   * This is the reciprocal method to ensure bidirectional conversion
   * 
   * @param validationResult The ValidationResult to convert
   * @returns An ImplementationComparisonResult if applicable, or null if the ValidationResult doesn't contain comparison data
   */
  public static fromValidationResult(validationResult: ValidationResult<any>): ImplementationComparisonResult | null {
    // Check if the validation result contains implementation comparison metadata
    if (!validationResult.metadata['implementationComparison']) {
      return null;
    }
    
    const comparisonData = validationResult.metadata['implementationComparison'];
    
    // Extract mismatches from validation errors
    const mismatches: ImplementationDifference[] = [];
    
    for (const error of validationResult.errors) {
      if (error instanceof ImplementationMismatchError) {
        // For each difference in the error's diff
        error.diff.forEach((values, path) => {
          const [expected, actual] = values;
          
          mismatches.push({
            path,
            expected,
            actual,
            message: error.message,
            severity: error.severity,
            context: {
              functionalImplementation: error.functionalImplementation,
              oopImplementation: error.oopImplementation
            }
          });
        });
      }
    }
    
    // Extract metrics from metadata
    const metrics: Partial<ImplementationComparisonMetrics> = comparisonData.metrics || {
      totalDifferences: mismatches.length,
      tracesCompared: validationResult.traces.length,
      tracesDiverged: 0
    };
    
    // Create the comparison result
    return new ImplementationComparisonResult(
      validationResult.isValid,
      mismatches,
      comparisonData.summary || {},
      metrics
    );
  }
  
  /**
   * Creates an ImplementationComparisonResult from a plain object
   * 
   * @param obj The plain object to convert
   * @returns A new ImplementationComparisonResult instance
   */
  public static fromObject(obj: any): ImplementationComparisonResult {
    // Ensure mismatches have the correct structure
    const mismatches: ImplementationDifference[] = Array.isArray(obj.mismatches) 
      ? obj.mismatches.map((m: any) => ({
          path: m.path || "",
          expected: m.expected,
          actual: m.actual,
          message: m.message || `Mismatch at ${m.path}`,
          severity: m.severity !== undefined ? m.severity : ErrorSeverity.ERROR,
          context: m.context || {}
        }))
      : [];
    
    // Extract trace comparisons if available
    const traceComparisons: Array<{ index: number; comparison: TraceComparisonResult }> = [];
    if (obj.traceComparisons && Array.isArray(obj.traceComparisons)) {
      for (const tc of obj.traceComparisons) {
        if (tc.comparison) {
          // Convert valueDifferences from object to Map
          const valueDifferences = new Map<string, [any, any]>();
          if (tc.comparison.valueDifferences && typeof tc.comparison.valueDifferences === 'object') {
            for (const [key, value] of Object.entries(tc.comparison.valueDifferences)) {
              if (Array.isArray(value) && value.length === 2) {
                valueDifferences.set(key, [value[0], value[1]]);
              }
            }
          }
          
          traceComparisons.push({
            index: tc.index,
            comparison: new TraceComparisonResult(
              tc.comparison.equivalent !== false,
              tc.comparison.divergencePoints || [],
              valueDifferences
            )
          });
        }
      }
    }
    
    return new ImplementationComparisonResult(
      obj.equivalent !== false,
      mismatches,
      obj.summary || {},
      obj.metrics || {},
      traceComparisons
    );
  }
  
  /**
   * Converts the comparison result to a plain object
   * 
   * @returns A plain object representation of this result
   */
  public toObject(): any {
    // Convert trace comparisons to serializeable format
    const traceComparisons = this.traceComparisons.map(tc => ({
      index: tc.index,
      comparison: {
        equivalent: tc.comparison.equivalent,
        divergencePoints: tc.comparison.divergencePoints,
        valueDifferences: Object.fromEntries(tc.comparison.valueDifferences)
      }
    }));
    
    return {
      equivalent: this.equivalent,
      mismatches: this.mismatches,
      summary: this.summary,
      metrics: this.metrics,
      traceComparisons
    };
  }
}