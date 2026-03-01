// src/core/policy/__tests__/PolicyDecorator.test.ts

import { policy } from '../PolicyDecorator';
import { withPolicy } from '../PolicyWrapper';
import { enhanceAdapterWithPolicy } from '../PolicyAdapter';
import { DOPAdapter } from '../../dop/DOPAdapter';
import { DataModel } from '../../dop/BaseDataModel';
import { BehaviorModel } from '../../dop/BehaviourModel';

// Mock environment for testing
const originalNodeEnv = process.env.NODE_ENV;

describe('Policy Implementation Tests', () => {
  // Setup and teardown
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe('@policy decorator', () => {
    test('should enforce policy in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      class TestClass {
        @policy({ 
          production: { prevent: true, log: true },
          development: { prevent: false, log: false }
        })
        sensitiveMethod() {
          return 'sensitive data';
        }
      }
      
      const instance = new TestClass();
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => instance.sensitiveMethod()).toThrow('Operation prevented by policy in production environment');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    test('should allow execution in development environment', () => {
      process.env.NODE_ENV = 'development';
      
      class TestClass {
        @policy({ 
          production: { prevent: true, log: true },
          development: { prevent: false, log: true }
        })
        sensitiveMethod() {
          return 'sensitive data';
        }
      }
      
      const instance = new TestClass();
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      expect(instance.sensitiveMethod()).toBe('sensitive data');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('withPolicy function', () => {
    test('should wrap function with policy enforcement', () => {
      process.env.NODE_ENV = 'production';
      
      const originalFn = () => 'network request';
      const wrappedFn = withPolicy(originalFn, {
        production: { prevent: true, log: true, audit: true },
        development: { prevent: false, log: false }
      });
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      expect(() => wrappedFn()).toThrow('Operation prevented by policy in production environment');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    test('should pass arguments and context', () => {
      process.env.NODE_ENV = 'development';
      
      const originalFn = function(this: any, a: number, b: number) {
        return a + b + (this.value || 0);
      };
      
      const wrappedFn = withPolicy(originalFn, {
        production: { prevent: true },
        development: { prevent: false, log: true }
      });
      
      const context = { value: 10 };
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation();
      
      expect(wrappedFn.call(context, 5, 7)).toBe(22);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('enhanceAdapterWithPolicy', () => {
    class MockDataModel implements DataModel<MockDataModel> {
      getMinimizationSignature() { return 'test'; }
      clone() { return this; }
    }
    
    class MockBehaviorModel implements BehaviorModel<MockDataModel, any> {
      process() { return {}; }
      getBehaviorId() { return 'test'; }
      getDescription() { return 'test'; }
    }
    
    class MockAdapter extends DOPAdapter<MockDataModel, any> {
      constructor() {
        super(new MockDataModel(), new MockBehaviorModel());
      }
      
      makeNetworkRequest() {
        return 'network data';
      }
      
      accessSensitiveData() {
        return 'sensitive data';
      }
    }
    
    test('should enhance adapter with policies', () => {
      process.env.NODE_ENV = 'production';
      
      const adapter = new MockAdapter();
      const policies = {
        makeNetworkRequest: {
          production: { prevent: true, log: true },
          development: { prevent: false, log: false }
        },
        accessSensitiveData: {
          production: { prevent: false, audit: true },
          development: { prevent: false }
        }
      };
      
      const enhancedAdapter = enhanceAdapterWithPolicy(adapter, policies);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const auditSpy = jest.spyOn(console, 'info').mockImplementation();
      
      // Network request should be prevented in production
      expect(() => enhancedAdapter.makeNetworkRequest()).toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      // Sensitive data should be audited but not prevented
      expect(enhancedAdapter.accessSensitiveData()).toBe('sensitive data');
      expect(auditSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      auditSpy.mockRestore();
    });
  });
});