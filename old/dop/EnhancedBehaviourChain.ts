import { DataModel } from "./BaseDataModel";
import { BehaviorModel } from "./BehaviourModel";
import { BehaviorChain } from "./BehaviourChain";
import { ValidationState } from "./ValidationState";
import { ValidationStateMachine } from "./ValidationStateMachine";
import { ExecutionTrace } from "../validation/errors/ExecutionTrace";
import { ValidationError } from "../validation/errors/ValidationError";
import { ErrorSeverity } from "../validation/errors/ErrorHandler";

/**
 * Enhanced behavior chain that maintains state consistency and integrates with
 * ValidationStateMachine for proper state transitions.
 * 
 * @template T The type of data model these behaviors operate on
 */
export class EnhancedBehaviorChain<T extends DataModel<T>> extends BehaviorChain<T> {
  /**
   * State machine for handling state transitions during behavior execution
   */
  private stateMachine: ValidationStateMachine;
  
  /**
   * Whether execution tracing is enabled
   */
  private tracingEnabled: boolean;
  
  /**
   * Whether state minimization is enabled
   */
  private minimizationEnabled: boolean;
  
  /**
   * Behavior dependency graph for optimizing execution order
   */
  private dependencyGraph: Map<string, Set<string>>;
  
  /**
   * Cache for behavior execution results
   */
  private resultCache: Map<string, T>;
  
  /**
   * Error handler function
   */
  private errorHandler?: (error: ValidationError, behavior: BehaviorModel<T, T>) => void;
  
  /**
   * Creates a new enhanced behavior chain
   * 
   * @param behaviors Initial behaviors to include
   * @param stateMachine State machine for handling state transitions
   * @param options Configuration options
   */
  constructor(
    behaviors: BehaviorModel<T, T>[] = [],
    stateMachine: ValidationStateMachine = new ValidationStateMachine(),
    options: {
      tracingEnabled?: boolean;
      minimizationEnabled?: boolean;
      errorHandler?: (error: ValidationError, behavior: BehaviorModel<T, T>) => void;
    } = {}
  ) {
    super(behaviors);
    this.stateMachine = stateMachine;
    this.tracingEnabled = options.tracingEnabled || false;
    this.minimizationEnabled = options.minimizationEnabled !== false;
    if (options.errorHandler) {
      this.errorHandler = options.errorHandler;
    }
    this.dependencyGraph = new Map<string, Set<string>>();
    this.resultCache = new Map<string, T>();
    
    // Build dependency graph for behaviors
    this.buildDependencyGraph();
  }
  
  /**
   * Builds a dependency graph for optimizing behavior execution order
   */
  private buildDependencyGraph(): void {
    this.dependencyGraph.clear();
    
    // Initialize with empty dependencies for each behavior
    for (const behavior of this.behaviors) {
      const behaviorId = behavior.getBehaviorId();
      this.dependencyGraph.set(behaviorId, new Set<string>());
    }
    
    // Analyze relationships between behaviors
    for (let i = 0; i < this.behaviors.length; i++) {
      const behavior = this.behaviors[i];
      if (!behavior) continue; // Skip if behavior is undefined
      
      const behaviorId = behavior.getBehaviorId();
      
      // Add implicit sequential dependencies
      // Behaviors later in the chain may depend on earlier ones
      for (let j = 0; j < i; j++) {
        const dependencyBehavior = this.behaviors[j];
        if (!dependencyBehavior) continue; // Skip if dependency behavior is undefined
        
        const dependencyId = dependencyBehavior.getBehaviorId();
        
        // Check for compatibility
        if (this.areBehaviorsCompatible(behavior, dependencyBehavior)) {
          const dependencies = this.dependencyGraph.get(behaviorId);
          if (dependencies) {
            dependencies.add(dependencyId);
          }
        }
      }
    }
    
    // Validate and optimize the dependency graph
    this.validateDependencyGraph();
  }
  
  /**
   * Checks if two behaviors are compatible and have dependencies
   * 
   * @param behavior1 First behavior
   * @param behavior2 Second behavior
   * @returns True if the behaviors are compatible
   */
  private areBehaviorsCompatible(behavior1: BehaviorModel<T, T>, behavior2: BehaviorModel<T, T>): boolean {
    // This is a simplified implementation
    // In a real-world scenario, we'd check for actual compatibility markers
    
    // For now, we'll assume behaviors are compatible if they have different IDs
    return behavior1.getBehaviorId() !== behavior2.getBehaviorId();
  }
  
  /**
   * Validates the dependency graph and removes cycles
   */
  private validateDependencyGraph(): void {
    // Detect and break cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    // Depth-first search to detect cycles
    const detectCycle = (behaviorId: string, path: string[] = []): boolean => {
      // If we've already checked this behavior and found no cycles, skip
      if (visited.has(behaviorId)) {
        return false;
      }
      
      // If we encounter a behavior already in the current path, we've found a cycle
      if (recursionStack.has(behaviorId)) {
        // Break the cycle by removing the dependency
        const cycleStart = path.indexOf(behaviorId);
        if (cycleStart >= 0) {
          // Get the behavior before the cycle start
          const lastBehavior = path[path.length - 1];
          if (lastBehavior) {
            const dependencies = this.dependencyGraph.get(lastBehavior);
            if (dependencies) {
              dependencies.delete(behaviorId);
            }
          }
        }
        return true;
      }
      
      // Add to current path and mark as being processed
      recursionStack.add(behaviorId);
      path.push(behaviorId);
      
      // Check all dependencies
      const dependencies = this.dependencyGraph.get(behaviorId);
      if (dependencies) {
        for (const depId of dependencies) {
          if (detectCycle(depId, [...path])) {
            return true;
          }
        }
      }
      
      // Mark as fully processed and remove from current path
      recursionStack.delete(behaviorId);
      visited.add(behaviorId);
      
      return false;
    };
    
    // Check each behavior
    for (const behaviorId of this.dependencyGraph.keys()) {
      detectCycle(behaviorId);
    }
    
    // Minimize the graph by removing redundant dependencies
    this.minimizeDependencyGraph();
  }
  
  /**
   * Minimizes the dependency graph by removing redundant dependencies
   */
  private minimizeDependencyGraph(): void {
    for (const [behaviorId, dependencies] of this.dependencyGraph.entries()) {
      const minimized = new Set<string>();
      
      for (const depId of dependencies) {
        // Check if this dependency is already implied by other dependencies
        const isRedundant = Array.from(dependencies).some(otherId => {
          if (otherId === depId) return false;
          const otherDeps = this.dependencyGraph.get(otherId);
          return otherDeps?.has(depId) || false;
        });
        
        if (!isRedundant) {
          minimized.add(depId);
        }
      }
      
      this.dependencyGraph.set(behaviorId, minimized);
    }
  }
  
  /**
   * Processes a data model through the entire behavior chain
   * with state management and execution tracing
   * 
   * @param data The initial data model
   * @returns The transformed data model
   */
  public override process(data: T): T {
    // Reset state machine to initial state
    this.stateMachine.reset();
    
    // Transition to processing state
    this.stateMachine.transition('begin_processing');
    
    // Apply state minimization if enabled
    if (this.minimizationEnabled) {
      this.stateMachine.minimize();
    }
    
    let result = data;
    const processingState = this.stateMachine.getCurrentState();
    
    try {
      // Get optimized behavior execution order
      const orderedBehaviors = this.getOptimizedBehaviorOrder();
      
      // Process each behavior
      for (const behavior of orderedBehaviors) {
        const behaviorId = behavior.getBehaviorId();
        
        // Create execution trace if tracing is enabled
        let trace: ExecutionTrace | undefined;
        if (this.tracingEnabled) {
          trace = ExecutionTrace.start(behaviorId, { 
            description: behavior.getDescription(),
            dataMinimizationSignature: result.getMinimizationSignature()
          });
        }
        
        try {
          // Check cache if state minimization is enabled
          if (this.minimizationEnabled) {
            const cacheKey = this.generateCacheKey(behaviorId, result);
            const cachedResult = this.resultCache.get(cacheKey);
            
            if (cachedResult) {
              result = cachedResult;
              continue;
            }
          }
          
          // Create a validation state for this behavior
          const behaviorState = new ValidationState(
            `behavior_${behaviorId}`,
            true,
            { 
              behaviorId: behaviorId,
              description: behavior.getDescription()
            }
          );
          
          // Add state to state machine if not exists
          if (!this.stateMachine.getState(`behavior_${behaviorId}`)) {
            this.stateMachine.addState(behaviorState);
            
            // Add transitions from processing state to behavior state
            this.stateMachine.addTransition(
              processingState?.getId() || 'processing',
              `execute_${behaviorId}`,
              `behavior_${behaviorId}`
            );
            
            // Add transition back to processing state
            this.stateMachine.addTransition(
              `behavior_${behaviorId}`,
              'behavior_complete',
              processingState?.getId() || 'processing'
            );
          }
          
          // Transition to behavior state
          this.stateMachine.transition(`execute_${behaviorId}`);
          
          // Apply the behavior
          result = behavior.process(result);
          
          // Cache the result if state minimization is enabled
          if (this.minimizationEnabled) {
            const cacheKey = this.generateCacheKey(behaviorId, data);
            this.resultCache.set(cacheKey, result);
          }
          
          // Transition back to processing state
          this.stateMachine.transition('behavior_complete');
          
          // Complete trace if enabled
          if (trace) {
            trace.end({ 
              success: true,
              resultMinimizationSignature: result.getMinimizationSignature()
            });
          }
        } catch (error) {
          // Handle behavior execution error
          const validationError = new ValidationError(
            'BEHAVIOR_EXECUTION_ERROR',
            `Error executing behavior "${behaviorId}": ${error instanceof Error ? error.message : String(error)}`,
            'EnhancedBehaviorChain',
            'chain',
            ErrorSeverity.ERROR,
            { behaviorId }
          );
          
          // Call error handler if provided
          if (this.errorHandler) {
            this.errorHandler(validationError, behavior);
          }
          
          // Complete trace with error
          if (trace) {
            trace.end({ 
              success: false,
              error: validationError.message
            });
          }
          
          // Transition to error state
          this.stateMachine.transition('processing_error');
          
          // Handle error in state machine
          this.stateMachine.handleErrorInState(validationError);
          
          // Rethrow to stop further processing
          throw validationError;
        }
      }
      
      // Transition to completed state
      this.stateMachine.transition('processing_complete');
      
      return result;
    } catch (error) {
      // Handle overall chain execution error
      if (!(error instanceof ValidationError)) {
        const validationError = new ValidationError(
          'BEHAVIOR_CHAIN_ERROR',
          `Error in behavior chain: ${error instanceof Error ? error.message : String(error)}`,
          'EnhancedBehaviorChain',
          'chain',
          ErrorSeverity.ERROR
        );
        
        // Transition to error state
        this.stateMachine.transition('processing_error');
        
        // Handle error in state machine
        this.stateMachine.handleErrorInState(validationError);
      }
      
      // Return the input data since we couldn't process it
      return data;
    }
  }
  
  /**
   * Gets an optimized order for behavior execution based on dependencies
   * 
   * @returns Array of behaviors in optimized execution order
   */
  private getOptimizedBehaviorOrder(): BehaviorModel<T, T>[] {
    // If there are no behaviors or only one, return as is
    if (this.behaviors.length <= 1) {
      return [...this.behaviors];
    }
    
    // Use topological sort to get execution order
    const result: BehaviorModel<T, T>[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();
    
    // Topological sort function
    const visit = (behaviorId: string): void => {
      // If already in result, skip
      if (visited.has(behaviorId)) {
        return;
      }
      
      // Check for cycle (should not occur due to validation)
      if (temp.has(behaviorId)) {
        // In a real implementation, handle cycles better
        return;
      }
      
      // Mark as being processed
      temp.add(behaviorId);
      
      // Visit all dependencies first
      const dependencies = this.dependencyGraph.get(behaviorId);
      if (dependencies) {
        for (const depId of dependencies) {
          visit(depId);
        }
      }
      
      // Mark as visited
      temp.delete(behaviorId);
      visited.add(behaviorId);
      
      // Add to result
      const behavior = this.behaviors.find(b => b.getBehaviorId() === behaviorId);
      if (behavior) {
        result.push(behavior);
      }
    };
    
    // Visit all behaviors
    for (const behavior of this.behaviors) {
      visit(behavior.getBehaviorId());
    }
    
    return result;
  }
  
  /**
   * Generates a cache key for a behavior and data model
   * 
   * @param behaviorId The behavior ID
   * @param data The data model
   * @returns A cache key string
   */
  private generateCacheKey(behaviorId: string, data: T): string {
    return `${behaviorId}:${data.getMinimizationSignature()}`;
  }
  
  /**
   * Clears the result cache
   * 
   * @returns This chain for method chaining
   */
  public clearCache(): EnhancedBehaviorChain<T> {
    this.resultCache.clear();
    return this;
  }
  
  /**
   * Gets the state machine
   * 
   * @returns The validation state machine
   */
  public getStateMachine(): ValidationStateMachine {
    return this.stateMachine;
  }
  
  /**
   * Sets the error handler function
   * 
   * @param handler The error handler function
   * @returns This chain for method chaining
   */
  public setErrorHandler(handler: (error: ValidationError, behavior: BehaviorModel<T, T>) => void): EnhancedBehaviorChain<T> {
    this.errorHandler = handler;
    return this;
  }
  
  /**
   * Sets whether tracing is enabled
   * 
   * @param enabled Whether to enable tracing
   * @returns This chain for method chaining
   */
  public setTracingEnabled(enabled: boolean): EnhancedBehaviorChain<T> {
    this.tracingEnabled = enabled;
    return this;
  }
  
  /**
   * Sets whether state minimization is enabled
   * 
   * @param enabled Whether to enable state minimization
   * @returns This chain for method chaining
   */
  public setMinimizationEnabled(enabled: boolean): EnhancedBehaviorChain<T> {
    this.minimizationEnabled = enabled;
    return this;
  }
  
  /**
   * Adds a dependency between behaviors
   * 
   * @param dependentId ID of the dependent behavior
   * @param dependencyId ID of the behavior being depended on
   * @returns This chain for method chaining
   */
  public addDependency(dependentId: string, dependencyId: string): EnhancedBehaviorChain<T> {
    // Make sure both behaviors exist
    const dependentBehavior = this.behaviors.find(b => b.getBehaviorId() === dependentId);
    const dependencyBehavior = this.behaviors.find(b => b.getBehaviorId() === dependencyId);
    
    if (!dependentBehavior || !dependencyBehavior) {
      throw new Error(`Cannot add dependency between nonexistent behaviors: ${dependentId} -> ${dependencyId}`);
    }
    
    // Get or create the dependency set
    if (!this.dependencyGraph.has(dependentId)) {
      this.dependencyGraph.set(dependentId, new Set<string>());
    }
    
    // Add the dependency
    this.dependencyGraph.get(dependentId)!.add(dependencyId);
    
    // Validate dependency graph to prevent cycles
    this.validateDependencyGraph();
    
    return this;
  }
  
  /**
   * Creates a new enhanced behavior chain with the same behaviors and configuration
   * 
   * @returns A new EnhancedBehaviorChain instance
   */
  public override clone(): EnhancedBehaviorChain<T> {
    return new EnhancedBehaviorChain<T>(
      [...this.behaviors],
      this.stateMachine.clone(),
      {
        tracingEnabled: this.tracingEnabled,
        minimizationEnabled: this.minimizationEnabled,
        ...(this.errorHandler !== undefined ? { errorHandler: this.errorHandler } : {})
      }
    );
  }
}