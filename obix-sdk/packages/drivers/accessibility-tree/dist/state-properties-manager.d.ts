/**
 * Feature 8: State & Properties Manager
 * Reactive ARIA state management with batch updates
 */
import type { Disposable } from "./types.js";
export type AriaStateChangeHandler = (element: Element, key: string, value: string | boolean | undefined) => void;
export interface AriaStateManagerConfig {
    batchUpdates?: boolean;
}
export interface AriaStateManagerAPI extends Disposable {
    setState(element: Element, key: string, value: string | boolean | undefined): void;
    getState(element: Element, key: string): string | boolean | undefined;
    getAllStates(element: Element): Record<string, string | boolean | undefined>;
    removeState(element: Element, key: string): void;
    onStateChange(handler: AriaStateChangeHandler): () => void;
    applyPending(): void;
}
export declare function createAriaStateManager(config?: AriaStateManagerConfig): AriaStateManagerAPI;
//# sourceMappingURL=state-properties-manager.d.ts.map