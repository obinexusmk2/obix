/**
 * ExecutionTrace.ts
 * 
 * Implementation of the ExecutionTrace class and related types used for
 * tracking rule execution and comparing implementations across paradigms.
 * 
 * Copyright © 2025 OBINexus Computing
 */

/**
 * TraceComparisonResult represents the outcome of comparing two execution traces
 */
export class TraceComparisonResult {
    /**
     * Whether the two traces are equivalent
     */
    public equivalent: boolean;
    
    /**
     * Points where the execution paths diverged
     */
    public divergencePoints: string[];
    
    /**
     * Map of value differences at each divergence point
     */
    public valueDifferences: Map<string, [any, any]>;
    
    constructor(
      equivalent: boolean = true,
      divergencePoints: string[] = [],
      valueDifferences: Map<string, [any, any]> = new Map()
    ) {
      this.equivalent = equivalent;
      this.divergencePoints = [...divergencePoints];
      this.valueDifferences = new Map(valueDifferences);
    }
    
    /**
     * Creates a TraceComparisonResult from a plain object
     */
    public static fromObject(obj: any): TraceComparisonResult {
      const valueDifferences = new Map<string, [any, any]>();
      
      if (obj.valueDifferences && typeof obj.valueDifferences === 'object') {
        for (const [key, value] of Object.entries(obj.valueDifferences)) {
          if (Array.isArray(value) && value.length === 2) {
            valueDifferences.set(key, [value[0], value[1]]);
          }
        }
      }
      
      return new TraceComparisonResult(
        obj.equivalent ?? true,
        obj.divergencePoints ?? [],
        valueDifferences
      );
    }
    
    /**
     * Converts the trace comparison result to a plain object
     */
    public toObject(): any {
      return {
        equivalent: this.equivalent,
        divergencePoints: this.divergencePoints,
        valueDifferences: Object.fromEntries(this.valueDifferences)
      };
    }
    
    /**
     * Returns a string representation of the comparison result
     */
    public toString(): string {
      if (this.equivalent) {
        return "Traces are equivalent";
      }
      
      const parts = [`Traces diverge at ${this.divergencePoints.length} point(s):`];
      
      for (const point of this.divergencePoints) {
        const diff = this.valueDifferences.get(point);
        if (diff) {
          parts.push(`  - At ${point}: expected ${JSON.stringify(diff[0])}, got ${JSON.stringify(diff[1])}`);
        } else {
          parts.push(`  - At ${point}: values unknown`);
        }
      }
      
      return parts.join("\n");
    }
  }
  
  /**
   * ExecutionTrace captures details about the execution of a validation rule
   * to facilitate comparison between functional and OOP implementations
   */
  export class ExecutionTrace {
    /**
     * Identifier of the rule being executed
     */
    public ruleId: string;
    
    /**
     * Timestamp when execution started
     */
    public startTime: number;
    
    /**
     * Timestamp when execution ended
     */
    public endTime: number;
    
    /**
     * Snapshot of the input before rule execution
     */
    public inputSnapshot: Record<string, any>;
    
    /**
     * Snapshot of the output after rule execution
     */
    public outputSnapshot: Record<string, any>;
    
    /**
     * Chronological path of execution steps
     */
    public executionPath: string[];
    
    
    public  id: string;
    
    constructor(
      ruleId: string,
      id: string | number,
      startTime: number = Date.now(),
      endTime: number = 0,
      inputSnapshot: Record<string, any> = {},
      outputSnapshot: Record<string, any> = {},
      executionPath: string[] = []
    ) {
      this.ruleId = ruleId;
      this.id = id.toString();
      this.startTime = startTime;
      this.endTime = endTime || startTime;
      this.inputSnapshot = { ...inputSnapshot };
      this.outputSnapshot = { ...outputSnapshot };
      this.executionPath = [...executionPath];
    }
    
    /**
     * Records the end of rule execution
     * 
     * @param output The output after rule execution
     * @returns This ExecutionTrace instance for chaining
     */
    public end(output: Record<string, any> = {}): ExecutionTrace {
      this.endTime = Date.now();
      this.outputSnapshot = { ...output };
      return this;
    }
    
    /**
     * Adds an execution step to the path
     * 
     * @param step Description of the execution step
     * @returns This ExecutionTrace instance for chaining
     */
    public addStep(step: string): ExecutionTrace {
      this.executionPath.push(step);
      return this;
    }
    
    /**
     * Gets the execution duration in milliseconds
     * 
     * @returns Duration in milliseconds
     */
    public getDuration(): number {
      return this.endTime - this.startTime;
    }
    
    /**
     * Compares this trace with another to identify differences
     * 
     * @param other The other trace to compare against
     * @returns TraceComparisonResult with comparison details
     */
    public compareWith(other: ExecutionTrace): TraceComparisonResult {
      // If rule IDs don't match, we can't compare meaningfully
      if (this.ruleId !== other.ruleId) {
        return new TraceComparisonResult(
          false,
          ["rule_id_mismatch"],
          new Map([["rule_id", [this.ruleId, other.ruleId]]])
        );
      }
      
      // Check for input differences
      const inputDifferences = this.compareObjects(this.inputSnapshot, other.inputSnapshot);
      if (inputDifferences.size > 0) {
        const divergencePoints = Array.from(inputDifferences.keys()).map(key => `input.${key}`);
        return new TraceComparisonResult(false, divergencePoints, inputDifferences);
      }
      
      // Compare execution paths
      const pathResult = this.compareExecutionPaths(other);
      if (!pathResult.equivalent) {
        return pathResult;
      }
      
      // Check for output differences
      const outputDifferences = this.compareObjects(this.outputSnapshot, other.outputSnapshot);
      if (outputDifferences.size > 0) {
        const divergencePoints = Array.from(outputDifferences.keys()).map(key => `output.${key}`);
        return new TraceComparisonResult(false, divergencePoints, outputDifferences);
      }
      
      // No meaningful differences found
      return new TraceComparisonResult(true);
    }
    
    /**
     * Compares execution paths between two traces
     * 
     * @public
     * @param other The other trace to compare against
     * @returns TraceComparisonResult with path comparison details
     */
    public compareExecutionPaths(other: ExecutionTrace): TraceComparisonResult {
      const maxLength = Math.max(this.executionPath.length, other.executionPath.length);
      const minLength = Math.min(this.executionPath.length, other.executionPath.length);
      
      // If path lengths differ, that's already a divergence
      if (this.executionPath.length !== other.executionPath.length) {
        return new TraceComparisonResult(
          false,
          [`path_length_mismatch`],
          new Map([["path_length", [this.executionPath.length, other.executionPath.length]]])
        );
      }
      
      const divergencePoints: string[] = [];
      const valueDifferences = new Map<string, [any, any]>();
      
      // Compare each step in the execution paths
      for (let i = 0; i < maxLength; i++) {
        // If we've reached the end of one path but not the other
        if (i >= minLength) {
          const divergePoint = `path[${i}]`;
          divergencePoints.push(divergePoint);
          valueDifferences.set(
            divergePoint,
            i < this.executionPath.length 
              ? [this.executionPath[i], undefined] 
              : [undefined, other.executionPath[i]]
          );
          continue;
        }
        
        // Compare the current steps
        if (this.executionPath[i] !== other.executionPath[i]) {
          const divergePoint = `path[${i}]`;
          divergencePoints.push(divergePoint);
          valueDifferences.set(divergePoint, [this.executionPath[i], other.executionPath[i]]);
        }
      }
      
      return new TraceComparisonResult(
        divergencePoints.length === 0,
        divergencePoints,
        valueDifferences
      );
    }
    
    /**
     * Compares two objects and identifies differences
     * 
     * @public
     * @param obj1 First object
     * @param obj2 Second object
     * @returns Map of differences with key paths and value pairs
     */
    public compareObjects(obj1: Record<string, any>, obj2: Record<string, any>): Map<string, [any, any]> {
      const differences = new Map<string, [any, any]>();
      
      // Check all keys in first object
      for (const key of Object.keys(obj1)) {
        // If key doesn't exist in second object
        if (!(key in obj2)) {
          differences.set(key, [obj1[key], undefined]);
          continue;
        }
        
        // If values are objects, recursively compare
        if (typeof obj1[key] === 'object' && obj1[key] !== null && 
            typeof obj2[key] === 'object' && obj2[key] !== null &&
            !Array.isArray(obj1[key]) && !Array.isArray(obj2[key])) {
          const nestedDifferences = this.compareObjects(obj1[key], obj2[key]);
          
          // Add nested differences with proper path prefixing
          for (const [nestedKey, values] of nestedDifferences.entries()) {
            differences.set(`${key}.${nestedKey}`, values);
          }
        }
        // Compare arrays
        else if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
          if (obj1[key].length !== obj2[key].length) {
            differences.set(`${key}.length`, [obj1[key].length, obj2[key].length]);
          }
          
          // Compare array elements
          const maxLength = Math.max(obj1[key].length, obj2[key].length);
          for (let i = 0; i < maxLength; i++) {
            if (i >= obj1[key].length) {
              differences.set(`${key}[${i}]`, [undefined, obj2[key][i]]);
            } else if (i >= obj2[key].length) {
              differences.set(`${key}[${i}]`, [obj1[key][i], undefined]);
            } else if (!this.deepEquals(obj1[key][i], obj2[key][i])) {
              differences.set(`${key}[${i}]`, [obj1[key][i], obj2[key][i]]);
            }
          }
        }
        // Simple value comparison
        else if (!this.deepEquals(obj1[key], obj2[key])) {
          differences.set(key, [obj1[key], obj2[key]]);
        }
      }
      
      // Check for keys in second object that don't exist in first
      for (const key of Object.keys(obj2)) {
        if (!(key in obj1)) {
          differences.set(key, [undefined, obj2[key]]);
        }
      }
      
      return differences;
    }
    
    /**
     * Deep equality check for any two values
     * 
     * @public
     * @param val1 First value
     * @param val2 Second value
     * @returns True if the values are deeply equal
     */
    public deepEquals(val1: any, val2: any): boolean {
      // Handle primitive types
      if (val1 === val2) return true;
      if (val1 === null || val2 === null) return false;
      if (val1 === undefined || val2 === undefined) return false;
      
      // Handle different types
      if (typeof val1 !== typeof val2) return false;
      
      // Handle objects
      if (typeof val1 === 'object') {
        // Handle arrays
        if (Array.isArray(val1) && Array.isArray(val2)) {
          if (val1.length !== val2.length) return false;
          for (let i = 0; i < val1.length; i++) {
            if (!this.deepEquals(val1[i], val2[i])) return false;
          }
          return true;
        }
        
        // Handle Date objects
        if (val1 instanceof Date && val2 instanceof Date) {
          return val1.getTime() === val2.getTime();
        }
        
        // Handle regular objects
        if (!Array.isArray(val1) && !Array.isArray(val2)) {
          const keys1 = Object.keys(val1);
          const keys2 = Object.keys(val2);
          
          if (keys1.length !== keys2.length) return false;
          
          for (const key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!this.deepEquals(val1[key], val2[key])) return false;
          }
          
          return true;
        }
        
        // Different object types
        return false;
      }
      
      // Handle functions (compare toString representations)
      if (typeof val1 === 'function' && typeof val2 === 'function') {
        return val1.toString() === val2.toString();
      }
      
      // Different values
      return false;
    }
    
    /**
     * Creates an ExecutionTrace from a plain object
     * 
     * @param obj The plain object to convert
     * @returns A new ExecutionTrace instance
     */
    public static fromObject(obj: any): ExecutionTrace {
      return new ExecutionTrace(
        obj.ruleId || "unknown",
        obj.startTime || Date.now(),
        obj.endTime || 0,
        obj.inputSnapshot || {},
        obj.outputSnapshot || {},
        obj.executionPath || []
      );
    }
    
    /**
     * Converts the execution trace to a plain object
     * 
     * @returns A plain object representation of this trace
     */
    public toObject(): any {
      return {
        ruleId: this.ruleId,
        startTime: this.startTime,
        endTime: this.endTime,
        inputSnapshot: this.inputSnapshot,
        outputSnapshot: this.outputSnapshot,
        executionPath: this.executionPath
      };
    }
    
    /**
     * Creates a new instance to trace execution of a rule
     * 
     * @param ruleId The ID of the rule being executed
     * @param input The input to the rule
     * @returns A new ExecutionTrace instance
     */
    public static start(ruleId: string, input: Record<string, any> = {}): ExecutionTrace {
      return new ExecutionTrace(
        ruleId,
        Date.now(),
        Date.now(),
        Date.now(), // Use a timestamp as the unique ID
        { ...input },
        {},
        []
      );
    }
    
    /**
     * Clones this execution trace
     * 
     * @returns A new ExecutionTrace instance with the same properties
     */
    public clone(): ExecutionTrace {
      return new ExecutionTrace(
        this.ruleId,
        this.id,
        this.startTime,
        this.endTime,
        this.inputSnapshot,
        { ...this.outputSnapshot },
        [...this.executionPath]
      );
    }
}
