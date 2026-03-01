/**
 * StateType enumeration for the Dual-Paradigm Adapter pattern
 * 
 * Defines the possible states for a component in the OBIX framework
 * 
 * @author Nnamdi Okpala
 */

export enum StateType {
  /**
   * Initial state, before any processing or initialization
   */
  INITIAL = 'INITIAL',
  
  /**
   * Ready state, component initialized but not active
   */
  READY = 'READY',
  
  /**
   * Active state, component is fully operational
   */
  ACTIVE = 'ACTIVE',
  
  /**
   * Processing state, component is performing an operation
   */
  PROCESSING = 'PROCESSING',
  
  /**
   * Error state, component encountered an error
   */
  ERROR = 'ERROR',
  
  /**
   * Destroyed state, component has been cleaned up
   */
  DESTROYED = 'DESTROYED'
}
