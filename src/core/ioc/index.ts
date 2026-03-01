/**
 * src/core/ioc/index.ts
 * 
 * Main exports for the IoC module.
 * Provides access to the service container, registry, and providers.
 */

// Export core container and interfaces
export { 
  ServiceContainer, 
  ServiceLifetime,
  ServiceRegistrationOptions
} from './ServiceContainer';

// Export service provider interface
export { ServiceProvider } from './providers/ServiceRegistry';

// Export registry
export { ServiceRegistry } from './registry/ServiceRegistry';

// Export provider index
export * from './providers';

// Export registry index
export * from './registry';

import { ServiceContainer } from './providers';
// Convenience function to create a fully configured container
import { ServiceRegistry } from './registry/ServiceRegistry';

/**
 * Create a fully configured service container with all core providers registered
 * 
 * @param customize Optional function to customize the container
 * @returns Configured ServiceContainer instance
 */
export function createContainer(
  customize?: (container: ServiceContainer) => void
): ServiceContainer {
  return ServiceRegistry.createContainer(customize);
}