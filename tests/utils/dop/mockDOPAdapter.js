/**
 * Mock DOP Adapter Factory
 * 
 * Creates mock DOP adapter implementations for testing adapter functionality.
 * 
 * @module tests/utils/dop/mockDOPAdapter
 */

/**
 * Creates a mock DOP adapter for testing
 * 
 * @param {Object} config - Configuration for the adapter
 * @param {Object} options - Additional configuration options
 * @returns {Object} A mock DOP adapter implementation
 */
function createMockDOPAdapter(config = {}, options = {}) {
    // Default configuration
    const defaultConfig = {
      functional: {
        initialState: { count: 0 },
        transitions: {
          increment: (state) => ({ count: state.count + 1 }),
          decrement: (state) => ({ count: state.count - 1 }),
          reset: () => ({ count: 0 })
        }
      },
      oop: {
        initialState: { count: 0 },
        increment(state) { return { count: state.count + 1 }; },
        decrement(state) { return { count: state.count - 1 }; },
        reset() { return { count: 0 }; }
      }
    };
    
    // Combine provided config with defaults
    const adapterConfig = {
      functional: { ...defaultConfig.functional, ...config.functional },
      oop: { ...defaultConfig.oop, ...config.oop }
    };
    
    // Track current state for testing
    let currentState = { ...adapterConfig.functional.initialState };
    
    // Execution history for verification
    const executionHistory = [];
    
    // Implementation comparison results
    const comparisonResult = options.comparisonResult || {
      equivalent: true,
      differences: [],
      traces: []
    };
    
    // Create the mock adapter
    const mockAdapter = {
      // Configuration access
      getConfig: jest.fn(() => ({ ...adapterConfig })),
      getFunctionalConfig: jest.fn(() => ({ ...adapterConfig.functional })),
      getOOPConfig: jest.fn(() => ({ ...adapterConfig.oop })),
      
      // Adaptation methods
      adapt: jest.fn((dataModel) => {
        // If dataModel provided, use its data as current state
        if (dataModel && typeof dataModel.getData === 'function') {
          currentState = { ...dataModel.getData() };
        }
        
        return {
          initialState: { ...currentState },
          transitions: Object.keys(adapterConfig.functional.transitions)
        };
      }),
      
      // State management
      getState: jest.fn(() => ({ ...currentState })),
      setState: jest.fn((newState) => {
        currentState = { ...newState };
        return mockAdapter;
      }),
      resetState: jest.fn(() => {
        currentState = { ...adapterConfig.functional.initialState };
        return mockAdapter;
      }),
      
      // Transition execution
      executeTransition: jest.fn((transitionName, state = currentState) => {
        const inputState = { ...state };
        
        // Execute transition based on mode
        let result;
        if (options.executionMode === 'oop' && 
            typeof adapterConfig.oop[transitionName] === 'function') {
          result = adapterConfig.oop[transitionName](inputState);
        } else if (typeof adapterConfig.functional.transitions[transitionName] === 'function') {
          result = adapterConfig.functional.transitions[transitionName](inputState);
        } else {
          throw new Error(`Transition '${transitionName}' not found`);
        }
        
        // Record execution
        executionHistory.push({
          transition: transitionName,
          inputState,
          outputState: { ...result }
        });
        
        // Update current state
        currentState = { ...result };
        
        return result;
      }),
      
      // Validation methods
      validate: jest.fn(() => ({
        isValid: options.validationResult?.isValid !== false,
        errors: options.validationResult?.errors || [],
        warnings: options.validationResult?.warnings || [],
        component: 'DOPAdapter',
        data: mockAdapter
      })),
      
      // Implementation comparison
      compareImplementations: jest.fn(() => comparisonResult),
      
      // History and debugging
      getExecutionHistory: jest.fn(() => [...executionHistory]),
      clearExecutionHistory: jest.fn(() => {
        executionHistory.length = 0;
        return mockAdapter;
      }),
      
      // State machine compatibility
      getMinimizationSignature: jest.fn(() => JSON.stringify({
        type: 'DOPAdapter',
        functional: Object.keys(adapterConfig.functional.transitions),
        oop: Object.keys(adapterConfig.oop).filter(k => typeof adapterConfig.oop[k] === 'function'),
        currentState
      })),
      
      // Instance methods
      clone: jest.fn(() => createMockDOPAdapter(adapterConfig, options)),
      toObject: jest.fn(() => ({
        config: adapterConfig,
        executionCount: executionHistory.length,
        currentState,
        ...options.additionalMetadata
      })),
      
      // Custom methods
      ...(options.customMethods || {})
    };
    
    return mockAdapter;
  }
  
  module.exports = createMockDOPAdapter;