import { DataModel } from "./BaseDataModel";
import { BehaviorModel } from "./BehaviourModel";

/**
 * Registry for behavior models to enable dynamic lookup
 */
export class BehaviorRegistry {
    /**
     * Map of behavior models by id
     */
    public static behaviors = new Map<string, BehaviorModel<any, any>>();
    
    /**
     * Registers a behavior model
     * 
     * @param behavior The behavior to register
     */
    public static register(behavior: BehaviorModel<any, any>): void {
      this.behaviors.set(behavior.getBehaviorId(), behavior);
    }
    
    /**
     * Gets a behavior model by id
     * 
     * @param id The behavior id
     * @returns The behavior model or undefined if not found
     */
    public static get<T extends DataModel<T>, R>(id: string): BehaviorModel<T, R> | undefined {
      return this.behaviors.get(id) as BehaviorModel<T, R> | undefined;
    }
    
    /**
     * Gets all registered behavior models
     * 
     * @returns Array of all behavior models
     */
    public static getAll(): BehaviorModel<any, any>[] {
      return Array.from(this.behaviors.values());
    }
    
    /**
     * Clears all registered behavior models
     */
    public static clear(): void {
      this.behaviors.clear();
    }
  }
  