/**
 * Feature 9: Focus Management System
 * Programmatic focus control, focus traps, save/restore
 */
const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not(:disabled)",
    "input:not(:disabled)",
    "select:not(:disabled)",
    "textarea:not(:disabled)",
    '[tabindex]:not([tabindex="-1"])',
    "[contenteditable]",
].join(",");
export function createFocusManager() {
    const focusStack = new Map();
    const traps = new Set();
    function getFocusableElements(container) {
        return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));
    }
    return {
        moveFocus(target) {
            let element;
            if (typeof target === "string") {
                element = document.querySelector(target);
            }
            else {
                element = target;
            }
            if (element && typeof element.focus === "function") {
                element.focus();
                return document.activeElement === element;
            }
            return false;
        },
        getFocusedElement() {
            return document.activeElement;
        },
        createFocusTrap(config) {
            let active = false;
            let previousFocus = null;
            function handleKeyDown(e) {
                const event = e;
                if (config.escapeDeactivates !== false && event.key === "Escape") {
                    handle.deactivate();
                    return;
                }
                if (event.key !== "Tab")
                    return;
                const focusable = getFocusableElements(config.container);
                if (focusable.length === 0) {
                    event.preventDefault();
                    return;
                }
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                const current = document.activeElement;
                if (event.shiftKey && current === first) {
                    event.preventDefault();
                    last.focus();
                }
                else if (!event.shiftKey && current === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
            const handle = {
                activate() {
                    if (active)
                        return;
                    active = true;
                    previousFocus = document.activeElement;
                    config.container.addEventListener("keydown", handleKeyDown);
                    let initial = null;
                    if (config.initialFocus) {
                        if (typeof config.initialFocus === "string") {
                            initial = config.container.querySelector(config.initialFocus);
                        }
                        else {
                            initial = config.initialFocus;
                        }
                    }
                    if (!initial) {
                        const focusable = getFocusableElements(config.container);
                        initial = focusable[0] || null;
                    }
                    if (initial && typeof initial.focus === "function") {
                        initial.focus();
                    }
                },
                deactivate() {
                    if (!active)
                        return;
                    active = false;
                    config.container.removeEventListener("keydown", handleKeyDown);
                    if (config.returnFocusOnDeactivate !== false &&
                        previousFocus &&
                        typeof previousFocus.focus === "function") {
                        previousFocus.focus();
                    }
                    previousFocus = null;
                },
                isActive() {
                    return active;
                },
                destroy() {
                    handle.deactivate();
                    traps.delete(handle);
                },
            };
            traps.add(handle);
            return handle;
        },
        saveFocus(key = "__default__") {
            const current = document.activeElement;
            if (current) {
                focusStack.set(key, current);
            }
        },
        restoreFocus(key = "__default__") {
            const element = focusStack.get(key);
            if (element && typeof element.focus === "function") {
                element.focus();
                focusStack.delete(key);
                return document.activeElement === element;
            }
            return false;
        },
        getFocusableElements,
        destroy() {
            for (const trap of traps) {
                trap.deactivate();
            }
            traps.clear();
            focusStack.clear();
        },
    };
}
//# sourceMappingURL=focus-management.js.map