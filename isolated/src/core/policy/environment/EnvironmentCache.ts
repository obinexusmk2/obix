/**
 * src/core/policy/environment/EnvironmentCache.ts
 * 
 * Caching mechanism for environment detection to improve performance.
 * Particularly useful for policy rules that are evaluated frequently.
 */

import { EnvironmentType } from '../types/EnvironmentType';
import { EnvironmentManager } from './EnvironmentManager';

/**
 * Cache entry with value and TTL
 */
interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * Environment detection cache
 */
export class EnvironmentCache {
  private static instance: EnvironmentCache;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private environmentManager: EnvironmentManager;
  private defaultTTL: number = 60000; // 1 minute default TTL
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.environmentManager = EnvironmentManager.getInstance();
    
    // Listen for environment changes to invalidate cache
    this.environmentManager.addEnvironmentChangeListener(() => {
      this.invalidateCache();
    });
  }
  
  /**
   * Gets the singleton instance
   * 
   * @returns EnvironmentCache instance
   */
  public static getInstance(): EnvironmentCache {
    if (!EnvironmentCache.instance) {
      EnvironmentCache.instance = new EnvironmentCache();
    }
    return EnvironmentCache.instance;
  }
  
  /**
   * Sets the cache entry
   * 
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (default: 1 minute)
   */
  public set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { value, expiry });
  }
  
  /**
   * Gets a cached value or computes it if not cached
   * 
   * @param key Cache key
   * @param compute Function to compute the value if not cached
   * @param ttl Time to live in milliseconds (default: 1 minute)
   * @returns Cached or computed value
   */
  public getOrCompute<T>(
    key: string,
    compute: () => T,
    ttl: number = this.defaultTTL
  ): T {
    const cached = this.get<T>(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    // Compute the value
    const value = compute();
    this.set(key, value, ttl);
    return value;
  }
  
  /**
   * Gets a cached value
   * 
   * @param key Cache key
   * @returns Cached value or undefined if not found or expired
   */
  public get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value as T;
  }
  
  /**
   * Deletes a cache entry
   * 
   * @param key Cache key
   * @returns True if the entry was deleted
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Clears all cache entries
   */
  public clear(): void {
    this.cache.clear();
  }
  
  /**
   * Invalidates the entire cache
   */
  public invalidateCache(): void {
    this.clear();
  }
  
  /**
   * Sets the default TTL for cache entries
   * 
   * @param ttl Default time to live in milliseconds
   */
  public setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
  
  /**
   * Gets a cached environment check or computes it
   * 
   * @param check Function to check the environment
   * @param ttl Time to live in milliseconds
   * @returns Cached or computed check result
   */
  public getCachedEnvironmentCheck(
    check: (env: EnvironmentType) => boolean,
    ttl: number = this.defaultTTL
  ): boolean {
    const currentEnv = this.environmentManager.getCurrentEnvironment();
    const cacheKey = `env_check:${check.toString()}:${currentEnv}`;
    
    return this.getOrCompute(
      cacheKey,
      () => check(currentEnv),
      ttl
    );
  }
  
  /**
   * Creates a cached version of an environment check function
   * 
   * @param check Original check function
   * @param ttl Cache TTL in milliseconds
   * @returns Cached check function
   */
  public createCachedCheck(
    check: (env: EnvironmentType) => boolean,
    ttl: number = this.defaultTTL
  ): (env: EnvironmentType) => boolean {
    return (env: EnvironmentType) => {
      const cacheKey = `env_check:${check.toString()}:${env}`;
      
      return this.getOrCompute(
        cacheKey,
        () => check(env),
        ttl
      );
    };
  }
  
  /**
   * Gets cached policy rule evaluation
   * 
   * @param ruleId Rule ID
   * @param check Rule condition function
   * @param context Evaluation context
   * @param ttl Cache TTL in milliseconds
   * @returns Cached or computed rule evaluation
   */
  public getCachedRuleEvaluation(
    ruleId: string,
    check: (env: EnvironmentType, context?: any) => boolean,
    context?: any,
    ttl: number = this.defaultTTL
  ): boolean {
    const currentEnv = this.environmentManager.getCurrentEnvironment();
    const contextHash = this.hashContext(context);
    const cacheKey = `rule:${ruleId}:${currentEnv}:${contextHash}`;
    
    return this.getOrCompute(
      cacheKey,
      () => check(currentEnv, context),
      ttl
    );
  }
  
  /**
   * Creates a simple hash of the context object for cache keys
   * 
   * @private
   * @param context Context object
   * @returns String hash of the context
   */
  private hashContext(context?: any): string {
    if (!context) {
      return 'undefined';
    }
    
    try {
      // Use a simple JSON.stringify for context hashing
      // For more complex objects, a better hashing function should be used
      return JSON.stringify(context);
    } catch (error) {
      // If context can't be stringified, use object properties
      if (typeof context === 'object') {
        return Object.keys(context).join(',');
      }
      return String(context);
    }
  }
}