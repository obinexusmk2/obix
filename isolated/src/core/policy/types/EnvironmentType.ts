/**
 * src/core/policy/types/EnvironmentType.ts
 * 
 * Defines the available execution environments for policy enforcement.
 */

/**
 * Available execution environments
 */
export enum EnvironmentType {
    /**
     * Development environment
     * Used during local development and debugging
     */
    DEVELOPMENT = 'development',
    
    /**
     * Testing environment
     * Used during automated tests and QA testing
     */
    TESTING = 'testing',
    
    /**
     * Staging environment
     * Pre-production environment for final testing
     */
    STAGING = 'staging',
    
    /**
     * Production environment
     * Live environment with real users and data
     */
    PRODUCTION = 'production'
  }
  
  /**
   * Environment type hierarchy for inheritance
   * Each environment inherits permissions from environments to its left
   */
  export const ENVIRONMENT_HIERARCHY = [
    EnvironmentType.DEVELOPMENT, // Most permissive
    EnvironmentType.TESTING,
    EnvironmentType.STAGING,
    EnvironmentType.PRODUCTION   // Most restrictive
  ];
  
  /**
   * Checks if one environment is equal to or more restrictive than another
   * 
   * @param env Environment to check
   * @param thanEnv Environment to compare against
   * @returns True if env is equal to or more restrictive than thanEnv
   */
  export function isMoreRestrictiveThan(
    env: EnvironmentType,
    thanEnv: EnvironmentType
  ): boolean {
    const envIndex = ENVIRONMENT_HIERARCHY.indexOf(env);
    const thanEnvIndex = ENVIRONMENT_HIERARCHY.indexOf(thanEnv);
    
    // Higher index means more restrictive
    return envIndex >= thanEnvIndex;
  }
  
  /**
   * Checks if one environment is equal to or less restrictive than another
   * 
   * @param env Environment to check
   * @param thanEnv Environment to compare against
   * @returns True if env is equal to or less restrictive than thanEnv
   */
  export function isLessRestrictiveThan(
    env: EnvironmentType,
    thanEnv: EnvironmentType
  ): boolean {
    const envIndex = ENVIRONMENT_HIERARCHY.indexOf(env);
    const thanEnvIndex = ENVIRONMENT_HIERARCHY.indexOf(thanEnv);
    
    // Lower index means less restrictive
    return envIndex <= thanEnvIndex;
  }
  
  /**
   * Gets all environments that are equal to or less restrictive than the given environment
   * 
   * @param env Reference environment
   * @returns Array of environments that are equal to or less restrictive
   */
  export function getLessRestrictiveEnvironments(
    env: EnvironmentType
  ): EnvironmentType[] {
    const envIndex = ENVIRONMENT_HIERARCHY.indexOf(env);
    return ENVIRONMENT_HIERARCHY.slice(0, envIndex + 1);
  }
  
  /**
   * Gets all environments that are equal to or more restrictive than the given environment
   * 
   * @param env Reference environment
   * @returns Array of environments that are equal to or more restrictive
   */
  export function getMoreRestrictiveEnvironments(
    env: EnvironmentType
  ): EnvironmentType[] {
    const envIndex = ENVIRONMENT_HIERARCHY.indexOf(env);
    return ENVIRONMENT_HIERARCHY.slice(envIndex);
  }