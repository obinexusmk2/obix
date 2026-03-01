
// src/api/hooks/useComponent.ts
import { Component } from '../dop/interface.js';
import { DOPAdapter, ComponentConfig } from '../dop/DOPAdapter.js';
import { FunctionalComponent } from '../functional/FunctionalComponent.js';

/**
 * Hook to create a component with React-like syntax
 * 
 * @param config Component configuration
 * @returns Component and helpers
 */
export function useComponent<S, E extends string>(
  config: ComponentConfig<S, E>
): [Component<S, E>, (event: E, payload?: any) => void, S] {
  const component = new FunctionalComponent<S, E>(
    DOPAdapter.createFromFunctional<S, E>(config)
  );
  
  return [
    component,
    (event: E, payload?: any) => component.trigger(event, payload),
    component.state
  ];
}
