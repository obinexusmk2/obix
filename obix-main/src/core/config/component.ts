import { RenderOutput } from "@/api/shared/render/RenderTypes";

/**
 * Configuration for functional components
 */
export interface ComponentConfig<S, E extends string> {
  /** Initial component state */
  initialState: S;
  /** Map of event names to transition functions */
  transitions: Record<E, (state: S, payload?: any) => S>;
  /** Function to render the component */
  render: (state: S, trigger: (event: E, payload?: any) => void) => RenderOutput;
  /** Optional lifecycle hooks */
  hooks?: {
    /** Called when component is mounted */
    onMount?: () => void;
    /** Called when component state is updated */
    onUpdate?: (prevState: S, newState: S) => void;
    /** Called when component is unmounted */
    onUnmount?: () => void;
  };
}
