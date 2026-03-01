// src/core/policy/PolicyDecorator.ts

/**
 * Policy configuration for a method
 */
export interface PolicyConfig {
  [environment: string]: {
    prevent?: boolean;
    log?: boolean;
    audit?: boolean;
    validateBefore?: boolean;
    validateAfter?: boolean;
  }
}

/**
 * Decorator to apply policy to a method
 * 
 * @param config Policy configuration
 */
export function policy(config: PolicyConfig) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function(...args: any[]) {
      const env = process.env.NODE_ENV || 'development';
      const envConfig = config[env] || {};
      
      // Check if operation should be prevented
      if (envConfig.prevent) {
        console.warn(`Operation ${propertyKey} prevented by policy in ${env} environment`);
        throw new Error(`Operation prevented by policy in ${env} environment`);
      }
      
      // Log if configured
      if (envConfig.log) {
        console.info(`Policy: ${propertyKey} called in ${env} environment`, {
          class: target.constructor.name,
          args: args.map(arg => arg instanceof Object ? '[Object]' : arg)
        });
      }
      
      // Audit if configured
      if (envConfig.audit) {
        console.info(`AUDIT: ${propertyKey} called`, {
          timestamp: new Date().toISOString(),
          environment: env,
          class: target.constructor.name,
          method: propertyKey,
          args: JSON.stringify(args)
        });
      }
      
      // Call the original method
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}