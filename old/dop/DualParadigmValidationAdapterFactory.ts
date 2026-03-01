import { DualParadigmAdapterFactory, DOPAdapter } from "./DOPAdapter";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";
import { ValidationDOPAdapter } from "./ValidationDataModelImpl";
import { ValidationResult } from "./ValidationResult";

/**
 * Dual-paradigm factory for validation DOP adapters
 */
export class DualParadigmValidationAdapterFactory extends DualParadigmAdapterFactory<
  ValidationDataModelImpl,
  ValidationResult<ValidationDataModelImpl>
> {
  /**
   * Creates an adapter from a functional configuration
   * 
   * @param config The functional configuration
   * @returns A validation DOP adapter
   */
  public override createFromFunctional(config: Record<string, any>): DOPAdapter<
    ValidationDataModelImpl,
    ValidationResult<ValidationDataModelImpl>
  > {
    // Extract configuration
    const rules = config['rules'] || [];
    const minimizationEnabled = config['minimizationEnabled'] !== false;
    const tracingEnabled = config['tracingEnabled'] === true;
    
    return ValidationDOPAdapter.createFunctional(rules, minimizationEnabled, tracingEnabled);
  }
  
  /**
   * Creates an adapter from an OOP component
   * 
   * @param component The OOP component
   * @returns A validation DOP adapter
   */
  public override createFromOOP(component: any): DOPAdapter<
    ValidationDataModelImpl,
    ValidationResult<ValidationDataModelImpl>
  > {
    // Extract configuration from the component
    const rules = component.rules || [];
    const minimizationEnabled = component.minimizationEnabled !== false;
    const tracingEnabled = component.tracingEnabled === true;
    
    return ValidationDOPAdapter.createOOP(rules, minimizationEnabled, tracingEnabled);
  }
}