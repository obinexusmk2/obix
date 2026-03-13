/**
 * OBIX Forms - Validation, autocomplete, progressive enhancement
 * Comprehensive form management with advanced validation
 */

/**
 * Validation rule definition
 */
export interface ValidationRule {
  name: string;
  validate: (value: unknown) => boolean | Promise<boolean>;
  message: string;
}

/**
 * Autocomplete data types
 */
export type AutocompleteType =
  | "off"
  | "on"
  | "name"
  | "email"
  | "tel"
  | "url"
  | "street-address"
  | "postal-code"
  | "cc-name"
  | "cc-number"
  | "cc-exp"
  | "cc-csc";

/**
 * Field definition
 */
export interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  validationRules: ValidationRule[];
  autocomplete?: AutocompleteType;
  initialValue?: unknown;
  metadata?: Record<string, unknown>;
}

/**
 * Progressive enhancement strategy
 */
export interface ProgressiveEnhancement {
  noJsBaseline: boolean;
  gracefulDegradation: boolean;
  lazyValidation: boolean;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

/**
 * Form configuration
 */
export interface FormConfig {
  fields: FieldDefinition[];
  progressiveEnhancement?: ProgressiveEnhancement;
  submitHandler?: (data: Record<string, unknown>) => Promise<void>;
}

/**
 * Form engine interface
 */
export interface FormEngine {
  validate(data: Record<string, unknown>): Promise<ValidationResult>;
  getField(name: string): FieldDefinition | undefined;
  submit(data: Record<string, unknown>): Promise<void>;
  enableAutocomplete(fieldName: string, type: AutocompleteType): void;
  setValidationTiming(timing: "onChange" | "onBlur" | "onSubmit"): void;
}

/**
 * Create a form engine instance
 */
export function createFormEngine(config: FormConfig): FormEngine {
  return {
    validate(data: Record<string, unknown>): Promise<ValidationResult> {
      throw new Error("Not yet implemented");
    },
    getField(name: string): FieldDefinition | undefined {
      throw new Error("Not yet implemented");
    },
    submit(data: Record<string, unknown>): Promise<void> {
      throw new Error("Not yet implemented");
    },
    enableAutocomplete(fieldName: string, type: AutocompleteType): void {
      throw new Error("Not yet implemented");
    },
    setValidationTiming(timing: "onChange" | "onBlur" | "onSubmit"): void {
      throw new Error("Not yet implemented");
    }
  };
}

