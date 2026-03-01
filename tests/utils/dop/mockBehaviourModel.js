/**
 * Mock Behavior Model Factory
 * 
 * Creates mock behavior model implementations for testing DOP adapters.
 * 
 * @module tests/utils/dop/mockBehaviorModel
 */

/**
 * Creates a mock behavior model for testing
 * 
 * @param {Object} transitions - Transition functions keyed by transition name
 * @param {Object} options - Additional configuration options
 * @returns {Object} A mock behavior model implementation
 */
function createMockBehaviorModel(transitions = {}, options = {}) {
    // Default transitions if none provided
    const defaultTransitions = {
      increment: (state) => ({ count: (state.count || 0) + 1 }),
      decrement: (state) => ({ count: (state.count || 0) - 1 }),
      reset: () => ({ count: 0 })
    };
    
    // Combine provided transitions with defaults
    const allTransitions = {
      ...defaultTransitions,
      ...transitions
    };
    
    // Execution history for testing and verification
    const executionHistory = [];
    
    // Create the mock behavior model
    const mockBehaviorModel = {
      // Basic behavior operations
      getTransitions: jest.fn(() => ({ ...allTransitions })),
      executeTransition: jest.fn((transitionName, state) => {
        if (typeof allTransitions[transitionName] !== 'function') {
          throw new Error(`Transition '${transitionName}' not found`);
        }
        
        const result = allTransitions[transitionName](state);
        
        // Record execution for history
        executionHistory.push({
          transition: transitionName,
          inputState: { ...state },
          outputState: { ...result }
        });
        
        return result;
      }),
      
      // Chain execution support
      executeTransitionChain: jest.fn((transitionChain, initialState) => {
        let currentState = { ...initialState };
        
        // Execute each transition in the chain
        const results = transitionChain.map(transitionName => {
          currentState = mockBehaviorModel.executeTransition(transitionName, currentState);
          return { 
            transition: transitionName,
            state: { ...currentState }
          };
        });
        
        return {
          finalState: currentState,
          steps: results
        };
      }),
      
      // History and debugging utilities
      getExecutionHistory: jest.fn(() => [...executionHistory]),
      clearExecutionHistory: jest.fn(() => {
        executionHistory.length = 0;
        return mockBehaviorModel;
      }),
      
      // State machine compatibility
      getMinimizationSignature: jest.fn(() => JSON.stringify({
        type: 'BehaviorModel',
        transitions: Object.keys(allTransitions),
        ...options.signatureData
      })),
      
      // Instance methods
      clone: jest.fn(() => createMockBehaviorModel(allTransitions, options)),
      toObject: jest.fn(() => ({
        transitions: Object.keys(allTransitions),
        executionCount: executionHistory.length,
        ...options.additionalMetadata
      })),
      
      // Validation support if enabled
      validate: options.withValidation ? jest.fn(() => ({
        isValid: options.validationResult?.isValid !== false,
        errors: options.validationResult?.errors || [],
        warnings: options.validationResult?.warnings || []
      })) : undefined,
      
      // Custom methods
      ...(options.customMethods || {})
    };
    
    return mockBehaviorModel;
  }
  
  module.exports = createMockBehaviorModel;