/**
 * Class for tracking execution trace for validation errors
 */
export class ExecutionTraceDetail {
    private steps: { action: string; state: any; timestamp: number }[] = [];
    
    /**
     * Add a step to the execution trace
     * @param action Action that was executed
     * @param state State after the action
     */
    addStep(action: string, state: any): void {
      this.steps.push({
        action,
        state: JSON.parse(JSON.stringify(state)), // Deep clone the state
        timestamp: Date.now()
      });
    }
    
    /**
     * Get the execution trace
     * @returns The execution trace steps
     */
    getSteps(): { action: string; state: any; timestamp: number }[] {
      return [...this.steps]; // Return a copy to prevent external modification
    }
    
    /**
     * Clear the execution trace
     */
    clear(): void {
      this.steps = [];
    }
    
    /**
     * Get the last step in the execution trace
     * @returns The last step or undefined if no steps exist
     */
    getLastStep(): { action: string; state: any; timestamp: number } | undefined {
      return this.steps.length > 0 ? this.steps[this.steps.length - 1] : undefined;
    }
    
    /**
     * Convert the execution trace to a string representation
     * @returns String representation of the execution trace
     */
    toString(): string {
      return this.steps.map(step => 
        `${new Date(step.timestamp).toISOString()} - ${step.action}: ${JSON.stringify(step.state)}`
      ).join('\n');
    }
  }
  
  