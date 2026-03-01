import { DOPAdapter } from '../../../src/core/dop/index.js';
import { ErrorSeverity, ErrorCode } from '../../../src/core/common/errors/error-types.js';
import { BaseParserError } from '../../../src/core/common/errors/error-factory.js';
import { ValidationResult } from '../../../src/core/parser/validation/index.js';

// Create a mock BaseParserError if the actual one doesn't exist yet
class MockBaseParserError {
  code: any;
  message: string;
  position: any;
  context?: string;
  severity: any;
  metadata: Record<string, any>;

  constructor(options: any) {
    this.code = options.code;
    this.message = options.message;
    this.position = options.position;
    this.context = options.context;
    this.severity = options.severity;
    this.metadata = options.metadata || {};
  }
}

// Use either the actual or mock error class
const ErrorClass = BaseParserError || MockBaseParserError;

// Define mock enum values if they don't exist
const ErrorSeverityValues = ErrorSeverity || {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  CRITICAL: 'critical'
};

const ErrorCodeValues = ErrorCode || {
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

describe('DOP Adapter with Validation Integration', () => {
  // Test functional component validation
  describe('Functional Component Validation', () => {
    it('should validate component state correctly', () => {
      // Create a functional component with validation
      const counter = DOPAdapter.createFromFunctional({
        initialState: { count: 0 },
        transitions: {
          increment: (state: any) => ({ count: state.count + 1 }),
          decrement: (state: any) => ({ count: state.count - 1 })
        },
        validation: [
          // Custom validation rule
          {
            id: 'count_range',
            description: 'Ensures count stays within valid range',
            severity: ErrorSeverityValues.ERROR,
            validate: (state: any): ValidationResult => {
              const isValid = state.count >= 0 && state.count <= 100;
              return {
                isValid,
                errors: isValid ? [] : [
                  new ErrorClass({
                    code: ErrorCodeValues.VALIDATION_ERROR,
                    message: 'Count must be between 0 and 100',
                    position: { line: 0, column: 0, start: 0, end: 0 },
                    severity: ErrorSeverityValues.ERROR
                  })
                ],
                warnings: [],
                metadata: { propertyName: 'count' }
              };
            }
          }
        ]
      });
      
      // Validate initial state
      let result = counter.validate();
      expect(result.isValid).toBe(true);
      
      // Increment to valid state
      counter.trigger('increment');
      result = counter.validate();
      expect(result.isValid).toBe(true);
      
      // Set to invalid state
      counter.setState({ count: 101 });
      result = counter.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].message).toContain('between 0 and 100');
    });
  });
});
