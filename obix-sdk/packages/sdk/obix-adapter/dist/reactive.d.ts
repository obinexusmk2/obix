/**
 * OBIX DP Adapter - Reactive Component Wrapper
 * Implements observable pattern for reactive paradigm support
 */
import type { ComponentLogic, ReactiveComponent } from "./types";
/**
 * ReactiveWrapper<S>
 * Wraps component logic in a reactive, observable pattern
 * Manages state subscriptions and action dispatch
 */
export declare class ReactiveWrapper<S extends Record<string, any> = Record<string, any>> implements ReactiveComponent<S> {
    state: S;
    private subscribers;
    private logic;
    private proxyState;
    constructor(logic: ComponentLogic<S>);
    /**
     * Subscribe to state changes
     * Returns an unsubscribe function
     */
    subscribe(callback: (state: S) => void): () => void;
    /**
     * Notify all subscribers of state changes
     */
    notify(): void;
    /**
     * Dispatch an action and notify subscribers
     * @param actionName - Name of the action to execute
     * @param args - Arguments to pass to the action
     */
    dispatch(actionName: string, ...args: any[]): void;
    /**
     * Get the rendered output based on current state
     */
    render(): any;
}
//# sourceMappingURL=reactive.d.ts.map