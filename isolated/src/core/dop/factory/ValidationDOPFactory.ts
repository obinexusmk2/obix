import { ValidationRule } from "../validation/rules/ValidationRule";
import { DOPAdapter } from "./DOPAdapter";
import { DualParadigmValidationAdapterFactory } from "./DualParadigmValidationAdapterFactory";
import { ValidationDataModelImpl } from "./ValidatationDataModelImpl";
import { ValidationDOPAdapter } from "./ValidationDOPAdapter";
import { ValidationResult } from "./ValidationResult";


/**
 * Factory for creating validation DOP adapters
 */
export class ValidationDOPAdapterFactory {
    /**
     * Creates a validation DOP adapter for functional programming
     * 
     * @param rules Initial validation rules
     * @param minimizationEnabled Whether to enable state minimization
     * @param tracingEnabled Whether to enable tracing
     * @returns A new ValidationDOPAdapter instance
     */
    public static createFunctional(
      rules: ValidationRule[] = [],
      minimizationEnabled: boolean = true,
      tracingEnabled: boolean = false
    ): DOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>> {
      return ValidationDOPAdapter.createFunctional(rules, minimizationEnabled, tracingEnabled) as unknown as DOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>>;
    }
    
    /**
     * Creates a validation DOP adapter for OOP
     * 
     * @param rules Initial validation rules
     * @param minimizationEnabled Whether to enable state minimization
     * @param tracingEnabled Whether to enable tracing
     * @returns A new ValidationDOPAdapter instance
     */
    public static createOOP(
      rules: ValidationRule[] = [],
      minimizationEnabled: boolean = true,
      tracingEnabled: boolean = false
    ): DOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>> {
      return ValidationDOPAdapter.createOOP(rules, minimizationEnabled, tracingEnabled) as unknown as DOPAdapter<ValidationDataModelImpl, ValidationResult<ValidationDataModelImpl>>;
    }
    
    /**
     * Creates a validation DOP adapter factory that can create adapters for both paradigms
     * 
     * @returns A new DualParadigmAdapterFactory instance
     */
    public static createFactory(): DualParadigmValidationAdapterFactory {
      return new DualParadigmValidationAdapterFactory();
    }
  }
  