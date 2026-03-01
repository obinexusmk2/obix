/**
 * Mock Data Model Factory
 * 
 * Creates mock data model implementations for testing DOP adapters.
 * 
 * @module tests/utils/dop/mockDataModel
 */

/**
 * Creates a mock data model for testing
 * 
 * @param {Object} initialData - Initial data for the model
 * @param {Object} options - Additional configuration options
 * @returns {Object} A mock data model implementation
 */
function createMockDataModel(initialData = {}, options = {}) {
    // Internal data storage
    let data = { ...initialData };
    let version = 0;
    
    // Create the mock data model
    const mockDataModel = {
      // Basic data operations
      getData: jest.fn(() => ({ ...data })),
      setData: jest.fn((newData) => {
        data = { ...newData };
        version++;
        return mockDataModel;
      }),
      updateData: jest.fn((partialData) => {
        data = { ...data, ...partialData };
        version++;
        return mockDataModel;
      }),
      resetData: jest.fn(() => {
        data = { ...initialData };
        version = 0;
        return mockDataModel;
      }),
      
      // Utility methods
      getVersion: jest.fn(() => version),
      clone: jest.fn(() => createMockDataModel(data, options)),
      toObject: jest.fn(() => ({
        data: { ...data },
        version,
        ...options.additionalMetadata
      })),
      
      // State machine compatibility
      getMinimizationSignature: jest.fn(() => JSON.stringify({
        type: 'DataModel',
        data: { ...data },
        version
      })),
      
      // Validation methods if enabled
      validate: options.withValidation ? jest.fn(() => ({
        isValid: options.validationResult?.isValid !== false,
        errors: options.validationResult?.errors || [],
        warnings: options.validationResult?.warnings || []
      })) : undefined,
      
      // Custom methods
      ...(options.customMethods || {})
    };
    
    return mockDataModel;
  }
  
  module.exports = createMockDataModel;