/**
 * DOM Mutation Driver
 * Efficient DOM diffing and patching (alternative to React reconciler)
 */

export type DiffAlgorithm = "myers" | "histogram" | "patience";

export interface DOMPatch {
  type: "create" | "remove" | "update" | "replace";
  path: string;
  value?: unknown;
  attributes?: Record<string, string>;
}

export interface DomMutationDriverConfig {
  /** Root DOM element to manage */
  rootElement: Element;
  /** Batch DOM updates for efficiency */
  batchUpdates?: boolean;
  /** Algorithm for diff calculation */
  diffAlgorithm?: DiffAlgorithm;
}

export interface DomMutationDriverAPI {
  /** Initialize the DOM mutation driver */
  initialize(): Promise<void>;
  /** Compute the diff between two DOM states */
  diff(oldVNode: unknown, newVNode: unknown): DOMPatch[];
  /** Apply patches to the DOM */
  patch(patches: DOMPatch[]): Promise<void>;
  /** Update the root element */
  updateRoot(vnode: unknown): Promise<void>;
  /** Clear all children from root */
  clear(): void;
  /** Get current DOM snapshot */
  getSnapshot(): unknown;
  /** Destroy the driver */
  destroy(): Promise<void>;
}

type ObjectRecord = Record<string, unknown>;

const isObjectRecord = (value: unknown): value is ObjectRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalize = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalize);
  }
  if (isObjectRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<ObjectRecord>((acc, key) => {
        acc[key] = normalize(value[key]);
        return acc;
      }, {});
  }
  return value;
};

const toPath = (base: string, key: string | number) =>
  base === "/" ? `/${String(key)}` : `${base}/${String(key)}`;

export function createDomMutationDriver(
  config: DomMutationDriverConfig
): DomMutationDriverAPI {
  let initialized = false;
  let snapshot: unknown = null;

  const diffValue = (oldValue: unknown, newValue: unknown, path = "/"): DOMPatch[] => {
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return [];
    }

    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      const patches: DOMPatch[] = [];
      const max = Math.max(oldValue.length, newValue.length);
      for (let index = 0; index < max; index += 1) {
        const childPath = toPath(path, index);
        if (index >= oldValue.length) {
          patches.push({ type: "create", path: childPath, value: normalize(newValue[index]) });
        } else if (index >= newValue.length) {
          patches.push({ type: "remove", path: childPath });
        } else {
          patches.push(...diffValue(oldValue[index], newValue[index], childPath));
        }
      }
      return patches;
    }

    if (isObjectRecord(oldValue) && isObjectRecord(newValue)) {
      const patches: DOMPatch[] = [];
      const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
      for (const key of Array.from(keys).sort()) {
        const childPath = toPath(path, key);
        if (!(key in oldValue)) {
          patches.push({ type: "create", path: childPath, value: normalize(newValue[key]) });
        } else if (!(key in newValue)) {
          patches.push({ type: "remove", path: childPath });
        } else {
          patches.push(...diffValue(oldValue[key], newValue[key], childPath));
        }
      }
      return patches;
    }

    return [{ type: "replace", path, value: normalize(newValue) }];
  };

  const applyToSnapshot = (patches: DOMPatch[]) => {
    const target = normalize(snapshot);
    if (!isObjectRecord(target) && !Array.isArray(target)) {
      if (patches.some((patch) => patch.path === "/")) {
        snapshot = patches.find((patch) => patch.path === "/")?.value ?? null;
      }
      return;
    }

    const setAtPath = (obj: unknown, path: string, value: unknown, remove = false) => {
      const segments = path.split("/").filter(Boolean);
      if (segments.length === 0) {
        snapshot = remove ? null : value;
        return;
      }

      let cursor: any = obj;
      for (let i = 0; i < segments.length - 1; i += 1) {
        const segment = segments[i];
        if (cursor[segment] === undefined) {
          cursor[segment] = {};
        }
        cursor = cursor[segment];
      }
      const last = segments[segments.length - 1];
      if (remove) {
        if (Array.isArray(cursor)) {
          cursor.splice(Number(last), 1);
        } else {
          delete cursor[last];
        }
      } else {
        cursor[last] = value;
      }
      snapshot = obj;
    };

    for (const patch of patches) {
      if (patch.type === "remove") {
        setAtPath(target, patch.path, undefined, true);
      } else {
        setAtPath(target, patch.path, normalize(patch.value));
      }
    }
  };

  return {
    async initialize() {
      initialized = true;
      snapshot = null;
    },
    diff(oldVNode, newVNode) {
      return diffValue(normalize(oldVNode), normalize(newVNode));
    },
    async patch(patches) {
      if (!initialized) {
        await this.initialize();
      }
      applyToSnapshot(patches);
      if (typeof config.rootElement.setAttribute === "function") {
        config.rootElement.setAttribute("data-obix-patches", String(patches.length));
      }
    },
    async updateRoot(vnode) {
      const normalized = normalize(vnode);
      const patches = this.diff(snapshot, normalized);
      await this.patch(patches);
      snapshot = normalized;
    },
    clear() {
      if ("textContent" in config.rootElement) {
        config.rootElement.textContent = "";
      }
      snapshot = null;
    },
    getSnapshot() {
      return normalize(snapshot);
    },
    async destroy() {
      this.clear();
      initialized = false;
    },
  };
}
