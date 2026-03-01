import { DOPAdapter } from "./DOPAdapter";

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