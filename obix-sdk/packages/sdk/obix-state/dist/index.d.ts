/**
 * OBIX State - State machine minimization (automata-based state management)
 * Efficient state management using automata-based algorithms
 */
/**
 * Automaton type for state classification
 */
export type AutomatonType = "DFA" | "NFA" | "Moore" | "Mealy";
/**
 * State definition in the state machine
 */
export interface State {
    id: string;
    name: string;
    metadata?: Record<string, unknown>;
    onEnter?: () => void;
    onExit?: () => void;
}
/**
 * Transition between states
 */
export interface Transition {
    from: string;
    to: string;
    event: string;
    guard?: () => boolean;
    action?: () => void;
}
/**
 * State machine minimization result
 */
export interface MinimizationResult {
    originalStateCount: number;
    minimizedStateCount: number;
    reduction: number;
    equivalentStates: Map<string, string>;
}
/**
 * State machine configuration
 */
export interface StateMachineConfig {
    initialState: string;
    states: State[];
    transitions: Transition[];
    acceptingStates?: string[];
    automatonType?: AutomatonType;
}
/**
 * State machine interface
 */
export interface StateMachine {
    transition(event: string): boolean;
    minimize(): MinimizationResult;
    getStates(): State[];
    isAccepting(): boolean;
    serialize(): string;
    merge(other: StateMachine): StateMachine;
    getCurrentState(): State | undefined;
}
/**
 * Create a state machine instance
 */
export declare function createStateMachine(config: StateMachineConfig): StateMachine;
//# sourceMappingURL=index.d.ts.map