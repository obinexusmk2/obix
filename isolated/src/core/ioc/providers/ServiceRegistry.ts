/**
 * src/core/ioc/providers/ServiceRegistry.ts
 * 
 * Defines the interface for service providers that register
 * services with the IoC container.
 */

import { ServiceContainer } from '../ServiceContainer';

/**
 * Interface for service providers that can register services with a container
 */
export interface ServiceProvider {
  /**
   * Register services with the container
   * 
   * @param container Service container to register services with
   */
  register(container: ServiceContainer): void;
  
  /**
   * Optional boot method called after all providers are registered
   * Use for initialization that depends on other services
   * 
   * @param container Service container with all services registered
   */
  boot?(container: ServiceContainer): void;
}