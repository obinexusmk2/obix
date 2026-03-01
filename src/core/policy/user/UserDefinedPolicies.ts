/**
 * src/core/policy/user/UserDefinedPolicies.ts
 * 
 * Allows users to define custom policy rules and DSL for policy expressions.
 * This module provides a high-level abstraction for creating custom policies.
 */

import { PolicyRule } from '../types/PolicyTypes';
import { EnvironmentType } from '../types/EnvironmentType';
import { PolicyBranching, BranchHandler } from '../branching/PolicyBranching';

/**
 * Custom policy builder for creating readable policy definitions
 */
export class PolicyBuilder {
  private rules: PolicyRule[] = [];
  private description: string = '';
  private id: string = '';
  
  /**
   * Start building a new policy
   * 
   * @param id Policy ID
   * @returns Policy builder instance
   */
  public static policy(id: string): PolicyBuilder {
    const builder = new PolicyBuilder();
    builder.id = id;
    return builder;
  }
  
  /**
   * Set policy description
   * 
   * @param description Policy description
   * @returns This builder instance
   */
  public describedAs(description: string): PolicyBuilder {
    this.description = description;
    return this;
  }
  
  /**
   * Define policy to only allow in specific environments
   * 
   * @param environments Allowed environments
   * @returns This builder instance
   */
  public allowIn(...environments: EnvironmentType[]): PolicyBuilder {
    this.rules.push({
      id: `${this.id}-environment`,
      description: `Allow only in ${environments.join(', ')}`,
      condition: (env) => environments.includes(env),
      action: () => console.debug(`[Policy] Environment restriction enforced: ${environments.join(', ')}`)
    });
    return this;
  }
  
  /**
   * Define policy to block in specific environments
   * 
   * @param environments Blocked environments
   * @returns This builder instance
   */
  public blockIn(...environments: EnvironmentType[]): PolicyBuilder {
    this.rules.push({
      id: `${this.id}-environment-block`,
      description: `Block in ${environments.join(', ')}`,
      condition: (env) => !environments.includes(env),
      action: () => console.debug(`[Policy] Environment blocking enforced: ${environments.join(', ')}`)
    });
    return this;
  }
  
  /**
   * Require specific roles for the policy
   * 
   * @param roles Required roles
   * @returns This builder instance
   */
  public requireRoles(...roles: string[]): PolicyBuilder {
    this.rules.push({
      id: `${this.id}-roles`,
      description: `Require roles: ${roles.join(', ')}`,
      condition: (env, context) => {
        // Always allow in development for easier testing
        if (env === EnvironmentType.DEVELOPMENT) {
          return true;
        }
        
        // Check context for user roles
        if (context && context.user && context.user.roles) {
          return roles.some(role => context.user.roles.includes(role));
        }
        
        return false;
      },
      action: () => console.debug(`[Policy] Role requirement enforced: ${roles.join(', ')}`)
    });
    return this;
  }
  
  /**
   * Require feature flag to be enabled
   * 
   * @param flagName Feature flag name
   * @returns This builder instance
   */
  public requireFeatureFlag(flagName: string): PolicyBuilder {
    this.rules.push({
      id: `${this.id}-feature-flag`,
      description: `Require feature flag: ${flagName}`,
      condition: (env, context) => {
        // Always allow in development for easier testing
        if (env === EnvironmentType.DEVELOPMENT) {
          return true;
        }
        
        // Check context for feature flags
        if (context && context.featureFlags) {
          return context.featureFlags[flagName] === true;
        }
        
        return false;
      },
      action: () => console.debug(`[Policy] Feature flag requirement enforced: ${flagName}`)
    });
    return this;
  }
  
  /**
   * Add a custom condition
   * 
   * @param conditionId Condition ID
   * @param description Condition description
   * @param conditionFn Condition function
   * @returns This builder instance
   */
  public where(
    conditionId: string,
    description: string,
    conditionFn: (env: EnvironmentType, context?: any) => boolean
  ): PolicyBuilder {
    this.rules.push({
      id: `${this.id}-${conditionId}`,
      description,
      condition: conditionFn,
      action: () => console.debug(`[Policy] Custom condition enforced: ${description}`)
    });
    return this;
  }
  
  /**
   * Add authorization check for PII data
   * 
   * @returns This builder instance
   */
  public requirePIIAuthorization(): PolicyBuilder {
    this.rules.push({
      id: `${this.id}-pii`,
      description: 'Require PII data authorization',
      condition: (env, context) => {
        // Less strict in non-production environments
        if (env !== EnvironmentType.PRODUCTION) {
          return true;
        }
        
        // In production, require explicit PII authorization
        return context && context.piiAuthorized === true;
      },
      action: () => console.debug('[Policy] PII authorization enforced')
    });
    return this;
  }
  
  /**
   * Build the finalized policy rule
   * 
   * @returns Policy rule that combines all conditions
   */
  public build(): PolicyRule {
    if (this.rules.length === 0) {
      throw new Error('Cannot build a policy with no conditions');
    }
    
    // Use the description if provided, otherwise generate from rules
    const finalDescription = this.description || 
      `Policy ${this.id}: ${this.rules.map(r => r.description).join(' AND ')}`;
    
    // Return a composite rule
    return {
      id: this.id,
      description: finalDescription,
      // All conditions must pass (AND logic)
      condition: (env, context) => {
        for (const rule of this.rules) {
          if (!rule.condition(env, context)) {
            return false;
          }
        }
        return true;
      },
      // Execute all actions
      action: () => {
        console.debug(`[Policy] Composite policy ${this.id} enforced`);
        for (const rule of this.rules) {
          rule.action();
        }
      }
    };
  }
}

/**
 * Interface for unless pattern
 */
export interface UnlessExpression<T = any, R = any> {
  /**
   * Define the condition for the unless pattern
   * 
   * @param condition Condition function
   * @returns Unless handler interface
   */
  condition(condition: PolicyRule | ((context?: any) => boolean)): UnlessHandler<T, R>;
}

/**
 * Interface for unless handler
 */
export interface UnlessHandler<T = any, R = any> {
  /**
   * Define the alternative handler for the unless pattern
   * 
   * @param handler Handler function
   * @returns Complete unless expression
   */
  then(handler: BranchHandler<T, R>): (input: T, context?: any) => R;
}

/**
 * DSL for user-defined policy expressions
 */
export const Policy = {
  /**
   * Create a policy builder
   * 
   * @param id Policy ID
   * @returns Policy builder
   */
  define: (id: string) => PolicyBuilder.policy(id),
  
  /**
   * Create an if expression
   * 
   * @param condition Policy condition
   * @returns Then handler interface
   */
  if: <T = any, R = any>(condition: PolicyRule | ((context?: any) => boolean)) => ({
    /**
     * Define the handler for when condition is true
     * 
     * @param handler Handler function
     * @returns Else handler interface
     */
    then: (handler: BranchHandler<T, R>) => ({
      /**
       * Define the handler for when condition is false
       * 
       * @param handler Handler function
       * @returns Complete if-else expression
       */
      else: (elseHandler: BranchHandler<T, R>) => 
        PolicyBranching.ifElse<T, R>(condition, handler, elseHandler),
      
      /**
       * Create the if-then expression without else
       * 
       * @returns If-then function
       */
      build: () => PolicyBranching.ifElse<T, R>(condition, handler)
    })
  }),
  
  /**
   * Create an unless expression
   * 
   * @param defaultHandler Default handler
   * @returns Unless expression interface
   */
  unless: <T = any, R = any>(defaultHandler: BranchHandler<T, R>): UnlessExpression<T, R> => ({
    /**
     * Define the condition for the unless pattern
     * 
     * @param condition Condition function
     * @returns Unless handler interface
     */
    condition: (condition: PolicyRule | ((context?: any) => boolean)): UnlessHandler<T, R> => ({
      /**
       * Define the alternative handler for the unless pattern
       * 
       * @param handler Handler function
       * @returns Complete unless expression
       */
      then: (handler: BranchHandler<T, R>) => 
        PolicyBranching.unless<T, R>(defaultHandler, condition, handler)
    })
  }),
  
  /**
   * Create a switch expression
   * 
   * @param cases Switch cases
   * @param defaultCase Default case
   * @returns Switch function
   */
  switch: <T = any, R = any>(
    cases: Array<{
      name: string;
      condition: PolicyRule | ((context?: any) => boolean);
      handler: BranchHandler<T, R>;
    }>,
    defaultCase?: BranchHandler<T, R>
  ) => PolicyBranching.switch<T, R>(cases, defaultCase),
  
  /**
   * Create an environment-based routing function
   * 
   * @param handlers Map of environment to handlers
   * @param defaultHandler Default handler
   * @returns Environment routing function
   */
  byEnvironment: <T = any, R = any>(
    handlers: Partial<Record<EnvironmentType, BranchHandler<T, R>>>,
    defaultHandler?: BranchHandler<T, R>
  ) => PolicyBranching.byEnvironment<T, R>(handlers, defaultHandler)
};

/**
 * Examples of using the Policy DSL
 */

// Example 1: Define a policy using the builder
export const examplePolicy = Policy.define('admin-feature')
  .describedAs('Only allow admins to access this feature')
  .blockIn(EnvironmentType.PRODUCTION)
  .requireRoles('admin')
  .build();

// Example 2: Using if-else expression
export const processData = <T>(data: T, context?: any) => 
  Policy.if(examplePolicy).then(
    (data) => {
      // Process data with full access
      return data;
    }
  ).else(
    (data) => {
      // Process data with restricted access
      return data;
    }
  )(data, context);

// Example 3: Using unless pattern
export const sendNotification = (message: string, context?: any) =>
  Policy.unless(
    (message) => {
      // Default behavior
      console.log(`Sending notification: ${message}`);
      return true;
    }
  ).condition(
    (context) => context?.user?.status === 'blocked'
  ).then(
    (message) => {
      // Alternative behavior
      console.log(`Notification blocked: ${message}`);
      return false;
    }
  )(message, context);

// Example 4: Using switch
export const routeRequest = <T>(request: T, context?: any) =>
  Policy.switch([
    {
      name: 'admin',
      condition: (context) => context?.user?.role === 'admin',
      handler: (request) => {
        // Admin handler
        return { ...request, route: 'admin' };
      }
    },
    {
      name: 'editor',
      condition: (context) => context?.user?.role === 'editor',
      handler: (request) => {
        // Editor handler
        return { ...request, route: 'editor' };
      }
    }
  ], 
  (request) => {
    // Default handler
    return { ...request, route: 'user' };
  })(request, context);

// Example 5: Using environment routing
export const getDataSource = <T>(query: T, context?: any) =>
  Policy.byEnvironment({
    [EnvironmentType.DEVELOPMENT]: (query) => {
      // Development data source
      return { ...query, source: 'dev-db' };
    },
    [EnvironmentType.TESTING]: (query) => {
      // Testing data source
      return { ...query, source: 'test-db' };
    },
    [EnvironmentType.PRODUCTION]: (query) => {
      // Production data source
      return { ...query, source: 'prod-db' };
    }
  }, 
  (query) => {
    // Default data source
    return { ...query, source: 'fallback-db' };
  })(query, context);