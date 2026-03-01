import { BaseDataModel } from "./BaseDataModel";

/**
 * State-aware data model for use with the state machine minimizer
 * 
 * @template T Type of the derived data model (for self-referencing generics)
 * @template S Type of the state values
 */
export abstract class StatefulDataModel<T extends StatefulDataModel<T, S>, S = Record<string, any>> extends BaseDataModel<T> {
    /**
     * Current state
     */
    protected state: S;
    
    /**
     * Initial state (for reset operations)
     */
    protected initialState: S;
    
    /**
     * Constructor
     * 
     * @param initialState The initial state
     */
    constructor(initialState: S) {
        super();
        this.initialState = this.cloneState(initialState);
        this.state = this.cloneState(initialState);
    }
    
    /**
     * Gets the current state
     * 
     * @returns The current state
     */
    public getState(): S {
        return this.cloneState(this.state);
    }
    
    /**
     * Updates the state
     * 
     * @param updater Function that returns the new state based on current state
     * @returns A new instance with the updated state
     */
    public withStateUpdate(updater: (currentState: S) => S): T {
        const clone = this.clone();
        clone.state = this.cloneState(updater(this.getState()));
        return clone;
    }
    
    /**
     * Resets the state to the initial state
     * 
     * @returns A new instance with the reset state
     */
    public withResetState(): T {
        const clone = this.clone();
        clone.state = this.cloneState(this.initialState);
        return clone;
    }
    
    /**
     * Gets the initial state
     * 
     * @returns The initial state
     */
    public getInitialState(): S {
        return this.cloneState(this.initialState);
    }
    
    /**
     * Deep clone of a state object
     * 
     * @param state The state to clone
     * @returns A deep clone of the state
     */
    protected abstract cloneState(state: S): S;
    
    /**
     * Overrides the minimization signature to include state
     * 
     * @returns A string signature representing the model's state
     */
    public override getMinimizationSignature(): string {
        // Include the state in the signature for more precise minimization
        return JSON.stringify({
            baseSignature: super.getMinimizationSignature(),
            state: this.state
        });
    }
}
