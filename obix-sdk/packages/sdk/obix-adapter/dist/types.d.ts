/**
 * OBIX DP Adapter - Type Definitions
 * Defines the core types for paradigm translation in the data-oriented programming pattern
 */
/**
 * Supported programming paradigms for OBIX components
 */
export declare enum Paradigm {
    DATA_ORIENTED = "DATA_ORIENTED",
    FUNCTIONAL = "FUNCTIONAL",
    OOP = "OOP",
    REACTIVE = "REACTIVE"
}
/**
 * Action function signature
 * Takes context and arguments, returns void or a value
 */
export type Action<S, Args extends any[] = any[], R = void> = (context: ActionContext<S>, ...args: Args) => R;
/**
 * Action context provided to actions during execution
 * Contains the current state and all available actions
 */
export interface ActionContext<S> {
    state: S;
    [key: string]: any;
}
/**
 * Component logic definition - the pure data representation
 * This is the source of truth for all paradigm transformations
 */
export interface ComponentLogic<S = Record<string, any>> {
    name: string;
    state: S;
    actions: Record<string, Action<S>>;
    render: (context: ActionContext<S>) => any;
    metadata?: {
        version?: string;
        description?: string;
        tags?: string[];
        [key: string]: any;
    };
}
/**
 * Functional component type
 * A function that takes no arguments and returns rendered output
 */
export type FunctionalComponent<S = Record<string, any>> = () => any;
/**
 * OOP component class type
 * A class with state, render method, and action methods
 */
export interface OOPComponentClass<S = Record<string, any>> {
    new (): {
        state: S;
        render(): any;
        [key: string]: any;
    };
}
/**
 * Reactive component interface
 * Observable-based component with state subscriptions and action dispatch
 */
export interface ReactiveComponent<S = Record<string, any>> {
    state: S;
    subscribe(callback: (state: S) => void): () => void;
    dispatch(actionName: string, ...args: any[]): void;
    notify(): void;
}
/**
 * Transform result wrapper
 * Returned by transform operations to include paradigm metadata
 */
export interface TransformResult<S = Record<string, any>> {
    paradigm: Paradigm;
    component: any;
    metadata?: {
        source?: Paradigm;
        timestamp?: number;
        [key: string]: any;
    };
}
/**
 * Adapter configuration
 * Specifies source and target paradigms for a transformation
 */
export interface AdapterConfig<S = Record<string, any>> {
    source: Paradigm;
    target: Paradigm;
    logic: ComponentLogic<S>;
    metadata?: {
        [key: string]: any;
    };
}
//# sourceMappingURL=types.d.ts.map