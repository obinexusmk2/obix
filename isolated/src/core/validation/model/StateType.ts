/**
 * StateType.ts
 * 
 * Defines state types for the validation state machine
 */

/**
 * Enumeration of validation state types
 */
export enum StateType {
  INITIAL = 'INITIAL',
  VALIDATING = 'VALIDATING',
  VALIDATED = 'VALIDATED',
  ERROR = 'ERROR'
}
