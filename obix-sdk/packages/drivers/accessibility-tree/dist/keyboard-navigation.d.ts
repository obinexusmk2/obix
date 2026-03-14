/**
 * Feature 7: Keyboard Navigation Controller
 * ARIA widget keyboard patterns (roving tabindex, activedescendant, type-ahead)
 */
import type { Disposable } from "./types.js";
import type { FocusManagerAPI } from "./focus-management.js";
export type KeyboardPattern = "roving-tabindex" | "activedescendant" | "grid";
export interface KeyboardNavigationConfig {
    container: Element;
    pattern: KeyboardPattern;
    orientation?: "horizontal" | "vertical" | "both";
    wrap?: boolean;
    typeAhead?: boolean;
    focusManager: FocusManagerAPI;
}
export interface KeyboardNavigationHandle extends Disposable {
    activate(): void;
    deactivate(): void;
    setItems(items: Element[]): void;
    getCurrentItem(): Element | null;
    moveTo(index: number): void;
}
export interface KeyboardNavigationAPI extends Disposable {
    createNavigation(id: string, config: KeyboardNavigationConfig): KeyboardNavigationHandle;
    getNavigation(id: string): KeyboardNavigationHandle | undefined;
    destroyNavigation(id: string): void;
}
export declare function createKeyboardNavigationController(): KeyboardNavigationAPI;
//# sourceMappingURL=keyboard-navigation.d.ts.map