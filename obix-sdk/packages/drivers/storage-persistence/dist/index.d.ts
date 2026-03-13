/**
 * Storage Persistence Driver
 * LocalStorage/IndexedDB wrapper for state caching
 */
export type StorageBackend = "localStorage" | "indexedDB";
export interface StoredValue {
    data: unknown;
    timestamp: number;
    ttl?: number;
}
export interface StoragePersistenceDriverConfig {
    /** Storage backend to use */
    backend?: StorageBackend;
    /** Namespace for stored items */
    namespace?: string;
    /** Maximum number of entries to store */
    maxEntries?: number;
    /** Time-to-live for entries in milliseconds */
    ttl?: number;
}
export interface StoragePersistenceDriverAPI {
    /** Initialize storage driver */
    initialize(): Promise<void>;
    /** Store a value */
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    /** Retrieve a value */
    get(key: string): Promise<unknown>;
    /** Remove a value */
    remove(key: string): Promise<void>;
    /** Check if a key exists */
    has(key: string): Promise<boolean>;
    /** Clear all values */
    clear(): Promise<void>;
    /** Get all keys */
    keys(): Promise<string[]>;
    /** Get storage size */
    getSize(): Promise<number>;
    /** Set TTL for an entry */
    setTTL(key: string, ttl: number): Promise<void>;
    /** Clean up expired entries */
    cleanup(): Promise<void>;
    /** Destroy the driver */
    destroy(): Promise<void>;
}
export declare function createStoragePersistenceDriver(config: StoragePersistenceDriverConfig): StoragePersistenceDriverAPI;
//# sourceMappingURL=index.d.ts.map