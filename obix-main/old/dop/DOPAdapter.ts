/**
 * DOPAdapter.ts
 * 
 * Core implementation of the DOP (Data-Oriented Programming) Adapter pattern
 * for the OBIX framework. This component provides a unified interface for
 * bridging functional and object-oriented paradigms using Nnamdi Okpala's
 * automaton state minimization technology.
 * 
 * Copyright © 2025 OBINexus Computing
 */
import { DataModel } from './BaseDataModel';
import { BehaviorModel } from './BehaviourModel';
import { ImplementationComparisonResult } from './ImplementationComparisonResult';
import { ValidationResult } from './ValidationResult';

/**
 * Interface for the DOP Adapter pattern
 */
export interface DOPAdapter<T extends DataModel<T>, R> {
  /**
   * Gets the current data model
   */
  getDataModel(): T;
  
  /**
   * Gets the behavior model
   */
  getBehaviorModel(): BehaviorModel<T, R>;
  
  /**
   * Validates the data model
   */
  validate(): ValidationResult<T>;
  
  /**
   * Applies behavior to the data model
   * 
   * @param data Data to adapt
   */
  adapt(data: T): R;
  
  /**
   * Compares with another validation result
   * 
   * @param other The other validation result
   */
  compareWith(other: ValidationResult<any>): ImplementationComparisonResult;
  
  /**
   * Enables or disables result caching
   * 
   * @param enabled Whether caching should be enabled
   */
  enableCaching(enabled: boolean): DOPAdapter<T, R>;
  
  /**
   * Clears the result cache
   */
  clearCache(): void;

  /**
   * Generates a cache key for a data model
   * 
   * @param data The data model to generate a key for
   */
  generateCacheKey(data: T): string;
}

/**
 * Base implementation of the DOP Adapter pattern
 */
export class BaseDOPAdapter<T extends DataModel<T>, R> implements DOPAdapter<T, R> {
  /**
   * Data model
   */
  protected dataModel: T;
  
  /**
   * Behavior model
   */
  protected behaviorModel: BehaviorModel<T, R>;
  
  /**
   * Whether the data model is valid
   */
  public isValid: boolean = false;
  
  /**
   * Whether caching is enabled
   */
  protected isCachingEnabled: boolean = false;
  
  /**
   * Result cache
   */
  protected resultCache: Map<string, R> = new Map();
  
  /**
   * Creates a new DOP adapter
   * 
   * @param dataModel The data model
   * @param behaviorModel The behavior model
   */
  constructor(dataModel: T, behaviorModel: BehaviorModel<T, R>) {
    this.dataModel = dataModel;
    this.behaviorModel = behaviorModel;
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
  
  /**
   * Validates the data model
   * 
   * @returns Validation result
   */
  public validate(): ValidationResult<T> {
    const result = this.behaviorModel.validate(this.dataModel);
    this.isValid = result.isValid;
    return result;
  }
  
  /**
   * Adapts a data model using the behavior model
   * 
   * @param data The data model to adapt
   * @returns Result of adaptation
   */
  public adapt(data: T): R {
    if (this.isCachingEnabled) {
      const cacheKey = this.generateCacheKey(data);
      
      if (this.resultCache.has(cacheKey)) {
        return this.resultCache.get(cacheKey)!;
      }
      
      const result = this.behaviorModel.process(data);
      this.resultCache.set(cacheKey, result);
      return result;
    }
    
    return this.behaviorModel.process(data);
  }
  
  /**
   * Compares with another validation result
   * 
   * @param other The other validation result
   * @returns Comparison result
   */
  public compareWith(other: ValidationResult<any>): ImplementationComparisonResult {
    return this.behaviorModel.compareWith(other);
  }
  
  /**
   * Enables or disables result caching
   * 
   * @param enabled Whether caching should be enabled
   * @returns This adapter for method chaining
   */
  public enableCaching(enabled: boolean): DOPAdapter<T, R> {
    this.isCachingEnabled = enabled;
    console.log(`Caching enabled: ${enabled}`);
    return this;
  }
  
  /**
   * Clears the result cache
   */
  public clearCache(): void {
    throw new Error('Method not implemented.');
  }
  
  /**
   * Generates a cache key for a data model
   * 
   * @param data The data model to generate a key for
   * @returns Cache key
   */
  public generateCacheKey(data: T): string {
    // This is a simple implementation that can be overridden
    return data.getMinimizationSignature();
  }
}

/**
 * Factory interface for creating DOPAdapters
 * 
 * @template T The data model type
 * @template R The result type
 */
export interface DOPAdapterFactory<T extends DataModel<T>, R> {
  /**
   * Creates a DOP adapter from a functional configuration
   * 
   * @param config The functional configuration
   */
  createFromFunctional(config: Record<string, any>): DOPAdapter<T, R>;
  
  /**
   * Creates a DOP adapter from an OOP component
   * 
   * @param component The OOP component
   */
  createFromOOP(component: any): DOPAdapter<T, R>;
}

/**
 * Base factory for creating DOP adapters
 */
export class DualParadigmAdapterFactory<T extends DataModel<T>, R> implements DOPAdapterFactory<T, R> {
  /**
   * Creates a DOP adapter from a functional configuration
   * 
   * @param config The functional configuration
   */
  public createFromFunctional(config: Record<string, any>): DOPAdapter<T, R> {
    throw new Error('Method not implemented: Should be overridden by subclasses');
  }
  
  /**
   * Creates a DOP adapter from an OOP component
   * 
   * @param component The OOP component
   */
  public createFromOOP(component: any): DOPAdapter<T, R> {
    throw new Error('Method not implemented: Should be overridden by subclasses');
  }
}