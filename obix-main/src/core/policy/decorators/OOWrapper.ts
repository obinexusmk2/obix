import { Component, ComponentState, TransitionFunction, RenderFunction } from '../types';

/**
 * OOWrapper.ts
 * 
 * A wrapper that converts functional components into object-oriented style components
 * following the data-oriented adapter pattern.
 */


/**
 * Interface for the object-oriented component wrapper
 */
export interface OOComponent<S extends ComponentState, P = {}> {
    // State management
    getState(): Readonly<S>;
    
    // Lifecycle methods
    mount(): void;
    unmount(): void;
    
    // Render method
    render(): JSX.Element;

    // Any other methods are considered state transitions
    [key: string]: any;
}

/**
 * Function component definition
 */
export interface FunctionalComponent<S extends ComponentState, P = {}> {
    initialState: S;
    transitions: Record<string, TransitionFunction<S>>;
    render: RenderFunction<S, P>;
}

/**
 * Wraps a functional component definition in an object-oriented class-based API
 * 
 * @param functionalComponent The functional component definition
 * @returns A class-based component with OO API
 */
export function wrapFunctional<S extends ComponentState, P = {}>(
    functionalComponent: FunctionalComponent<S, P>
): new (props: P) => OOComponent<S, P> {
    return class OOWrappedComponent implements OOComponent<S, P> {
        private _state: S;
        private _isMounted: boolean = false;
        private readonly _props: P;
        private readonly _transitions: Record<string, TransitionFunction<S>>;
        private readonly _render: RenderFunction<S, P>;
        
        constructor(props: P) {
            this._props = props;
            this._state = { ...functionalComponent.initialState };
            this._transitions = functionalComponent.transitions;
            this._render = functionalComponent.render;
            
            // Dynamically create transition methods
            Object.keys(this._transitions).forEach(transitionName => {
                if (typeof this[transitionName] === 'undefined') {
                    this[transitionName] = (...args: any[]) => {
                        if (!this._isMounted) {
                            throw new Error(`Cannot call transition "${transitionName}" on unmounted component`);
                        }
                        
                        const nextState = this._transitions[transitionName](this._state, ...args);
                        this._state = { ...nextState };
                        return this;
                    };
                }
            });
        }
        
        getState(): Readonly<S> {
            return Object.freeze({ ...this._state });
        }
        
        mount(): void {
            if (this._isMounted) {
                throw new Error('Component is already mounted');
            }
            this._isMounted = true;
        }
        
        unmount(): void {
            if (!this._isMounted) {
                throw new Error('Component is not mounted');
            }
            this._isMounted = false;
        }
        
        render(): JSX.Element {
            if (!this._isMounted) {
                throw new Error('Cannot render unmounted component');
            }
            return this._render(this._state, this._props);
        }
    };
}

/**
 * Creates a functional component from an object-oriented component class
 * (Reverse adapter)
 */
export function createFunctional<S extends ComponentState, P = {}>(
    ooComponent: new (props: P) => OOComponent<S, P>
): (props: P) => FunctionalComponent<S, P> {
    return (props: P) => {
        const instance = new ooComponent(props);
        const state = instance.getState();
        
        // Extract transition methods
        const transitions: Record<string, TransitionFunction<S>> = {};
        const prototype = Object.getPrototypeOf(instance);
        
        Object.getOwnPropertyNames(prototype).forEach(name => {
            if (
                name !== 'constructor' && 
                name !== 'getState' && 
                name !== 'mount' && 
                name !== 'unmount' && 
                name !== 'render' &&
                !name.startsWith('_') &&
                typeof prototype[name] === 'function'
            ) {
                transitions[name] = (state: S, ...args: any[]) => {
                    const tempInstance = new ooComponent(props);
                    Object.assign(tempInstance, { _state: state });
                    tempInstance.mount();
                    tempInstance[name](...args);
                    const newState = tempInstance.getState();
                    tempInstance.unmount();
                    return newState;
                };
            }
        });
        
        return {
            initialState: state,
            transitions,
            render: (state: S, props: P) => {
                const tempInstance = new ooComponent(props);
                Object.assign(tempInstance, { _state: state });
                tempInstance.mount();
                const result = tempInstance.render();
                tempInstance.unmount();
                return result;
            }
        };
    };
}