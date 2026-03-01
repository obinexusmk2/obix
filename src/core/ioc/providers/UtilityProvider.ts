/**
 * src/core/ioc/providers/UtilityProvider.ts
 * 
 * Service provider for common utility services.
 * Registers utility components and helper functions with the IOC container.
 */

import { ServiceProvider } from './ServiceRegistry'
import { ServiceContainer } from '../ServiceContainer'

/**
 * Provider for utility services
 */
export class UtilityProvider implements ServiceProvider {
  /**
   * Register utility services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register async utilities
    this.registerAsyncUtilities(container);
    
    // Register data utilities
    this.registerDataUtilities(container);
    
    // Register string utilities
    this.registerStringUtilities(container);
    
    // Register constants
    this.registerConstants(container);
    
    // Register error handlers
    this.registerErrorHandlers(container);
  }
  
  /**
   * Boot utility services after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // Initialize error handlers if needed
  }
  
  /**
   * Register async utilities
   * 
   * @param container Service container
   */
  private registerAsyncUtilities(container: ServiceContainer): void {
    try {
      // Import async utilities
      const { AsyncUtils } = require('../../common/utils/AsyncUtils');
      
      // Register debounce function
      container.singleton('utils.debounce', () => {
        return AsyncUtils.debounce;
      });
      
      // Register throttle function
      container.singleton('utils.throttle', () => {
        return AsyncUtils.throttle;
      });
      
      // Register delay function
      container.singleton('utils.delay', () => {
        return AsyncUtils.delay;
      });
      
      // Register timeout function
      container.singleton('utils.timeout', () => {
        return AsyncUtils.timeout;
      });
      
      // Register retryable function
      container.singleton('utils.retryable', () => {
        return AsyncUtils.retryable;
      });
    } catch (error) {
      console.error('Error registering async utilities:', error);
    }
  }
  
  /**
   * Register data utilities
   * 
   * @param container Service container
   */
  private registerDataUtilities(container: ServiceContainer): void {
    try {
      // Import data utilities
      const { DataUtils } = require('../../common/utils/DataUtils');
      
      // Register deep clone function
      container.singleton('utils.deepClone', () => {
        return DataUtils.deepClone;
      });
      
      // Register deep compare function
      container.singleton('utils.deepCompare', () => {
        return DataUtils.deepCompare;
      });
      
      // Register object merge function
      container.singleton('utils.merge', () => {
        return DataUtils.merge;
      });
      
      // Register path get/set functions
      container.singleton('utils.getPath', () => {
        return DataUtils.getPath;
      });
      
      container.singleton('utils.setPath', () => {
        return DataUtils.setPath;
      });
      
      // Register data transformation utilities
      container.singleton('utils.transform', () => {
        return DataUtils.transform;
      });
    } catch (error) {
      console.error('Error registering data utilities:', error);
    }
  }
  
  /**
   * Register string utilities
   * 
   * @param container Service container
   */
  private registerStringUtilities(container: ServiceContainer): void {
    try {
      // Import string utilities
      const { StringUtils } = require('../../common/utils/StringUtils');
      
      // Register camel case function
      container.singleton('utils.camelCase', () => {
        return StringUtils.camelCase;
      });
      
      // Register pascal case function
      container.singleton('utils.pascalCase', () => {
        return StringUtils.pascalCase;
      });
      
      // Register kebab case function
      container.singleton('utils.kebabCase', () => {
        return StringUtils.kebabCase;
      });
      
      // Register snake case function
      container.singleton('utils.snakeCase', () => {
        return StringUtils.snakeCase;
      });
      
      // Register string format function
      container.singleton('utils.format', () => {
        return StringUtils.format;
      });
      
      // Register template function
      container.singleton('utils.template', () => {
        return StringUtils.template;
      });
    } catch (error) {
      console.error('Error registering string utilities:', error);
    }
  }
  
  /**
   * Register constants
   * 
   * @param container Service container
   */
  private registerConstants(container: ServiceContainer): void {
    try {
      // Import constants
      const cacheConstants = require('../../common/constants/cache-constants');
      const eventConstants = require('../../common/constants/event-constants');
      const minimizationConstants = require('../../common/constants/minimization-constants');
      const stateConstants = require('../../common/constants/state-constants');
      
      // Register constants objects
      container.instance('constants.cache', cacheConstants);
      container.instance('constants.event', eventConstants);
      container.instance('constants.minimization', minimizationConstants);
      container.instance('constants.state', stateConstants);
    } catch (error) {
      console.error('Error registering constants:', error);
    }
  }
  
  /**
   * Register error handlers
   * 
   * @param container Service container
   */
  private registerErrorHandlers(container: ServiceContainer): void {
    try {
      // Import error types
      const { errorTypes } = require('../../common/errors/error-types');
      
      // Register error types
      container.instance('errors.types', errorTypes);
      
      // Register error handler factory
      container.singleton('errors.createHandler', () => {
        return (options?: any) => {
          return (error: Error) => {
            console.error('Error handled by IOC container handler:', error);
            
            // Apply custom error handling logic here
            if (options?.rethrow) {
              throw error;
            }
            
            return {
              error,
              handled: true,
              message: error.message,
              type: error.name
            };
          };
        };
      });
      
      // Register default error handler
      container.singleton('errors.handler', (container) => {
        const createHandler = container.resolve<Function>('errors.createHandler');
        return createHandler({ rethrow: false });
      });
    } catch (error) {
      console.error('Error registering error handlers:', error);
    }
  }
}