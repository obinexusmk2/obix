import { BaseBehaviorModel } from "./BaseBehaviorModel";
import { DataModel } from "./BaseDataModel";
import { OptimizationResult } from "./OptimizedResult";

/**
 * A behavior model that optimizes a data model
 * 
 * @template T The data model type
 */
export abstract class OptimizationBehavior<T extends DataModel<T>> extends BaseBehaviorModel<T, OptimizationResult<T>> {
    /**
     * Creates a new optimization behavior
     * 
     * @param id Unique identifier
     * @param description Behavior description
     */
    constructor(id: string, description: string) {
      super(id, description);
    }
    
    /**
     * Optimizes a data model
     * 
     * @param data The data model to optimize
     * @returns Optimization result
     */
    abstract override process(data: T): OptimizationResult<T>;
  }
  
  