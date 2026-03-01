import { BaseBehaviorModel } from "./BaseBehaviorModel";
import { DataModel } from "./BaseDataModel";


/**
 * A behavior model that transforms one data model type to another
 * 
 * @template T The source data model type
 * @template R The target data model type
 */
export abstract class TransformBehavior<T extends DataModel<T>, R extends DataModel<R>> extends BaseBehaviorModel<T, R> {
  /**
   * Creates a new transform behavior
   * 
   * @param id Unique identifier
   * @param description Behavior description
   */
  constructor(id: string, description: string) {
    super(id, description);
  }
  
  /**
   * Transforms a source data model to a target data model
   * 
   * @param data The source data model
   * @returns The transformed target data model
   */
  abstract override process(data: T): R;
}
