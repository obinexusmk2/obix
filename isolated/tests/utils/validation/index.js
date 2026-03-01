/**
 * Validation Testing Utilities
 * 
 * Provides utilities for testing the validation system in the OBIX framework.
 * 
 * @module tests/utils/validation
 */

const { createMockValidationResult, createMockValidationRule } = require('../mockFactory');

/**
 * Creates a mock validation engine for testing
 * 
 * @param {Object} options - Configuration options
 * @returns {Object} Mock validation engine
 */
function createMockValidationEngine(options = {}) {
  // Default validation result
  const defaultResult = createMockValidationResult(
    options.isValid !== false,
    options.errors || [],
    options.warnings || []
  );
  
  // Rule registry
  const ruleRegistry = new Map();
  
  // Track validation calls for testing
  const validationCalls = [];
  
  // Create the mock validation engine
  const engine = {
    // Rule management
    registerRule: jest.fn((rule) => {
      ruleRegistry.set(rule.id, rule);
      return engine;
    }),
    
    unregisterRule: jest.fn((ruleId) => {
      ruleRegistry.delete(ruleId);
      return engine;
    }),
    
    getRuleById: jest.fn((ruleId) => ruleRegistry.get(ruleId)),
    
    getAllRules: jest.fn(() => Array.from(ruleRegistry.values())),
    
    // Validation
    validate: jest.fn((data, ruleIds) => {
      // Track this validation call
      validationCalls.push({ data, ruleIds, timestamp: Date.now() });
      
      if (options.validateImpl) {
        return options.validateImpl(data, ruleIds);
      }
      
      // Default implementation returns the configured result
      return { ...defaultResult };
    }),
    
    validateWithRule: jest.fn((data, ruleId) => {
      const rule = ruleRegistry.get(ruleId);
      
      if (!rule) {
        return createMockValidationResult(false, [
          { code: 'RULE_NOT_FOUND', message: `Rule ${ruleId} not found` }
        ]);
      }
      
      return rule.validate(data);
    }),
    
    // History and debugging
    getValidationCalls: jest.fn(() => [...validationCalls]),
    
    // Engine configuration
    getConfiguration: jest.fn(() => ({
      strictMode: options.strictMode !== false,
      enableTracing: options.enableTracing !== false,
      maxRuleChainDepth: options.maxRuleChainDepth || 10,
      ...options.configuration
    })),
    
    // State machine compatibility
    minimize: jest.fn(() => ({
      originalStateCount: options.originalStateCount || 10,
      minimizedStateCount: options.minimizedStateCount || 5,
      optimizationRatio: options.optimizationRatio || 0.5
    })),
    
    // Custom methods
    ...(options.customMethods || {})
  };
  
  return engine;
}

/**
 * Creates a test validator function that simulates validation
 * 
 * @param {Function} validatorFn - Optional custom validator function
 * @returns {Function} Test validator function
 */
function createTestValidator(validatorFn) {
  return function testValidator(data, options = {}) {
    // Use custom validator if provided
    if (validatorFn) {
      return validatorFn(data, options);
    }
    
    // Default implementation performs basic type checking
    const errors = [];
    const warnings = [];
    
    // Check for null/undefined
    if (data === null || data === undefined) {
      errors.push({
        code: 'VALIDATION_NULL_DATA',
        message: 'Data cannot be null or undefined'
      });
      
      return createMockValidationResult(false, errors, warnings);
    }
    
    // Type checking
    if (options.expectedType && typeof data !== options.expectedType) {
      errors.push({
        code: 'VALIDATION_TYPE_ERROR',
        message: `Expected ${options.expectedType}, got ${typeof data}`
      });
    }
    
    // Object property validation
    if (typeof data === 'object' && options.requiredProperties) {
      for (const prop of options.requiredProperties) {
        if (!(prop in data)) {
          errors.push({
            code: 'VALIDATION_MISSING_PROPERTY',
            message: `Missing required property: ${prop}`
          });
        }
      }
    }
    
    // Value range validation for numbers
    if (typeof data === 'number' && options.range) {
      if (options.range.min !== undefined && data < options.range.min) {
        errors.push({
          code: 'VALIDATION_RANGE_ERROR',
          message: `Value ${data} below minimum ${options.range.min}`
        });
      }
      
      if (options.range.max !== undefined && data > options.range.max) {
        errors.push({
          code: 'VALIDATION_RANGE_ERROR',
          message: `Value ${data} above maximum ${options.range.max}`
        });
      }
    }
    
    // String validation
    if (typeof data === 'string' && options.pattern) {
      const regex = new RegExp(options.pattern);
      if (!regex.test(data)) {
        errors.push({
          code: 'VALIDATION_PATTERN_ERROR',
          message: `Value '${data}' does not match pattern ${options.pattern}`
        });
      }
    }
    
    return createMockValidationResult(errors.length === 0, errors, warnings);
  };
}

/**
 * Creates a predefined set of validation rules for testing
 * 
 * @returns {Array} Array of validation rule objects
 */
function createTestValidationRules() {
  return [
    // Type validation rule
    createMockValidationRule('type-validation', 1, true, {
      description: 'Validates data types',
      validate: (data) => {
        const errors = [];
        
        if (typeof data !== 'object' || data === null) {
          errors.push({
            code: 'TYPE_VALIDATION_ERROR',
            message: 'Data must be an object'
          });
        }
        
        return createMockValidationResult(errors.length === 0, errors);
      }
    }),
    
    // Required fields validation rule
    createMockValidationRule('required-fields', 1, true, {
      description: 'Validates required fields',
      validate: (data) => {
        const errors = [];
        
        if (typeof data !== 'object' || data === null) {
          errors.push({
            code: 'REQUIRED_FIELDS_TYPE_ERROR',
            message: 'Data must be an object'
          });
          return createMockValidationResult(false, errors);
        }
        
        const requiredFields = ['id', 'name'];
        
        for (const field of requiredFields) {
          if (!(field in data)) {
            errors.push({
              code: 'MISSING_REQUIRED_FIELD',
              message: `Missing required field: ${field}`
            });
          }
        }
        
        return createMockValidationResult(errors.length === 0, errors);
      }
    }),
    
    // Format validation rule
    createMockValidationRule('format-validation', 2, true, {
      description: 'Validates data format',
      validate: (data) => {
        const errors = [];
        const warnings = [];
        
        if (typeof data !== 'object' || data === null) {
          errors.push({
            code: 'FORMAT_VALIDATION_TYPE_ERROR',
            message: 'Data must be an object'
          });
          return createMockValidationResult(false, errors);
        }
        
        // Email validation
        if ('email' in data) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data.email)) {
            errors.push({
              code: 'INVALID_EMAIL_FORMAT',
              message: 'Invalid email format'
            });
          }
        }
        
        // Phone validation
        if ('phone' in data) {
          const phoneRegex = /^\+?[0-9]{10,15}$/;
          if (!phoneRegex.test(data.phone)) {
            warnings.push({
              code: 'INVALID_PHONE_FORMAT',
              message: 'Phone number format may be invalid'
            });
          }
        }
        
        return createMockValidationResult(errors.length === 0, errors, warnings);
      }
    })
  ];
}

module.exports = {
  createMockValidationEngine,
  createTestValidator,
  createTestValidationRules
};