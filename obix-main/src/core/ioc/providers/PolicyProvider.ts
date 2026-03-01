/**
 * src/core/ioc/providers/PolicyProvider.ts
 * 
 * IOC provider for policy system services.
 * Registers policy-related services with the IOC container.
 */

import { ServiceProvider } from './ServiceRegistry'
import { ServiceContainer } from '../ServiceContainer'
import { EnvironmentManager } from '../../policy/environment/EnvironmentManager';
import { PolicyRuleEngine } from '../../policy/engine/PolicyRuleEngine';
import { DynamicPolicyLoader, PolicyConfigSource } from '../../policy/loading/DynamicPolicyLoader';
import { PolicyViolationReporter } from '../../policy/reporting/PolicyViolationReporter';
import { PolicyBranching } from '../../policy/branching/PolicyBranching';
import { PolicyValidationRule } from '../../policy/engine/ValidationRule';
import { DEVELOPMENT_ONLY, PRODUCTION_BLOCKED, PII_PROTECTION, ADMIN_ONLY } from '../../policy';

/**
 * Policy system service provider
 * 
 * Registers policy-related services with the IOC container.
 * Integrates with the OBIX framework's dependency injection system
 * to provide access to policy components throughout the application.
 */
export class PolicyProvider implements ServiceProvider {
  /**
   * Register policy services with the container
   * 
   * @param container Service container
   */
  public register(container: ServiceContainer): void {
    // Register environment manager as a singleton
    container.singleton('policy.environmentManager', () => {
      return EnvironmentManager.getInstance();
    });
    
    // Register policy rule engine
    container.singleton('policy.ruleEngine', () => {
      return new PolicyRuleEngine();
    });
    
    // Register dynamic policy loader
    container.singleton('policy.loader', () => {
      return DynamicPolicyLoader.getInstance({
        defaultSource: this.determineConfigSource(),
        envVarPrefix: 'OBIX_POLICY_',
        enableCache: true,
        cacheTTL: 60000, // 1 minute
        refreshInterval: 300000 // 5 minutes
      });
    });
    
    // Register policy violation reporter
    container.singleton('policy.reporter', () => {
      return PolicyViolationReporter.getInstance({
        enableConsoleReporting: true,
        enableAnalyticsReporting: process.env.OBIX_POLICY_ANALYTICS === 'true',
        enableAlertNotifications: process.env.OBIX_POLICY_ALERTS === 'true',
        throttleReporting: true
      });
    });
    
    // Register policy branching system
    container.singleton('policy.branching', () => {
      return new PolicyBranching();
    });
    
    // Register predefined policies
    container.singleton('policy.rules', async (container) => {
      const loader = container.resolve<DynamicPolicyLoader>('policy.loader');
      const policies = new Map<string, PolicyRule>();
      
      // Add built-in policies
      policies.set('development-only', DEVELOPMENT_ONLY);
      policies.set('production-blocked', PRODUCTION_BLOCKED);
      policies.set('pii-protection', PII_PROTECTION);
      policies.set('admin-only', ADMIN_ONLY);
      
      try {
        // Load dynamic policies
        const dynamicPolicies = await loader.loadPolicies();
        
        // Merge with predefined policies (dynamic policies override built-ins)
        for (const [id, policy] of dynamicPolicies.entries()) {
          policies.set(id, policy);
        }
      } catch (error) {
        console.error('Error loading dynamic policies:', error);
      }
      
      return policies;
    });
    
    // Register policy validation rules
    container.singleton('policy.validationRules', (container) => {
      const policies = container.resolve<Map<string, PolicyRule>>('policy.rules');
      const validationRules = new Map<string, PolicyValidationRule>();
      
      // Convert policy rules to validation rules
      for (const [id, policy] of policies.entries()) {
        const validationRule = new PolicyValidationRule(policy);
        validationRules.set(validationRule.getId(), validationRule);
      }
      
      return validationRules;
    });
    
    // Register environment detection overrides
    if (process.env.OBIX_ENVIRONMENT) {
      const envManager = EnvironmentManager.getInstance();
      const envValue = process.env.OBIX_ENVIRONMENT.toLowerCase();
      
      switch (envValue) {
        case 'development':
        case 'dev':
          envManager.setEnvironment(EnvironmentType.DEVELOPMENT);
          break;
        case 'testing':
        case 'test':
          envManager.setEnvironment(EnvironmentType.TESTING);
          break;
        case 'staging':
        case 'stage':
          envManager.setEnvironment(EnvironmentType.STAGING);
          break;
        case 'production':
        case 'prod':
          envManager.setEnvironment(EnvironmentType.PRODUCTION);
          break;
      }
    }
  }
  
  /**
   * Additional provider setup after registration
   * 
   * @param container Service container
   */
  public boot(container: ServiceContainer): void {
    // Get the reporter for logging
    const reporter = container.resolve<PolicyViolationReporter>('policy.reporter');
    const envManager = container.resolve<EnvironmentManager>('policy.environmentManager');
    
    // Log the current environment
    console.debug(`[OBIX Policy] Environment: ${envManager.getCurrentEnvironment()}`);
    
    // Set up any global event listeners or hooks
    if (typeof window !== 'undefined' && envManager.isProduction()) {
      // In browser production environment, listen for unhandled errors
      window.addEventListener('error', (event) => {
        // Report unhandled errors as potential policy violations
        const result = {
          allowed: false,
          reason: `Unhandled error: ${event.message}`,
          rule: {
            id: 'runtime-error',
            description: 'Runtime error occurred',
            condition: () => false,
            action: () => {}
          }
        };
        
        reporter.reportViolation(
          result,
          { error: event.error, filename: event.filename, lineno: event.lineno },
          'ERROR',
          'window.onerror'
        );
        
        return false; // Don't prevent default handling
      });
    }
  }
  
  /**
   * Determines the configuration source based on environment
   * 
   * @private
   * @returns The appropriate configuration source
   */
  private determineConfigSource(): PolicyConfigSource {
    if (process.env.OBIX_POLICY_SOURCE) {
      const source = process.env.OBIX_POLICY_SOURCE.toLowerCase();
      
      switch (source) {
        case 'env':
        case 'environment':
          return PolicyConfigSource.ENVIRONMENT_VARIABLES;
        case 'file':
        case 'config':
          return PolicyConfigSource.CONFIG_FILE;
        case 'api':
        case 'remote':
          return PolicyConfigSource.REMOTE_API;
        case 'storage':
        case 'local':
          return PolicyConfigSource.LOCAL_STORAGE;
      }
    }
    
    // Default based on environment
    if (typeof window !== 'undefined') {
      // Browser environment, try local storage
      return PolicyConfigSource.LOCAL_STORAGE;
    } else {
      // Node.js environment, use environment variables
      return PolicyConfigSource.ENVIRONMENT_VARIABLES;
    }
  }
}