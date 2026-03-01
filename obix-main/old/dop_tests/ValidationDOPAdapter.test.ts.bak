


// Mock ValidationRule implementation for testing
const mockValidationRule: ValidationRule = {
    id: 'test-rule',
    severity: 1,
    validate: (data: any) => ({ isValid: true, errors: [] })
};

const mockInvalidRule: ValidationRule = {
  id: 'invalid-rule',
  severity: 2,
  validate: (data: any) => ({ isValid: false, errors: ['Invalid data'] })
};

// Mock ValidationStateMachine implementation
jest.mock('../../../src/core/dop/validation/ValidationStateMachine', () => {
  return {
    ValidationStateMachine: jest.fn().mockImplementation(() => {
      return {
        reset: jest.fn(),
        transition: jest.fn(),
        minimize: jest.fn(),
        handleErrorInState: jest.fn(),
        clone: jest.fn().mockReturnThis()
      };
    })
  };
});

// Mock ExecutionTrace
jest.mock('../../../src/validation/errors/ExecutionTrace', () => {
  return {
    ExecutionTrace: {
      start: jest.fn().mockImplementation((id, data) => ({
        id,
        startTime: Date.now(),
        data,
        end: jest.fn().mockImplementation((endData) => {
          return {
            id,
            startTime: Date.now() - 100,
            endTime: Date.now(),
            data,
            endData
          };
        })
      }))
    }
  };
});

describe('ValidationDOPAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      
      expect(adapter.getDataModel()).toBe(dataModel);
      expect(adapter.getBehaviorModel()).toBe(behaviorModel);
      expect(adapter.isValidating()).toBe(false);
      expect(adapter.isTracingEnabled()).toBe(false);
    });
    
    it('should adapt and validate data model', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      const result = adapter.adapt(dataModel);
      
      expect(result.isValid).toBe(true);
      expect(adapter.isValidating()).toBe(false); // Should reset after validation
    });
    
    it('should register validation rules', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 });
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      adapter.registerRule(mockValidationRule);
      
      // Verify the rule was added to the data model
      expect(adapter.getDataModel().getRules()).toContainEqual(mockValidationRule);
    });
    
    it('should handle invalid validation rules', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockInvalidRule]);
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      const result = adapter.adapt(dataModel);
      
      expect(result.isValid).toBe(false);
    });
  });
  
  describe('Tracing', () => {
    it('should enable and disable tracing', () => {
      const adapter = new ValidationDOPAdapter();
      
      expect(adapter.isTracingEnabled()).toBe(false);
      
      adapter.setTracingEnabled(true);
      expect(adapter.isTracingEnabled()).toBe(true);
      
      adapter.setTracingEnabled(false);
      expect(adapter.isTracingEnabled()).toBe(false);
    });
    
    it('should add traces when tracing is enabled', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel, true);
      const result = adapter.adapt(dataModel);
      
      // Verify that ExecutionTrace.start was called
      expect(ExecutionTrace.start).toHaveBeenCalledWith('validation-adapter', expect.any(Object));
    });
  });
  
  describe('State Machine Minimization', () => {
    it('should minimize state machine when enabled', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const stateMachine = new ValidationStateMachine();
      const behaviorModel = new ValidationBehaviorModelImpl(stateMachine, 'test', 'test', true);
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      adapter.adapt(dataModel);
      
      // Verify that minimize was called on the state machine
      expect(stateMachine.minimize).toHaveBeenCalled();
    });
    
    it('should not minimize state machine when disabled', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const stateMachine = new ValidationStateMachine();
      const behaviorModel = new ValidationBehaviorModelImpl(stateMachine, 'test', 'test', false);
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      adapter.adapt(dataModel);
      
      // Verify that minimize was not called on the state machine
      expect(stateMachine.minimize).not.toHaveBeenCalled();
    });
  });
  
  describe('Factory Methods', () => {
    it('should create functional adapter', () => {
      const adapter = ValidationDOPAdapter.createFunctional([mockValidationRule], true, true);
      
      expect(adapter).toBeInstanceOf(ValidationDOPAdapter);
      expect(adapter.getDataModel().getRules()).toContainEqual(mockValidationRule);
      expect(adapter.getBehaviorModel()).toBeInstanceOf(ValidationBehaviorModelImpl);
      expect(adapter.isTracingEnabled()).toBe(true);
    });
    
    it('should create OOP adapter', () => {
      const adapter = ValidationDOPAdapter.createOOP([mockValidationRule], true, true);
      
      expect(adapter).toBeInstanceOf(ValidationDOPAdapter);
      expect(adapter.getDataModel().getRules()).toContainEqual(mockValidationRule);
      expect(adapter.getBehaviorModel()).toBeInstanceOf(ValidationBehaviorModelImpl);
      expect(adapter.isTracingEnabled()).toBe(true);
    });
  });
  
  describe('ValidationDOPAdapterFactory', () => {
    it('should create functional adapter', () => {
      const adapter = ValidationDOPAdapterFactory.createFunctional([mockValidationRule], true, true);
      
      expect(adapter).toBeInstanceOf(DOPAdapter);
    });
    
    it('should create OOP adapter', () => {
      const adapter = ValidationDOPAdapterFactory.createOOP([mockValidationRule], true, true);
      
      expect(adapter).toBeInstanceOf(DOPAdapter);
    });
    
    it('should create dual paradigm factory', () => {
      const factory = ValidationDOPAdapterFactory.createFactory();
      
      expect(factory).toBeInstanceOf(DualParadigmValidationAdapterFactory);
    });
  });
  
  describe('DualParadigmValidationAdapterFactory', () => {
    it('should create adapter from functional config', () => {
      const factory = new DualParadigmValidationAdapterFactory();
      const config = {
        rules: [mockValidationRule],
        minimizationEnabled: true,
        tracingEnabled: true
      };
      
      const adapter = factory.createFromFunctional(config);
      
      expect(adapter).toBeInstanceOf(DOPAdapter);
      expect(adapter.getDataModel().getRules()).toContainEqual(mockValidationRule);
    });
    
    it('should create adapter from OOP component', () => {
      const factory = new DualParadigmValidationAdapterFactory();
      const component = {
        rules: [mockValidationRule],
        minimizationEnabled: true,
        tracingEnabled: true
      };
      
      const adapter = factory.createFromOOP(component);
      
      expect(adapter).toBeInstanceOf(DOPAdapter);
      expect(adapter.getDataModel().getRules()).toContainEqual(mockValidationRule);
    });
  });
  
  describe('Comparison', () => {
    it('should compare with another validation result', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      const otherResult = new ValidationResult<ValidationDataModelImpl>(true, dataModel);
      
      const comparisonResult = adapter.compareWith(otherResult);
      
      expect(comparisonResult.equivalent).toBe(true);
    });
    
    it('should detect mismatches between validation results', () => {
      const dataModel = new ValidationDataModelImpl({ value: 10 }, [mockValidationRule]);
      const behaviorModel = new ValidationBehaviorModelImpl();
      
      const adapter = new ValidationDOPAdapter(dataModel, behaviorModel);
      adapter.isValid = false; // Manually set to create mismatch
      
      const otherResult = new ValidationResult<ValidationDataModelImpl>(true, dataModel);
      
      const comparisonResult = adapter.compareWith(otherResult);
      
      expect(comparisonResult.equivalent).toBe(false);
      expect(comparisonResult.mismatches.length).toBeGreaterThan(0);
      expect(comparisonResult.mismatches[0].path).toBe('isValid');
    });
  });
});