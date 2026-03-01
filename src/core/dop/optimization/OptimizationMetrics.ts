/**
 * Metrics about an optimization operation
 * 
 * Optimization metrics for AST optimization
 */
export interface OptimizationMetrics {
  /**
   * Time taken for the optimization in milliseconds
   */
  timeTaken: number;
  

  /**
   * Estimated memory reduction as a percentage
   */
  memoryReduction: number;
  
  /**
   * Number of items that were optimized
   */
  itemsOptimized: number;
  
  /** Node count reduction metrics */
  nodeReduction: {
    /** Original node count */
    original: number;
    /** Optimized node count */
    optimized: number;
    /** Ratio of optimized to original (lower is better) */
    ratio: number;
  };
  
  /** Memory usage metrics */
  memoryUsage: {
    /** Original memory usage in bytes */
    original: number;
    /** Optimized memory usage in bytes */
    optimized: number;
    /** Ratio of optimized to original (lower is better) */
    ratio: number;
  };
  
  /** State equivalence class metrics */
  stateClasses: {
    /** Number of equivalence classes */
    count: number;
    /** Average nodes per class */
    averageSize: number;
  };
  
  /**
   * Additional metrics specific to the optimization
   */
  [key: string]: any;
}
