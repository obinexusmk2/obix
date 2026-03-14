/**
 * Feature 2: ARIA Widget Compliance Engine
 * W3C ARIA Authoring Practices design patterns with validation
 */
import type { Disposable } from "./types.js";
import type { AriaStateManagerAPI } from "./state-properties-manager.js";
import type { FocusManagerAPI } from "./focus-management.js";
import type { KeyboardNavigationAPI } from "./keyboard-navigation.js";
export type WidgetPattern = "accordion" | "menu-bar" | "slider" | "tabs" | "dialog" | "listbox" | "tree" | "combobox";
export interface WidgetConfig {
    container: Element;
    pattern: WidgetPattern;
    options?: Record<string, unknown>;
}
export interface WidgetHandle extends Disposable {
    activate(): void;
    deactivate(): void;
    getPattern(): WidgetPattern;
    validate(): WidgetValidationResult;
}
export interface WidgetValidationResult {
    valid: boolean;
    errors: Array<{
        element: Element;
        message: string;
        severity: "error" | "warning";
    }>;
}
export interface WidgetComplianceDeps {
    stateManager: AriaStateManagerAPI;
    focusManager: FocusManagerAPI;
    keyboardNav: KeyboardNavigationAPI;
}
export interface WidgetComplianceAPI extends Disposable {
    createWidget(id: string, config: WidgetConfig): WidgetHandle;
    getWidget(id: string): WidgetHandle | undefined;
    destroyWidget(id: string): void;
    validateAll(): Map<string, WidgetValidationResult>;
    getSupportedPatterns(): WidgetPattern[];
}
export declare function createWidgetComplianceEngine(deps: WidgetComplianceDeps): WidgetComplianceAPI;
//# sourceMappingURL=aria-widget-compliance.d.ts.map