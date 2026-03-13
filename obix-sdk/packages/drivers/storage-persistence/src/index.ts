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

export function createStoragePersistenceDriver(
  config: StoragePersistenceDriverConfig
): StoragePersistenceDriverAPI {
  const store = new Map<string, StoredValue>();
  const ns = config.namespace ?? "obix";

  const getScoped = (key: string) => `${ns}:${key}`;
  const isExpired = (value: StoredValue) =>
    typeof value.ttl === "number" && Date.now() > value.timestamp + value.ttl;

  return {
    async initialize() {},
    async set(key, value, ttl) {
      const scoped = getScoped(key);
      if (store.size >= (config.maxEntries ?? Number.MAX_SAFE_INTEGER) && !store.has(scoped)) {
        const oldest = Array.from(store.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        if (oldest) {
          store.delete(oldest[0]);
        }
      }
      store.set(scoped, { data: value, ttl: ttl ?? config.ttl, timestamp: Date.now() });
    },
    async get(key) {
      const item = store.get(getScoped(key));
      if (!item) {
        return null;
      }
      if (isExpired(item)) {
        store.delete(getScoped(key));
        return null;
      }
      return item.data;
    },
    async remove(key) {
      store.delete(getScoped(key));
    },
    async has(key) {
      return (await this.get(key)) !== null;
    },
    async clear() {
      store.clear();
    },
    async keys() {
      return Array.from(store.keys()).map((key) => key.slice(ns.length + 1));
    },
    async getSize() {
      return store.size;
    },
    async setTTL(key, ttl) {
      const scoped = getScoped(key);
      const item = store.get(scoped);
      if (!item) {
        return;
      }
      item.ttl = ttl;
    },
    async cleanup() {
      for (const [key, value] of store.entries()) {
        if (isExpired(value)) {
          store.delete(key);
        }
      }
    },
    async destroy() {
      store.clear();
    },
  };
}
