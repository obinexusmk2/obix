/**
 * Creates an immutable state update
 * 
 * @param state Current state
 * @param updates Partial updates to apply
 * @returns New state with updates applied
 */
export function updateState<S extends object>(state: S, updates: Partial<S>): S {
  return { ...state, ...updates };
}

/**
 * Creates a deep immutable state update
 * 
 * @param state Current state
 * @param path Path to the property to update
 * @param value New value
 * @returns New state with deep update applied
 */
export function deepUpdateState<S extends { [key: string]: any }>(
  state: S,
  path: string[],
  value: any
): S {
  if (path.length === 0) {
    return value;
  }
  
  const [first, ...rest] = path;
  const result = { ...state };
  
  if (rest.length === 0) {
    result[first as keyof S] = value;
  } else {
    result[first as keyof S] = deepUpdateState(
      result[first as keyof S] as S[keyof S],
      rest,
      value
    ) as any;
  }
  
  return result;
}

/**
 * Creates a copy of the state with a property removed
 * 
 * @param state Current state
 * @param key Key to remove
 * @returns New state with the key removed
 */
export function removeStateProperty<S extends object>(state: S, key: keyof S): S {
  const result = { ...state };
  delete result[key];
  return result;
}

/**
 * Creates a template-based initial state
 * 
 * @param template State template
 * @returns Deep clone of the template
 */
export function createInitialState<S>(template: S): S {
  return JSON.parse(JSON.stringify(template));
}

/**
 * Creates a deep clone of a state object
 * 
 * @param state State to clone
 * @returns Deep clone of the state
 */
export function cloneState<S>(state: S): S {
  return JSON.parse(JSON.stringify(state));
}

/**
 * Merges multiple state objects
 * 
 * @param states State objects to merge
 * @returns Merged state
 */
export function mergeStates<S extends object>(...states: S[]): S {
  return Object.assign({}, ...states);
}

/**
 * Creates a state transformer function
 * 
 * @param transformFn Transformation function
 * @returns State transformer function
 */
export function createStateTransformer<S extends object>(
  transformFn: (state: S) => Partial<S>
): (state: S) => S {
  return (state: S) => updateState(state, transformFn(state));
}

/**
 * Creates a conditional state transformer
 * 
 * @param condition Condition function
 * @param transformFn Transformation function
 * @returns Conditional state transformer
 */
export function createConditionalTransformer<S extends object>(
  condition: (state: S) => boolean,
  transformFn: (state: S) => Partial<S>
): (state: S) => S {
  return (state: S) => condition(state) ? updateState(state, transformFn(state)) : state;
}

/**
 * Extracts an optimized state by selecting specific properties
 * 
 * @param state Full state
 * @param keys Keys to include in the optimized state
 * @returns Optimized state with only the selected properties
 */
export function selectState<S extends object, K extends keyof S>(
  state: S,
  ...keys: K[]
): Pick<S, K> {
  return keys.reduce((result, key) => {
    result[key] = state[key];
    return result;
  }, {} as Pick<S, K>);
}

/**
 * Creates a state difference object
 * 
 * @param oldState Previous state
 * @param newState Current state
 * @returns Object containing only the properties that changed
 */
export function getStateDiff<S extends object>(oldState: S, newState: S): Partial<S> {
  const diff: Partial<S> = {};
  
  for (const key in newState) {
    if (oldState[key] !== newState[key]) {
      diff[key] = newState[key];
    }
  }
  
  return diff;
}

/**
 * Checks if a state change is significant (more than just reference changes)
 * 
 * @param oldState Previous state
 * @param newState Current state
 * @returns True if the states are meaningfully different
 */
export function hasStateChanged<S extends object>(oldState: S, newState: S): boolean {
  return Object.keys(getStateDiff(oldState, newState)).length > 0;
}