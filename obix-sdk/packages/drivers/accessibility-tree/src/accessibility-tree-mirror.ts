/**
 * Feature 4: Accessibility Tree Mirror
 * Real-time DOM-to-Accessibility Tree synchronization with MutationObserver
 */

import type { AccessibilityNode, Disposable } from "./types.js";

/** Implied ARIA role mapping from HTML tag names */
const IMPLIED_ROLES: Record<string, string> = {
  a: "link",
  article: "article",
  aside: "complementary",
  button: "button",
  details: "group",
  dialog: "dialog",
  footer: "contentinfo",
  form: "form",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  header: "banner",
  hr: "separator",
  img: "img",
  input: "textbox",
  li: "listitem",
  main: "main",
  menu: "menu",
  nav: "navigation",
  ol: "list",
  option: "option",
  progress: "progressbar",
  section: "region",
  select: "combobox",
  summary: "button",
  table: "table",
  tbody: "rowgroup",
  td: "cell",
  textarea: "textbox",
  tfoot: "rowgroup",
  th: "columnheader",
  thead: "rowgroup",
  tr: "row",
  ul: "list",
};

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

function buildNode(element: Element, filter?: (el: Element) => boolean): AccessibilityNode {
  const tag = element.tagName?.toLowerCase() ?? "";
  const explicitRole = element.getAttribute("role");
  const role = explicitRole || IMPLIED_ROLES[tag] || "generic";

  const label =
    element.getAttribute("aria-label") ||
    element.getAttribute("aria-labelledby") ||
    (element as HTMLElement).title ||
    undefined;

  const description = element.getAttribute("aria-describedby") || undefined;

  // Collect aria-* attributes
  const attributes: Record<string, string> = {};
  if (element.attributes) {
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name.startsWith("aria-") || attr.name === "role" || attr.name === "tabindex") {
        attributes[attr.name] = attr.value;
      }
    }
  }

  const children: AccessibilityNode[] = [];
  for (let i = 0; i < element.children.length; i++) {
    const child = element.children[i];
    if (filter && !filter(child)) continue;
    children.push(buildNode(child, filter));
  }

  return {
    role,
    label,
    description,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    children: children.length > 0 ? children : undefined,
  };
}

function diffNodes(
  prev: AccessibilityNode | undefined,
  curr: AccessibilityNode | undefined,
  path: string,
  result: TreeDiff[]
): void {
  if (!prev && curr) {
    result.push({ type: "added", path, newNode: curr });
    return;
  }
  if (prev && !curr) {
    result.push({ type: "removed", path, oldNode: prev });
    return;
  }
  if (!prev || !curr) return;

  // Check if node itself changed
  if (
    prev.role !== curr.role ||
    prev.label !== curr.label ||
    prev.description !== curr.description ||
    JSON.stringify(prev.attributes) !== JSON.stringify(curr.attributes)
  ) {
    result.push({ type: "changed", path, oldNode: prev, newNode: curr });
  }

  // Diff children
  const prevChildren = prev.children ?? [];
  const currChildren = curr.children ?? [];
  const maxLen = Math.max(prevChildren.length, currChildren.length);
  for (let i = 0; i < maxLen; i++) {
    diffNodes(prevChildren[i], currChildren[i], `${path}/${i}`, result);
  }
}

export function createAccessibilityTreeMirror(
  config: TreeMirrorConfig
): TreeMirrorAPI {
  let observer: MutationObserver | null = null;
  let cachedSnapshot: AccessibilityNode | null = null;
  const changeHandlers = new Set<(diffs: TreeDiff[]) => void>();

  function takeSnapshot(): AccessibilityNode {
    return buildNode(config.rootElement, config.subtreeFilter);
  }

  function handleMutations(): void {
    const prev = cachedSnapshot;
    cachedSnapshot = takeSnapshot();
    if (prev && changeHandlers.size > 0) {
      const diffs = diffNodes_wrapper(prev, cachedSnapshot);
      if (diffs.length > 0) {
        for (const handler of changeHandlers) {
          handler(diffs);
        }
      }
    }
  }

  function diffNodes_wrapper(prev: AccessibilityNode, curr: AccessibilityNode): TreeDiff[] {
    const result: TreeDiff[] = [];
    diffNodes(prev, curr, "", result);
    return result;
  }

  return {
    observe() {
      if (observer) return;
      cachedSnapshot = takeSnapshot();
      observer = new MutationObserver(handleMutations);
      observer.observe(config.rootElement, {
        attributes: true,
        attributeFilter: ["role", "tabindex", "aria-label", "aria-labelledby",
          "aria-describedby", "aria-expanded", "aria-selected", "aria-hidden",
          "aria-controls", "aria-live", "aria-atomic", "aria-relevant",
          "aria-activedescendant", "aria-checked", "aria-disabled",
          "aria-pressed", "aria-valuenow", "aria-valuemin", "aria-valuemax"],
        childList: true,
        subtree: true,
      });
    },

    disconnect() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    },

    snapshot() {
      cachedSnapshot = takeSnapshot();
      return cachedSnapshot;
    },

    diff(previous, current) {
      return diffNodes_wrapper(previous, current);
    },

    serialize() {
      return JSON.stringify(this.snapshot(), null, 2);
    },

    onTreeChange(handler) {
      changeHandlers.add(handler);
      return () => { changeHandlers.delete(handler); };
    },

    destroy() {
      this.disconnect();
      cachedSnapshot = null;
      changeHandlers.clear();
    },
  };
}
