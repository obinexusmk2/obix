/**
 * MRUCache.ts
 * 
 * Most Recently Used cache implementation optimized for frequently accessed components
 * and data-intensive operations. This implementation complements the LRU cache by
 * prioritizing the most active items for UI component state transitions.
 * 
 * Integration with Nnamdi Okpala's automaton state minimization technology enables
 * efficient state transition tracking with minimal overhead.
 * 
 * Copyright © 2025 OBINexus Computing
 */

/**
 * Cache entry with key, value, and metadata for the MRU cache
 */
interface MRUCacheEntry<K, V> {
    /** Cache key */
    key: K;
    /** Cached value */
    value: V;
    /** Next entry in the linked list */
    next: MRUCacheEntry<K, V> | null;
    /** Previous entry in the linked list */
    prev: MRUCacheEntry<K, V> | null;
    /** Timestamp when entry was added or accessed */
    accessTime: number;
    /** Access frequency count */
    accessCount: number;
    /** Last transition state identifier (for component state tracking) */
    lastTransitionState?: string;
}

/**
 * Cache statistics for performance monitoring
 */
export interface MRUCacheStats {
    /** Total number of cache hits */
    hits: number;
    /** Total number of cache misses */
    misses: number;
    /** Total number of cache accesses */
    accesses: number;
    /** Total time spent accessing cache entries (ms) */
    totalAccessTime: number;
    /** Total number of evictions */
    evictions: number;
    /** Hit rate as a ratio (0-1) */
    hitRate: number;
    /** Average access time per entry (ms) */
    averageAccessTime: number;
    /** Average access count per entry */
    averageAccessCount: number;
    /** Current memory usage estimation (bytes) */
    memoryUsage: number;
}

/**
 * Configuration options for the MRU cache
 */
export interface MRUCacheOptions {
    /** Maximum number of entries to store */
    capacity?: number;
    /** Enable transition state tracking for components */
    trackTransitions?: boolean;
    /** Function to estimate memory size of entries */
    memorySizeEstimator?: (key: any, value: any) => number;
    /** Maximum memory size (in bytes) before triggering cleanup */
    maxMemorySize?: number;
    /** Time-to-live for cache entries (in milliseconds) */
    ttl?: number;
    /** Auto-cleanup interval (in milliseconds) */
    cleanupInterval?: number;
}

/**
 * Most Recently Used (MRU) cache implementation with integrated state transition tracking
 */
export class MRUCache<K, V> {
    /** Maximum number of entries in the cache */
    private capacity: number;
    /** Current number of entries in the cache */
    private count: number;
    /** Map of keys to cache entries for O(1) access */
    private cache: Map<K, MRUCacheEntry<K, V>>;
    /** Head of the doubly linked list (most recently used) */
    private head: MRUCacheEntry<K, V> | null;
    /** Tail of the doubly linked list (least recently used) */
    private tail: MRUCacheEntry<K, V> | null;
    /** Cache statistics for performance monitoring */
    private stats: MRUCacheStats;
    /** Whether to track transition states for components */
    private trackTransitions: boolean;
    /** Function to estimate memory size of entries */
    private memorySizeEstimator: (key: any, value: any) => number;
    /** Maximum memory size (in bytes) */
    private maxMemorySize: number;
    /** Current estimated memory usage */
    private currentMemoryUsage: number;
    /** Time-to-live for cache entries (in milliseconds) */
    private ttl: number | null;
    /** Cleanup interval timer ID */
    private cleanupTimerId: NodeJS.Timeout | null;
    /** Auto-cleanup interval (in milliseconds) */
    private cleanupInterval: number | null;
    
    /**
     * Create a new MRU cache
     * 
     * @param options Configuration options
     */
    constructor(options: MRUCacheOptions = {}) {
        this.capacity = options.capacity || 100;
        this.count = 0;
        this.cache = new Map<K, MRUCacheEntry<K, V>>();
        this.head = null;
        this.tail = null;
        this.trackTransitions = options.trackTransitions || false;
        this.ttl = options.ttl || null;
        this.cleanupInterval = options.cleanupInterval || null;
        this.cleanupTimerId = null;
        
        // Default memory size estimator (rough estimation)
        this.memorySizeEstimator = options.memorySizeEstimator || 
            ((key, value) => {
                let size = 0;
                // Estimate key size
                if (typeof key === 'string') {
                    size += key.length * 2; // UTF-16 characters (2 bytes each)
                } else if (typeof key === 'number') {
                    size += 8; // 8 bytes for number
                } else if (typeof key === 'object' && key !== null) {
                    size += 50; // Base object size estimate
                    // Add rough size for stringified object
                    try {
                        size += JSON.stringify(key).length * 2;
                    } catch (e) {
                        size += 100; // Fallback if not stringifiable
                    }
                }

                // Estimate value size
                if (typeof value === 'string') {
                    size += value.length * 2;
                } else if (typeof value === 'number') {
                    size += 8;
                } else if (typeof value === 'object' && value !== null) {
                    size += 100; // Base object size estimate
                    // Add rough size for stringified object
                    try {
                        size += JSON.stringify(value).length * 2;
                    } catch (e) {
                        size += 200; // Fallback if not stringifiable
                    }
                }
                
                // Add overhead for MRUCacheEntry structure
                size += 56; // Pointers and timestamps
                
                return size;
            });
        
        this.maxMemorySize = options.maxMemorySize || 1024 * 1024 * 10; // Default 10MB
        this.currentMemoryUsage = 0;
        
        this.stats = {
            hits: 0,
            misses: 0,
            accesses: 0,
            totalAccessTime: 0,
            evictions: 0,
            hitRate: 0,
            averageAccessTime: 0,
            averageAccessCount: 0,
            memoryUsage: 0
        };
        
        // Start cleanup interval if specified
        if (this.cleanupInterval !== null) {
            this.startCleanupInterval();
        }
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
            // Check if entry has expired
            if (this.ttl !== null && (Date.now() - entry.accessTime) > this.ttl) {
                // Entry expired, remove it
                this.delete(key);
                this.stats.misses++;
                this.stats.hitRate = this.stats.hits / this.stats.accesses;
                return undefined;
            }
            
            // Cache hit
            this.stats.hits++;
            
            // Update access time and count
            entry.accessTime = Date.now();
            entry.accessCount++;
            
            // Move entry to the front (head) of the list
            this.removeFromList(entry);
            this.addToFront(entry);
            
            // Update stats
            this.stats.totalAccessTime += performance.now() - startTime;
            this.stats.hitRate = this.stats.hits / this.stats.accesses;
            this.stats.averageAccessTime = this.stats.totalAccessTime / this.stats.accesses;
            
            const totalAccessCounts = Array.from(this.cache.values())
                .reduce((sum, entry) => sum + entry.accessCount, 0);
            this.stats.averageAccessCount = totalAccessCounts / this.count || 0;
            
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
     * @param transitionState Optional transition state identifier for components
     */
    public set(key: K, value: V, transitionState?: string): void {
        // Check if key already exists
        const existingEntry = this.cache.get(key);
        
        if (existingEntry) {
            // Calculate memory difference for the update
            const oldSize = this.memorySizeEstimator(key, existingEntry.value);
            const newSize = this.memorySizeEstimator(key, value);
            const sizeDifference = newSize - oldSize;
            
            // Update current memory usage
            this.currentMemoryUsage += sizeDifference;
            this.stats.memoryUsage = this.currentMemoryUsage;
            
            // Update existing entry
            existingEntry.value = value;
            existingEntry.accessTime = Date.now();
            existingEntry.accessCount++;
            
            // Update transition state if tracking is enabled
            if (this.trackTransitions && transitionState) {
                existingEntry.lastTransitionState = transitionState;
            }
            
            // Move to front of the list (most recently used)
            this.removeFromList(existingEntry);
            this.addToFront(existingEntry);
            
            // Check if we need to free up memory
            this.checkAndFreeMemory();
            
            return;
        }
        
        // Create new entry
        const newEntry: MRUCacheEntry<K, V> = {
            key,
            value,
            next: null,
            prev: null,
            accessTime: Date.now(),
            accessCount: 1
        };
        
        // Add transition state if tracking is enabled
        if (this.trackTransitions && transitionState) {
            newEntry.lastTransitionState = transitionState;
        }
        
        // Calculate memory usage for new entry
        const entrySize = this.memorySizeEstimator(key, value);
        this.currentMemoryUsage += entrySize;
        this.stats.memoryUsage = this.currentMemoryUsage;
        
        // Add to cache map
        this.cache.set(key, newEntry);
        
        // Add to front of the list (most recently used)
        this.addToFront(newEntry);
        
        // Increment count
        this.count++;
        
        // If over capacity, remove most recently used item (MRU eviction policy)
        if (this.count > this.capacity) {
            this.evictMRU();
        }
        
        // Check if we need to free up memory
        this.checkAndFreeMemory();
    }
    
    /**
     * Check if a key exists in the cache
     * 
     * @param key Cache key
     * @returns True if key exists in cache
     */
    public has(key: K): boolean {
        const entry = this.cache.get(key);
        
        // Check if entry exists and hasn't expired
        if (entry && this.ttl !== null) {
            if ((Date.now() - entry.accessTime) > this.ttl) {
                // Entry has expired, remove it
                this.delete(key);
                return false;
            }
        }
        
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
        
        // Update memory usage
        const entrySize = this.memorySizeEstimator(key, entry.value);
        this.currentMemoryUsage -= entrySize;
        this.stats.memoryUsage = this.currentMemoryUsage;
        
        // Remove from linked list
        this.removeFromList(entry);
        
        // Remove from cache map
        this.cache.delete(key);
        
        // Decrement count
        this.count--;
        
        return true;
    }
    
    /**
     * Get an entry with its metadata
     * 
     * @param key Cache key
     * @returns Entry with metadata or undefined if not found
     */
    public getWithMetadata(key: K): {
        value: V,
        accessCount: number,
        accessTime: number,
        lastTransitionState?: string
    } | undefined {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return undefined;
        }
        
        // Check if entry has expired
        if (this.ttl !== null && (Date.now() - entry.accessTime) > this.ttl) {
            // Entry expired, remove it
            this.delete(key);
            return undefined;
        }
        
        const result: {
            value: V,
            accessCount: number,
            accessTime: number,
            lastTransitionState?: string
        } = {
            value: entry.value,
            accessCount: entry.accessCount,
            accessTime: entry.accessTime
        };
        
        // Only add lastTransitionState if it exists
        if (entry.lastTransitionState !== undefined) {
            result.lastTransitionState = entry.lastTransitionState;
        }
        
        return result;
    }
    
    /**
     * Get all entries with a specific transition state
     * 
     * @param transitionState The transition state to filter by
     * @returns Array of entries with the specified transition state
     */
    public getByTransitionState(transitionState: string): Array<{
        key: K,
        value: V,
        accessCount: number,
        accessTime: number
    }> {
        // Only works if transition tracking is enabled
        if (!this.trackTransitions) {
            return [];
        }
        
        const result: Array<{
            key: K,
            value: V,
            accessCount: number,
            accessTime: number
        }> = [];
        
        for (const entry of this.cache.values()) {
            // Skip expired entries
            if (this.ttl !== null && (Date.now() - entry.accessTime) > this.ttl) {
                continue;
            }
            
            if (entry.lastTransitionState === transitionState) {
                result.push({
                    key: entry.key,
                    value: entry.value,
                    accessCount: entry.accessCount,
                    accessTime: entry.accessTime
                });
            }
        }
        
        return result;
    }
    
    /**
     * Update transition state for a cached entry
     * 
     * @param key Cache key
     * @param transitionState New transition state
     * @returns True if the entry was found and updated
     */
    public updateTransitionState(key: K, transitionState: string): boolean {
        // Only works if transition tracking is enabled
        if (!this.trackTransitions) {
            return false;
        }
        
        const entry = this.cache.get(key);
        
        if (!entry) {
            return false;
        }
        
        // Update transition state
        entry.lastTransitionState = transitionState;
        
        // Update access time
        entry.accessTime = Date.now();
        entry.accessCount++;
        
        // Move to front (most recently used)
        this.removeFromList(entry);
        this.addToFront(entry);
        
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
        this.currentMemoryUsage = 0;
        
        // Reset statistics
        this.stats = {
            hits: 0,
            misses: 0,
            accesses: 0,
            totalAccessTime: 0,
            evictions: 0,
            hitRate: 0,
            averageAccessTime: 0,
            averageAccessCount: 0,
            memoryUsage: 0
        };
    }
    
    /**
     * Get the most frequently accessed entries
     * 
     * @param limit Maximum number of entries to return
     * @returns Array of the most frequently accessed entries
     */
    public getMostFrequentEntries(limit: number = 10): Array<{
        key: K,
        value: V,
        accessCount: number
    }> {
        // Convert cache to array and sort by access count
        const entries = Array.from(this.cache.values())
            .map(entry => ({
                key: entry.key,
                value: entry.value,
                accessCount: entry.accessCount
            }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, limit);
        
        return entries;
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
     * Get cache statistics
     * 
     * @returns Cache statistics object
     */
    public getStats(): MRUCacheStats {
        return { ...this.stats };
    }
    
    /**
     * Set the time-to-live for cache entries
     * 
     * @param ttl Time-to-live in milliseconds (null for no expiration)
     */
    public setTTL(ttl: number | null): void {
        this.ttl = ttl;
    }
    
    /**
     * Enable or disable transition state tracking
     * 
     * @param enabled Whether to enable transition state tracking
     */
    public setTransitionTracking(enabled: boolean): void {
        this.trackTransitions = enabled;
    }
    
    /**
     * Configure the cleanup interval
     * 
     * @param interval Cleanup interval in milliseconds (null to disable)
     */
    public setCleanupInterval(interval: number | null): void {
        // Stop existing interval if any
        if (this.cleanupTimerId !== null) {
            clearInterval(this.cleanupTimerId);
            this.cleanupTimerId = null;
        }
        
        this.cleanupInterval = interval;
        
        // Start new interval if not null
        if (interval !== null) {
            this.startCleanupInterval();
        }
    }
    
    /**
     * Start the cleanup interval timer
     */
    private startCleanupInterval(): void {
        if (this.cleanupInterval === null) {
            return;
        }
        
        this.cleanupTimerId = setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.cleanupInterval);
    }
    
    /**
     * Cleanup expired entries
     */
    public cleanupExpiredEntries(): void {
        // Only if TTL is set
        if (this.ttl === null) {
            return;
        }
        
        const now = Date.now();
        const expiredKeys: K[] = [];
        
        // Find expired entries
        for (const [key, entry] of this.cache.entries()) {
            if ((now - entry.accessTime) > this.ttl) {
                expiredKeys.push(key);
            }
        }
        
        // Delete expired entries
        for (const key of expiredKeys) {
            this.delete(key);
        }
    }
    
    /**
     * Check and free memory if exceeding limits
     */
    private checkAndFreeMemory(): void {
        // If we're over the memory limit, free some space
        if (this.currentMemoryUsage > this.maxMemorySize) {
            const targetUsage = this.maxMemorySize * 0.8; // Target 80% of max
            
            while (this.currentMemoryUsage > targetUsage && this.count > 0) {
                this.evictMRU();
            }
        }
    }
    
    /**
     * Add an entry to the front (head) of the list
     */
    private addToFront(entry: MRUCacheEntry<K, V>): void {
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
    private removeFromList(entry: MRUCacheEntry<K, V>): void {
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
     * Remove the most recently used entry (from the head)
     * This is the MRU eviction policy which differs from LRU
     */
    private evictMRU(): void {
        if (!this.head) {
            return;
        }
        
        // Get the key to remove
        const key = this.head.key;
        
        // Update memory usage
        const entrySize = this.memorySizeEstimator(key, this.head.value);
        this.currentMemoryUsage -= entrySize;
        this.stats.memoryUsage = this.currentMemoryUsage;
        
        // Remove from the linked list
        this.removeFromList(this.head);
        
        // Remove from the cache map
        this.cache.delete(key);
        
        // Update stats
        this.stats.evictions++;
        
        // Decrement count
        this.count--;
    }
    
    /**
     * Cleanup resources when the cache is no longer needed
     */
    public dispose(): void {
        // Stop cleanup interval if running
        if (this.cleanupTimerId) {
            clearInterval(this.cleanupTimerId);
            this.cleanupTimerId = null;
        }
        
        // Clear all cache entries
        this.clear();
    }
}