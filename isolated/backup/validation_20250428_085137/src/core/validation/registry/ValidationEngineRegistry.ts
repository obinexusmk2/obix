/**
 * ValidationEngineRegistry.ts
 * 
 * Registry for ValidationEngine instances that provides centralized access
 * to engines for different domains and purposes.
 * 
 * Copyright © 2025 OBINexus Computing
 */

import { IValidationEngine } from "../core";
import { ValidationEngineFactory } from "../factory";


/**
 * Registry for validation engines
 */
export class ValidationEngineRegistry {
  /**
   * Singleton instance of the registry
   */
  public static instance: ValidationEngineRegistry;
  
  /**
   * Map of engine keys to engine instances
   */
  public engines: Map<string, IValidationEngine> = new Map();
  
  /**
   * Key for the default engine
   */
  public defaultEngineKey: string = 'default';
  
  /**
   * public constructor to enforce singleton pattern
   */
  public constructor() {
    // Initialize the default engine
    this.initializeDefaultEngine();
  }
  
  /**
   * Gets the singleton instance of the registry
   * 
   * @returns The ValidationEngineRegistry instance
   */
  public static getInstance(): ValidationEngineRegistry {
    if (!ValidationEngineRegistry.instance) {
      ValidationEngineRegistry.instance = new ValidationEngineRegistry();
    }
    
    return ValidationEngineRegistry.instance;
  }
  
  /**
   * Registers a validation engine with the registry
   * 
   * @param key The key to register the engine under
   * @param engine The validation engine to register
   * @returns This registry for method chaining
   */
  public register(key: string, engine: IValidationEngine): ValidationEngineRegistry {
    this.engines.set(key, engine);
    return this;
  }
  
  /**
   * Gets a validation engine by key
   * 
   * @param key The key to get the engine for
   * @returns The validation engine or undefined if not found
   */
  public get(key: string): IValidationEngine | undefined {
    return this.engines.get(key);
  }
  
  /**
   * Gets the default validation engine
   * 
   * @returns The default validation engine
   */
  public getDefault(): IValidationEngine {
    const defaultEngine = this.engines.get(this.defaultEngineKey);
    
    if (!defaultEngine) {
      // If default engine doesn't exist, create it
      const engine = ValidationEngineFactory.createDefault();
      this.register(this.defaultEngineKey, engine);
      return engine;
    }
    
    return defaultEngine;
  }
  
  /**
   * Sets the default engine key
   * 
   * @param key The key of the engine to use as default
   * @returns This registry for method chaining
   */
  public setDefaultKey(key: string): ValidationEngineRegistry {
    if (!this.engines.has(key)) {
      throw new Error(`No engine registered for key: ${key}`);
    }
    
    this.defaultEngineKey = key;
    return this;
  }
  
  /**
   * Creates and registers an engine for a specific domain
   * 
   * @param domain The domain to create an engine for
   * @param key Optional key to register the engine under (defaults to domain)
   * @returns The created validation engine
   */
  public createForDomain(domain: string, key?: string): IValidationEngine {
    const engineKey = key || domain;
    let engine: IValidationEngine;
    
    switch (domain.toLowerCase()) {
      case 'html':
        engine = ValidationEngineFactory.createForHTML();
        break;
      case 'css':
        engine = ValidationEngineFactory.createForCSS();
        break;
      case 'javascript':
      case 'js':
        engine = ValidationEngineFactory.createForJS();
        break;
      case 'typescript':
      case 'ts':
        engine = ValidationEngineFactory.createForTS();
        break;
      case 'debug':
      case 'debugging':
        engine = ValidationEngineFactory.createForDebugging();
        break;
      default:
        engine = ValidationEngineFactory.createDefault();
    }
    
    this.register(engineKey, engine);
    return engine;
  }
  
  /**
   * Gets all registered engines
   * 
   * @returns Map of keys to engines
   */
  public getAllEngines(): Map<string, IValidationEngine> {
    return new Map(this.engines);
  }
  
  /**
   * Gets all registered engine keys
   * 
   * @returns Array of engine keys
   */
  public getEngineKeys(): string[] {
    return Array.from(this.engines.keys());
  }
  
  /**
   * Removes an engine from the registry
   * 
   * @param key The key of the engine to remove
   * @returns This registry for method chaining
   */
  public remove(key: string): ValidationEngineRegistry {
    if (key === this.defaultEngineKey) {
      throw new Error('Cannot remove the default engine');
    }
    
    this.engines.delete(key);
    return this;
  }
  
  /**
   * Clears all engines from the registry except the default
   * 
   * @returns This registry for method chaining
   */
  public clear(): ValidationEngineRegistry {
    const defaultEngine = this.engines.get(this.defaultEngineKey);
    this.engines.clear();
    
    if (defaultEngine) {
      this.engines.set(this.defaultEngineKey, defaultEngine);
    }
    
    return this;
  }
  
  /**
   * Initializes the default engine
   * 
   * @public
   */
  public initializeDefaultEngine(): void {
    const defaultEngine = ValidationEngineFactory.createDefault();
    this.register(this.defaultEngineKey, defaultEngine);
  }
}