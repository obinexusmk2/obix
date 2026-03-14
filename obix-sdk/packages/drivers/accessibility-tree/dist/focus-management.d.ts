/**
 * Feature 9: Focus Management System
 * Programmatic focus control, focus traps, save/restore
 */
import type { Disposable } from "./types.js";
export interface FocusTrapConfig {
    container: Element;
    initialFocus?: Element | string;
    returnFocusOnDeactivate?: boolean;
    escapeDeactivates?: boolean;
}
export interface FocusTrapHandle extends Disposable {
    activate(): void;
    deactivate(): void;
    isActive(): boolean;
}
export interface FocusManagerAPI extends Disposable {
    moveFocus(target: Element | string): boolean;
    getFocusedElement(): Element | null;
    createFocusTrap(config: FocusTrapConfig): FocusTrapHandle;
    saveFocus(key?: string): void;
    restoreFocus(key?: string): boolean;
    getFocusableElements(container: Element): Element[];
}
export declare function createFocusManager(): FocusManagerAPI;
//# sourceMappingURL=focus-management.d.ts.map