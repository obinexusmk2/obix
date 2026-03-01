import { DataModel } from "./BaseDataModel";
import { BehaviorModel } from "./BehaviourModel";

/**
 * A collection of behavior models that can be chained together
 * 
 * @template T The type of data model these behaviors operate on
 */
export class BehaviorChain<T extends DataModel<T>> {
  /**
   * The behaviors in this chain
   */
  public behaviors: BehaviorModel<T, T>[];
  
  /**
   * Creates a new behavior chain
   * 
   * @param behaviors Initial behaviors to include
   */
  constructor(behaviors: BehaviorModel<T, T>[] = []) {
    this.behaviors = [...behaviors];
  }
  
  /**
   * Adds a behavior to the chain
   * 
   * @param behavior The behavior to add
   * @returns This chain for method chaining
   */
  public add(behavior: BehaviorModel<T, T>): BehaviorChain<T> {
    this.behaviors.push(behavior);
    return this;
  }
  
  /**
   * Processes a data model through the entire behavior chain
   * 
   * @param data The initial data model
   * @returns The transformed data model
   */
  public process(data: T): T {
    return this.behaviors.reduce(
      (result, behavior) => behavior.process(result),
      data
    );
  }
  
  /**
   * Creates a new behavior chain with the same behaviors
   * 
   * @returns A new BehaviorChain instance
   */
  public clone(): BehaviorChain<T> {
    return new BehaviorChain<T>([...this.behaviors]);
  }

  public getBehaviorId(): string[] {
    return this.behaviors.map(behavior => behavior.getBehaviorId());
  }

  /**
   * Retrieves a specific behavior by its ID
   * 
   * @param id The ID of the behavior to retrieve
   * @returns The behavior with the matching ID, or undefined if not found
   */
  public getBehavior(id: string): BehaviorModel<T, T> | undefined {
    for (const behavior of this.behaviors) {
      if (behavior.getBehaviorId() === id) {
        return behavior;
      }
    }
    return undefined;
  }
  
  /**
   * Gets the behaviors in this chain
   * 
   * @returns Array of behaviors
   */
  public getBehaviors(): BehaviorModel<T, T>[] {
    return [...this.behaviors];
  }
}