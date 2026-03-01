/**
 * ExecutionTrace.ts
 * 
 * Provides detailed execution tracing for debugging and validation analysis.
 * Used by the DOP adapter system to track execution paths and identify divergences.
 */

/**
 * Represents a single step in an execution trace
 */
export interface TraceStep {
    /** Step identifier */
    id: string;
    
    /** Step name */
    name: string;
    
    /** Step type */
    type: string;
    
    /** Step timestamp */
    timestamp: number;
    
    /** Step duration in milliseconds */
    duration?: number;
    
    /** Step status */
    status: 'start' | 'end' | 'error' | 'info';
    
    /** Step data */
    data?: Record<string, any>;
    
    /** Child steps */
    children?: TraceStep[];
    
    /** Error information if status is error */
    error?: {
      message: string;
      stack?: string;
      details?: Record<string, any>;
    };
  }
  
  /**
   * Execution trace for debugging and validation
   */
  export class ExecutionTrace {
    /** Trace identifier */
    public readonly id: string;
    
    /** Trace name */
    public readonly name: string;
    
    /** Trace source */
    public readonly source: string;
    
    /** Root trace steps */
    public readonly steps: TraceStep[] = [];
    
    /** Stack of active steps */
    private activeSteps: TraceStep[] = [];
    
    /** Start time of the trace */
    private startTime: number;
    
    /** End time of the trace */
    private endTime?: number;
    
    /** Whether the trace is complete */
    private completed: boolean = false;
    
    /** Additional trace metadata */
    public metadata: Record<string, any> = {};
    
    /**
     * Create a new execution trace
     */
    private constructor(name: string, source: string, initialData?: Record<string, any>) {
      this.id = `trace-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      this.name = name;
      this.source = source;
      this.startTime = Date.now();
      
      if (initialData) {
        this.metadata = { ...initialData };
      }
    }
    
    /**
     * Start a new trace step
     */
    public beginStep(name: string, type: string, data?: Record<string, any>): string {
      if (this.completed) {
        throw new Error('Cannot add steps to a completed trace');
      }
      
      const step: TraceStep = {
        id: `${this.id}-step-${this.steps.length + this.activeSteps.length}`,
        name,
        type,
        timestamp: Date.now(),
        status: 'start',
        data,
        children: []
      };
      
      if (this.activeSteps.length === 0) {
        // Root step
        this.steps.push(step);
      } else {
        // Child step
        const parentStep = this.activeSteps[this.activeSteps.length - 1];
        parentStep.children = parentStep.children || [];
        parentStep.children.push(step);
      }
      
      this.activeSteps.push(step);
      return step.id;
    }
    
    /**
     * End a trace step
     */
    public endStep(data?: Record<string, any>): void {
      if (this.completed) {
        throw new Error('Cannot end steps in a completed trace');
      }
      
      if (this.activeSteps.length === 0) {
        throw new Error('No active step to end');
      }
      
      const step = this.activeSteps.pop();
      if (step) {
        step.status = 'end';
        step.duration = Date.now() - step.timestamp;
        
        if (data) {
          step.data = { ...(step.data || {}), ...data };
        }
      }
    }
    
    /**
     * Log an error in the current step
     */
    public logError(error: Error, details?: Record<string, any>): void {
      if (this.completed) {
        throw new Error('Cannot log errors in a completed trace');
      }
      
      if (this.activeSteps.length === 0) {
        // Create a new error step
        const errorStep: TraceStep = {
          id: `${this.id}-error-${this.steps.length}`,
          name: 'Error',
          type: 'error',
          timestamp: Date.now(),
          status: 'error',
          error: {
            message: error.message,
            stack: error.stack,
            details
          }
        };
        
        this.steps.push(errorStep);
      } else {
        // Add error to current step
        const currentStep = this.activeSteps[this.activeSteps.length - 1];
        currentStep.status = 'error';
        currentStep.error = {
          message: error.message,
          stack: error.stack,
          details
        };
      }
    }
    
    /**
     * Add an info step to the trace
     */
    public addInfo(name: string, data?: Record<string, any>): void {
      if (this.completed) {
        throw new Error('Cannot add info to a completed trace');
      }
      
      const infoStep: TraceStep = {
        id: `${this.id}-info-${this.steps.length + this.activeSteps.length}`,
        name,
        type: 'info',
        timestamp: Date.now(),
        status: 'info',
        data
      };
      
      if (this.activeSteps.length === 0) {
        // Root info step
        this.steps.push(infoStep);
      } else {
        // Child info step
        const parentStep = this.activeSteps[this.activeSteps.length - 1];
        parentStep.children = parentStep.children || [];
        parentStep.children.push(infoStep);
      }
    }
    
    /**
     * End the trace
     */
    public end(finalData?: Record<string, any>): void {
      if (this.completed) {
        return;
      }
      
      // End all active steps
      while (this.activeSteps.length > 0) {
        this.endStep();
      }
      
      this.endTime = Date.now();
      this.completed = true;
      
      if (finalData) {
        this.metadata = { ...this.metadata, ...finalData };
      }
    }
    
    /**
     * Get the duration of the trace
     */
    public getDuration(): number {
      return (this.endTime || Date.now()) - this.startTime;
    }
    
    /**
     * Convert to a JSON object
     */
    public toJSON(): Record<string, any> {
      return {
        id: this.id,
        name: this.name,
        source: this.source,
        startTime: this.startTime,
        endTime: this.endTime,
        duration: this.getDuration(),
        metadata: this.metadata,
        steps: this.steps
      };
    }
    
    /**
     * Start a new execution trace
     */
    public static start(name: string, initialData?: Record<string, any>, source: string = 'default'): ExecutionTrace {
      return new ExecutionTrace(name, source, initialData);
    }
    
    /**
     * Compare two traces and find differences
     */
    public static compareTraces(trace1: ExecutionTrace, trace2: ExecutionTrace): {
      identical: boolean;
      differences: Array<{
        path: string;
        trace1Value: any;
        trace2Value: any;
      }>;
    } {
      const differences: Array<{
        path: string;
        trace1Value: any;
        trace2Value: any;
      }> = [];
      
      // Helper function to compare steps recursively
      const compareSteps = (steps1: TraceStep[], steps2: TraceStep[], path: string): void => {
        // Check number of steps
        if (steps1.length !== steps2.length) {
          differences.push({
            path: `${path}.length`,
            trace1Value: steps1.length,
            trace2Value: steps2.length
          });
        }
        
        // Check each step
        for (let i = 0; i < Math.min(steps1.length, steps2.length); i++) {
          const step1 = steps1[i];
          const step2 = steps2[i];
          const stepPath = `${path}[${i}]`;
          
          // Compare basic properties
          if (step1.name !== step2.name) {
            differences.push({
              path: `${stepPath}.name`,
              trace1Value: step1.name,
              trace2Value: step2.name
            });
          }
          
          if (step1.type !== step2.type) {
            differences.push({
              path: `${stepPath}.type`,
              trace1Value: step1.type,
              trace2Value: step2.type
            });
          }
          
          if (step1.status !== step2.status) {
            differences.push({
              path: `${stepPath}.status`,
              trace1Value: step1.status,
              trace2Value: step2.status
            });
          }
          
          // Compare data (if exists)
          if (step1.data || step2.data) {
            const data1 = step1.data || {};
            const data2 = step2.data || {};
            
            // Simple comparison of data keys
            const keys1 = Object.keys(data1);
            const keys2 = Object.keys(data2);
            
            // Check for keys in data1 that aren't in data2
            for (const key of keys1) {
              if (!keys2.includes(key)) {
                differences.push({
                  path: `${stepPath}.data.${key}`,
                  trace1Value: data1[key],
                  trace2Value: undefined
                });
              } else if (JSON.stringify(data1[key]) !== JSON.stringify(data2[key])) {
                differences.push({
                  path: `${stepPath}.data.${key}`,
                  trace1Value: data1[key],
                  trace2Value: data2[key]
                });
              }
            }
            
            // Check for keys in data2 that aren't in data1
            for (const key of keys2) {
              if (!keys1.includes(key)) {
                differences.push({
                  path: `${stepPath}.data.${key}`,
                  trace1Value: undefined,
                  trace2Value: data2[key]
                });
              }
            }
          }
          
          // Compare children recursively
          if ((step1?.children || step2?.children) && step1 && step2) {
            compareSteps(
              step1.children || [],
              step2.children || [],
              `${stepPath}.children`
            );
          }
        }
      };
      
      // Compare root steps
      compareSteps(trace1.steps, trace2.steps, 'steps');
      
      return {
        identical: differences.length === 0,
        differences
      };
    }
  }