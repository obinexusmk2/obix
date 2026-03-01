
/**
 * Constants related to state machine implementation
 */

/**
 * Default ID for the initial state when none is provided
 */
export const DEFAULT_INITIAL_STATE_ID = 'initial';

/**
 * Maximum number of states allowed in a state machine 
 * (to prevent memory issues with large or infinite state machines)
 */
export const MAX_STATES_LIMIT = 10000;

/**
 * Reserved metadata keys that cannot be used for custom metadata
 */
export const RESERVED_METADATA_KEYS = [
  'equivalenceClass',
  'stateSignature',
  'isMinimized',
  'representativeId',
  'referenceCount',
  'accessFrequency'
];

/**
 * Maximum recursion depth for state equivalence checks
 */
export const MAX_EQUIVALENCE_RECURSION_DEPTH = 100;

/**
 * Default transition priority
 */
export const DEFAULT_TRANSITION_PRIORITY = 0;

/**
 * Transition operation timeout in milliseconds
 * (to prevent infinite loops)
 */
export const TRANSITION_OPERATION_TIMEOUT = 5000;

/**
 * Metadata key for identifying accepting states
 */
export const ACCEPTING_STATE_METADATA_KEY = 'accepting';

/**
 * State ID prefix for minimized states
 */
export const MINIMIZED_STATE_PREFIX = 'eq';

/**
 * Default value comparison depth for state equivalence
 */
export const DEFAULT_VALUE_COMPARISON_DEPTH = 5;