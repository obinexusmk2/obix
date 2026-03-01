

/**
 * Base interface for all data models in the DOP pattern
 * Represents a pure data structure without behavior
 * 
 * @template T Type of the data model (for self-referencing generics)
 */
export interface DataModel<T> {
    /**
     * Creates a deep clone of the data model
     * 
     * @returns A new instance with identical data
     */
    clone(): T;
    
    /**
     * Converts the data model to a plain JavaScript object
     * suitable for serialization or transmission
     * 
     * @returns A serializable representation of the model
     */
    toObject(): Record<string, any>;
    
    /**
     * Merges data from another instance of the same model type
     * 
     * @param other The other model to merge from
     * @returns A new instance containing merged data
     */
    merge(other: T): T;

    /**
     * Deep equality check against another data model
     * 
     * @param other The other model to compare with
     * @returns True if the models are equivalent
     */
    equals(other: T): boolean;
    
    /**
     * Gets the state minimization signature for this data model
     * Used by the automaton state minimization algorithm
     * 
     * @returns A unique signature representing the model's state
     */
    getMinimizationSignature(): string;
}

/**
 * Base  class implementing common DataModel functionality
 * Provides foundational immutable data operations
 * 
 * @template T Type of the derived data model (for self-referencing generics)
 */
export abstract class BaseDataModel<T extends BaseDataModel<T>> implements DataModel<T> {
    /**
     * Optional metadata for the model
     */
    protected metadata: Map<string, any> = new Map();
    
    /**
     * Optional equivalence class for state minimization
     */
    protected equivalenceClass: number = -1;
    
    /**
     * Converts the data model to a plain JavaScript object
     * This method must be implemented by concrete data model classes
     */
    abstract toObject(): Record<string, any>;
    
    /**
     * Creates a deep clone of the data model
     * This method must be implemented by concrete data model classes
     */
    abstract clone(): T;
    
    /**
     * Merges data from another instance of the same model type
     * This method must be implemented by concrete data model classes
     */
    abstract merge(other: T): T;
    
    /**
     * Creates a new instance with updated field value
     * 
     * @param field The field name to update
     * @param value The new value to set
     * @returns A new instance with the updated field
     */
    protected withField<K extends keyof T>(field: K, value: T[K]): T {
        const clone = this.clone();
        Object.assign(clone, { [field]: value });
        return clone;
    }
    
    /**
     * Creates a new instance with multiple updated field values
     * 
     * @param fields Object containing field-value pairs to update
     * @returns A new instance with the updated fields
     */
    protected withFields(fields: Partial<T>): T {
        const clone = this.clone();
        Object.assign(clone, fields);
        return clone;
    }
    
    /**
     * Deep equality check against another data model
     * 
     * @param other The other model to compare with
     * @returns True if the models are equivalent
     */
    public equals(other: T): boolean {
        if (other === null || other === undefined) {
            return false;
        }
        
        const thisObj = this.toObject();
        const otherObj = other.toObject();
        
        return this.deepEquals(thisObj, otherObj);
    }
    
    /**
     * Deep comparison of two objects
     * 
     * @public
     * @param obj1 First object
     * @param obj2 Second object
     * @returns True if objects are deeply equal
     */
    public deepEquals(obj1: any, obj2: any): boolean {
        // Handle primitive types
        if (obj1 === obj2) return true;
        if (obj1 === null || obj2 === null) return false;
        if (obj1 === undefined || obj2 === undefined) return false;
        
        // Handle different types
        if (typeof obj1 !== typeof obj2) return false;
        
        // Handle arrays
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!this.deepEquals(obj1[i], obj2[i])) return false;
            }
            return true;
        }
        
        // Handle objects
        if (typeof obj1 === 'object') {
            // Handle Date objects
            if (obj1 instanceof Date && obj2 instanceof Date) {
                return obj1.getTime() === obj2.getTime();
            }
            
            // Handle regular objects
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            
            if (keys1.length !== keys2.length) return false;
            
            for (const key of keys1) {
                if (!keys2.includes(key)) return false;
                if (!this.deepEquals(obj1[key], obj2[key])) return false;
            }
            
            return true;
        }
        
        // Different values
        return false;
    }

    
    
    /**
     * Gets a state minimization signature for this data model
     * Used by automaton state minimization algorithm to identify equivalent states
     * 
     * @returns A string signature representing the model's state
     */
    public getMinimizationSignature(): string {
        // Default implementation uses JSON.stringify on the toObject result
        // Concrete implementations should override this with more efficient signatures
        const obj = this.toObject();
        
        // Extract relevant properties for state minimization
        const relevantProps: Record<string, any> = {};
        
        // Filter out properties that don't affect the state equivalence
        Object.entries(obj).forEach(([key, value]) => {
            // Skip internal properties
            if (!key.startsWith('_') && !key.startsWith('$')) {
                relevantProps[key] = value;
            }
        });
        
        // Return a stable JSON string (sorted keys)
        return JSON.stringify(relevantProps, Object.keys(relevantProps).sort());
    }
    
    /**
     * Gets the equivalence class for this model
     * Used by the state minimization algorithm
     * 
     * @returns The equivalence class identifier
     */
    public getEquivalenceClass(): number {
        return this.equivalenceClass;
    }
    
    /**
     * Sets the equivalence class for this model
     * Used by the state minimization algorithm
     * 
     * @param classId The equivalence class identifier
     */
    public setEquivalenceClass(classId: number): void {
        this.equivalenceClass = classId;
    }
    
    /**
     * Sets a metadata value
     * 
     * @param key The metadata key
     * @param value The metadata value
     * @returns This instance for method chaining
     */
    public setMetadata(key: string, value: any): T {
        this.metadata.set(key, value);
        return this as unknown as T;
    }
    
    /**
     * Gets a metadata value
     * 
     * @param key The metadata key
     * @returns The metadata value or undefined if not found
     */
    public getMetadata(key: string): any {
        return this.metadata.get(key);
    }
    
    /**
     * Gets all metadata
     * 
     * @returns A copy of the metadata map
     */
    public getAllMetadata(): Map<string, any> {
        return new Map(this.metadata);
    }

}