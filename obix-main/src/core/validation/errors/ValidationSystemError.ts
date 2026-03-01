import { ValidationErrorClass, ValidationPhase, ErrorSeverity } from "./ValidationError";

/**
 * Error representing a problem with the validation system itself
 */
export class ValidationSystemError extends ValidationErrorClass {
    /**
     * Phase where the error occurred
     */
    public phase: ValidationPhase;
    
    /**
     * Context information about the error
     */
    public context: Record<string, unknown>;
    
    /**
     * Stack trace from the original error
     */
    public stackTrace: string;
    
    /**
     * Whether the error is recoverable
     */
    public recoverable: boolean;
    
    /**
     * Recovery function if the error is recoverable
     */
    public recoveryFunction: Function | null;
    
    /**
     * Creates a new ValidationSystemError instance
     * 
     * @param errorCode Unique error code
     * @param message Human-readable error message
     * @param component Component where the error occurred
     * @param phase Phase where the error occurred
     * @param context Context information about the error
     * @param stackTrace Stack trace from the original error
     * @param recoverable Whether the error is recoverable
     * @param recoveryFunction Recovery function if the error is recoverable
     * @param metadata Additional metadata for the error
     * @param trace Trace of locations where the error passed through
     */
    constructor(
      errorCode: string,
      message: string,
      component: string,
      phase: ValidationPhase,
      context: Record<string, unknown> = {},
      stackTrace: string = '',
      recoverable: boolean = false,
      recoveryFunction: Function | null = null,
      metadata: Record<string, unknown> = {},
      trace: string[] = []
    ) {
      super(errorCode, message, component, 'system', ErrorSeverity.ERROR, metadata, trace);
      
      this.phase = phase;
      this.context = { ...context };
      this.stackTrace = stackTrace;
      this.recoverable = recoverable;
      this.recoveryFunction = recoveryFunction;
    }
    
    /**
     * Attempts to recover from the error
     * 
     * @param args Arguments to pass to the recovery function
     * @returns Result of the recovery function, or null if not recoverable
     */
    public recovery(...args: unknown[]): unknown {
      if (this.recoverable && this.recoveryFunction) {
        return this.recoveryFunction(...args);
      }
      return null;
    }
    
    /**
     * Converts the error to a JSON object
     * 
     * @returns JSON representation of the error
     */
    public override toJSON(): Record<string, unknown> {
      return {
        ...super.toJSON(),
        phase: this.phase,
        context: this.context,
        stackTrace: this.stackTrace,
        recoverable: this.recoverable
        // Note: recoveryFunction can't be serialized
      };
    }
    
    /**
     * Creates a ValidationSystemError from a plain object
     * 
     * @param obj The plain object
     * @returns A new ValidationSystemError instance
     */
    public static override fromObject(obj: unknown): ValidationSystemError {
      const errorObj = obj as {
        errorCode?: string;
        message?: string;
        component?: string;
        phase?: ValidationPhase;
        context?: Record<string, unknown>;
        stackTrace?: string;
        recoverable?: boolean;
        metadata?: Record<string, unknown>;
        trace?: string[];
      };
      return new ValidationSystemError(
        errorObj.errorCode || 'SYSTEM_ERROR',
        errorObj.message || 'System error',
        errorObj.component || 'unknown',
        errorObj.phase || ValidationPhase.INITIALIZATION,
        errorObj.context || {},
        errorObj.stackTrace || '',
        errorObj.recoverable || false,
        null, // Recovery function can't be deserialized
        errorObj.metadata || {},
        errorObj.trace || []
      );
    }
  }
  
 