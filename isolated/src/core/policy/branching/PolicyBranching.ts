/**
 * src/core/policy/branching/PolicyBranching.ts
 * 
 * Advanced policy branching system to handle complex conditional logic 
 * and function routing based on policy evaluations.
 */

import { PolicyRule, PolicyResult } from '../types/PolicyTypes';
import { EnvironmentType } from '../types/EnvironmentType';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { PolicyRuleEngine } from '../engine/PolicyRuleEngine';

/**
 * Branch condition for decision making
 */
export type BranchCondition = (context?: any) => boolean;

/**
 * Branch handler function
 */
export type BranchHandler<T = any, R = any> = (input: T, context?: any) => R;

/**
 * Function to execute when policy check fails
 */
export type FallbackHandler<T = any, R = any> = (
  input: T, 
  result: PolicyResult, 
  context?: any
) => R;

/**
 * Branch configuration
 */
export interface PolicyBranch<T = any, R = any> {
  /**
   * Branch name for identification
   */
  name: string;
  
  /**
   * Policy rules to evaluate
   */
  rules: PolicyRule[] | PolicyRule;
  
  /**
   * Additional condition beyond policy rules
   */
  condition?: BranchCondition;
  
  /**
   * Handler to execute when branch is taken
   */
  handler: BranchHandler<T, R>;
  
  /**
   * Priority for evaluation order (higher first)
   */
  priority?: number;
  
  /**
   * Metadata for the branch
   */
  metadata?: Record<string, any>;
}

/**
 * Configuration for if-else policy structure
 */
export interface PolicyIfElseConfig<T = any, R = any> {
  /**
   * Condition branch (if)
   */
  if: PolicyRule[] | PolicyRule | BranchCondition;
  
  /**
   * Handler for if branch
   */
  then: BranchHandler<T, R>;
  
  /**
   * Optional else-if branches
   */
  elseIf?: Array<{
    condition: PolicyRule[] | PolicyRule | BranchCondition;
    handler: BranchHandler<T, R>;
  }>;
  
  /**
   * Handler for else branch
   */
  else?: BranchHandler<T, R>;
  
  /**
   * Context to pass to conditions and handlers
   */
  context?: any;
}

/**
 * Class for complex policy branching and routing
 */
export class PolicyBranching<T = any, R = any> {
  private branches: PolicyBranch<T, R>[] = [];
  private environmentManager: EnvironmentManager;
  private ruleEngine: PolicyRuleEngine;
  private fallbackHandler?: FallbackHandler<T, R>;
  
  /**
   * Create a new policy branching instance
   */
  constructor() {
    this.environmentManager = EnvironmentManager.getInstance();
    this.ruleEngine = new PolicyRuleEngine();
  }
  
  /**
   * Add a branch to the branching logic
   * 
   * @param branch Branch to add
   * @returns This instance for method chaining
   */
  public addBranch(branch: PolicyBranch<T, R>): PolicyBranching<T, R> {
    this.branches.push(branch);
    return this;
  }
  
  /**
   * Set the fallback handler for when no branch matches
   * 
   * @param handler Fallback handler
   * @returns This instance for method chaining
   */
  public setFallback(handler: FallbackHandler<T, R>): PolicyBranching<T, R> {
    this.fallbackHandler = handler;
    return this;
  }
  
  /**
   * Remove a branch by name
   * 
   * @param name Branch name
   * @returns True if branch was removed
   */
  public removeBranch(name: string): boolean {
    const initialLength = this.branches.length;
    this.branches = this.branches.filter(branch => branch.name !== name);
    return initialLength !== this.branches.length;
  }
  
  /**
   * Evaluate all branches and execute the first matching one
   * 
   * @param input Input to pass to branch handler
   * @param context Optional context for evaluation
   * @returns Result from branch handler
   */
  public execute(input: T, context?: any): R {
    // Get current environment
    const currentEnv = this.environmentManager.getCurrentEnvironment();
    
    // Sort branches by priority (higher first)
    const sortedBranches = [...this.branches].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );
    
    // Evaluate branches
    for (const branch of sortedBranches) {
      const ruleList = Array.isArray(branch.rules) ? branch.rules : [branch.rules];
      
      // Evaluate policy rules
      const result = this.ruleEngine.evaluateRules(ruleList, currentEnv, context);
      
      // Check additional condition if provided
      const conditionPassed = !branch.condition || branch.condition(context);
      
      // Take this branch if policy and condition pass
      if (result.allowed && conditionPassed) {
        return branch.handler(input, context);
      }
      
      // If we got here, the branch didn't match
    }
    
    // No branch matched, use fallback or return undefined
    if (this.fallbackHandler) {
      // Create a "failure" result since we don't have a specific one
      const failureResult: PolicyResult = {
        allowed: false,
        reason: 'No policy branch matched'
      };
      
      return this.fallbackHandler(input, failureResult, context);
    }
    
    return undefined as unknown as R;
  }
  
  /**
   * Create a policy branching from if-else configuration
   * 
   * @param config If-else configuration
   * @returns Policy branching instance
   */
  public static fromIfElse<T = any, R = any>(
    config: PolicyIfElseConfig<T, R>
  ): PolicyBranching<T, R> {
    const branching = new PolicyBranching<T, R>();
    
    // Add 'if' branch
    branching.addBranch({
      name: 'if',
      rules: typeof config.if === 'function' 
        ? { 
            id: 'dynamic-condition', 
            description: 'Dynamic condition',
            condition: () => true,
            action: () => {}
          } 
        : config.if,
      condition: typeof config.if === 'function' ? config.if : undefined,
      handler: config.then,
      priority: 100
    });
    
    // Add 'else-if' branches
    if (config.elseIf) {
      config.elseIf.forEach((elseIfBranch, index) => {
        branching.addBranch({
          name: `elseif-${index}`,
          rules: typeof elseIfBranch.condition === 'function'
            ? {
                id: `dynamic-condition-${index}`,
                description: `Dynamic condition ${index}`,
                condition: () => true,
                action: () => {}
              }
            : elseIfBranch.condition,
          condition: typeof elseIfBranch.condition === 'function' 
            ? elseIfBranch.condition 
            : undefined,
          handler: elseIfBranch.handler,
          priority: 100 - (index + 1)
        });
      });
    }
    
    // Add 'else' branch if provided
    if (config.else) {
      branching.addBranch({
        name: 'else',
        rules: {
          id: 'always-true',
          description: 'Always true condition',
          condition: () => true,
          action: () => {}
        },
        handler: config.else,
        priority: -100 // Lowest priority to ensure it runs last
      });
    }
    
    return branching;
  }
  
  /**
   * Create an if-else structure based on policy rules
   * 
   * @param ifCondition Policy rules for if condition
   * @param thenHandler Handler for then branch
   * @param elseHandler Handler for else branch
   * @returns Function that evaluates conditions and routes
   */
  public static ifElse<T = any, R = any>(
    ifCondition: PolicyRule[] | PolicyRule | BranchCondition,
    thenHandler: BranchHandler<T, R>,
    elseHandler?: BranchHandler<T, R>
  ): (input: T, context?: any) => R {
    return (input: T, context?: any) => {
      const branching = PolicyBranching.fromIfElse<T, R>({
        if: ifCondition,
        then: thenHandler,
        else: elseHandler
      });
      
      return branching.execute(input, context);
    };
  }
  
  /**
   * Create a switch-case structure based on policy rules
   * 
   * @param cases Map of case names to conditions and handlers
   * @param defaultHandler Default handler if no case matches
   * @returns Function that evaluates conditions and routes
   */
  public static switch<T = any, R = any>(
    cases: Array<{
      name: string;
      condition: PolicyRule[] | PolicyRule | BranchCondition;
      handler: BranchHandler<T, R>;
    }>,
    defaultHandler?: BranchHandler<T, R>
  ): (input: T, context?: any) => R {
    return (input: T, context?: any) => {
      const branching = new PolicyBranching<T, R>();
      
      // Add cases as branches
      cases.forEach((caseItem, index) => {
        branching.addBranch({
          name: caseItem.name,
          rules: typeof caseItem.condition === 'function'
            ? {
                id: `dynamic-case-${index}`,
                description: `Dynamic case condition ${index}`,
                condition: () => true,
                action: () => {}
              }
            : caseItem.condition,
          condition: typeof caseItem.condition === 'function' 
            ? caseItem.condition 
            : undefined,
          handler: caseItem.handler
        });
      });
      
      // Add default case if provided
      if (defaultHandler) {
        branching.addBranch({
          name: 'default',
          rules: {
            id: 'always-true',
            description: 'Always true condition',
            condition: () => true,
            action: () => {}
          },
          handler: defaultHandler,
          priority: -100 // Lowest priority to ensure it runs last
        });
      }
      
      return branching.execute(input, context);
    };
  }
  
  /**
   * Execute different functions based on environment
   * 
   * @param handlers Map of environment types to handlers
   * @param defaultHandler Default handler if no environment matches
   * @returns Function that routes based on environment
   */
  public static byEnvironment<T = any, R = any>(
    handlers: Partial<Record<EnvironmentType, BranchHandler<T, R>>>,
    defaultHandler?: BranchHandler<T, R>
  ): (input: T, context?: any) => R {
    return (input: T, context?: any) => {
      const branching = new PolicyBranching<T, R>();
      const environmentManager = EnvironmentManager.getInstance();
      const currentEnv = environmentManager.getCurrentEnvironment();
      
      // Use handler for current environment if available
      const handler = handlers[currentEnv];
      if (handler) {
        return handler(input, context);
      }
      
      // Use default handler if provided
      if (defaultHandler) {
        return defaultHandler(input, context);
      }
      
      return undefined as unknown as R;
    };
  }
  
  /**
   * Create a policy-based routing function (unless pattern)
   * 
   * @param defaultHandler Default handler
   * @param unlessCondition Condition to not execute default handler
   * @param alternativeHandler Handler to use when condition is true
   * @returns Function that implements the unless pattern
   */
  public static unless<T = any, R = any>(
    defaultHandler: BranchHandler<T, R>,
    unlessCondition: PolicyRule[] | PolicyRule | BranchCondition,
    alternativeHandler: BranchHandler<T, R>
  ): (input: T, context?: any) => R {
    return PolicyBranching.ifElse<T, R>(
      unlessCondition,
      alternativeHandler,
      defaultHandler
    );
  }
}