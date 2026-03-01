/**
 * Common error types and enumerations for the OBIX framework
 * 
 * These types are used throughout the validation system and DOP pattern implementation
 * to provide consistent error handling and reporting.
 */

/**
 * Severity levels for validation errors and warnings
 */
export enum ErrorSeverity {
    /** Informational messages that don't affect functionality */
    INFO = 'info',
    
    /** Warning messages that indicate potential issues */
    WARNING = 'warning',
    
    /** Error messages that indicate functionality issues */
    ERROR = 'error',
    
    /** Critical errors that prevent normal operation */
    CRITICAL = 'critical'
  }
  
  /**
   * Error codes for validation and parsing errors
   */
  export enum ErrorCode {
    // General error codes
    UNKNOWN_ERROR = 'unknown_error',
    VALIDATION_ERROR = 'validation_error',
    PARSING_ERROR = 'parsing_error',
    
    // DOP-specific error codes
    IMPLEMENTATION_MISMATCH = 'implementation_mismatch',
    BEHAVIOR_CHAIN_ERROR = 'behavior_chain_error',
    INVALID_STATE_TRANSITION = 'invalid_state_transition',
    
    // Structural error codes
    INVALID_STRUCTURE = 'invalid_structure',
    MISSING_REQUIRED_FIELD = 'missing_required_field',
    INVALID_TYPE = 'invalid_type',
    
    // State machine error codes
    STATE_MACHINE_ERROR = 'state_machine_error',
    INVALID_STATE = 'invalid_state',
    TRANSITION_ERROR = 'transition_error',
    
    // AST-specific error codes
    AST_ERROR = 'ast_error',
    INVALID_NODE = 'invalid_node',
    INVALID_PARENT_REF = 'invalid_parent_ref'
  }
  
  /**
   * Base error interface for all OBIX errors
   */
  export interface BaseError {
    /** Error code */
    code: ErrorCode;
    
    /** Error message */
    message: string;
    
    /** Error severity */
    severity: ErrorSeverity;
    
    /** Component that generated the error */
    component?: string;
    
    /** Additional error details */
    details?: Record<string, any>;
    
    /** Stack trace */
    stack?: string;
  }
  
  /**
   * Position information for errors in source code
   */
  export interface SourcePosition {
    /** Line number (1-based) */
    line: number;
    
    /** Column number (1-based) */
    column: number;
    
    /** Start offset in the source (0-based) */
    start: number;
    
    /** End offset in the source (0-based) */
    end: number;
  }
  
  /**
   * Interface for parser errors that include source position
   */
  export interface ParserErrorInfo extends BaseError {
    /** Source position */
    position: SourcePosition;
    
    /** Source text that caused the error */
    source?: string;
  }