/**
 * src/core/ioc/providers/DOPProvider.ts
 * 
 * Service provider for DOP (Data-Oriented Programming) module components.
 * Registers DOP-related services with the IOC container to support
 * the 1:1 correspondence between functional and OOP paradigms.
 */

import { ServiceProvider } from './ServiceRegistry'
import { ServiceContainer } from '../ServiceContainer'

// Import DOP core components
import {
  DOPAdapter,
  ValidationDOPAdapter,
  TimedDOPAdapter
} from '../../dop/adapter';

import {
  BaseBehaviorModel,
  BehaviorRegistry,
  BehaviourChain,
  BehaviourModel,
  EnhacedValidationBehaviourModel,
  EnhancedBehaviourChain,
  OptimizedBehaviour,
  OptimizedValidationBehaviourModel,
  TransformBehavior,
  ValidationBehaviorModelImpl
} from '../../dop/behavior';

import {
  ExecutionTrace,
  ImplementationComparisonResult,
  TraceComparisonResult
} from '../../dop/common';

import {
  BaseDataModel,
  StatefulDataModel,
  ValidationDataModelImpl
} from '../../dop/data';

import {
  DataModelFactory,
  DOPAdapterFactory,
  DualParadigmValidationAdapterFactory,
  ValidationDOPFactory
} from '../../dop/factory';

import {
  ValidationResult,
  ValidationAdapter,
  ValidationStateMachine,
  ValidationState
} from '../../dop/validation';

/**
 * Provider for DOP module services
 */
export class DOPProvider implements ServiceProvider {
  /**
   * Register DOP services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register adapter components
    this.registerAdapterServices(container);
    
    // Register behavior components
    this.registerBehaviorServices(container);
    
    // Register data model components
    this.registerDataModelServices(container);
    
    // Register factory components
    this.registerFactoryServices(container);
    
    // Register validation components
    this.registerValidationServices(container);
    
    // Register utility components
    this.registerUtilityServices(container);
  }
  
  /**
   * Boot DOP services after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // Initialize behavior registry
    const registry = container.resolve<BehaviorRegistry>('dop.behaviorRegistry');
    
    // Register default behaviors
    registry.registerBehavior('transform', (container) => 
      container.resolve<TransformBehavior>('dop.transformBehavior')
    );
    
    registry.registerBehavior('validation', (container) => 
      container.resolve<ValidationBehaviorModelImpl>('dop.validationBehavior')
    );
    
    registry.registerBehavior('optimized', (container) => 
      container.resolve<OptimizedBehaviour>('dop.optimizedBehavior')
    );
    
    // Log registered behaviors
    console.debug(`[DOP] Registered behaviors: ${Array.from(registry.getBehaviorNames()).join(', ')}`);
  }
  
  /**
   * Register adapter services
   * 
   * @param container Service container
   */
  private registerAdapterServices(container: ServiceContainer): void {
    // Register base adapter factory function
    container.transient('dop.adapter', (container, dataModel: any, behaviorModel: any, options?: any) => {
      return new DOPAdapter(dataModel, behaviorModel, options);
    });
    
    // Register validation adapter factory function
    container.transient('dop.validationAdapter', (container, dataModel: any, behaviorModel: any, options?: any) => {
      return new ValidationDOPAdapter(dataModel, behaviorModel, options);
    });
    
    // Register timed adapter factory function
    container.transient('dop.timedAdapter', (container, dataModel: any, behaviorModel: any, options?: any) => {
      return new TimedDOPAdapter(dataModel, behaviorModel, options);
    });
  }
  
  /**
   * Register behavior services
   * 
   * @param container Service container
   */
  private registerBehaviorServices(container: ServiceContainer): void {
    // Register behavior registry
    container.singleton('dop.behaviorRegistry', () => {
      return new BehaviorRegistry();
    });
    
    // Register behavior chain factory
    container.transient('dop.behaviourChain', () => {
      return new BehaviourChain();
    });
    
    // Register enhanced behavior chain factory
    container.transient('dop.enhancedBehaviourChain', () => {
      return new EnhancedBehaviourChain();
    });
    
    // Register base behavior model factory
    container.transient('dop.baseBehaviorModel', () => {
      return new BaseBehaviorModel();
    });
    
    // Register transform behavior
    container.transient('dop.transformBehavior', () => {
      return new TransformBehavior();
    });
    
    // Register validation behavior
    container.transient('dop.validationBehavior', () => {
      return new ValidationBehaviorModelImpl();
    });
    
    // Register optimized behavior
    container.transient('dop.optimizedBehavior', () => {
      return new OptimizedBehaviour();
    });
    
    // Register optimized validation behavior
    container.transient('dop.optimizedValidationBehavior', () => {
      return new OptimizedValidationBehaviourModel();
    });
    
    // Register enhanced validation behavior
    container.transient('dop.enhancedValidationBehavior', () => {
      return new EnhacedValidationBehaviourModel();
    });
  }
  
  /**
   * Register data model services
   * 
   * @param container Service container
   */
  private registerDataModelServices(container: ServiceContainer): void {
    // Register stateful data model factory
    container.transient('dop.statefulDataModel', (container, initialState: any) => {
      return new StatefulDataModel(initialState);
    });
    
    // Register validation data model factory
    container.transient('dop.validationDataModel', (container, initialState: any, validationRules?: any[]) => {
      return new ValidationDataModelImpl(initialState, validationRules);
    });
  }
  
  /**
   * Register factory services
   * 
   * @param container Service container
   */
  private registerFactoryServices(container: ServiceContainer): void {
    // Register data model factory
    container.singleton('dop.dataModelFactory', () => {
      return new DataModelFactory();
    });
    
    // Register DOP adapter factory
    container.singleton('dop.adapterFactory', () => {
      return new DOPAdapterFactory();
    });
    
    // Register validation DOP factory
    container.singleton('dop.validationFactory', () => {
      return new ValidationDOPFactory();
    });
    
    // Register dual paradigm adapter factory
    container.singleton('dop.dualParadigmFactory', () => {
      return new DualParadigmValidationAdapterFactory();
    });
    
    // Register factory function for creating adapters with 1:1 correspondence
    container.singleton('dop.createAdapter', (container) => {
      const adapterFactory = container.resolve<DOPAdapterFactory>('dop.adapterFactory');
      
      return (dataModel: any, behaviorModel: any, options?: any) => {
        return adapterFactory.createAdapter(dataModel, behaviorModel, options);
      };
    });
    
    // Register factory function for creating validation adapters
    container.singleton('dop.createValidationAdapter', (container) => {
      const validationFactory = container.resolve<ValidationDOPFactory>('dop.validationFactory');
      
      return (dataModel: any, behaviorModel: any, validationRules?: any[], options?: any) => {
        return validationFactory.createValidationAdapter(dataModel, behaviorModel, validationRules, options);
      };
    });
    
    // Register factory function for creating dual paradigm adapters
    container.singleton('dop.createDualParadigmAdapter', (container) => {
      const dualFactory = container.resolve<DualParadigmValidationAdapterFactory>('dop.dualParadigmFactory');
      
      return (functionalComponent: any, oopComponent: any, options?: any) => {
        return dualFactory.createDualParadigmAdapter(functionalComponent, oopComponent, options);
      };
    });
  }
  
  /**
   * Register validation services
   * 
   * @param container Service container
   */
  private registerValidationServices(container: ServiceContainer): void {
    // Register validation adapter
    container.transient('dop.validationAdapterInstance', () => {
      return new ValidationAdapter();
    });
    
    // Register validation state machine
    container.transient('dop.validationStateMachine', () => {
      return new ValidationStateMachine();
    });
    
    // Register validation state
    container.transient('dop.validationState', (container, isValid: boolean, data: any) => {
      return new ValidationState(isValid, data);
    });
    
    // Register validation result factory
    container.transient('dop.validationResult', (container, isValid: boolean, data: any) => {
      return new ValidationResult(isValid, data);
    });
  }
  
  /**
   * Register utility services
   * 
   * @param container Service container
   */
  private registerUtilityServices(container: ServiceContainer): void {
    // Register execution trace
    container.transient('dop.executionTrace', (container, name: string) => {
      return new ExecutionTrace(name);
    });
    
    // Register implementation comparison result
    container.transient('dop.implementationComparisonResult', () => {
      return new ImplementationComparisonResult();
    });
    
    // Register trace comparison result
    container.transient('dop.traceComparisonResult', () => {
      return new TraceComparisonResult();
    });
    
    // Register utility function for comparing implementations
    container.singleton('dop.compareImplementations', (container) => {
      return (functionalTrace: ExecutionTrace, oopTrace: ExecutionTrace) => {
        const result = container.resolve<ImplementationComparisonResult>('dop.implementationComparisonResult');
        const traceResult = container.resolve<TraceComparisonResult>('dop.traceComparisonResult');
        
        traceResult.compareTraces(functionalTrace, oopTrace);
        result.setTraceComparison(traceResult);
        
        return result;
      };
    });
  }
}