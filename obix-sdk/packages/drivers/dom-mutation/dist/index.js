/**
 * DOM Mutation Driver
 * Efficient DOM diffing and patching (alternative to React reconciler)
 */
const isObjectRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const normalize = (value) => {
    if (Array.isArray(value)) {
        return value.map(normalize);
    }
    if (isObjectRecord(value)) {
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
            acc[key] = normalize(value[key]);
            return acc;
        }, {});
    }
    return value;
};
const toPath = (base, key) => base === "/" ? `/${String(key)}` : `${base}/${String(key)}`;
export function createDomMutationDriver(config) {
    let initialized = false;
    let snapshot = null;
    const diffValue = (oldValue, newValue, path = "/") => {
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
            return [];
        }
        if (Array.isArray(oldValue) && Array.isArray(newValue)) {
            const patches = [];
            const max = Math.max(oldValue.length, newValue.length);
            for (let index = 0; index < max; index += 1) {
                const childPath = toPath(path, index);
                if (index >= oldValue.length) {
                    patches.push({ type: "create", path: childPath, value: normalize(newValue[index]) });
                }
                else if (index >= newValue.length) {
                    patches.push({ type: "remove", path: childPath });
                }
                else {
                    patches.push(...diffValue(oldValue[index], newValue[index], childPath));
                }
            }
            return patches;
        }
        if (isObjectRecord(oldValue) && isObjectRecord(newValue)) {
            const patches = [];
            const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
            for (const key of Array.from(keys).sort()) {
                const childPath = toPath(path, key);
                if (!(key in oldValue)) {
                    patches.push({ type: "create", path: childPath, value: normalize(newValue[key]) });
                }
                else if (!(key in newValue)) {
                    patches.push({ type: "remove", path: childPath });
                }
                else {
                    patches.push(...diffValue(oldValue[key], newValue[key], childPath));
                }
            }
            return patches;
        }
        return [{ type: "replace", path, value: normalize(newValue) }];
    };
    const applyToSnapshot = (patches) => {
        const target = normalize(snapshot);
        if (!isObjectRecord(target) && !Array.isArray(target)) {
            if (patches.some((patch) => patch.path === "/")) {
                snapshot = patches.find((patch) => patch.path === "/")?.value ?? null;
            }
            return;
        }
        const setAtPath = (obj, path, value, remove = false) => {
            const segments = path.split("/").filter(Boolean);
            if (segments.length === 0) {
                snapshot = remove ? null : value;
                return;
            }
            let cursor = obj;
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
                }
                else {
                    delete cursor[last];
                }
            }
            else {
                cursor[last] = value;
            }
            snapshot = obj;
        };
        for (const patch of patches) {
            if (patch.type === "remove") {
                setAtPath(target, patch.path, undefined, true);
            }
            else {
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
//# sourceMappingURL=index.js.map