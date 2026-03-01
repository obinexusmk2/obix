/**
 * PersistableCacheStore
 * 
 * Provides persistent storage capabilities for state machine transitions,
 * based on the AeroCache pattern from the OBIX tools. This allows state
 * transitions to be cached across application sessions, improving startup
 * performance significantly.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { State } from './State';

export interface CachedStateEntry {
  stateId: string;
  isAccepting: boolean;
  metadata: Record<string, any>;
  equivalenceClass?: number;
  timestamp: number;
  expires?: number;
}

export interface CachedTransitionEntry {
  sourceStateId: string;
  targetStateId: string;
  inputSymbol: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PersistableCacheOptions {
  cacheDir?: string;
  maxSize?: number; // In bytes
  ttl?: number; // In milliseconds
  pruneInterval?: number; // In milliseconds
  compactionThreshold?: number; // 0-1 ratio
  algorithm?: 'sha256' | 'md5';
}

/**
 * Implementation of a persistent cache store for state machine transitions
 */
export class PersistableCacheStore {
  public options: Required<PersistableCacheOptions>;
  public memoryCache: Map<string, any>;
  public pruneTimer: NodeJS.Timeout | null = null;
  public stats: {
    hits: number;
    misses: number;
    writes: number;
    size: number;
    lastCompaction: number;
  };
  
  /**
   * Create a new PersistableCacheStore
   * 
   * @param options Configuration options
   */
  constructor(options: PersistableCacheOptions = {}) {
    this.options = {
      cacheDir: options.cacheDir || path.join(process.cwd(), '.cache', 'obix-state-cache'),
      maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB default
      ttl: options.ttl || 24 * 60 * 60 * 1000, // 24 hours default
      pruneInterval: options.pruneInterval || 60 * 60 * 1000, // 1 hour default
      compactionThreshold: options.compactionThreshold || 0.7, // 70% full default
      algorithm: options.algorithm || 'sha256'
    };
    
    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      writes: 0,
      size: 0,
      lastCompaction: Date.now()
    };
    
    // Ensure cache directory exists
    this.ensureCacheDirectory();
    
    // Start periodic pruning
    this.startPruneTimer();
    
    // Calculate current cache size
    this.calculateCacheSize();
  }
  
  /**
   * Generate a cache key for an item
   * 
   * @param key Primary key
   * @param metadata Optional metadata to include in the key
   * @returns A hash-based cache key
   */
  public generateCacheKey(key: string, metadata?: any): string {
    const hash = crypto.createHash(this.options.algorithm);
    hash.update(key);
    
    if (metadata) {
      hash.update(JSON.stringify(metadata));
    }
    
    return hash.digest('hex');
  }
  
  /**
   * Ensure the cache directory exists
   */
  public ensureCacheDirectory(): void {
    try {
      if (!fs.existsSync(this.options.cacheDir)) {
        fs.mkdirSync(this.options.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn(`Failed to create cache directory: ${error}`);
    }
  }
  
  /**
   * Calculate the current size of the cache
   */
  public calculateCacheSize(): void {
    try {
      let size = 0;
      const files = fs.readdirSync(this.options.cacheDir);
      
      for (const file of files) {
        try {
          const stats = fs.statSync(path.join(this.options.cacheDir, file));
          size += stats.size;
        } catch (error) {
          // Skip files with errors
        }
      }
      
      this.stats.size = size;
      
      // Check if compaction is needed
      if (size > this.options.maxSize * this.options.compactionThreshold) {
        this.compactCache();
      }
    } catch (error) {
      console.warn(`Failed to calculate cache size: ${error}`);
    }
  }
  
  /**
   * Get an item from the cache
   * 
   * @param key Item key
   * @param metadata Optional metadata for key generation
   * @returns The cached item or null if not found
   */
  get<T>(key: string, metadata?: any): T | null {
    const cacheKey = this.generateCacheKey(key, metadata);
    
    // Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      const item = this.memoryCache.get(cacheKey);
      
      // Check expiration
      if (item.expires && item.expires < Date.now()) {
        this.memoryCache.delete(cacheKey);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return item.data;
    }
    
    // Check file cache
    const cachePath = path.join(this.options.cacheDir, cacheKey);
    try {
      if (fs.existsSync(cachePath)) {
        const content = fs.readFileSync(cachePath, 'utf8');
        const item = JSON.parse(content);
        
        // Check expiration
        if (item.expires && item.expires < Date.now()) {
          try {
            fs.unlinkSync(cachePath);
          } catch (e) {
            // Ignore deletion errors
          }
          this.stats.misses++;
          return null;
        }
        
        // Add to memory cache
        this.memoryCache.set(cacheKey, item);
        
        this.stats.hits++;
        return item.data;
      }
    } catch (error) {
      // Log and continue
      console.warn(`Cache read error for key ${cacheKey}: ${error}`);
    }
    
    this.stats.misses++;
    return null;
  }
  
  /**
   * Store an item in the cache
   * 
   * @param key Item key
   * @param data Data to cache
   * @param metadata Optional metadata
   * @param ttl Optional custom TTL
   */
  set<T>(key: string, data: T, metadata?: any, ttl?: number): void {
    const cacheKey = this.generateCacheKey(key, metadata);
    const expires = Date.now() + (ttl || this.options.ttl);
    
    const item = {
      data,
      metadata: metadata || {},
      timestamp: Date.now(),
      expires
    };
    
    // Add to memory cache
    this.memoryCache.set(cacheKey, item);
    
    // Write to file cache
    const cachePath = path.join(this.options.cacheDir, cacheKey);
    try {
      fs.writeFileSync(cachePath, JSON.stringify(item), 'utf8');
      this.stats.writes++;
    } catch (error) {
      console.warn(`Cache write error for key ${cacheKey}: ${error}`);
    }
    
    // Update cache size periodically
    if (this.stats.writes % 10 === 0) {
      this.calculateCacheSize();
    }
  }
  
  /**
   * Store a state in the cache
   * 
   * @param state State to cache
   * @param metadata Optional additional metadata
   * @returns The cache key
   */
  setState(state: State, metadata?: any): string {
    const stateData: CachedStateEntry = {
      stateId: state.id,
      isAccepting: state.isAccepting,
      metadata: state.metadata || {},
      equivalenceClass: state.equivalenceClass,
      timestamp: Date.now()
    };
    
    const key = `state:${state.id}`;
    this.set(key, stateData, metadata);
    return key;
  }
  
  /**
   * Store a transition in the cache
   * 
   * @param sourceStateId Source state ID
   * @param inputSymbol Input symbol
   * @param targetStateId Target state ID
   * @param metadata Optional additional metadata
   * @returns The cache key
   */
  setTransition(sourceStateId: string, inputSymbol: string, targetStateId: string, metadata?: any): string {
    const transitionData: CachedTransitionEntry = {
      sourceStateId,
      targetStateId,
      inputSymbol,
      timestamp: Date.now(),
      metadata
    };
    
    const key = `transition:${sourceStateId}:${inputSymbol}`;
    this.set(key, transitionData, metadata);
    return key;
  }
  
  /**
   * Get a cached state
   * 
   * @param stateId State ID
   * @param metadata Optional metadata
   * @returns The cached state entry or null
   */
  getState(stateId: string, metadata?: any): CachedStateEntry | null {
    return this.get<CachedStateEntry>(`state:${stateId}`, metadata);
  }
  
  /**
   * Get a cached transition
   * 
   * @param sourceStateId Source state ID
   * @param inputSymbol Input symbol
   * @param metadata Optional metadata
   * @returns The cached transition entry or null
   */
  getTransition(sourceStateId: string, inputSymbol: string, metadata?: any): CachedTransitionEntry | null {
    return this.get<CachedTransitionEntry>(`transition:${sourceStateId}:${inputSymbol}`, metadata);
  }
  
  /**
   * Remove an item from the cache
   * 
   * @param key Item key
   * @param metadata Optional metadata for key generation
   */
  remove(key: string, metadata?: any): void {
    const cacheKey = this.generateCacheKey(key, metadata);
    
    // Remove from memory cache
    this.memoryCache.delete(cacheKey);
    
    // Remove from file cache
    const cachePath = path.join(this.options.cacheDir, cacheKey);
    try {
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
    } catch (error) {
      console.warn(`Cache remove error for key ${cacheKey}: ${error}`);
    }
  }
  
  /**
   * Clear all items from the cache
   */
  clear(): void {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear file cache
    try {
      const files = fs.readdirSync(this.options.cacheDir);
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(this.options.cacheDir, file));
        } catch (error) {
          // Ignore errors for individual files
        }
      }
      
      this.stats = {
        hits: 0,
        misses: 0,
        writes: 0,
        size: 0,
        lastCompaction: Date.now()
      };
    } catch (error) {
      console.warn(`Cache clear error: ${error}`);
    }
  }
  
  /**
   * Start the periodic pruning timer
   */
  public startPruneTimer(): void {
    // Clear any existing timer
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
    }
    
    // Start new prune timer
    this.pruneTimer = setInterval(() => {
      this.pruneExpiredEntries();
    }, this.options.pruneInterval);
  }
  
  /**
   * Prune expired entries from the cache
   */
  public pruneExpiredEntries(): void {
    try {
      const now = Date.now();
      const files = fs.readdirSync(this.options.cacheDir);
      
      for (const file of files) {
        const cachePath = path.join(this.options.cacheDir, file);
        
        try {
          const content = fs.readFileSync(cachePath, 'utf8');
          const item = JSON.parse(content);
          
          // Remove if expired
          if (item.expires && item.expires < now) {
            fs.unlinkSync(cachePath);
            this.memoryCache.delete(file);
          }
        } catch (error) {
          // Remove corrupted entries
          try {
            fs.unlinkSync(cachePath);
          } catch (e) {
            // Ignore errors
          }
        }
      }
      
      // Update cache size
      this.calculateCacheSize();
    } catch (error) {
      console.warn(`Cache pruning error: ${error}`);
    }
  }
  
  /**
   * Compact the cache by removing least recently used entries
   */
  public compactCache(): void {
    try {
      const files = fs.readdirSync(this.options.cacheDir);
      const entries: Array<{ path: string; timestamp: number; size: number }> = [];
      
      // Collect file information
      for (const file of files) {
        const cachePath = path.join(this.options.cacheDir, file);
        
        try {
          const stats = fs.statSync(cachePath);
          const content = fs.readFileSync(cachePath, 'utf8');
          const item = JSON.parse(content);
          
          entries.push({
            path: cachePath,
            timestamp: item.timestamp || 0,
            size: stats.size
          });
        } catch (error) {
          // Remove corrupted entries
          try {
            fs.unlinkSync(cachePath);
          } catch (e) {
            // Ignore errors
          }
        }
      }
      
      // If still over the threshold, remove oldest entries
      if (this.stats.size > this.options.maxSize) {
        // Sort by timestamp (oldest first)
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        let removedSize = 0;
        const targetSize = this.stats.size - (this.options.maxSize * 0.7); // Aim to get down to 70%
        
        // Remove oldest entries until we get below the target
        for (const entry of entries) {
          try {
            fs.unlinkSync(entry.path);
            removedSize += entry.size;
            
            // Also remove from memory cache
            const fileName = path.basename(entry.path);
            this.memoryCache.delete(fileName);
            
            if (removedSize >= targetSize) {
              break;
            }
          } catch (error) {
            // Ignore errors
          }
        }
      }
      
      this.stats.lastCompaction = Date.now();
      this.calculateCacheSize();
    } catch (error) {
      console.warn(`Cache compaction error: ${error}`);
    }
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Current cache statistics
   */
  getStats(): {
    hits: number;
    misses: number;
    writes: number;
    size: number;
    hitRatio: number;
    memoryEntries: number;
    lastCompaction: Date;
  } {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      writes: this.stats.writes,
      size: this.stats.size,
      hitRatio: total > 0 ? this.stats.hits / total : 0,
      memoryEntries: this.memoryCache.size,
      lastCompaction: new Date(this.stats.lastCompaction)
    };
  }
  
  /**
   * Dispose of resources
   */
  dispose(): void {
    // Clear timer
    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }
    
    // Clear memory cache
    this.memoryCache.clear();
  }
  
  /**
   * Export cache metadata for analysis
   * 
   * @returns Cache metadata information
   */
  exportMetadata(): {
    stats: any;
    entries: number;
    oldestTimestamp: number;
    newestTimestamp: number;
    averageSize: number;
  } {
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    let totalSize = 0;
    let count = 0;
    
    try {
      const files = fs.readdirSync(this.options.cacheDir);
      
      for (const file of files) {
        const cachePath = path.join(this.options.cacheDir, file);
        
        try {
          const stats = fs.statSync(cachePath);
          const content = fs.readFileSync(cachePath, 'utf8');
          const item = JSON.parse(content);
          
          totalSize += stats.size;
          count++;
          
          if (item.timestamp < oldestTimestamp) {
            oldestTimestamp = item.timestamp;
          }
          
          if (item.timestamp > newestTimestamp) {
            newestTimestamp = item.timestamp;
          }
        } catch (error) {
          // Skip problematic files
        }
      }
    } catch (error) {
      console.warn(`Cache metadata export error: ${error}`);
    }
    
    return {
      stats: this.getStats(),
      entries: count,
      oldestTimestamp,
      newestTimestamp,
      averageSize: count > 0 ? totalSize / count : 0
    };
  
  }
  
}