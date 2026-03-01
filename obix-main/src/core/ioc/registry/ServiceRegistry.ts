/**
 * src/core/ioc/registry/ServiceRegistry.ts
 * 
 * Registry for service providers and container factory.
 * Facilitates the creation and configuration of IoC containers
 * with all necessary service providers for the OBIX framework.
 */



// Import all core service providers
import { AutomatonProvider } from '../providers/AutomatonProvider';
import { DOPProvider } from '../providers/DOPProvider';
import { ParserProvider } from '../providers/ParserProvider';
import { PolicyProvider } from '../providers/PolicyProvider';
import { UtilityProvider } from '../providers/UtilityProvider';
import { AstProvider } from '../providers/AstProvider';
import { DiffProvider } from '../providers/DiffProvider';
import { ValidationProvider } from '../providers/ValidationProvider';
import { ServiceProvider, ServiceContainer } from '../providers';

/**
 * Registry for service providers and container factory
 */
export class ServiceRegistry {
  private static providers: ServiceProvider[] = [];
  private static initialized: boolean = false;
  
  /**
   * Initialize the service registry with default providers
   */
  private static initialize(): void {
    if (this.initialized) {
      return;
    }
    
    // Register core service providers
    this.registerProvider(new UtilityProvider());
    this.registerProvider(new AutomatonProvider());
    this.registerProvider(new DOPProvider());
    this.registerProvider(new ParserProvider());
    this.registerProvider(new PolicyProvider());
    this.registerProvider(new AstProvider());
    this.registerProvider(new DiffProvider());
    this.registerProvider(new ValidationProvider());
    
    this.initialized = true;
  }
  
  /**
   * Register a service provider with the registry
   * 
   * @param provider Service provider to register
   */
  public static registerProvider(provider: ServiceProvider): void {
    this.providers.push(provider);
  }
  
  /**
   * Get all registered service providers
   * 
   * @returns Array of registered providers
   */
  public static getProviders(): ServiceProvider[] {
    this.initialize();
    return [...this.providers];
  }
  
  /**
   * Create a new service container with all registered providers
   * 
   * @param customizeContainer Optional function to customize the container
   * @returns Configured service container
   */
  public static createContainer(
    customizeContainer?: (container: ServiceContainer) => void
  ): ServiceContainer {
    this.initialize();
    
    const container = new ServiceContainer();
    
    // Register all providers with the container
    for (const provider of this.providers) {
      provider.register(container);
    }
    
    // Apply custom configuration if provided
    if (customizeContainer) {
      customizeContainer(container);
    }
    
    // Boot all providers
    for (const provider of this.providers) {
      if (typeof provider.boot === 'function') {
        provider.boot(container);
      }
    }
    
    return container;
  }
  
  /**
   * Clear all registered providers
   * Primarily used for testing
   */
  public static clearProviders(): void {
    this.providers = [];
    this.initialized = false;
  }
  
  /**
   * Retrieve a specific provider by type
   * 
   * @param providerType Provider constructor
   * @returns Provider instance or undefined if not found
   */
  public static getProvider<T extends ServiceProvider>(
    providerType: new (...args: any[]) => T
  ): T | undefined {
    this.initialize();
    return this.providers.find(p => p instanceof providerType) as T | undefined;
  }
  
  /**
   * Create a minimal container with only specific providers
   * 
   * @param providerTypes Types of providers to include
   * @returns Container with only requested providers
   */
  public static createMinimalContainer(
    providerTypes: Array<new (...args: any[]) => ServiceProvider>
  ): ServiceContainer {
    const container = new ServiceContainer();
    
    // Register only specified providers
    for (const ProviderType of providerTypes) {
      const provider = new ProviderType();
      provider.register(container);
    }
    
    // Boot all registered providers
    for (const ProviderType of providerTypes) {
      const provider = new ProviderType();
      if (typeof provider.boot === 'function') {
        provider.boot(container);
      }
    }
    
    return container;
  }
}