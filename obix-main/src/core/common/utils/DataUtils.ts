/**
 * Utility functions for data manipulation and optimization
 */

/**
 * Type guard to check if an object has a specific property
 * 
 * @param obj Object to check
 * @param prop Property name
 * @returns True if the object has the property
 */
export function hasProperty<T extends object, K extends string>(
    obj: T,
    prop: K
  ): obj is T & Record<K, unknown> {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  
  /**
   * Type guard to check if a value is a plain object
   * 
   * @param value Value to check
   * @returns True if the value is a plain object
   */
  export function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
  
  /**
   * Type guard to check if a value is a Date object
   * 
   * @param value Value to check
   * @returns True if the value is a Date
   */
  export function isDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
  }
  
  /**
   * Type guard to check if a value is a function
   * 
   * @param value Value to check
   * @returns True if the value is a function
   */
  export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
  }
  
  /**
   * Safely parse JSON with error handling
   * 
   * @param json JSON string to parse
   * @param defaultValue Default value if parsing fails
   * @returns Parsed object or default value
   */
  export function safeJsonParse<T>(json: string, defaultValue: T): T {
    try {
      return JSON.parse(json) as T;
    } catch (error) {
      return defaultValue;
    }
  }
  
  /**
   * Create an immutable version of an object
   * 
   * @param obj Object to make immutable
   * @returns Deep frozen object
   */
  export function makeImmutable<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      Object.freeze(obj.map(makeImmutable));
      return obj;
    }
    
    // Freeze properties first
    const props = Object.getOwnPropertyNames(obj);
    
    for (const prop of props) {
      const value = (obj as any)[prop];
      
      if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        (obj as any)[prop] = makeImmutable(value);
      }
    }
    
    // Then freeze the object itself
    return Object.freeze(obj);
  }
  
  /**
   * Group an array of objects by a key
   * 
   * @param arr Array to group
   * @param key Key to group by
   * @returns Grouped object
   */
  export function groupBy<T, K extends keyof T>(arr: T[], key: K): Record<string, T[]> {
    return arr.reduce((result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    }, {} as Record<string, T[]>);
  }
  
  /**
   * Convert an array to a Map using a key function
   * 
   * @param array Array to convert
   * @param keyFn Function to extract key from item
   * @returns Map with keys from keyFn and values from array
   */
  export function arrayToMap<T, K>(
    array: T[],
    keyFn: (item: T) => K
  ): Map<K, T> {
    return new Map(array.map(item => [keyFn(item), item]));
  }
  
  /**
   * Create an immutable map-like object that uses less memory
   * Optimized for strings or number keys
   * 
   * @returns Immutable map-like object
   */
  export function createFlyweightMap<T>(): {
    get: (key: string | number) => T | undefined;
    set: (key: string | number, value: T) => void;
    has: (key: string | number) => boolean;
    delete: (key: string | number) => boolean;
    clear: () => void;
    size: () => number;
    keys: () => (string | number)[];
    values: () => T[];
    entries: () => [string | number, T][];
  } {
    const store: Record<string, T> = Object.create(null);
    let count = 0;
    
    return {
      get: (key) => store[String(key)],
      set: (key, value) => {
        const stringKey = String(key);
        if (!(stringKey in store)) {
          count++;
        }
        store[stringKey] = value;
      },
      has: (key) => String(key) in store,
      delete: (key) => {
        const stringKey = String(key);
        if (stringKey in store) {
          delete store[stringKey];
          count--;
          return true;
        }
        return false;
      },
      clear: () => {
        for (const key in store) {
          delete store[key];
        }
        count = 0;
      },
      size: () => count,
      keys: () => Object.keys(store),
      values: () => Object.values(store),
      entries: () => Object.entries(store)
    };
  }
  
  /**
   * Create a memory-efficient set-like object
   * Optimized for strings or number values
   * 
   * @returns Set-like object
   */
  export function createFlyweightSet(): {
    add: (value: string | number) => void;
    has: (value: string | number) => boolean;
    delete: (value: string | number) => boolean;
    clear: () => void;
    size: () => number;
    values: () => (string | number)[];
  } {
    const store: Record<string, true> = Object.create(null);
    let count = 0;
    
    return {
      add: (value) => {
        const stringValue = String(value);
        if (!(stringValue in store)) {
          store[stringValue] = true;
          count++;
        }
      },
      has: (value) => String(value) in store,
      delete: (value) => {
        const stringValue = String(value);
        if (stringValue in store) {
          delete store[stringValue];
          count--;
          return true;
        }
        return false;
      },
      clear: () => {
        for (const key in store) {
          delete store[key];
        }
        count = 0;
      },
      size: () => count,
      values: () => Object.keys(store)
    };
  }
  
  /**
   * Get an approximate size of an object in bytes
   * 
   * @param obj Object to measure
   * @returns Approximate size in bytes
   */
  export function approximateSizeOf(obj: any): number {
    const seen = new WeakSet();
    
    function sizeOf(value: any): number {
      if (value === null) {
        return 0;
      }
      
      const type = typeof value;
      
      // Handle primitive types
      switch (type) {
        case 'boolean':
          return 4;
        case 'number':
          return 8;
        case 'string':
          return value.length * 2;
        case 'undefined':
          return 0;
      }
      
      // Avoid circular references
      if (seen.has(value)) {
        return 0;
      }
      
      seen.add(value);
      
      // Handle arrays
      if (Array.isArray(value)) {
        return value.reduce((acc, item) => acc + sizeOf(item), 0);
      }
      
      // Handle dates
      if (value instanceof Date) {
        return 8;
      }
      
      // Handle maps
      if (value instanceof Map) {
        let mapSize = 0;
        for (const [key, val] of value.entries()) {
          mapSize += sizeOf(key) + sizeOf(val);
        }
        return mapSize;
      }
      
      // Handle sets
      if (value instanceof Set) {
        let setSize = 0;
        for (const item of value.values()) {
          setSize += sizeOf(item);
        }
        return setSize;
      }
      
      // Handle objects
      if (type === 'object') {
        let objectSize = 0;
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            objectSize += key.length * 2; // Key size
            objectSize += sizeOf(value[key]); // Value size
          }
        }
        return objectSize;
      }
      
      return 0;
    }
    
    return sizeOf(obj);
  }