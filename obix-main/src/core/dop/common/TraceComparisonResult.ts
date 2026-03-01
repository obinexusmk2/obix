
  /**
   * Represents the result of comparing two execution traces
   */
  export class TraceComparisonResult {
    /**
     * Whether both traces are functionally equivalent
     */
    public equivalent: boolean;
    
    /**
     * Points in the execution where traces diverged
     */
    public divergencePoints: string[];
    
    /**
     * Map of diverged values at specific points (path -> [expected, actual])
     */
    public valueDifferences: Map<string, [any, any]>;
    
    /**
     * Creates a new trace comparison result
     * 
     * @param equivalent Whether traces are equivalent
     * @param divergencePoints Points where traces diverged
     * @param valueDifferences Specific value differences
     */
    constructor(
      equivalent: boolean = true,
      divergencePoints: string[] = [],
      valueDifferences: Map<string, [any, any]> = new Map()
    ) {
      this.equivalent = equivalent;
      this.divergencePoints = [...divergencePoints];
      this.valueDifferences = new Map(valueDifferences);
    }
  }

  
  