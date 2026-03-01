/**
 * src/core/policy/loading/DynamicPolicyLoader.ts
 * 
 * Dynamically loads policy rules based on environment variables, configuration files,
 * or remote API endpoints.
 */

import { PolicyRule } from '../types/PolicyTypes';
import { EnvironmentType } from '../types/EnvironmentType';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { PolicyRuleEngine } from '../engine/PolicyRuleEngine';

/**
 * Configuration source types for policy loading
 */
export enum PolicyConfigSource {
  /**
   * Load from environment variables
   */
  ENVIRONMENT_VARIABLES = 'environment_variables',
  
  /**
   * Load from local JSON configuration file
   */
  CONFIG_FILE = 'config_file',
  
  /**
   * Load from remote API endpoint
   */
  REMOTE_API = 'remote_api',
  
  /**
   * Load from local storage in browser environment
   */
  LOCAL_STORAGE = 'local_storage',
  
  /**
   * Load from in-memory configuration object
   */
  MEMORY = 'memory'
}

/**
 * Options for dynamic policy loading
 */
export interface PolicyLoaderOptions {
  /**
   * Default source to use for policy loading
   */
  defaultSource?: PolicyConfigSource;
  
  /**
   * Configuration file path (for CONFIG_FILE source)
   */
  configFilePath?: string;
  
  /**
   * Remote API endpoint (for REMOTE_API source)
   */
  apiEndpoint?: string;
  
  /**
   * Environment variable prefix for policy rules
   */
  envVarPrefix?: string;
  
  /**
   * Environment to use for policy evaluation
   */
  environment?: EnvironmentType;
  
  /**
   * Enable cache for loaded policies
   */
  enableCache?: boolean;
  
  /**
   * Cache TTL in milliseconds
   */
  cacheTTL?: number;
  
  /**
   * Interval in milliseconds to refresh policies
   */
  refreshInterval?: number;
  
  /**
   * Authentication token for API requests
   */
  authToken?: string;
}

/**
 * Interface for policy configuration entry
 */
export interface PolicyConfig {
  /**
   * Rule ID
   */
  id: string;
  
  /**
   * Rule description
   */
  description: string;
  
  /**
   * Environments where the rule is active
   */
  enabledEnvironments: EnvironmentType[];
  
  /**
   * Rule parameters for evaluation
   */
  parameters?: Record<string, any>;
  
  /**
   * JavaScript code string for condition function
   */
  conditionCode?: string;
  
  /**
   * Type of rule (built-in or custom)
   */
  type: 'built-in' | 'custom';
  
  /**
   * For built-in rules, the rule identifier
   */
  builtInRuleId?: string;
  
  /**
   * Priority for rule evaluation (higher numbers execute first)
   */
  priority?: number;
}

/**
 * Dynamic policy loader for loading policies from various sources
 */
export class DynamicPolicyLoader {
  private static instance: DynamicPolicyLoader;
  
  private options: PolicyLoaderOptions;
  private environmentManager: EnvironmentManager;
  private ruleEngine: PolicyRuleEngine;
  private loadedPolicies: Map<string, PolicyRule> = new Map();
  private refreshTimer: any = null;
  private cacheTimestamp: number = 0;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor(options: PolicyLoaderOptions = {}) {
    this.options = {
      defaultSource: PolicyConfigSource.ENVIRONMENT_VARIABLES,
      envVarPrefix: 'OBIX_POLICY_',
      enableCache: true,
      cacheTTL: 300000, // 5 minutes
      refreshInterval: 600000, // 10 minutes
      ...options
    };
    
    this.environmentManager = EnvironmentManager.getInstance();
    this.ruleEngine = new PolicyRuleEngine();
    
    // Start refresh timer if enabled
    if (this.options.refreshInterval && this.options.refreshInterval > 0) {
      this.startRefreshTimer();
    }
  }
  
  /**
   * Get the singleton instance
   * 
   * @param options Options for policy loader
   * @returns DynamicPolicyLoader instance
   */
  public static getInstance(options?: PolicyLoaderOptions): DynamicPolicyLoader {
    if (!DynamicPolicyLoader.instance) {
      DynamicPolicyLoader.instance = new DynamicPolicyLoader(options);
    } else if (options) {
      // Update options if provided
      DynamicPolicyLoader.instance.updateOptions(options);
    }
    
    return DynamicPolicyLoader.instance;
  }
  
  /**
   * Update loader options
   * 
   * @param options New options
   */
  public updateOptions(options: Partial<PolicyLoaderOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Restart timer if refresh interval changed
    if (options.refreshInterval !== undefined) {
      this.startRefreshTimer();
    }
  }
  
  /**
   * Load policies from the configured source
   * 
   * @param source Optional source to override default
   * @returns Map of loaded policy rules
   */
  public async loadPolicies(source?: PolicyConfigSource): Promise<Map<string, PolicyRule>> {
    const useSource = source || this.options.defaultSource;
    
    // Check cache if enabled
    if (
      this.options.enableCache &&
      this.loadedPolicies.size > 0 &&
      Date.now() - this.cacheTimestamp < this.options.cacheTTL!
    ) {
      return this.loadedPolicies;
    }
    
    // Load policies from the specified source
    switch (useSource) {
      case PolicyConfigSource.ENVIRONMENT_VARIABLES:
        await this.loadFromEnvironmentVariables();
        break;
      case PolicyConfigSource.CONFIG_FILE:
        await this.loadFromConfigFile();
        break;
      case PolicyConfigSource.REMOTE_API:
        await this.loadFromRemoteAPI();
        break;
      case PolicyConfigSource.LOCAL_STORAGE:
        await this.loadFromLocalStorage();
        break;
      case PolicyConfigSource.MEMORY:
        // Nothing to do, use already loaded policies
        break;
    }
    
    // Update cache timestamp
    this.cacheTimestamp = Date.now();
    
    return this.loadedPolicies;
  }
  
  /**
   * Get a specific policy rule
   * 
   * @param ruleId Rule ID to retrieve
   * @returns Policy rule or undefined if not found
   */
  public async getPolicy(ruleId: string): Promise<PolicyRule | undefined> {
    // Ensure policies are loaded
    if (this.loadedPolicies.size === 0) {
      await this.loadPolicies();
    }
    
    return this.loadedPolicies.get(ruleId);
  }
  
  /**
   * Manually register a policy rule
   * 
   * @param rule Policy rule to register
   */
  public registerPolicy(rule: PolicyRule): void {
    this.loadedPolicies.set(rule.id, rule);
  }
  
  /**
   * Remove a policy rule
   * 
   * @param ruleId Rule ID to remove
   * @returns True if rule was removed
   */
  public removePolicy(ruleId: string): boolean {
    return this.loadedPolicies.delete(ruleId);
  }
  
  /**
   * Clear all loaded policies
   */
  public clearPolicies(): void {
    this.loadedPolicies.clear();
  }
  
  /**
   * Create a rule function from dynamic configuration
   * 
   * @param config Policy configuration
   * @returns Policy rule
   */
  public createRuleFromConfig(config: PolicyConfig): PolicyRule {
    // Get current environment
    const currentEnv = this.options.environment || this.environmentManager.getCurrentEnvironment();
    
    // Create condition function
    let conditionFn: (env: EnvironmentType, context?: any) => boolean;
    
    // Handle built-in rules
    if (config.type === 'built-in' && config.builtInRuleId) {
      // This is where you'd implement built-in rule types
      // For example:
      switch (config.builtInRuleId) {
        case 'environment-restriction':
          conditionFn = (env) => config.enabledEnvironments.includes(env);
          break;
        case 'role-based':
          conditionFn = (env, context) => {
            const requiredRoles = config.parameters?.roles || [];
            return context?.user?.roles?.some((role: string) => 
              requiredRoles.includes(role)
            ) || false;
          };
          break;
        case 'feature-flag':
          conditionFn = (env, context) => {
            const flagName = config.parameters?.flagName;
            return context?.featureFlags?.[flagName] === true || false;
          };
          break;
        default:
          // Default to allowing in enabled environments
          conditionFn = (env) => config.enabledEnvironments.includes(env);
      }
    } 
    // Handle custom rules with code
    else if (config.conditionCode) {
      try {
        // Create function from code string
        // Note: This uses eval which can be a security risk
        // In production, consider safer alternatives
        conditionFn = new Function(
          'env', 'context', 
          `return (${config.conditionCode})(env, context);`
        ) as any;
      } catch (error) {
        console.error(`Error creating condition function for rule ${config.id}:`, error);
        // Default to restrictive behavior on error
        conditionFn = () => false;
      }
    } 
    // Default implementation
    else {
      conditionFn = (env) => config.enabledEnvironments.includes(env);
    }
    
    // Create the rule
    return {
      id: config.id,
      description: config.description,
      condition: conditionFn,
      action: () => console.debug(`[Policy] Rule ${config.id} enforced`)
    };
  }
  
  /**
   * Start or restart the policy refresh timer
   * 
   * @private
   */
  private startRefreshTimer(): void {
    // Clear existing timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    // Start new timer if interval is positive
    if (this.options.refreshInterval && this.options.refreshInterval > 0) {
      this.refreshTimer = setInterval(() => {
        this.loadPolicies().catch(error => {
          console.error('Error refreshing policies:', error);
        });
      }, this.options.refreshInterval);
    }
  }
  
  /**
   * Load policies from environment variables
   * 
   * @private
   */
  private async loadFromEnvironmentVariables(): Promise<void> {
    // Clear existing policies
    this.loadedPolicies.clear();
    
    // In Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      const prefix = this.options.envVarPrefix || 'OBIX_POLICY_';
      
      // Find all environment variables with the prefix
      const policyVars = Object.keys(process.env)
        .filter(key => key.startsWith(prefix));
      
      // Group by policy ID (format: PREFIX_POLICYID_PROPERTY)
      const policyGroups: Record<string, Record<string, string>> = {};
      
      for (const key of policyVars) {
        const parts = key.substring(prefix.length).split('_');
        if (parts.length >= 2) {
          const policyId = parts[0];
          const property = parts.slice(1).join('_').toLowerCase();
          
          if (!policyGroups[policyId]) {
            policyGroups[policyId] = {};
          }
          
          policyGroups[policyId][property] = process.env[key] || '';
        }
      }
      
      // Create policy rules from environment variables
      for (const [id, properties] of Object.entries(policyGroups)) {
        try {
          // Parse enabled environments
          const enabledEnvironments = (properties.environments || '')
            .split(',')
            .map(env => env.trim())
            .filter(Boolean)
            .map(env => env as EnvironmentType);
          
          // Create policy config
          const config: PolicyConfig = {
            id,
            description: properties.description || `Policy ${id}`,
            enabledEnvironments,
            type: properties.type as 'built-in' | 'custom' || 'custom',
            conditionCode: properties.condition,
            builtInRuleId: properties.builtinrule,
            parameters: {},
            priority: parseInt(properties.priority || '0', 10)
          };
          
          // Add additional parameters
          for (const [key, value] of Object.entries(properties)) {
            if (!['description', 'environments', 'type', 'condition', 'builtinrule', 'priority'].includes(key)) {
              try {
                config.parameters![key] = JSON.parse(value);
              } catch {
                config.parameters![key] = value;
              }
            }
          }
          
          // Create and register the rule
          const rule = this.createRuleFromConfig(config);
          this.loadedPolicies.set(rule.id, rule);
        } catch (error) {
          console.error(`Error creating policy rule from environment variables for ${id}:`, error);
        }
      }
    }
  }
  
  /**
   * Load policies from configuration file
   * 
   * @private
   */
  private async loadFromConfigFile(): Promise<void> {
    // Clear existing policies
    this.loadedPolicies.clear();
    
    const filePath = this.options.configFilePath;
    if (!filePath) {
      throw new Error('Config file path not specified');
    }
    
    try {
      // In Node.js environment
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');
        
        // Read and parse the config file
        const configPath = path.resolve(filePath);
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        
        // Process policy rules
        if (Array.isArray(config.policies)) {
          for (const policyConfig of config.policies) {
            if (policyConfig.id) {
              const rule = this.createRuleFromConfig(policyConfig);
              this.loadedPolicies.set(rule.id, rule);
            }
          }
        }
      } 
      // In browser environment
      else if (typeof fetch !== 'undefined') {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to load config file: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        // Process policy rules
        if (Array.isArray(config.policies)) {
          for (const policyConfig of config.policies) {
            if (policyConfig.id) {
              const rule = this.createRuleFromConfig(policyConfig);
              this.loadedPolicies.set(rule.id, rule);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading policies from config file:', error);
      throw error;
    }
  }
  
  /**
   * Load policies from remote API
   * 
   * @private
   */
  private async loadFromRemoteAPI(): Promise<void> {
    // Clear existing policies
    this.loadedPolicies.clear();
    
    const endpoint = this.options.apiEndpoint;
    if (!endpoint) {
      throw new Error('API endpoint not specified');
    }
    
    try {
      // Make API request
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authentication if provided
      if (this.options.authToken) {
        headers['Authorization'] = `Bearer ${this.options.authToken}`;
      }
      
      const response = await fetch(endpoint, { headers });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Process policy rules
      if (Array.isArray(data.policies)) {
        for (const policyConfig of data.policies) {
          if (policyConfig.id) {
            const rule = this.createRuleFromConfig(policyConfig);
            this.loadedPolicies.set(rule.id, rule);
          }
        }
      }
    } catch (error) {
      console.error('Error loading policies from API:', error);
      throw error;
    }
  }
  
  /**
   * Load policies from local storage
   * 
   * @private
   */
  private async loadFromLocalStorage(): Promise<void> {
    // Clear existing policies
    this.loadedPolicies.clear();
    
    // Only works in browser environment
    if (typeof localStorage !== 'undefined') {
      try {
        const storageKey = `${this.options.envVarPrefix || 'OBIX_POLICY_'}CONFIG`;
        const configJson = localStorage.getItem(storageKey);
        
        if (configJson) {
          const config = JSON.parse(configJson);
          
          // Process policy rules
          if (Array.isArray(config.policies)) {
            for (const policyConfig of config.policies) {
              if (policyConfig.id) {
                const rule = this.createRuleFromConfig(policyConfig);
                this.loadedPolicies.set(rule.id, rule);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading policies from local storage:', error);
      }
    }
  }
}