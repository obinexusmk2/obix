/**
 * OBIX DP Adapter - Reactive Component Wrapper
 * Implements observable pattern for reactive paradigm support
 */
/**
 * ReactiveWrapper<S>
 * Wraps component logic in a reactive, observable pattern
 * Manages state subscriptions and action dispatch
 */
export class ReactiveWrapper {
    state;
    subscribers;
    logic;
    proxyState;
    constructor(logic) {
        this.logic = logic;
        this.subscribers = new Set();
        // Create a proxy for state change detection
        this.state = JSON.parse(JSON.stringify(logic.state));
        this.proxyState = new Proxy(this.state, {
            set: (target, property, value) => {
                target[property] = value;
                this.notify();
                return true;
            },
        });
    }
    /**
     * Subscribe to state changes
     * Returns an unsubscribe function
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => {
            this.subscribers.delete(callback);
        };
    }
    /**
     * Notify all subscribers of state changes
     */
    notify() {
        this.subscribers.forEach((callback) => {
            callback(JSON.parse(JSON.stringify(this.state)));
        });
    }
    /**
     * Dispatch an action and notify subscribers
     * @param actionName - Name of the action to execute
     * @param args - Arguments to pass to the action
     */
    dispatch(actionName, ...args) {
        const action = this.logic.actions[actionName];
        if (!action) {
            throw new Error(`Action "${actionName}" not found in component logic`);
        }
        const context = {
            state: this.state,
            ...this.logic.actions,
        };
        action(context, ...args);
        this.notify();
    }
    /**
     * Get the rendered output based on current state
     */
    render() {
        const context = {
            state: this.state,
            ...this.logic.actions,
        };
        return this.logic.render(context);
    }
}
//# sourceMappingURL=reactive.js.map