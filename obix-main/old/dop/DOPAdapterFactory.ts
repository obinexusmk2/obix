import { DataModel } from "./BaseDataModel";
import { DOPAdapter } from "./DOPAdapter";


/**
 * Interface for creating adapters from OOP components
 */
export interface OOPAdapterFactory<T extends DataModel<T>, R> {
  /**
   * Creates an adapter from an OOP component
   * 
   * @param component The OOP component
   * @returns A DOP adapter
   */
  createFromOOP(component: any): DOPAdapter<T, R>;

  /**
   * Compares implementations from both paradigms
   * 
   * @param functionalConfig Functional configuration
   * @param oopComponent OOP component
   * @param testData Test data for comparison
   * @returns True if implementations are equivalent
   */
  compareImplementations(
    functionalConfig: Record<string, any>,
    oopComponent: any,
    testData: T
  ): boolean;
  
}

/**
 * Factory for creating DOP adapters with both paradigms
 * 
 * @template T The data model type
 * @template R The result type
 */
export abstract class DualParadigmAdapterFactory<T extends DataModel<T>, R> 
  implements FunctionalAdapterFactory<T, R>, OOPAdapterFactory<T, R> {
  
  /**
   * Creates an adapter from a functional component
   * 
   * @param config The functional configuration
   * @returns A DOP adapter
   */
  public abstract createFromFunctional(config: Record<string, any>): DOPAdapter<T, R>;
  
  /**
   * Creates an adapter from an OOP component
   * 
   * @param component The OOP component
   * @returns A DOP adapter
   */
  public abstract createFromOOP(component: any): DOPAdapter<T, R>;
  
  /**
   * Compares implementations from both paradigms
   * 
   * @param functionalConfig Functional configuration
   * @param oopComponent OOP component
   * @param testData Test data for comparison
   * @returns True if implementations are equivalent
   */
  public compareImplementations(
    functionalConfig: Record<string, any>,
    oopComponent: any,
    testData: T
  ): boolean {
    const functionalAdapter = this.createFromFunctional(functionalConfig);
    const oopAdapter = this.createFromOOP(oopComponent);
    
    // Apply behaviors to the test data
    const functionalResult = functionalAdapter.adapt(testData);
    const oopResult = oopAdapter.adapt(testData);
    
    // Compare results - this is a simplistic equality check
    // For complex cases, implement a proper comparison logic
    return JSON.stringify(functionalResult) === JSON.stringify(oopResult);
  }
}