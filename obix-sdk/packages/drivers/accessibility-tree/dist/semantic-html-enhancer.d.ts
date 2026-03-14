/**
 * Feature 6: Semantic HTML Enhancer
 * Auto-inject missing ARIA attributes where they can be inferred
 */
import type { Disposable } from "./types.js";
import type { AriaStateManagerAPI } from "./state-properties-manager.js";
export interface EnhancementRule {
    selector: string;
    test: (element: Element) => boolean;
    enhance: (element: Element, stateManager: AriaStateManagerAPI) => void;
    description: string;
}
export interface SemanticEnhancerConfig {
    rootElement: Element;
    stateManager: AriaStateManagerAPI;
    rules?: EnhancementRule[];
    autoObserve?: boolean;
}
export interface EnhancementReport {
    enhanced: number;
    skipped: number;
    details: Array<{
        element: Element;
        rule: string;
        attribute: string;
    }>;
}
export interface SemanticEnhancerAPI extends Disposable {
    scan(): EnhancementReport;
    observe(): void;
    disconnect(): void;
    addRule(rule: EnhancementRule): void;
    getBuiltinRules(): EnhancementRule[];
}
export declare function createSemanticEnhancer(config: SemanticEnhancerConfig): SemanticEnhancerAPI;
//# sourceMappingURL=semantic-html-enhancer.d.ts.map