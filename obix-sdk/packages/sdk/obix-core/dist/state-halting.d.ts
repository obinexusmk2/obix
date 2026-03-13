/**
 * State Halting Engine
 * Implements intelligent caching through state stability detection
 * Stops processing when component state is stable enough
 */
import { HaltRecommendation } from "./types.js";
/**
 * StateHaltEngine tracks state history and determines stability
 */
export declare class StateHaltEngine {
    private stateHistory;
    private readonly maxHistoryDepth;
    private readonly stabilityThreshold;
    constructor(maxHistoryDepth?: number, stabilityThreshold?: number);
    /**
     * Record a state snapshot for an instance
     */
    record<S>(instanceId: string, state: S, revision: number): void;
    /**
     * Check if state has stabilized for an instance
     */
    isStable<S>(instanceId: string): boolean;
    /**
     * Get halt recommendation for an instance
     */
    getHaltRecommendation(instanceId: string): HaltRecommendation;
    /**
     * Clear history for an instance
     */
    clear(instanceId: string): void;
    /**
     * Clear all history
     */
    clearAll(): void;
    /**
     * Deep equality check for state objects
     */
    private deepEqual;
    /**
     * Deep clone state object
     */
    private deepClone;
}
//# sourceMappingURL=state-halting.d.ts.map