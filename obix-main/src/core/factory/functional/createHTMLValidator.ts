import { HTMLValidationRule } from "@/core/validation/rules/HTMLValidationRule";
import { ValidationAdapter } from "@/core/dop/ValidationAdapter";

export function createHTMLValidator(rules: HTMLValidationRule[]) {
  return ValidationAdapter.createFromFunctional({
    rules,
    validateNode: (node: HTMLNode) => {
      // Custom validation logic here
      return {
        isValid: true,
        errors: [],
        warnings: [],
        metadata: {}
      };
    }
  });
}
