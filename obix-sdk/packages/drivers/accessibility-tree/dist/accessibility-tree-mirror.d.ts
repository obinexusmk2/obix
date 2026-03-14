/**
 * Feature 4: Accessibility Tree Mirror
 * Real-time DOM-to-Accessibility Tree synchronization with MutationObserver
 */
import type { AccessibilityNode, Disposable } from "./types.js";
export interface TreeMirrorConfig {
    rootElement: Element;
    observe?: boolean;
    subtreeFilter?: (element: Element) => boolean;
}
export interface TreeDiff {
    type: "added" | "removed" | "changed";
    path: string;
    oldNode?: AccessibilityNode;
    newNode?: AccessibilityNode;
}
export interface TreeMirrorAPI extends Disposable {
    observe(): void;
    disconnect(): void;
    snapshot(): AccessibilityNode;
    diff(previous: AccessibilityNode, current: AccessibilityNode): TreeDiff[];
    serialize(): string;
    onTreeChange(handler: (diffs: TreeDiff[]) => void): () => void;
}
export declare function createAccessibilityTreeMirror(config: TreeMirrorConfig): TreeMirrorAPI;
//# sourceMappingURL=accessibility-tree-mirror.d.ts.map