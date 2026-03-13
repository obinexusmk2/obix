/**
 * State Halting Engine
 * Implements intelligent caching through state stability detection
 * Stops processing when component state is stable enough
 */
/**
 * StateHaltEngine tracks state history and determines stability
 */
export class StateHaltEngine {
    stateHistory = new Map();
    maxHistoryDepth;
    stabilityThreshold;
    constructor(maxHistoryDepth = 10, stabilityThreshold = 3) {
        this.maxHistoryDepth = maxHistoryDepth;
        this.stabilityThreshold = stabilityThreshold;
    }
    /**
     * Record a state snapshot for an instance
     */
    record(instanceId, state, revision) {
        if (!this.stateHistory.has(instanceId)) {
            this.stateHistory.set(instanceId, []);
        }
        const history = this.stateHistory.get(instanceId);
        history.push({
            state: this.deepClone(state),
            revision,
            timestamp: Date.now()
        });
        // Keep history within max depth
        if (history.length > this.maxHistoryDepth) {
            history.shift();
        }
    }
    /**
     * Check if state has stabilized for an instance
     */
    isStable(instanceId) {
        const history = this.stateHistory.get(instanceId);
        if (!history || history.length < this.stabilityThreshold) {
            return false;
        }
        // Check last N states are identical (deep compare)
        const recentStates = history.slice(-this.stabilityThreshold);
        const firstState = recentStates[0].state;
        return recentStates.every(snapshot => this.deepEqual(snapshot.state, firstState));
    }
    /**
     * Get halt recommendation for an instance
     */
    getHaltRecommendation(instanceId) {
        const history = this.stateHistory.get(instanceId);
        if (!history || history.length === 0) {
            return {
                shouldHalt: false,
                stableForRevisions: 0
            };
        }
        if (this.isStable(instanceId)) {
            // Count how many revisions are stable
            const firstStableIndex = history.length - 1;
            for (let i = history.length - 1; i >= 0; i--) {
                if (!this.deepEqual(history[i].state, history[history.length - 1].state)) {
                    break;
                }
            }
            const stableCount = history.length > 0 ? history.length : 0;
            return {
                shouldHalt: true,
                reason: "State has stabilized - no changes detected",
                stableForRevisions: stableCount
            };
        }
        return {
            shouldHalt: false,
            stableForRevisions: 0
        };
    }
    /**
     * Clear history for an instance
     */
    clear(instanceId) {
        this.stateHistory.delete(instanceId);
    }
    /**
     * Clear all history
     */
    clearAll() {
        this.stateHistory.clear();
    }
    /**
     * Deep equality check for state objects
     */
    deepEqual(a, b) {
        if (a === b)
            return true;
        if (a == null || b == null)
            return a === b;
        if (typeof a !== typeof b)
            return false;
        if (typeof a !== "object")
            return a === b;
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        for (const key of keysA) {
            if (!keysB.includes(key))
                return false;
            if (!this.deepEqual(a[key], b[key]))
                return false;
        }
        return true;
    }
    /**
     * Deep clone state object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== "object")
            return obj;
        if (Array.isArray(obj))
            return obj.map(item => this.deepClone(item));
        const cloned = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                cloned[key] = this.deepClone(obj[key]);
            }
        }
        return cloned;
    }
}
//# sourceMappingURL=state-halting.js.map