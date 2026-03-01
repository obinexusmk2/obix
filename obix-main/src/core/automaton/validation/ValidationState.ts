/**
 * ValidationState class implementation required for state machine
 */
class ValidationState {
    /**
     * Unique identifier for this state
     */
    public stateId: string;
  
    /**
     * Whether this state is currently active
     */
    public active: boolean;
  
    /**
     * Additional metadata associated with this state
     */
    public metadata: Record<string, any>;
  
    /**
     * Equivalence class identifier for state minimization
     */
    public equivalenceClass: number | null;
  
    /**
     * Creates a new ValidationState instance
     * 
     * @param stateId Unique identifier for this state
     * @param active Whether this state is initially active
     * @param metadata Additional metadata for this state
     * @param equivalenceClass Optional equivalence class identifier
     */
    constructor(
      stateId: string,
      active: boolean = false,
      metadata: Record<string, any> = {},
      equivalenceClass: number | null = null
    ) {
      this.stateId = stateId;
      this.active = active;
      this.metadata = { ...metadata };
      this.equivalenceClass = equivalenceClass;
    }
  
    /**
     * Gets the state ID
     * 
     * @returns State ID
     */
    public getId(): string {
      return this.stateId;
    }
  
    /**
     * Checks if this state is active
     * 
     * @returns True if the state is active
     */
    public isActive(): boolean {
      return this.active;
    }
  
    /**
     * Gets metadata value by key
     * 
     * @param key Metadata key
     * @returns Metadata value or undefined if not found
     */
    public getMetadata(key: string): any {
      return this.metadata[key];
    }
  
    /**
     * Gets the equivalence class
     * 
     * @returns The equivalence class ID or null if not set
     */
    public getEquivalenceClass(): number | null {
      return this.equivalenceClass;
    }
  
    /**
     * Sets the equivalence class
     * 
     * @param classId The equivalence class ID
     */
    public setEquivalenceClass(classId: number): void {
      this.equivalenceClass = classId;
    }
  
    /**
     * Creates a clone of this state
     * 
     * @returns A new ValidationState instance
     */
    public clone(): ValidationState {
      return new ValidationState(
        this.stateId,
        this.active,
        { ...this.metadata },
        this.equivalenceClass
      );
    }
  }
  