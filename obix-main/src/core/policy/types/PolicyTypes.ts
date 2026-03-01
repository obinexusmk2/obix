/**
 * src/core/policy/types/PolicyTypes.ts
 * 
 * Type definitions for the policy enforcement system.
 */

import { EnvironmentType } from './EnvironmentType';
import { Component } from '@core/api/shared/components/ComponentInterface';

// Define ComponentType as a constructor type for Component
export type ComponentType<P = any> = new (props: P) => Component<any, any>;

/**
 * Policy rule interface
 */
export interface PolicyRule {
  /**
   * Unique identifier for the rule
   */
  id: string;
  
  /**
   * Human-readable description of the rule
   */
  description: string;
  
  /**
   * Condition function that determines if the rule is satisfied
   * Returns true if the condition is met (action allowed)
   * Returns false if the condition is not met (action blocked)
   * 
   * @param env Current execution environment
   * @param context Additional context for evaluation
   */
  condition: (env: EnvironmentType, context?: any) => boolean;
  
  /**
   * Action to take when the rule is evaluated
   * This is primarily used for side effects like logging
   */
  action: () => void;
  
  /**
   * Optional context requirements
   * Specifies what context properties are required for rule evaluation
   */
  contextRequirements?: string[];
  
  /**
   * Optional metadata for the rule
   */
  metadata?: Record<string, any>;
}

/**
 * Result of policy evaluation
 */
export interface PolicyResult {
  /**
   * Whether the action is allowed by policy
   */
  allowed: boolean;
  
  /**
   * Reason for denial if not allowed
   */
  reason?: string;
  
  /**
   * Rule that caused the denial if not allowed
   */
  rule?: PolicyRule;
  
  /**
   * Optional metadata about the evaluation
   */
  metadata?: Record<string, any>;
}

/**
 * Options for policy enforcement
 */
export interface PolicyOptions {
  /**
   * Whether to throw an error on policy violation
   */
  throwOnViolation?: boolean;
  
  /**
   * Whether to log policy violations
   */
  logViolations?: boolean;
  
  /**
   * Whether to enforce all rules strictly
   * If false, some rules may be treated as warnings
   */
  enforceStrict?: boolean;
  
  /**
   * Custom environment to use for evaluation
   * Overrides the detected environment
   */
  customEnvironment?: EnvironmentType;
  
  /**
   * Fallback value to return on policy violation
   */
  fallbackValue?: any;
  
  /**
   * Fallback component to render on policy violation
   */
  fallbackComponent?: ComponentType<any>;
  
  /**
   * Time-to-live for policy evaluation cache in milliseconds
   */
  cacheTTL?: number;
}

/**
 * Component with policy enforcement
 */
export interface PolicyEnforcedComponent<S = any, E extends string = string> extends Component<S, E> {
  /**
   * Adds a policy rule to the component
   * 
   * @param rule Policy rule to add
   */
  addPolicyRule(rule: PolicyRule): void;
  
  /**
   * Removes a policy rule from the component
   * 
   * @param ruleId ID of the rule to remove
   * @returns True if the rule was removed
   */
  removePolicyRule(ruleId: string): boolean;
  
  /**
   * Gets all policy rules for the component
   * 
   * @returns Array of policy rules
   */
  getPolicyRules(): PolicyRule[];
  
  /**
   * Evaluates all policy rules for the component
   * 
   * @param context Additional context for evaluation
   * @returns Policy evaluation result
   */
  evaluatePolicy(context?: any): PolicyResult;
}

/**
 * Factory function for creating common policy rules
 */
export interface PolicyRuleFactory {
  /**
   * Creates an environment restriction rule
   * 
   * @param environments Allowed environments
   * @param id Rule ID
   * @param description Rule description
   * @returns Policy rule
   */
  createEnvironmentRule(
    environments: EnvironmentType[],
    id: string,
    description: string
  ): PolicyRule;
  
  /**
   * Creates a role-based access control rule
   * 
   * @param allowedRoles Allowed roles
   * @param id Rule ID
   * @param description Rule description
   * @returns Policy rule
   */
  createRoleRule(
    allowedRoles: string[],
    id: string,
    description: string
  ): PolicyRule;
  
  /**
   * Creates a feature flag rule
   * 
   * @param featureFlag Feature flag name
   * @param id Rule ID
   * @param description Rule description
   * @returns Policy rule
   */
  createFeatureRule(
    featureFlag: string,
    id: string,
    description: string
  ): PolicyRule;
  
  /**
   * Creates a data sensitivity rule
   * 
   * @param sensitivityLevel Required sensitivity level
   * @param id Rule ID
   * @param description Rule description
   * @returns Policy rule
   */
  createDataSensitivityRule(
    sensitivityLevel: string,
    id: string,
    description: string
  ): PolicyRule;
}

/**
 * Data sensitivity levels for sensitive data handling
 */
export enum DataSensitivityLevel {
  /**
   * Public data with no sensitivity
   */
  PUBLIC = 'public',
  
  /**
   * Internal data not meant for public consumption
   */
  INTERNAL = 'internal',
  
  /**
   * Sensitive data requiring careful handling
   */
  SENSITIVE = 'sensitive',
  
  /**
   * Highly sensitive data with strict access controls
   */
  HIGHLY_SENSITIVE = 'highly_sensitive',
  
  /**
   * Personally identifiable information
   */
  PII = 'pii'
}

/**
 * Component lifecycle phase requiring policy enforcement
 */
export enum PolicyEnforcementPhase {
  /**
   * During component initialization
   */
  INITIALIZATION = 'initialization',
  
  /**
   * Before component mounting
   */
  PRE_MOUNT = 'pre_mount',
  
  /**
   * After component mounting
   */
  POST_MOUNT = 'post_mount',
  
  /**
   * Before state update
   */
  PRE_UPDATE = 'pre_update',
  
  /**
   * After state update
   */
  POST_UPDATE = 'post_update',
  
  /**
   * Before component unmounting
   */
  PRE_UNMOUNT = 'pre_unmount',
  
  /**
   * During event handling
   */
  EVENT_HANDLING = 'event_handling'
}