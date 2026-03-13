/**
 * OBIX DP Adapter - Main Adapter Class
 * Translates between programming paradigms: data-oriented ↔ functional ↔ OOP ↔ reactive
 */
import type { ComponentLogic, FunctionalComponent, OOPComponentClass, ReactiveComponent, TransformResult, Paradigm } from "./types";
/**
 * DOPAdapter<S>
 * The core adapter class that handles paradigm transformations
 * Works with any component logic and converts it to different paradigms
 */
export declare class DOPAdapter<S extends Record<string, any> = Record<string, any>> {
    private logic;
    constructor(logic: ComponentLogic<S>);
    /**
     * Transform to Functional paradigm
     * Creates a function-based component using closures for state management
     */
    toFunctional(): FunctionalComponent<S>;
    /**
     * Transform to OOP paradigm
     * Creates a class-based component with state properties and action methods
     */
    toOOP(): OOPComponentClass<S>;
    /**
     * Transform to Reactive paradigm
     * Creates an observable component with subscriptions and action dispatch
     */
    toReactive(): ReactiveComponent<S>;
    /**
     * Transform to Data-Oriented paradigm
     * Returns a normalized version of the component logic (identity transform)
     */
    toDataOriented(): ComponentLogic<S>;
    /**
     * Generic transform dispatcher
     * Routes to the appropriate transformation method based on target paradigm
     */
    transform(target: Paradigm): TransformResult<S>;
    /**
     * Static factory method: Create adapter from any paradigm
     * Reverse-adapts from functional, OOP, or reactive back to data-oriented
     *
     * @param input - The component in its source paradigm
     * @param sourceParadigm - The paradigm of the input component
     * @returns A DOPAdapter with normalized data-oriented logic
     */
    static fromAny<T extends Record<string, any> = Record<string, any>>(input: any, sourceParadigm: Paradigm): DOPAdapter<T>;
}
//# sourceMappingURL=dop-adapter.d.ts.map