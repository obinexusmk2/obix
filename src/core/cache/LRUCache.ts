/**
 * LRUCache.ts
 * 
 * Least Recently Used cache implementation for efficient caching of expensive
 * computations like diff results and AST optimizations. This implementation 
 * provides O(1) access and removal operations.
 * 
 * Copyright © 2025 OBINexus Computing
 */

/**
 * Cache entry with key, value, and metadata
 */
interface CacheEntry<K, V> {
    /** Cache key */
    key: K;
    /** Cached value */
    value: V;
    /** Next entry in the linked list */
    next: CacheEntry<K, V> | null;
    /** Previous entry in the linked list */
    prev: CacheEntry<K, V> | null;
    /** Timestamp when entry was added or accessed */
    accessTime: number;
  }
  
  /**
   * Cache statistics
   */
  export interface CacheStats {
    /** Total number of cache hits */
    hits: number;
    /** Total number of cache misses */
    misses: number;
    /** Total number of cache accesses */
    accesses: number;
    /** Total time spent accessing cache entries (ms) */
    totalAccessTime: number;
    /** Hit rate as a ratio (0-1) */
    hitRate: number;
    /** Average access time per entry (ms) */
    averageAccessTime: number;
  }
  
  /**
   * Least Recently Used (LRU) cache implementation
   */
  export class LRUCache<K, V> {
    /** Maximum number of entries in the cache */
    private capacity: number;
    /** Current number of entries in the cache */
    private count: number;
    /** Map of keys to cache entries for O(1) access */
    private cache: Map<K, CacheEntry<K, V>>;
    /** Head of the doubly linked list (most recently used) */
    private head: CacheEntry<K, V> | null;
    /** Tail of the doubly linked list (least recently used) */
    private tail: CacheEntry<K, V> | null;
    /** Cache statistics for performance monitoring */
    private stats: CacheStats;
    
    /**
     * Create a new LRU cache
     * 
     * @param capacity Maximum number of entries to store (default: 100)
     */
    constructor(capacity: number = 100) {
      this.capacity = Math.max(1, capacity);
      this.count = 0;
      this.cache = new Map<K, CacheEntry<K, V>>();
      this.head = null;
      this.tail = null;
      this.stats = {
        hits: 0,
        misses: 0,
        accesses: 0,
        totalAccessTime: 0,
        hitRate: 0,
        averageAccessTime: 0
      };
    }
    
    /**
     * Get a value from the cache
     * 
     * @param key Cache key
     * @returns Cached value or undefined if not found
     */
    public get(key: K): V | undefined {
      const startTime = performance.now();
      this.stats.accesses++;
      
      const entry = this.cache.get(key);
      
      if (entry) {
        // Cache hit
        this.stats.hits++;
        
        // Update access time
        entry.accessTime = performance.now();
        
        // Move entry to the front (head) of the list
        this.removeFromList(entry);
        this.addToFront(entry);
        
        // Update stats
        this.stats.totalAccessTime += performance.now() - startTime;
        this.stats.hitRate = this.stats.hits / this.stats.accesses;
        this.stats.averageAccessTime = this.stats.totalAccessTime / this.stats.accesses;
        
        return entry.value;
      }
      
      // Cache miss
      this.stats.misses++;
      this.stats.hitRate = this.stats.hits / this.stats.accesses;
      
      return undefined;
    }
    
    /**
     * Add or update a value in the cache
     * 
     * @param key Cache key
     * @param value Value to cache
     */
    public set(key: K, value: V): void {
      // Check if key already exists
      const existingEntry = this.cache.get(key);
      
      if (existingEntry) {
        // Update existing entry
        existingEntry.value = value;
        existingEntry.accessTime = performance.now();
        
        // Move to front of the list
        this.removeFromList(existingEntry);
        this.addToFront(existingEntry);
        return;
      }
      
      // Create new entry
      const newEntry: CacheEntry<K, V> = {
        key,
        value,
        next: null,
        prev: null,
        accessTime: performance.now()
      };
      
      // Add to cache map
      this.cache.set(key, newEntry);
      
      // Add to front of the list
      this.addToFront(newEntry);
      
      // Increment count
      this.count++;
      
      // If over capacity, remove least recently used item
      if (this.count > this.capacity) {
        this.removeLRU();
      }
    }
    
    /**
     * Check if a key exists in the cache
     * 
     * @param key Cache key
     * @returns True if key exists in cache
     */
    public has(key: K): boolean {
      return this.cache.has(key);
    }
    
    /**
     * Remove a specific key from the cache
     * 
     * @param key Cache key to remove
     * @returns True if key was found and removed
     */
    public delete(key: K): boolean {
      const entry = this.cache.get(key);
      
      if (!entry) {
        return false;
      }
      
      // Remove from linked list
      this.removeFromList(entry);
      
      // Remove from cache map
      this.cache.delete(key);
      
      // Decrement count
      this.count--;
      
      return true;
    }
    
    /**
     * Clear all cache entries
     */
    public clear(): void {
      this.cache.clear();
      this.head = null;
      this.tail = null;
      this.count = 0;
      
      // Reset statistics
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.accesses = 0;
      this.stats.totalAccessTime = 0;
      this.stats.hitRate = 0;
      this.stats.averageAccessTime = 0;
    }
    
    /**
     * Get current cache size
     * 
     * @returns Number of entries in the cache
     */
    public size(): number {
      return this.count;
    }
    
    /**
     * Get cache hit rate
     * 
     * @returns Ratio of hits to total accesses (0-1)
     */
    public hitRate(): number {
      return this.stats.hitRate;
    }
    
    /**
     * Get average access time per entry
     * 
     * @returns Average time in milliseconds
     */
    public averageAccessTime(): number {
      return this.stats.averageAccessTime;
    }
    
    /**
     * Get cache statistics
     * 
     * @returns Cache statistics object
     */
    public getStats(): CacheStats {
      return { ...this.stats };
    }
    
    /**
     * Add an entry to the front (head) of the list
     */
    private addToFront(entry: CacheEntry<K, V>): void {
      // Update entry pointers
      entry.next = this.head;
      entry.prev = null;
      
      // Update head pointer
      if (this.head) {
        this.head.prev = entry;
      }
      this.head = entry;
      
      // If this is the first entry, it's also the tail
      if (!this.tail) {
        this.tail = entry;
      }
    }
    
    /**
     * Remove an entry from the linked list
     */
    private removeFromList(entry: CacheEntry<K, V>): void {
      // Update adjacent entries
      if (entry.prev) {
        entry.prev.next = entry.next;
      } else {
        // This is the head
        this.head = entry.next;
      }
      
      if (entry.next) {
        entry.next.prev = entry.prev;
      } else {
        // This is the tail
        this.tail = entry.prev;
      }
    }
    
    /**
     * Remove the least recently used entry (from the tail)
     */
    private removeLRU(): void {
      if (!this.tail) {
        return;
      }
      
      // Get the key to remove
      const key = this.tail.key;
      
      // Remove from the linked list
      this.removeFromList(this.tail);
      
      // Remove from the cache map
      this.cache.delete(key);
      
      // Decrement count
      this.count--;
    }
  }