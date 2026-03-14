/**
 * Feature 7: Keyboard Navigation Controller
 * ARIA widget keyboard patterns (roving tabindex, activedescendant, type-ahead)
 */
export function createKeyboardNavigationController() {
    const navigations = new Map();
    return {
        createNavigation(id, config) {
            if (navigations.has(id)) {
                return navigations.get(id);
            }
            let items = [];
            let currentIndex = -1;
            let active = false;
            let typeBuffer = "";
            let typeTimer = null;
            const orientation = config.orientation ?? "vertical";
            const wrap = config.wrap ?? true;
            function isForward(key) {
                if (orientation === "horizontal" || orientation === "both") {
                    if (key === "ArrowRight")
                        return true;
                }
                if (orientation === "vertical" || orientation === "both") {
                    if (key === "ArrowDown")
                        return true;
                }
                return false;
            }
            function isBackward(key) {
                if (orientation === "horizontal" || orientation === "both") {
                    if (key === "ArrowLeft")
                        return true;
                }
                if (orientation === "vertical" || orientation === "both") {
                    if (key === "ArrowUp")
                        return true;
                }
                return false;
            }
            function focusItem(index) {
                if (index < 0 || index >= items.length)
                    return;
                const prev = currentIndex;
                currentIndex = index;
                if (config.pattern === "roving-tabindex") {
                    if (prev >= 0 && prev < items.length) {
                        items[prev].setAttribute("tabindex", "-1");
                    }
                    items[currentIndex].setAttribute("tabindex", "0");
                    items[currentIndex].focus();
                }
                else if (config.pattern === "activedescendant") {
                    const itemId = items[currentIndex].id ||
                        `${config.container.id || "nav"}-item-${currentIndex}`;
                    if (!items[currentIndex].id) {
                        items[currentIndex].id = itemId;
                    }
                    config.container.setAttribute("aria-activedescendant", itemId);
                }
            }
            function moveForward() {
                if (items.length === 0)
                    return;
                let next = currentIndex + 1;
                if (next >= items.length) {
                    next = wrap ? 0 : items.length - 1;
                }
                focusItem(next);
            }
            function moveBackward() {
                if (items.length === 0)
                    return;
                let prev = currentIndex - 1;
                if (prev < 0) {
                    prev = wrap ? items.length - 1 : 0;
                }
                focusItem(prev);
            }
            function handleTypeAhead(char) {
                typeBuffer += char.toLowerCase();
                if (typeTimer)
                    clearTimeout(typeTimer);
                typeTimer = setTimeout(() => { typeBuffer = ""; }, 500);
                const match = items.findIndex((item) => (item.textContent ?? "").toLowerCase().startsWith(typeBuffer));
                if (match !== -1) {
                    focusItem(match);
                }
            }
            function handleKeyDown(e) {
                const event = e;
                if (isForward(event.key)) {
                    event.preventDefault();
                    moveForward();
                }
                else if (isBackward(event.key)) {
                    event.preventDefault();
                    moveBackward();
                }
                else if (event.key === "Home") {
                    event.preventDefault();
                    focusItem(0);
                }
                else if (event.key === "End") {
                    event.preventDefault();
                    focusItem(items.length - 1);
                }
                else if (config.typeAhead && event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
                    handleTypeAhead(event.key);
                }
            }
            const handle = {
                activate() {
                    if (active)
                        return;
                    active = true;
                    config.container.addEventListener("keydown", handleKeyDown);
                    if (config.pattern === "roving-tabindex") {
                        for (const item of items) {
                            item.setAttribute("tabindex", "-1");
                        }
                        if (items.length > 0) {
                            focusItem(0);
                        }
                    }
                    else if (config.pattern === "activedescendant") {
                        config.container.setAttribute("tabindex", "0");
                        if (items.length > 0) {
                            focusItem(0);
                        }
                    }
                },
                deactivate() {
                    if (!active)
                        return;
                    active = false;
                    config.container.removeEventListener("keydown", handleKeyDown);
                    if (typeTimer) {
                        clearTimeout(typeTimer);
                        typeTimer = null;
                    }
                    typeBuffer = "";
                },
                setItems(newItems) {
                    items = [...newItems];
                    currentIndex = items.length > 0 ? 0 : -1;
                },
                getCurrentItem() {
                    if (currentIndex >= 0 && currentIndex < items.length) {
                        return items[currentIndex];
                    }
                    return null;
                },
                moveTo(index) {
                    focusItem(index);
                },
                destroy() {
                    handle.deactivate();
                    navigations.delete(id);
                },
            };
            navigations.set(id, handle);
            return handle;
        },
        getNavigation(id) {
            return navigations.get(id);
        },
        destroyNavigation(id) {
            const handle = navigations.get(id);
            if (handle) {
                handle.destroy();
            }
        },
        destroy() {
            for (const handle of navigations.values()) {
                handle.deactivate();
            }
            navigations.clear();
        },
    };
}
//# sourceMappingURL=keyboard-navigation.js.map