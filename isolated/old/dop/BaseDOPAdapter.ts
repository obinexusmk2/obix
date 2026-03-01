import { DataModel } from "./BaseDataModel";
import { BehaviorModel } from "./BehaviourModel";
import { ImplementationComparisonResult } from "./ImplementationComparisonResult";
import { ValidationResult } from "./ValidationResult";

/**
 * Base implementation of the DOP Adapter pattern
 * 
 * @template T The data model type
 * @template R The result type
 */
export abstract class BaseDOPAdapter<T extends DataModel<T>, R> {
  /**
   * The data model
   */
  protected dataModel: T;
  
  /**
   * The behavior model
   */
  protected behaviorModel: BehaviorModel<T, R>;
  
  /**
   * Validation state flag
   */
  public isValid: boolean = false;
  
  /**
   * Reference to data model for compatibility with tests
   */
  public data: T;
  
  /**
   * Creates a new DOP adapter
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   */
  constructor(dataModel: T, behaviorModel: BehaviorModel<T, R>) {
    this.dataModel = dataModel;
    this.behaviorModel = behaviorModel;
    this.data = dataModel;
  }
  
  /**
   * Enables or disables caching
   * 
   * @param enabled Whether to enable caching
   * @returns This adapter for method chaining
   */
  public enableCaching(enabled: boolean = true): this {
    // This base class does not implement caching, so just log the enabled value
    console.log(`Caching enabled: ${enabled}`);
    return this;
  }

  /**
   * Clears the cache of previous results
   * 
   * @returns This adapter for method chaining
   */
  public clearCache(): this {
    throw new Error('Method not implemented.');
  }

  /**
   * Validates the data model
   * 
   * @returns Validation result
   */
  public validate(): ValidationResult<T> {
    const validationResult = this.behaviorModel.validate(this.dataModel);
    this.isValid = validationResult.isValid;
    return validationResult;
  }
  
  /**
   * Applies the behavior to the data model
   * 
   * @param data The data model to process
   * @returns Result of the operation
   */
  public adapt(data: T): R {
    return this.behaviorModel.process(data);
  }
  
  /**
   * Compares this model with another ValidationResult
   * 
   * @param other The other ValidationResult to compare with
   * @returns The result of the comparison
   */
  public compareWith(other: ValidationResult<T>): ImplementationComparisonResult {
    // The test expects that when comparing with an identical validation result,
    // the comparison result should be equivalent=true
    if (this.isValid === other.isValid && this.dataModel.equals(other.data)) {
      return new ImplementationComparisonResult(true, [], {});
    }
    
    // Otherwise, return non-equivalent result
    return new ImplementationComparisonResult(false, [], {});
  }
  
  /**
   * Gets the data model
   * 
   * @returns The data model
   */
  public getDataModel(): T {
    return this.dataModel;
  }
  
  /**
   * Gets the behavior model
   * 
   * @returns The behavior model
   */
  public getBehaviorModel(): BehaviorModel<T, R> {
    return this.behaviorModel;
  }
}