/**
 * src/core/ioc/providers/AutomatonProvider.ts
 * 
 * Service provider for automaton module components.
 * Integrates state minimization technology with DOP adapter pattern
 * and provides automaton services to the application.
 */

import { ServiceProvider } from './ServiceRegistry'
import { ServiceContainer } from '../ServiceContainer'

// Import automaton core components
import { 
  StateMachineMinimizer,
  EquivalenceClassComputer
} from '../../automaton/minimizer';

import {
  OptimizedStateMachine,
  CacheableStateMachine,
  EnhancedCachableStateMachine,
  AdvancedTransitionCache,
  PerformanceMonitor,
  PersistanceCacheStore
} from '../../automaton/state';

import {
  StateMachineTransitionCache
} from '../../automaton/transition';

import {
  StateMachineValidationRule
} from '../../automaton/validation';

/**
 * Provider for automaton state machine services
 */
export class AutomatonProvider implements ServiceProvider {
  /**
   * Register automaton services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register minimizer components
    this.registerMinimizerServices(container);
    
    // Register state machine components
    this.registerStateMachineServices(container);
    
    // Register transition services
    this.registerTransitionServices(container);
    
    // Register validation services
    this.registerValidationServices(container);
    
    // Register factory functions
    this.registerFactories(container);
    
    // Register automaton-DOP integration
    this.registerDOPIntegration(container);
  }
  
  /**
   * Boot automaton services after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // Initialize performance monitoring if enabled
    if (process.env.AUTOMATON_PERF_MONITORING === 'true') {
      const monitor = container.resolve<PerformanceMonitor>('automaton.performanceMonitor');
      monitor.startMonitoring();
      
      console.debug('[Automaton] Performance monitoring enabled');
    }
    
    // Initialize persistence if enabled
    if (process.env.AUTOMATON_PERSISTENCE === 'true') {
      const store = container.resolve<PersistanceCacheStore>('automaton.persistenceStore');
      store.initialize();
      
      console.debug('[Automaton] Persistence store initialized');
    }
  }
  
  /**
   * Register state machine minimizer services
   * 
   * @param container Service container
   */
  private registerMinimizerServices(container: ServiceContainer): void {
    // Register equivalence class computer
    container.singleton('automaton.equivalenceComputer', () => {
      return new EquivalenceClassComputer();
    });
    
    // Register state machine minimizer
    container.singleton('automaton.minimizer', (container) => {
      const equivalenceComputer = container.resolve<EquivalenceClassComputer>('automaton.equivalenceComputer');
      return new StateMachineMinimizer(equivalenceComputer);
    });
  }
  
  /**
   * Register state machine services
   * 
   * @param container Service container
   */
  private registerStateMachineServices(container: ServiceContainer): void {
    // Register performance monitor
    container.singleton('automaton.performanceMonitor', () => {
      return new PerformanceMonitor();
    });
    
    // Register persistence store
    container.singleton('automaton.persistenceStore', () => {
      return new PersistanceCacheStore();
    });
    
    // Register optimized state machine factory
    container.transient('automaton.optimizedStateMachine', (container) => {
      const minimizer = container.resolve<StateMachineMinimizer>('automaton.minimizer');
      return new OptimizedStateMachine(minimizer);
    });
    
    // Register cacheable state machine factory
    container.transient('automaton.cacheableStateMachine', (container, options?: any) => {
      const cache = container.resolve<StateMachineTransitionCache>('automaton.transitionCache');
      return new CacheableStateMachine(cache, options);
    });
    
    // Register enhanced cacheable state machine factory
    container.transient('automaton.enhancedCacheableStateMachine', (container, options?: any) => {
      const advancedCache = container.resolve<AdvancedTransitionCache>('automaton.advancedTransitionCache');
      const monitor = container.resolve<PerformanceMonitor>('automaton.performanceMonitor');
      return new EnhancedCachableStateMachine(advancedCache, monitor, options);
    });
  }
  
  /**
   * Register transition services
   * 
   * @param container Service container
   */
  private registerTransitionServices(container: ServiceContainer): void {
    // Register transition cache
    container.singleton('automaton.transitionCache', () => {
      return new StateMachineTransitionCache();
    });
    
    // Register advanced transition cache
    container.singleton('automaton.advancedTransitionCache', (container) => {
      const persistenceStore = container.resolve<PersistanceCacheStore>('automaton.persistenceStore');
      return new AdvancedTransitionCache(persistenceStore);
    });
  }
  
  /**
   * Register validation services
   * 
   * @param container Service container
   */
  private registerValidationServices(container: ServiceContainer): void {
    // Register validation rule factory
    container.transient('automaton.validationRule', (container, options?: any) => {
      return new StateMachineValidationRule(options);
    });
  }
  
  /**
   * Register factory functions
   * 
   * @param container Service container
   */
  private registerFactories(container: ServiceContainer): void {
    // Register factory function for creating optimized state machines
    container.singleton('automaton.createOptimizedStateMachine', (container) => {
      return (initialStates: any, transitions: any, options?: any) => {
        const stateMachine = container.resolve<OptimizedStateMachine>('automaton.optimizedStateMachine');
        stateMachine.initialize(initialStates, transitions, options);
        return stateMachine;
      };
    });
    
    // Register factory function for creating cacheable state machines
    container.singleton('automaton.createCacheableStateMachine', (container) => {
      return (initialStates: any, transitions: any, options?: any) => {
        const stateMachine = container.resolve<CacheableStateMachine>('automaton.cacheableStateMachine');
        stateMachine.initialize(initialStates, transitions, options);
        return stateMachine;
      };
    });
    
    // Register factory function for creating enhanced cacheable state machines
    container.singleton('automaton.createEnhancedStateMachine', (container) => {
      return (initialStates: any, transitions: any, options?: any) => {
        const stateMachine = container.resolve<EnhancedCachableStateMachine>(
          'automaton.enhancedCacheableStateMachine'
        );
        stateMachine.initialize(initialStates, transitions, options);
        return stateMachine;
      };
    });
  }
  
  /**
   * Register automaton integration with DOP adapter
   * 
   * @param container Service container
   */
  private registerDOPIntegration(container: ServiceContainer): void {
    // This will be registered if DOPProvider is available
    if (container.has('dop.adapter')) {
      // Register automaton-enhanced DOP adapter factory
      container.singleton('automaton.createDOPAdapter', (container) => {
        return (dataModel: any, behaviorModel: any, options?: any) => {
          const adapterFactory = container.resolve<any>('dop.adapterFactory');
          const minimizer = container.resolve<StateMachineMinimizer>('automaton.minimizer');
          
          // Create the adapter with default factory
          const adapter = adapterFactory.createAdapter(dataModel, behaviorModel);
          
          // Enhance with state minimization if configured
          if (options?.enableMinimization !== false) {
            // Apply minimization to the adapter's state machine
            minimizer.minimizeStateMachine(adapter.getStateMachine());
          }
          
          return adapter;
        };
      });
      
      // Register validation rule for DOP adapter state machines
      container.singleton('automaton.createDOPValidationRule', (container) => {
        return (adapter: any, options?: any) => {
          const validationRule = container.resolve<StateMachineValidationRule>('automaton.validationRule', options);
          validationRule.setStateMachine(adapter.getStateMachine());
          return validationRule;
        };
      });
    }
  }
}