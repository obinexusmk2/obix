/**
 * Accessibility Tree Driver
 * ARIA/live region management and screen reader bridge
 */
export type AriaLiveRegion = "off" | "polite" | "assertive";
export type AriaRole = string;
export interface LiveRegionDefaults {
    level?: AriaLiveRegion;
    atomic?: boolean;
    relevant?: string[];
    label?: string;
}
export interface AccessibilityTreeDriverConfig {
    /** Root element for accessibility tree */
    rootElement: Element;
    /** Default configuration for live regions */
    liveRegionDefaults?: LiveRegionDefaults;
    /** Screen reader hints and optimizations */
    screenReaderHints?: boolean;
}
export interface AccessibilityNode {
    role: AriaRole;
    label?: string;
    description?: string;
    attributes?: Record<string, string>;
    children?: AccessibilityNode[];
}
export interface AccessibilityTreeDriverAPI {
    initialize(): Promise<void>;
    registerLiveRegion(element: Element, config?: LiveRegionDefaults): Promise<void>;
    announce(message: string, level?: AriaLiveRegion): void;
    updateAccessibilityNode(element: Element, node: AccessibilityNode): void;
    getAccessibilityTree(): AccessibilityNode;
    setScreenReaderMode(enabled: boolean): void;
    destroy(): Promise<void>;
}
export declare function createAccessibilityTreeDriver(config: AccessibilityTreeDriverConfig): AccessibilityTreeDriverAPI;
//# sourceMappingURL=index.d.ts.map