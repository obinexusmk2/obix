import { DataModel } from "./BaseDataModel";
import { BaseDOPAdapter } from "./BaseDOPAdapter";
import { BehaviorModel } from "./BehaviourModel";


/**
 * DOP Adapter that tracks processing time
 * 
 * @template T The data model type
 * @template R The result type
 */
export class TimedDOPAdapter<T extends DataModel<T>, R> extends BaseDOPAdapter<T, R> {
  /**
   * Processing time in milliseconds for the last operation
   */
  public processingTime: number = 0;
  override dataModel: T;
  override behaviorModel: BehaviorModel<T, R>;
  
  /**
   * Creates a new timed DOP adapter
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   */
  constructor(dataModel: T, behaviorModel: BehaviorModel<T, R>) {
    super(dataModel, behaviorModel);
    this.dataModel = dataModel;
    this.behaviorModel = behaviorModel;
  }
  
  /**
   * Applies the behavior to the data model with timing
   * 
   * @param data The data model to process
   * @returns Result of the operation
   */
  public override adapt(data: T): R {
    const startTime = performance.now();
    const result = super.adapt(data);
    this.processingTime = performance.now() - startTime;
    return result;
  }
  
  /**
   * Gets the data model
   * 
   * @returns The data model
   */
  public override getDataModel(): T {
    return this.dataModel;
  }
  
  /**
   * Gets the behavior model
   * 
   * @returns The behavior model
   */
  public override getBehaviorModel(): BehaviorModel<T, R> {
    return this.behaviorModel;
  }
  
  /**
   * Gets the processing time for the last operation
   * 
   * @returns Processing time in milliseconds
   */
  public getProcessingTime(): number {
    return this.processingTime;
  }
}
