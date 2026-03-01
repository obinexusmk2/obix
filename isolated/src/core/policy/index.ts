/**
 * src/core/policy/index.ts
 * 
 * Main exports for the OBIX policy system.
 * Includes predefined policy rules and core functionality.
 */

// Export types
export * from './types/PolicyTypes';
export * from './types/EnvironmentType';

// Export core functionality
export { policy, withPolicy, applyPolicy, enhanceAdapterWithPolicy } from './decorators/PolicyDecorator';
export { protectComponentMethod, createPolicyEnforcedFactory, createPolicyEnforcedAdapterFactory, withDOPPolicy } from './decorators/FunctionWrapper';
export { PolicyRuleEngine } from './engine/PolicyRuleEngine';
export { PolicyValidationRule } from './engine/ValidationRule';
export { EnvironmentManager } from './environment/EnvironmentManager';
export { EnvironmentCache } from './environment/EnvironmentCache';

// Import core types
import { PolicyRule } from './types/PolicyTypes';
import { EnvironmentType, isLessRestrictiveThan, isMoreRestrictiveThan } from './types/EnvironmentType';

/**
 * Predefined policy rules for common use cases
 */

/**
 * Allows execution only in development environment
 */
export const DEVELOPMENT_ONLY: PolicyRule = {
  id: 'development-only',
  description: 'Only allow execution in development environment',
  condition: (env) => env === EnvironmentType.DEVELOPMENT,
  action: () => console.debug('[Policy] DEVELOPMENT_ONLY rule enforced')
};

/**
 * Blocks execution in production environment
 */
export const PRODUCTION_BLOCKED: PolicyRule = {
  id: 'production-blocked',
  description: 'Block execution in production environment',
  condition: (env) => env !== EnvironmentType.PRODUCTION,
  action: () => console.debug('[Policy] PRODUCTION_BLOCKED rule enforced')
};

/**
 * Allows execution in development or staging environments
 */
export const STAGING_AND_DEV_ONLY: PolicyRule = {
  id: 'staging-and-dev-only',
  description: 'Only allow execution in development or staging environments',
  condition: (env) => env === EnvironmentType.DEVELOPMENT || env === EnvironmentType.STAGING,
  action: () => console.debug('[Policy] STAGING_AND_DEV_ONLY rule enforced')
};

/**
 * Allows execution in all environments except production
 */
export const NON_PRODUCTION_ONLY: PolicyRule = {
  id: 'non-production-only',
  description: 'Only allow execution in non-production environments',
  condition: (env) => env !== EnvironmentType.PRODUCTION,
  action: () => console.debug('[Policy] NON_PRODUCTION_ONLY rule enforced')
};

/**
 * Allows execution in testing environment
 */
export const TESTING_ONLY: PolicyRule = {
  id: 'testing-only',
  description: 'Only allow execution in testing environment',
  condition: (env) => env === EnvironmentType.TESTING,
  action: () => console.debug('[Policy] TESTING_ONLY rule enforced')
};

/**
 * Rule for no restrictions (always allowed)
 */
export const NO_RESTRICTIONS: PolicyRule = {
  id: 'no-restrictions',
  description: 'No restrictions, always allowed',
  condition: () => true,
  action: () => {}
};

/**
 * Protection for operations on personally identifiable information (PII)
 * This rule should be used for components that handle sensitive user data
 */
export const PII_PROTECTION: PolicyRule = {
  id: 'pii-protection',
  description: 'Protects personally identifiable information (PII)',
  condition: (env, context) => {
    // In production, PII operations need explicit context authorization
    if (env === EnvironmentType.PRODUCTION) {
      return context && context.piiAuthorized === true;
    }
    
    // Less restrictive in other environments
    return true;
  },
  action: () => console.debug('[Policy] PII_PROTECTION rule enforced')
};

/**
 * Rule for operations that require admin privileges
 */
export const ADMIN_ONLY: PolicyRule = {
  id: 'admin-only',
  description: 'Only allowed for admin users',
  condition: (env, context) => {
    // Check context for user role
    if (context && context.user && context.user.roles) {
      return context.user.roles.includes('admin');
    }
    
    // Allow in development for testing
    if (env === EnvironmentType.DEVELOPMENT) {
      return true;
    }
    
    return false;
  },
  action: () => console.debug('[Policy] ADMIN_ONLY rule enforced')
};

/**
 * Creates an environment restriction rule
 * 
 * @param allowedEnvironments Environments where execution is allowed
 * @param id Custom rule ID
 * @param description Custom rule description
 * @returns Policy rule
 */
export function createEnvironmentRule(
  allowedEnvironments: EnvironmentType[],
  id: string = 'custom-environment-rule',
  description: string = 'Custom environment restriction rule'
): PolicyRule {
  return {
    id,
    description,
    condition: (env) => allowedEnvironments.includes(env),
    action: () => console.debug(`[Policy] ${id} rule enforced`)
  };
}

/**
 * Creates a feature flag rule
 * 
 * @param featureFlag Feature flag name
 * @param id Custom rule ID
 * @param description Custom rule description
 * @returns Policy rule
 */
export function createFeatureFlagRule(
  featureFlag: string,
  id: string = `feature-flag-${featureFlag}`,
  description: string = `Requires feature flag ${featureFlag} to be enabled`
): PolicyRule {
  return {
    id,
    description,
    condition: (env, context) => {
      // Check context for feature flags
      if (context && context.featureFlags) {
        return context.featureFlags[featureFlag] === true;
      }
      
      // Allow in development for testing
      if (env === EnvironmentType.DEVELOPMENT) {
        return true;
      }
      
      return false;
    },
    action: () => console.debug(`[Policy] Feature flag ${featureFlag} rule enforced`)
  };
}

/**
 * Creates a role-based access control rule
 * 
 * @param allowedRoles Roles that are allowed
 * @param id Custom rule ID
 * @param description Custom rule description
 * @returns Policy rule
 */
export function createRoleRule(
  allowedRoles: string[],
  id: string = 'custom-role-rule',
  description: string = 'Custom role-based access control rule'
): PolicyRule {
  return {
    id,
    description,
    condition: (env, context) => {
      // Check context for user role
      if (context && context.user && context.user.roles) {
        return allowedRoles.some(role => context.user.roles.includes(role));
      }
      
      // Allow in development for testing
      if (env === EnvironmentType.DEVELOPMENT) {
        return true;
      }
      
      return false;
    },
    action: () => console.debug(`[Policy] ${id} rule enforced for roles: ${allowedRoles.join(', ')}`)
  };
}

/**
 * Creates a composite policy rule using AND logic
 * 
 * @param rules Rules to combine
 * @param id Custom rule ID
 * @param description Custom rule description
 * @returns Combined policy rule
 */
export function combineRules(
  rules: PolicyRule[],
  id: string = 'composite-rule',
  description: string = 'Composite policy rule (AND)'
): PolicyRule {
  return {
    id,
    description,
    condition: (env, context) => {
      // All rules must pass
      for (const rule of rules) {
        if (!rule.condition(env, context)) {
          return false;
        }
      }
      return true;
    },
    action: () => {
      console.debug(`[Policy] Composite rule ${id} enforced`);
      // Execute all actions
      rules.forEach(rule => rule.action());
    }
  };
}

/**
 * Creates a composite policy rule using OR logic
 * 
 * @param rules Rules to combine
 * @param id Custom rule ID
 * @param description Custom rule description
 * @returns Combined policy rule
 */
export function combineRulesOr(
  rules: PolicyRule[],
  id: string = 'composite-or-rule',
  description: string = 'Composite policy rule (OR)'
): PolicyRule {
  return {
    id,
    description,
    condition: (env, context) => {
      // At least one rule must pass
      return rules.some(rule => rule.condition(env, context));
    },
    action: () => {
      console.debug(`[Policy] Composite OR rule ${id} enforced`);
      // Find the first passing rule to execute its action
      const passingRule = rules.find(rule => rule.condition(env, {}));
      if (passingRule) {
        passingRule.action();
      }
    }
  };
}