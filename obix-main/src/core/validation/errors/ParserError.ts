/**
 * Error representing a parser-related issue
 */
export class ParserError extends ValidationErrorClass {
    /**
     * Position where the error occurred
     */
    public position: Position;
    
    /**
     * Context around the error (e.g., snippet of code)
     */
    public context: string;
    
    /**
     * Creates a new ParserError instance
     * 
     * @param errorCode Unique error code
     * @param message Human-readable error message
     * @param component Component where the error occurred
     * @param position Position where the error occurred
     * @param context Context around the error
     * @param metadata Additional metadata for the error
     * @param trace Trace of locations where the error passed through
     */
    constructor(
      errorCode: string,
      message: string,
      component: string,
      position: Position,
      context: string = '',
      metadata: Record<string, unknown> = {},
      trace: string[] = []
    ) {
      super(errorCode, message, component, 'parser', ErrorSeverity.ERROR, metadata, trace);
      
      this.position = position;
      this.context = context;
    }
    
    /**
     * Converts the error to a string
     * 
     * @returns String representation of the error
     */
    public override toString(): string {
      return `${super.toString()} at ${this.position.toString()}`;
    }
    
    /**
     * Converts the error to a JSON object
     * 
     * @returns JSON representation of the error
     */
    public override toJSON(): Record<string, unknown> {
      return {
        ...super.toJSON(),
        position: {
          line: this.position.line,
          column: this.position.column,
          start: this.position.start,
          end: this.position.end
        },
        context: this.context
      };
    }
    
    /**
     * Creates a ParserError from a plain object
     * 
     * @param obj The plain object
     * @returns A new ParserError instance
     */
    public static override fromObject(obj: unknown): ParserError {
      const errorObj = obj as {
        errorCode?: string;
        message?: string;
        component?: string;
        position?: unknown;
        context?: string;
        metadata?: Record<string, unknown>;
        trace?: string[];
      };
      return new ParserError(
        errorObj.errorCode || 'PARSER_ERROR',
        errorObj.message || 'Parser error',
        errorObj.component || 'unknown',
        Position.fromObject(errorObj.position || {}),
        errorObj.context || '',
        errorObj.metadata || {},
        errorObj.trace || []
      );
    }
  }
  
  