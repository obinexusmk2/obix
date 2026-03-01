/**
 * Create a validation error
 * @param code Error code
 * @param message Error message
 * @param path Optional property path
 * @param details Optional error details
 * @param severity Error severity (default: ERROR)
 * @returns Validation error object
 */
export function createValidationError(
  code: ValidationErrorCode | string,
  message: string,
  path?: string,
  details?: any,
  severity: ValidationSeverity = ValidationSeverity.ERROR
): ValidationError {
  return {
    code,
    message,
    path,
    severity,
    details
  };
}

/**
 * Create a validation warning
 * @param code Warning code
 * @param message Warning message
 * @param path Optional property path
 * @param details Optional warning details
 * @returns Validation warning object
 */
export function createValidationWarning(
  code: string,
  message: string,
  path?: string,
  details?: any
): ValidationWarning {
  return {
    code,
    message,
    path,
    details
  };
}

/**
 * Create a successful validation result
 * @param warnings Optional warnings
 * @param metadata Optional metadata
 * @returns Validation result object
 */
export function createSuccessValidationResult(
  warnings: ValidationWarning[] = [],
  metadata?: Record<string, any>
): ValidationResult {
  return {
    isValid: true,
    errors: [],
    warnings,
    metadata
  };
}

/**
 * Create a failed validation result
 * @param errors Validation errors
 * @param warnings Optional warnings
 * @param metadata Optional metadata
 * @returns Validation result object
 */
export function createFailedValidationResult(
  errors: ValidationError[],
  warnings: ValidationWarning[] = [],
  metadata?: Record<string, any>
): ValidationResult {
  return {
    isValid: false,
    errors,
    warnings,
    metadata
  };
}

/**
 * Merge multiple validation results
 * @param results Validation results to merge
 * @returns Merged validation result
 */
export function mergeValidationResults(...results: ValidationResult[]): ValidationResult {
  // Check if any results are invalid
  const isValid = results.every(result => result.isValid);
  
  // Merge errors and warnings
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  for (const result of results) {
    if (result.errors) {
      errors.push(...result.errors);
    }
    
    if (result.warnings) {
      warnings.push(...result.warnings);
    }
  }
  
  // Merge metadata
  const metadata: Record<string, any> = {};
  
  for (const result of results) {
    if (result.metadata) {
      Object.assign(metadata, result.metadata);
    }
  }
  
  return {
    isValid,
    errors,
    warnings,
    metadata
  };
}