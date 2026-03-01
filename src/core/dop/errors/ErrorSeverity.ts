

// Export an alias for compatibility with existing code
/**
 * Enumeration of error severity levels
 */
export enum ErrorSeverity {
    /**
     * Information only, doesn't affect correctness
     */
    INFO = 0,
    
    /**
     * Warning, potential issue but not critical
     */
    WARNING = 1,
    
    /**
     * Error, significant issue affecting correctness
     */
    ERROR = 2,
    
    /**
     * Critical error, fundamental implementation issue
     */
    CRITICAL = 3
  }
  