/**
 * src/core/ioc/providers/ValidationProvider.ts
 * 
 * Service provider for validation module components.
 * Registers validation services with the IoC container.
 */

import { ServiceProvider } from './ServiceRegistry';
import { ServiceContainer } from '../ServiceContainer';

/**
 * Provider for validation services
 */
export class ValidationProvider implements ServiceProvider {
  /**
   * Register validation services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register core validation components
    this.registerCoreValidationServices(container);
    
    // Register validation engine components
    this.registerValidationEngineServices(container);
    
    // Register validation data components
    this.registerValidationDataServices(container);
    
    // Register validation error components
    this.registerValidationErrorServices(container);
    
    // Register validation factory components
    this.registerValidationFactoryServices(container);
    
    // Register validation registry components
    this.registerValidationRegistryServices(container);
    
    // Register validation rule components
    this.registerValidationRuleServices(container);
  }
  
  /**
   * Boot validation services after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // Initialize validation registry with default rules
    try {
      const registry = container.resolve('validation.ruleRegistry');
      const cssRule = container.resolve('validation.rules.css');
      const htmlRule = container.resolve('validation.rules.html');
      
      // Register default rules
      registry.registerRule(cssRule);
      registry.registerRule(htmlRule);
    } catch (error) {
      console.error('Error initializing validation registry:', error);
    }
  }
  
  /**
   * Register core validation components
   * 
   * @param container Service container
   */
  private registerCoreValidationServices(container: ServiceContainer): void {
    try {
      // Import core validation components
      const {
        IValidationEngine,
        ValidationEngineImpl
      } = require('../../validation/core');
      
      // Register interface as a named reference (not instantiable)
      container.instance('validation.engineInterface', IValidationEngine);
      
      // Register implementation
      container.singleton('validation.engine', (container) => {
        return new ValidationEngineImpl();
      });
    } catch (error) {
      console.error('Error registering core validation services:', error);
    }
  }
  
  /**
   * Register validation engine components
   * 
   * @param container Service container
   */
  private registerValidationEngineServices(container: ServiceContainer): void {
    try {
      // Import validation engine components
      const {
        ValidationEngine
      } = require('../../validation/engine');
      
      const {
        ValidationEngineConfiguration,
        ValidationErrorHandlingStrategies
      } = require('../../validation/engine/config');
      
      // Register engine components
      container.transient('validation.engineInstance', (container, config?: any) => {
        return new ValidationEngine(config);
      });
      
      // Register configuration factory
      container.transient('validation.engineConfig', (container, options?: any) => {
        return new ValidationEngineConfiguration(options);
      });
      
      // Register error handling strategies
      container.instance('validation.errorHandlingStrategies', ValidationErrorHandlingStrategies);
    } catch (error) {
      console.error('Error registering validation engine services:', error);
    }
  }
  
  /**
   * Register validation data components
   * 
   * @param container Service container
   */
  private registerValidationDataServices(container: ServiceContainer): void {
    try {
      // Import validation data components
      const {
        ValidationDataModel
      } = require('../../validation/data');
      
      // Register data model factory
      container.transient('validation.dataModel', (container, data?: any) => {
        return new ValidationDataModel(data);
      });
    } catch (error) {
      console.error('Error registering validation data services:', error);
    }
  }
  
  /**
   * Register validation error components
   * 
   * @param container Service container
   */
  private registerValidationErrorServices(container: ServiceContainer): void {
    try {
      // Import validation error components
      const {
        ErrorHandler,
        ErrorTracker,
        ExecutionTrace,
        ValidationError
      } = require('../../validation/errors');
      
      // Register error components
      container.transient('validation.errorHandler', (container) => {
        return new ErrorHandler();
      });
      
      container.transient('validation.errorTracker', (container) => {
        return new ErrorTracker();
      });
      
      container.transient('validation.executionTrace', (container, name: string) => {
        return new ExecutionTrace(name);
      });
      
      container.transient('validation.error', (container, options: any) => {
        return new ValidationError(options);
      });
    } catch (error) {
      console.error('Error registering validation error services:', error);
    }
  }
  
  /**
   * Register validation factory components
   * 
   * @param container Service container
   */
  private registerValidationFactoryServices(container: ServiceContainer): void {
    try {
      // Import validation factory components
      const {
        ValidationAdapterFactory
      } = require('../../validation/factory');
      
      // Register factory components
      container.singleton('validation.adapterFactory', (container) => {
        return new ValidationAdapterFactory();
      });
    } catch (error) {
      console.error('Error registering validation factory services:', error);
    }
  }
  
  /**
   * Register validation registry components
   * 
   * @param container Service container
   */
  private registerValidationRegistryServices(container: ServiceContainer): void {
    try {
      // Import validation registry components
      const {
        ValidationEngineRegistry,
        ValidationRuleRegistry
      } = require('../../validation/registry');
      
      // Register registry components
      container.singleton('validation.engineRegistry', (container) => {
        return new ValidationEngineRegistry();
      });
      
      container.singleton('validation.ruleRegistry', (container) => {
        return new ValidationRuleRegistry();
      });
    } catch (error) {
      console.error('Error registering validation registry services:', error);
    }
  }
  
  /**
   * Register validation rule components
   * 
   * @param container Service container
   */
  private registerValidationRuleServices(container: ServiceContainer): void {
    try {
      // Import validation rule components
      const {
        CSSValidationRule,
        HTMLValidationRule,
        ValidationRule
      } = require('../../validation/rules');
      
      // Register rule interface as a named reference (not instantiable)
      container.instance('validation.ruleInterface', ValidationRule);
      
      // Register concrete rule implementations
      container.transient('validation.rules.css', (container) => {
        return new CSSValidationRule();
      });
      
      container.transient('validation.rules.html', (container) => {
        return new HTMLValidationRule();
      });
    } catch (error) {
      console.error('Error registering validation rule services:', error);
    }
  }
}
