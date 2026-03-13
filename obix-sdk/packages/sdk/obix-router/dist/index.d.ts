/**
 * OBIX Router - SPA navigation with scroll restoration, deep linking
 * Client-side routing with scroll state preservation and deep linking support
 */
export type ScrollRestorationMode = "auto" | "manual" | "hash";
export interface Route {
    path: string;
    name: string;
    component?: unknown;
    children?: Route[];
    metadata?: Record<string, unknown>;
}
export interface DeepLinkConfig {
    enabled: boolean;
    parseState?: (hash: string) => Record<string, unknown>;
    serializeState?: (state: Record<string, unknown>) => string;
}
export interface NavigationGuard {
    beforeNavigate?: (to: Route, from: Route) => boolean | Promise<boolean>;
    afterNavigate?: (to: Route, from: Route) => void;
}
export interface RouterConfig {
    routes: Route[];
    baseUrl?: string;
    scrollRestoration?: ScrollRestorationMode;
    deepLink?: DeepLinkConfig;
    guards?: NavigationGuard[];
}
export interface NavigationResult {
    success: boolean;
    from?: Route;
    to?: Route;
    timestamp: number;
}
export interface ObixRouter {
    navigate(path: string, state?: Record<string, unknown>): Promise<NavigationResult>;
    back(): void;
    forward(): void;
    restoreScroll(position?: {
        x: number;
        y: number;
    }): void;
    registerGuard(guard: NavigationGuard): void;
    getDeepLink(): string;
    getCurrentRoute(): Route | undefined;
}
export declare function createRouter(config: RouterConfig): ObixRouter;
//# sourceMappingURL=index.d.ts.map