/**
 * src/core/ioc/providers/DiffProvider.ts
 * 
 * Service provider for diff module components.
 * Registers differencing and reconciliation services with the IoC container.
 */

import { ServiceProvider } from './ServiceRegistry';
import { ServiceContainer } from '../ServiceContainer';

/**
 * Provider for diff services
 */
export class DiffProvider implements ServiceProvider {
  /**
   * Register diff services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register algorithm components
    this.registerAlgorithmServices(container);
    
    // Register DOM diff components
    this.registerDomDiffServices(container);
    
    // Register patching components
    this.registerPatchServices(container);
    
    // Register reconciliation components
    this.registerReconciliationServices(container);
    
    // Register vnode components
    this.registerVNodeServices(container);
  }
  
  /**
   * Boot diff services after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // No additional boot logic required
  }
  
  /**
   * Register diff algorithm services
   * 
   * @param container Service container
   */
  private registerAlgorithmServices(container: ServiceContainer): void {
    try {
      // Import diff algorithm components dynamically
      const diffAlgorithm = require('../../diff/algorithm');
      
      // Register diff algorithm components
      container.singleton('diff.algorithm', () => diffAlgorithm);
    } catch (error) {
      console.error('Error registering diff algorithm services:', error);
    }
  }
  
  /**
   * Register DOM diff services
   * 
   * @param container Service container
   */
  private registerDomDiffServices(container: ServiceContainer): void {
    try {
      // Import DOM diff components dynamically
      const domDiff = require('../../diff/dom');
      
      // Register DOM diff components
      container.singleton('diff.dom', () => domDiff);
    } catch (error) {
      console.error('Error registering DOM diff services:', error);
    }
  }
  
  /**
   * Register patch services
   * 
   * @param container Service container
   */
  private registerPatchServices(container: ServiceContainer): void {
    try {
      // Import patch components dynamically
      const patch = require('../../diff/patch');
      
      // Register patch components
      container.singleton('diff.patch', () => patch);
    } catch (error) {
      console.error('Error registering patch services:', error);
    }
  }
  
  /**
   * Register reconciliation services
   * 
   * @param container Service container
   */
  private registerReconciliationServices(container: ServiceContainer): void {
    try {
      // Import reconciliation components dynamically
      const reconciliation = require('../../diff/reconciliation');
      
      // Register reconciliation components
      container.singleton('diff.reconciliation', () => reconciliation);
    } catch (error) {
      console.error('Error registering reconciliation services:', error);
    }
  }
  
  /**
   * Register vnode services
   * 
   * @param container Service container
   */
  private registerVNodeServices(container: ServiceContainer): void {
    try {
      // Import vnode components dynamically
      const vnode = require('../../diff/vnode');
      
      // Register vnode components
      container.singleton('diff.vnode', () => vnode);
    } catch (error) {
      console.error('Error registering vnode services:', error);
    }
  }
}