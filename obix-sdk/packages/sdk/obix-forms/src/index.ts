/**
 * OBIX Forms - Validation, autocomplete, progressive enhancement
 * Comprehensive form management with advanced validation
 */

export interface ValidationRule {
  name: string;
  validate: (value: unknown) => boolean | Promise<boolean>;
  message: string;
}

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

export interface FieldDefinition {
  name: string;
  type: string;
  required: boolean;
  validationRules: ValidationRule[];
  autocomplete?: AutocompleteType;
  initialValue?: unknown;
  metadata?: Record<string, unknown>;
}

export interface ProgressiveEnhancement {
  noJsBaseline: boolean;
  gracefulDegradation: boolean;
  lazyValidation: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings?: Record<string, string[]>;
}

export interface FormConfig {
  fields: FieldDefinition[];
  progressiveEnhancement?: ProgressiveEnhancement;
  submitHandler?: (data: Record<string, unknown>) => Promise<void>;
}

export type ValidationTiming = "onChange" | "onBlur" | "onSubmit";

export interface FormEngine {
  validate(data: Record<string, unknown>): Promise<ValidationResult>;
  getField(name: string): FieldDefinition | undefined;
  submit(data: Record<string, unknown>): Promise<void>;
  enableAutocomplete(fieldName: string, type: AutocompleteType): void;
  setValidationTiming(timing: ValidationTiming): void;
  getValidationTiming(): ValidationTiming;
  shouldValidateOn(event: "change" | "blur" | "submit"): boolean;
}

export function createFormEngine(config: FormConfig): FormEngine {
  const fields = new Map(config.fields.map((field) => [field.name, { ...field }]));
  let validationTiming: ValidationTiming = "onSubmit";

  return {
    async validate(data: Record<string, unknown>): Promise<ValidationResult> {
      const errors: Record<string, string[]> = {};
      const warnings: Record<string, string[]> = {};

      for (const field of fields.values()) {
        const value = data[field.name];

        if (field.required && (value === undefined || value === null || value === "")) {
          errors[field.name] = [...(errors[field.name] ?? []), "This field is required."];
        }

        for (const rule of field.validationRules) {
          const isValid = await rule.validate(value);
          if (!isValid) {
            errors[field.name] = [...(errors[field.name] ?? []), rule.message];
          }
        }

        if (field.required && !field.autocomplete) {
          warnings[field.name] = [...(warnings[field.name] ?? []), "Missing autocomplete attribute for required field."];
        }
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors,
        warnings
      };
    },
    getField(name: string): FieldDefinition | undefined {
      return fields.get(name);
    },
    async submit(data: Record<string, unknown>): Promise<void> {
      const result = await this.validate(data);
      if (!result.valid) {
        throw new Error("Form validation failed.");
      }

      await config.submitHandler?.(data);
    },
    enableAutocomplete(fieldName: string, type: AutocompleteType): void {
      const field = fields.get(fieldName);
      if (!field) {
        throw new Error(`Field '${fieldName}' not found.`);
      }

      field.autocomplete = type;
    },
    setValidationTiming(timing: ValidationTiming): void {
      validationTiming = timing;
    },
    getValidationTiming(): ValidationTiming {
      return validationTiming;
    },
    shouldValidateOn(event: "change" | "blur" | "submit"): boolean {
      if (validationTiming === "onChange") {
        return event === "change";
      }

      if (validationTiming === "onBlur") {
        return event === "blur";
      }

      return event === "submit";
    }
  };
}
