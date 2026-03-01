// src/api/functional/component.ts
import { ComponentConfig } from '../../config/component.js';
import { FunctionalComponent } from './FunctionalComponent.js';

/**
 * Component factory function for creating functional components
 * 
 * This is the main entry point for the functional API. It creates a component
 * using a configuration object that defines the component's state, transitions,
 * render function, and optional lifecycle hooks.
 * 
 * @param config Component configuration
 * @returns Functional component instance
 * @example
 * ```typescript
 * const Counter = component({
 *   initialState: { count: 0 },
 *   transitions: {
 *     increment: (state) => ({ count: state.count + 1 }),
 *     decrement: (state) => ({ count: state.count - 1 })
 *   },
 *   render: (state, trigger) => (
 *     <div>
 *       <button onClick={() => trigger('decrement')}>-</button>
 *       <span>{state.count}</span>
 *       <button onClick={() => trigger('increment')}>+</button>
 *     </div>
 *   )
 * });
 * ```
 */
export function component<S extends DataModel<S>, E extends string>(
  config: ComponentConfig<S, E>
): FunctionalComponent<S, E> {
  const adapter = DOPAdapter.createFromFunctional(config) as DOPAdapter<S, E>;
  return new FunctionalComponent<S, E>(adapter, config);
}
