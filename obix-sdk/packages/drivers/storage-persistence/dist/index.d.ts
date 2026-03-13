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
    backend?: StorageBackend;
    namespace?: string;
    maxEntries?: number;
    ttl?: number;
}
export interface StoragePersistenceDriverAPI {
    initialize(): Promise<void>;
    set(key: string, value: unknown, ttl?: number): Promise<void>;
    get(key: string): Promise<unknown>;
    remove(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    clear(): Promise<void>;
    keys(): Promise<string[]>;
    getSize(): Promise<number>;
    setTTL(key: string, ttl: number): Promise<void>;
    cleanup(): Promise<void>;
    destroy(): Promise<void>;
}
export declare function createStoragePersistenceDriver(config: StoragePersistenceDriverConfig): StoragePersistenceDriverAPI;
//# sourceMappingURL=index.d.ts.map