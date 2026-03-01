import { BehaviorModel } from "@core/dop/common/BehaviourModel";
import { TestDataModel } from "./DataModel.test";
import { TestBehaviorModel } from "./BehaviorModel.test";
import { TimedDOPAdapter } from "@core/dop/common/TimedDOPAdapter";
import { ImplementationDifference, ImplementationComparisonResult } from "@core/dop/common/ImplementationComparisonResult";
import { ErrorSeverity } from "@core/validation/errors/ErrorHandler";


describe('TimedDOPAdapter', () => {
  // Mock performance.now() for consistent timing tests
  let originalPerformanceNow: any;
  let mockTimeCounter = 0;
  
  beforeEach(() => {
    originalPerformanceNow = performance.now;
    mockTimeCounter = 0;
    
    performance.now = jest.fn().mockImplementation(() => {
      mockTimeCounter += 50; // Increment by 50ms each call
      return mockTimeCounter;
    });
  });
  
  afterEach(() => {
    performance.now = originalPerformanceNow;
  });
  
  describe('Basic Functionality', () => {
    it('should initialize correctly', () => {
      const dataModel = new TestDataModel({ value: 10 });
      const behaviorModel = new TestBehaviorModel();
      
      const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
      
      expect(adapter.getDataModel()).toBe(dataModel);
      expect(adapter.getBehaviorModel()).toBe(behaviorModel);
      expect(adapter.getProcessingTime()).toBe(0); // Initial processing time should be 0
    });
    
    it('should adapt data model and track processing time', () => {
      const dataModel = new TestDataModel({ value: 10 });
      const behaviorModel = new TestBehaviorModel();
      
      const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
      const result = adapter.adapt(dataModel);
      
      expect(result.toObject()).toEqual({
        value: 10,
        processed: true
      });
      
      // With our mock implementation, processing time should be 50ms
      // (difference between two consecutive calls to performance.now)
      expect(adapter.getProcessingTime()).toBe(50);
    });
  });
  
  describe('Performance Tracking', () => {
    it('should accurately measure processing time', () => {
      // Create a behavior model with simulated processing time
      const dataModel = new TestDataModel({ value: 10 });
      
      // Use jest spies to verify timing behavior
      const startTimeSpy = jest.spyOn(performance, 'now');
      
      const adapter = new TimedDOPAdapter(dataModel, new TestBehaviorModel());
      adapter.adapt(dataModel);
      
      // Verify performance.now was called exactly twice (start and end timing)
      expect(startTimeSpy).toHaveBeenCalledTimes(2);
      expect(adapter.getProcessingTime()).toBe(50); // Mock increases by 50 each call
    });
    
    it('should update processing time for each operation', () => {
      const dataModel = new TestDataModel({ value: 10 });
      const behaviorModel = new TestBehaviorModel();
      
      const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
      
      // First operation
      adapter.adapt(dataModel);
      const firstTime = adapter.getProcessingTime();
      
      // Second operation
      adapter.adapt(dataModel.withData('newValue', 20));
      const secondTime = adapter.getProcessingTime();
      
      // Times should be different and second time should not include first time
      expect(secondTime).not.toBe(firstTime);
      expect(secondTime).toBe(50); // Each call to adapt resets and measures new time
    });
  });
  
  describe('Integration with BaseDOPAdapter', () => {
    it('should extend BaseDOPAdapter functionality', () => {
      const dataModel = new TestDataModel({ value: 10 });
      const behaviorModel = new TestBehaviorModel();
      
      const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
      
      // Should have access to base class methods
      expect(adapter.getDataModel()).toBe(dataModel);
      expect(adapter.getBehaviorModel()).toBe(behaviorModel);
      
      // Should have access to validate method from base class
      const validationResult = adapter.validate();
      expect(validationResult.isValid).toBe(true);
    });
  });
  
  describe('Real-world Scenarios', () => {
    it('should measure processing time for complex operations', () => {
      // Create a behavior model with longer processing time
      const dataModel = new TestDataModel({ 
        value: 10,
        complexData: Array(100).fill(0).map((_, i) => ({ id: i, value: `value-${i}` }))
      });
      const behaviorModel = new TestBehaviorModel('complex', 'Complex behavior');
      
      // Mock the process method to simulate variable processing time
      const processSpy = jest.spyOn(behaviorModel, 'process').mockImplementation((data) => {
        // Simulate processing that takes time proportional to data complexity
        const complexity = data.toObject().complexData?.length || 1;
        
        // Make performance.now advance by a variable amount based on complexity
        mockTimeCounter += complexity;
        
        return data.withData('processed', true);
      });
      
      const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
      adapter.adapt(dataModel);
      
      // Verify process was called
      expect(processSpy).toHaveBeenCalledTimes(1);
      
      // With our mock implementation, processing time should reflect the
      // variable processing time (base 50ms + complexity-based increase)
      expect(adapter.getProcessingTime()).toBeGreaterThan(0);
      
      // Clean up
      processSpy.mockRestore();
    });
    
    it('should maintain accurate timing across multiple operations', () => {
      const dataModel = new TestDataModel({ value: 10 });
      const behaviorModel = new TestBehaviorModel();
      
      const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
      
      // Perform multiple operations
      const operations = 5;
      const results = [];
      const times: number[] = [];
      
      for (let i = 0; i < operations; i++) {
        const result = adapter.adapt(dataModel.withData('iteration', i));
        results.push(result);
        times.push(adapter.getProcessingTime());
      }
      
      // Verify we have the expected number of results and times
      expect(results.length).toBe(operations);
      expect(times.length).toBe(operations);
      
      // Each time should be 50ms with our mock
      times.forEach(time => {
        expect(time).toBe(50);
      });
    });

    it('should handle complex object values in mismatches', () => {
      const mismatch: ImplementationDifference = {
        path: 'test.path',
        expected: { nested: { value: 10 } },
        actual: { nested: { value: 20 } },
        message: 'Objects differ',
        severity: ErrorSeverity.ERROR
      };
      
      const comparison = new ImplementationComparisonResult(false, [mismatch]);
      
      const report = comparison.generateReport();
      
      expect(report).toContain('Objects differ');
      expect(report).toContain('nested');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle zero processing time scenarios', () => {
    const dataModel = new TestDataModel({ value: 10 });
    const behaviorModel = new TestBehaviorModel();
    
    // Mock performance.now to return the same value (simulating instantaneous processing)
    mockTimeCounter = 100;
    performance.now = jest.fn().mockReturnValue(mockTimeCounter);
    
    const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
    adapter.adapt(dataModel);
    
    expect(adapter.getProcessingTime()).toBe(0);
  });

  it('should handle errors during processing and still measure time', () => {
    const dataModel = new TestDataModel({ value: 10 });
    const behaviorModel = new TestBehaviorModel();
    
    // Restore normal mock behavior
    mockTimeCounter = 0;
    performance.now = jest.fn().mockImplementation(() => {
      mockTimeCounter += 50;
      return mockTimeCounter;
    });
    
    // Make behavior model throw an error
    jest.spyOn(behaviorModel, 'process').mockImplementation(() => {
      throw new Error('Processing error');
    });
    
    const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
    
    expect(() => adapter.adapt(dataModel)).toThrow('Processing error');
    expect(adapter.getProcessingTime()).toBe(50); // Should still record time even with error
  });
});

describe('Sequential Operations', () => {
  it('should track timing independently for each sequential operation', () => {
    const dataModel = new TestDataModel({ value: 10 });
    const behaviorModel = new TestBehaviorModel();
    
    // Make each call to performance.now return different increments
    let callCount = 0;
    performance.now = jest.fn().mockImplementation(() => {
      callCount++;
      if (callCount <= 2) return callCount * 10; // First operation: 10, 20 (delta = 10ms)
      return callCount * 25; // Second operation: 75, 100 (delta = 25ms)
    });
    
    const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
    
    adapter.adapt(dataModel);
    expect(adapter.getProcessingTime()).toBe(10); // 20 - 10
    
    adapter.adapt(dataModel);
    expect(adapter.getProcessingTime()).toBe(25); // 100 - 75
  });

  it('should isolate timing between different adapter instances', () => {
    const dataModel = new TestDataModel({ value: 10 });
    const behaviorModel = new TestBehaviorModel();
    
    // Reset mock counter
    mockTimeCounter = 0;
    performance.now = jest.fn().mockImplementation(() => {
      mockTimeCounter += 50;
      return mockTimeCounter;
    });
    
    const adapter1 = new TimedDOPAdapter(dataModel, behaviorModel);
    const adapter2 = new TimedDOPAdapter(dataModel, behaviorModel);
    
    adapter1.adapt(dataModel);
    expect(adapter1.getProcessingTime()).toBe(50);
    expect(adapter2.getProcessingTime()).toBe(0); // Should not be affected by adapter1
    
    adapter2.adapt(dataModel);
    expect(adapter2.getProcessingTime()).toBe(50);
  });
});

describe('Performance Characteristics', () => {
  it('should not accumulate processing time across operations', () => {
    const dataModel = new TestDataModel({ value: 10 });
    const behaviorModel = new TestBehaviorModel();
    
    const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
    
    // First operation
    mockTimeCounter = 0;
    adapter.adapt(dataModel);
    expect(adapter.getProcessingTime()).toBe(50);
    
    // Second operation - processing time should be from this operation only
    mockTimeCounter = 100; // Reset to simulate time passing
    adapter.adapt(dataModel);
    expect(adapter.getProcessingTime()).toBe(50); // Still 50, not cumulative
  });

  it('should preserve BaseDOPAdapter validation behavior', () => {
    const dataModel = new TestDataModel({ value: 10 });
    const behaviorModel = new TestBehaviorModel();
    jest.spyOn(behaviorModel, 'validate').mockReturnValue({ isValid: false, errors: ['Test error'] });
    
    const adapter = new TimedDOPAdapter(dataModel, behaviorModel);
    const validation = adapter.validate();
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Test error');
  });
  });
