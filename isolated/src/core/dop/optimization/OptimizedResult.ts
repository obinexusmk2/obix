import { DataModel } from "./BaseDataModel";
import { OptimizationMetrics } from "./OptimizationMetrics";

/**
 * Result of an optimization operation
 * 
 * @template T The data model type
 */
export class OptimizationResult<T extends DataModel<T>> {
    /**
     * The original data model
     */
    public readonly original: T;
    
    /**
     * The optimized data model
     */
    public readonly optimized: T;
    
    /**
     * Metrics about the optimization
     */
    public readonly metrics: OptimizationMetrics;
    
    /**
     * Creates a new optimization result
     * 
     * @param original The original data model
     * @param optimized The optimized data model
     * @param metrics Optimization metrics
     */
    constructor(original: T, optimized: T, metrics: OptimizationMetrics) {
      this.original = original;
      this.optimized = optimized;
      this.metrics = metrics;
    }
  }
  