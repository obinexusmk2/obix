/**
 * Validation Error Handling Strategies for DOPAdapter
 * 
 * Defines strategies for handling validation errors in the OBIX framework.
 * 
 * @author Nnamdi Okpala
 */

export enum ValidationErrorHandlingStrategies {
  /**
   * Throw an exception when validation fails
   */
  THROW = 'THROW',
  
  /**
   * Log validation errors but continue execution
   */
  LOG = 'LOG',
  
  /**
   * Ignore validation errors entirely
   */
  IGNORE = 'IGNORE',
  
  /**
   * Report validation errors to a centralized reporting system
   */
  REPORT = 'REPORT',
  
  /**
   * Use a custom handler for validation errors
   */
  CUSTOM = 'CUSTOM'
}
