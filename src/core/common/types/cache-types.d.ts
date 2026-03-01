/**
 * Type definitions for state machine transition caching
 */
import { StateId, InputSymbol } from './state-machine-types';

/**
 * Cache eviction strategies
 */
export enum CacheStrategy {
  /**
   * Least Recently Used eviction strategy
   */
  LRU = 'lru',
  
  /**
   * Least Frequently Used eviction strategy
   */
  LFU = 'lfu',
  
  /**
   * First In First Out eviction strategy
   */
  FIFO = 'fifo',
  
  /**
   * Time-based expiration
   */
  TTL = 'ttl'
}

/**
 * Configuration options for transition cache
 */
export interface CacheOptions {
  /**
   * Whether caching is enabled
   */
  enabled?: boolean;
  
  /**
   * Maximum cache size
   */
  maxSize?: number;
  
  /**
   * Time-to-live in milliseconds
   */
  ttl?: number;
  
  /**
   * Whether to persist cache to storage
   */
  persistToStorage?: boolean;
  
  /**
   * Eviction strategy
   */
  strategy?: CacheStrategy;
  
  /**
   * Storage options for persistence
   */
  storageOptions?: {
    /**
     * Storage key prefix
     */
    keyPrefix?: string;
    
    /**
     * Storage implementation
     */
    storage?: 'localStorage' | 'sessionStorage' | 'custom';
    
    /**
     * Custom storage implementation
     */
    customStorage?: any;
  };
}

/**
 * Cache entry with metadata
 */
export interface CacheEntry<T = any> {
  /**
   * Cached value
   */
  value: T;
  
  /**
   * When this entry was created
   */
  createdAt: number;
  
  /**
   * When this entry was last accessed
   */
  lastAccessed: number;
  
  /**
   * How many times this entry has been accessed
   */
  accessCount: number;
  
  /**
   * Source state ID for this cached transition
   */
  sourceStateId: StateId;
  
  /**
   * Input symbol for this cached transition
   */
  inputSymbol: InputSymbol;
  
  /**
   * Target state ID for this cached transition
   */
  targetStateId: StateId;
  
  /**
   * Additional metadata
   */
  metadata?: Record<string, any>;
}

/**
 * Cache performance statistics
 */
export interface CacheStatistics {
  /**
   * Number of cache hits
   */
  hits: number;
  
  /**
   * Number of cache misses
   */
  misses: number;
  
  /**
   * Number of evictions
   */
  evictions: number;
  
  /**
   * Current cache size
   */
  size: number;
  
  /**
   * Hit ratio (hits / (hits + misses))
   */
  hitRatio: number;
  
  /**
   * Memory usage estimate (bytes)
   */
  memoryUsage?: number;
  
  /**
   * Average access time (ms)
   */
  avgAccessTime?: number;
}

/**
 * Cache warmup configuration
 */
export interface CacheWarmupConfig {
  /**
   * Sample size for transition analysis
   */
  sampleSize?: number;
  
  /**
   * Specific transitions to precompute
   */
  specificTransitions?: Array<{
    sourceStateId: StateId;
    inputSymbol: InputSymbol;
  }>;
  
  /**
   * Whether to use frequency analysis for warmup
   */
  useFrequencyAnalysis?: boolean;
  
  /**
   * Maximum transitions to precompute
   */
  maxTransitions?: number;
}