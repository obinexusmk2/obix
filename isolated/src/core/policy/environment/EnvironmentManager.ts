/**
 * src/core/policy/environment/EnvironmentManager.ts
 * 
 * Singleton manager for detecting and managing execution environments.
 * Provides environment-specific functionality for policy enforcement.
 */

import { EnvironmentType } from '../types/EnvironmentType';

/**
 * Environment manager singleton
 */
export class EnvironmentManager {
  private static instance: EnvironmentManager;
  private currentEnvironment: EnvironmentType;
  private environmentOverride: EnvironmentType | null = null;
  private listeners: Set<(env: EnvironmentType) => void> = new Set();
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.currentEnvironment = this.detectEnvironment();
  }
  
  /**
   * Gets the singleton instance
   * 
   * @returns EnvironmentManager instance
   */
  public static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }
  
  /**
   * Gets the current execution environment
   * 
   * @returns Current environment type
   */
  public getCurrentEnvironment(): EnvironmentType {
    // Return override if set, otherwise return detected environment
    return this.environmentOverride || this.currentEnvironment;
  }
  
  /**
   * Sets the environment explicitly (for testing or forced configurations)
   * 
   * @param env Environment type to set
   */
  public setEnvironment(env: EnvironmentType): void {
    if (this.environmentOverride !== env) {
      this.environmentOverride = env;
      this.notifyListeners(env);
    }
  }
  
  /**
   * Resets any environment override and returns to auto-detection
   */
  public resetEnvironment(): void {
    if (this.environmentOverride !== null) {
      this.environmentOverride = null;
      const detectedEnv = this.detectEnvironment();
      if (detectedEnv !== this.currentEnvironment) {
        this.currentEnvironment = detectedEnv;
        this.notifyListeners(detectedEnv);
      }
    }
  }
  
  /**
   * Detects the current execution environment
   * 
   * @private
   * @returns Detected environment type
   */
  private detectEnvironment(): EnvironmentType {
    // Browser environment detection
    if (typeof window !== 'undefined') {
      // Check for development tools
      const isDev = this.isLocalhost() || 
                    this.hasDevTools() ||
                    this.hasDevQuery();
      
      // Check for test environment
      const isTest = this.isTestEnvironment();
      
      // Check for staging environment
      const isStaging = this.isStagingEnvironment();
      
      if (isTest) {
        return EnvironmentType.TESTING;
      } else if (isDev) {
        return EnvironmentType.DEVELOPMENT;
      } else if (isStaging) {
        return EnvironmentType.STAGING;
      } else {
        return EnvironmentType.PRODUCTION;
      }
    } 
    // Node.js environment detection
    else if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      
      if (nodeEnv === 'test') {
        return EnvironmentType.TESTING;
      } else if (nodeEnv === 'development') {
        return EnvironmentType.DEVELOPMENT;
      } else if (nodeEnv === 'staging' || process.env.STAGING === 'true') {
        return EnvironmentType.STAGING;
      } else if (nodeEnv === 'production') {
        return EnvironmentType.PRODUCTION;
      }
    }
    
    // Default to production for safety
    return EnvironmentType.PRODUCTION;
  }
  
  /**
   * Checks if running on localhost
   * 
   * @private
   * @returns True if running on localhost
   */
  private isLocalhost(): boolean {
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1'
      );
    }
    return false;
  }
  
  /**
   * Checks if developer tools are present
   * 
   * @private
   * @returns True if developer tools are detected
   */
  private hasDevTools(): boolean {
    // Check for React devtools
    return (
      typeof window !== 'undefined' &&
      (
        (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
        (window as any).__REDUX_DEVTOOLS_EXTENSION__
      )
    );
  }
  
  /**
   * Checks if development query parameter is present
   * 
   * @private
   * @returns True if development mode is requested via URL
   */
  private hasDevQuery(): boolean {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      return params.has('dev') || params.has('development');
    }
    return false;
  }
  
  /**
   * Checks if running in a test environment
   * 
   * @private
   * @returns True if in test environment
   */
  private isTestEnvironment(): boolean {
    // Check common test environment indicators
    return (
      typeof process !== 'undefined' && 
      (
        process.env.NODE_ENV === 'test' ||
        process.env.JEST_WORKER_ID !== undefined ||
        process.env.TESTING === 'true'
      )
    ) || (
      typeof window !== 'undefined' &&
      (
        (window as any).jasmine !== undefined ||
        (window as any).Mocha !== undefined ||
        (window as any).jest !== undefined ||
        (window as any).__karma__ !== undefined
      )
    );
  }
  
  /**
   * Checks if running in a staging environment
   * 
   * @private
   * @returns True if in staging environment
   */
  private isStagingEnvironment(): boolean {
    // Check for staging environment indicators
    if (typeof process !== 'undefined' && process.env) {
      return (
        process.env.NODE_ENV === 'staging' ||
        process.env.STAGING === 'true'
      );
    }
    
    // Check URL for staging indicators
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      return (
        hostname.includes('staging.') ||
        hostname.includes('stage.') ||
        hostname.includes('-staging') ||
        hostname.includes('-stage')
      );
    }
    
    return false;
  }
  
  /**
   * Convenience method to check if running in production
   * 
   * @returns True if in production environment
   */
  public isProduction(): boolean {
    return this.getCurrentEnvironment() === EnvironmentType.PRODUCTION;
  }
  
  /**
   * Convenience method to check if running in development
   * 
   * @returns True if in development environment
   */
  public isDevelopment(): boolean {
    return this.getCurrentEnvironment() === EnvironmentType.DEVELOPMENT;
  }
  
  /**
   * Convenience method to check if running in testing
   * 
   * @returns True if in testing environment
   */
  public isTesting(): boolean {
    return this.getCurrentEnvironment() === EnvironmentType.TESTING;
  }
  
  /**
   * Convenience method to check if running in staging
   * 
   * @returns True if in staging environment
   */
  public isStaging(): boolean {
    return this.getCurrentEnvironment() === EnvironmentType.STAGING;
  }
  
  /**
   * Register a listener for environment changes
   * 
   * @param listener Function to call when environment changes
   * @returns Function to unregister the listener
   */
  public addEnvironmentChangeListener(
    listener: (env: EnvironmentType) => void
  ): () => void {
    this.listeners.add(listener);
    
    // Call with current environment immediately
    listener(this.getCurrentEnvironment());
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Notify all listeners of an environment change
   * 
   * @private
   * @param env New environment
   */
  private notifyListeners(env: EnvironmentType): void {
    this.listeners.forEach(listener => {
      try {
        listener(env);
      } catch (error) {
        console.error('Error in environment change listener:', error);
      }
    });
  }
}