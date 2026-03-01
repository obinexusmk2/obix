/**
 * src/core/ioc/ServiceContainer.ts
 * 
 * Core implementation of the Inversion of Control container for dependency injection.
 * This class manages service registration, resolution, and lifecycle management.
 */

/**
 * Service lifetime options
 */
export enum ServiceLifetime {
  /**
   * New instance created each time the service is resolved
   */
  TRANSIENT = 'transient',
  
  /**
   * Single instance created and reused for the lifetime of the container
   */
  SINGLETON = 'singleton',
  
  /**
   * Instance scoped to a specific context or request
   */
  SCOPED = 'scoped'
}

/**
 * Service registration options
 */
export interface ServiceRegistrationOptions {
  /**
   * Service lifetime (singleton, transient, scoped)
   */
  lifetime?: ServiceLifetime;
  
  /**
   * Tags for service categorization and filtering
   */
  tags?: string[];
}

/**
 * Factory function for creating service instances
 */
export type ServiceFactory<T = any> = (container: ServiceContainer, ...args: any[]) => T;

/**
 * Interface for service binding configuration
 */
interface ServiceBinding {
  /**
   * Factory function to create the service
   */
  factory: ServiceFactory;
  
  /**
   * Cached singleton instance if lifetime is SINGLETON
   */
  instance?: any;
  
  /**
   * Service lifetime configuration
   */
  lifetime: ServiceLifetime;
  
  /**
   * Tags for service categorization
   */
  tags: string[];
}

/**
 * Core IoC container implementation
 */
export class ServiceContainer {
  /**
   * Map of service key to binding configuration
   */
  private bindings: Map<string, ServiceBinding> = new Map();
  
  /**
   * Map of service keys to their aliases
   */
  private aliases: Map<string, string> = new Map();
  
  /**
   * Currently active scope for scoped services
   */
  private activeScope: string | null = null;
  
  /**
   * Map of scoped service instances by scope ID
   */
  private scopes: Map<string, Map<string, any>> = new Map();
  
  /**
   * Register a service with the container
   * 
   * @param key Service identifier
   * @param factory Factory function to create the service
   * @param options Registration options
   */
  public register<T>(
    key: string,
    factory: ServiceFactory<T>,
    options: ServiceRegistrationOptions = {}
  ): void {
    const lifetime = options.lifetime || ServiceLifetime.TRANSIENT;
    const tags = options.tags || [];
    
    this.bindings.set(key, {
      factory,
      lifetime,
      tags
    });
  }
  
  /**
   * Register a singleton service with the container
   * 
   * @param key Service identifier
   * @param factory Factory function to create the service
   * @param tags Optional tags for categorization
   */
  public singleton<T>(key: string, factory: ServiceFactory<T>, tags: string[] = []): void {
    this.register(key, factory, { lifetime: ServiceLifetime.SINGLETON, tags });
  }
  
  /**
   * Register a transient service with the container
   * 
   * @param key Service identifier
   * @param factory Factory function to create the service
   * @param tags Optional tags for categorization
   */
  public transient<T>(key: string, factory: ServiceFactory<T>, tags: string[] = []): void {
    this.register(key, factory, { lifetime: ServiceLifetime.TRANSIENT, tags });
  }
  
  /**
   * Register a scoped service with the container
   * 
   * @param key Service identifier
   * @param factory Factory function to create the service
   * @param tags Optional tags for categorization
   */
  public scoped<T>(key: string, factory: ServiceFactory<T>, tags: string[] = []): void {
    this.register(key, factory, { lifetime: ServiceLifetime.SCOPED, tags });
  }
  
  /**
   * Register an existing instance with the container
   * 
   * @param key Service identifier
   * @param instance Instance to register
   * @param tags Optional tags for categorization
   */
  public instance<T>(key: string, instance: T, tags: string[] = []): void {
    this.bindings.set(key, {
      factory: () => instance,
      instance,
      lifetime: ServiceLifetime.SINGLETON,
      tags
    });
  }
  
  /**
   * Create an alias for a service
   * 
   * @param alias Alias name
   * @param target Target service key
   */
  public alias(alias: string, target: string): void {
    this.aliases.set(alias, target);
  }
  
  /**
   * Resolve a service from the container
   * 
   * @param key Service identifier
   * @param args Optional arguments to pass to the factory
   * @returns The resolved service instance
   */
  public resolve<T>(key: string, ...args: any[]): T {
    // Check if key is an alias
    if (this.aliases.has(key)) {
      const targetKey = this.aliases.get(key)!;
      return this.resolve<T>(targetKey, ...args);
    }
    
    const binding = this.bindings.get(key);
    
    if (!binding) {
      throw new Error(`Service not registered: ${key}`);
    }
    
    // Handle different lifetime patterns
    switch (binding.lifetime) {
      case ServiceLifetime.SINGLETON:
        // Reuse existing instance if available
        if (!binding.instance) {
          binding.instance = binding.factory(this, ...args);
        }
        return binding.instance as T;
        
      case ServiceLifetime.SCOPED:
        // Check if a scope is active
        if (!this.activeScope) {
          throw new Error(`Cannot resolve scoped service '${key}' without an active scope`);
        }
        
        // Get or create scope container
        let scopeContainer = this.scopes.get(this.activeScope);
        if (!scopeContainer) {
          scopeContainer = new Map<string, any>();
          this.scopes.set(this.activeScope, scopeContainer);
        }
        
        // Get or create scoped instance
        if (!scopeContainer.has(key)) {
          scopeContainer.set(key, binding.factory(this, ...args));
        }
        
        return scopeContainer.get(key) as T;
        
      case ServiceLifetime.TRANSIENT:
      default:
        // Always create new instance
        return binding.factory(this, ...args) as T;
    }
  }
  
  /**
   * Get a service (alias for resolve)
   * 
   * @param key Service identifier
   * @param args Optional arguments to pass to the factory
   * @returns The resolved service instance
   */
  public get<T>(key: string, ...args: any[]): T {
    return this.resolve<T>(key, ...args);
  }
  
  /**
   * Check if a service is registered with the container
   * 
   * @param key Service identifier
   * @returns True if the service is registered
   */
  public has(key: string): boolean {
    return this.bindings.has(key) || this.aliases.has(key);
  }
  
  /**
   * Remove a service registration
   * 
   * @param key Service identifier
   * @returns True if the service was removed
   */
  public remove(key: string): boolean {
    // Remove aliases pointing to this key
    for (const [alias, target] of this.aliases.entries()) {
      if (target === key) {
        this.aliases.delete(alias);
      }
    }
    
    return this.bindings.delete(key);
  }
  
  /**
   * Get all registered service keys
   * 
   * @returns Array of service keys
   */
  public getKeys(): string[] {
    return Array.from(this.bindings.keys());
  }
  
  /**
   * Get all services with specific tags
   * 
   * @param tags Tags to filter by
   * @returns Object mapping service keys to instances
   */
  public getByTags(tags: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, binding] of this.bindings.entries()) {
      if (tags.some(tag => binding.tags.includes(tag))) {
        result[key] = this.resolve(key);
      }
    }
    
    return result;
  }
  
  /**
   * Begin a new scope for scoped services
   * 
   * @param scopeId Optional scope identifier
   * @returns Scope ID
   */
  public beginScope(scopeId?: string): string {
    const id = scopeId || `scope_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.activeScope = id;
    return id;
  }
  
  /**
   * End the current scope and dispose of all scoped services
   * 
   * @param scopeId Optional scope ID to validate
   */
  public endScope(scopeId?: string): void {
    if (scopeId && this.activeScope !== scopeId) {
      throw new Error(`Cannot end scope ${scopeId} - current active scope is ${this.activeScope}`);
    }
    
    if (this.activeScope) {
      this.scopes.delete(this.activeScope);
      this.activeScope = null;
    }
  }
  
  /**
   * Execute a function within a scope
   * 
   * @param fn Function to execute within the scope
   * @param scopeId Optional scope identifier
   * @returns The result of the function
   */
  public withScope<T>(fn: (container: ServiceContainer) => T, scopeId?: string): T {
    const id = this.beginScope(scopeId);
    try {
      return fn(this);
    } finally {
      this.endScope(id);
    }
  }
  
  /**
   * Create a child container that inherits this container's registrations
   * 
   * @returns A new child container
   */
  public createChildContainer(): ServiceContainer {
    const child = new ServiceContainer();
    
    // Copy all bindings
    for (const [key, binding] of this.bindings.entries()) {
      child.bindings.set(key, { ...binding });
    }
    
    // Copy all aliases
    for (const [alias, target] of this.aliases.entries()) {
      child.aliases.set(alias, target);
    }
    
    return child;
  }
}