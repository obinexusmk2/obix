import { ErrorSeverity } from "../../../src/core/validation/errors/ErrorHandler";
import { DataModel } from "./BaseDataModel";
import { ImplementationComparisonResult, ImplementationDifference } from "./ImplementationComparisonResult";
import { ValidationResult } from "./ValidationResult";



/**
 * Base interface for all behavior models in the DOP pattern
 * Represents operations that can be performed on data models
 * 
 * @template T The type of data model this behavior operates on
 * @template R The return type for operations (often the same as T)
 */
export interface BehaviorModel<T extends DataModel<T>, R = T> {
  /**
   * Performs operations on the provided data model
   * 
   * @param data The data model to operate on
   * @returns Result of the operation (typically a new data model)
   */
  process(data: T): R;
  
  /**
   * Gets a unique identifier for this behavior
   */
  getBehaviorId(): string;
  
  /**
   * Gets a description of this behavior
   */
  getDescription(): string; 

  /**
   * Compares this behavior model's result with another validation result
   * 
   * @param oopResult The validation result to compare with
   * @returns Implementation comparison result
   */
  compareWith(oopResult: ValidationResult<any>): ImplementationComparisonResult;

  /**
   * Validates the data model
   * 
   * @param dataModel The data model to validate
   * @returns Validation result
   */
  validate(dataModel: T): ValidationResult<T>;
}
/**
 * Base class for behavior models that share common functionality
 * 
 * @template T The type of data model this behavior operates on
 * @template R The return type for operations
 */
export abstract class BaseBehaviorModel<T extends DataModel<T>, R = T> implements BehaviorModel<T, R> {
  /**
   * Unique identifier for this behavior
   */
  protected id: string;
  
  /**
   * Description of what this behavior does
   */
  protected description: string;
  
  /**
   * Creates a new behavior model
   * 
   * @param id Unique identifier
   * @param description Behavior description
   */
  constructor(id: string, description: string) {
    this.id = id;
    this.description = description;
  }
  
  /**
   * Compares this behavior model's result with another validation result
   * 
   * @param oopResult The validation result to compare with
   * @returns Implementation comparison result
   */
  compareWith(oopResult: ValidationResult<any>): ImplementationComparisonResult {
    // Implement comparison logic here
    const divergences: Map<string, [any, any]> = new Map();

    if (this.validate(oopResult.data).isValid !== oopResult.isValid) {
      divergences.set('isValid', [this.validate(oopResult.data).isValid, oopResult.isValid]);
    }

    const equivalent = divergences.size === 0;

    const mismatches: ImplementationDifference[] = [];
    divergences.forEach((value, key) => {
      mismatches.push({ path: key, expected: value[0], actual: value[1], message: '', severity: ErrorSeverity.MEDIUM });
    });

    return new ImplementationComparisonResult(
      equivalent,
      mismatches,
      {
        thisResult: this.validate(oopResult.data).getSummary(),
        otherResult: oopResult.getSummary(),
        divergences: Object.fromEntries(divergences),
        traceComparisons: []
      }
    );
  }

  /**
   * Validates the data model
   * 
   * @param dataModel The data model to validate
   * @returns Validation result
   */
  validate(dataModel: T): ValidationResult<T> {
    // Implement validation logic here
    const errors: string[] = [];
    // Example validation logic
    if (!dataModel) {
      errors.push("Data model is required.");
    }
    return errors.length > 0 ? ValidationResult.invalid(dataModel, errors) : ValidationResult.valid(dataModel);
  }
  
  /**
   * Performs operations on the provided data model
   * Must be implemented by concrete subclasses
   * 
   * @param data The data model to operate on
   * @returns Result of the operation
   */
  abstract process(data: T): R;
  
  /**
   * Gets the unique identifier for this behavior
   * 
   * @returns Behavior identifier
   */
  public getBehaviorId(): string {
    return this.id;
  }
  
  /**
   * Gets the description of this behavior
   * 
   * @returns Behavior description
   */
  public getDescription(): string {
    return this.description;
  }
}