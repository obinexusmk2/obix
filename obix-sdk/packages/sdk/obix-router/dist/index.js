/**
 * OBIX Router - SPA navigation with scroll restoration, deep linking
 * Client-side routing with scroll state preservation and deep linking support
 */
const DEFAULT_PARSE = (hash) => {
    if (!hash) {
        return {};
    }
    try {
        return JSON.parse(decodeURIComponent(hash));
    }
    catch {
        return {};
    }
};
const DEFAULT_SERIALIZE = (state) => encodeURIComponent(JSON.stringify(state));
const normalizePath = (path, baseUrl = "") => {
    if (!path.startsWith("/")) {
        return `${baseUrl}/${path}`.replace(/\/+/g, "/");
    }
    return `${baseUrl}${path}`.replace(/\/+/g, "/");
};
export function createRouter(config) {
    const routesByPath = new Map(config.routes.map((route) => [normalizePath(route.path, config.baseUrl), route]));
    const guards = [...(config.guards ?? [])];
    const deepLinkConfig = config.deepLink;
    const scrollPositions = new Map();
    const browserWindow = typeof window !== "undefined" ? window : undefined;
    let currentPath = normalizePath(config.routes[0]?.path ?? "/", config.baseUrl);
    let currentState = {};
    const routeForPath = (path) => routesByPath.get(path) ?? {
        path,
        name: "not-found",
        metadata: { missingRoute: true }
    };
    const captureScroll = (path) => {
        if (!browserWindow || config.scrollRestoration === "manual") {
            return;
        }
        const anchor = browserWindow.document.activeElement;
        scrollPositions.set(path, {
            x: browserWindow.scrollX,
            y: browserWindow.scrollY,
            anchorId: anchor instanceof HTMLElement ? anchor.id || undefined : undefined
        });
    };
    const resolveState = (state) => {
        if (state) {
            return state;
        }
        if (deepLinkConfig?.enabled && browserWindow?.location.hash) {
            return (deepLinkConfig.parseState ?? DEFAULT_PARSE)(browserWindow.location.hash.slice(1));
        }
        return {};
    };
    const updateLocation = (path, state) => {
        if (!browserWindow) {
            return;
        }
        const hash = deepLinkConfig?.enabled ? `#${(deepLinkConfig.serializeState ?? DEFAULT_SERIALIZE)(state)}` : "";
        browserWindow.history.pushState(state, "", `${path}${hash}`);
    };
    const applyScrollRestoration = (path) => {
        if (!browserWindow || config.scrollRestoration === "manual") {
            return;
        }
        const saved = scrollPositions.get(path);
        if (saved) {
            browserWindow.scrollTo(saved.x, saved.y);
            if (saved.anchorId) {
                browserWindow.document.getElementById(saved.anchorId)?.scrollIntoView({ block: "center" });
            }
            return;
        }
        if (config.scrollRestoration === "hash") {
            const anchor = browserWindow.location.hash.replace("#", "");
            if (anchor) {
                browserWindow.document.getElementById(anchor)?.scrollIntoView({ block: "start" });
                return;
            }
        }
        browserWindow.scrollTo(0, 0);
    };
    if (browserWindow) {
        browserWindow.history.scrollRestoration = config.scrollRestoration === "manual" ? "manual" : "auto";
        browserWindow.addEventListener("popstate", () => {
            currentPath = normalizePath(browserWindow.location.pathname, config.baseUrl);
            currentState = resolveState(browserWindow.history.state ?? undefined);
            applyScrollRestoration(currentPath);
        });
    }
    return {
        async navigate(path, state) {
            const normalizedPath = normalizePath(path, config.baseUrl);
            const fromRoute = routeForPath(currentPath);
            const toRoute = routeForPath(normalizedPath);
            for (const guard of guards) {
                if (guard.beforeNavigate) {
                    const allowed = await guard.beforeNavigate(toRoute, fromRoute);
                    if (!allowed) {
                        return {
                            success: false,
                            from: fromRoute,
                            to: toRoute,
                            timestamp: Date.now()
                        };
                    }
                }
            }
            captureScroll(currentPath);
            currentPath = normalizedPath;
            currentState = resolveState(state);
            updateLocation(normalizedPath, currentState);
            applyScrollRestoration(normalizedPath);
            for (const guard of guards) {
                guard.afterNavigate?.(toRoute, fromRoute);
            }
            return {
                success: true,
                from: fromRoute,
                to: toRoute,
                timestamp: Date.now()
            };
        },
        back() {
            browserWindow?.history.back();
        },
        forward() {
            browserWindow?.history.forward();
        },
        restoreScroll(position) {
            if (!browserWindow) {
                return;
            }
            if (position) {
                browserWindow.scrollTo(position.x, position.y);
                scrollPositions.set(currentPath, { ...position });
                return;
            }
            applyScrollRestoration(currentPath);
        },
        registerGuard(guard) {
            guards.push(guard);
        },
        getDeepLink() {
            if (!deepLinkConfig?.enabled) {
                return currentPath;
            }
            const serialized = (deepLinkConfig.serializeState ?? DEFAULT_SERIALIZE)(currentState);
            return `${currentPath}#${serialized}`;
        },
        getCurrentRoute() {
            return routeForPath(currentPath);
        }
    };
}
//# sourceMappingURL=index.js.map