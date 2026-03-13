/**
 * OBIX Router - SPA navigation with scroll restoration, deep linking
 * Client-side routing with scroll state preservation and deep linking support
 */

/**
 * Scroll restoration mode
 */
export type ScrollRestorationMode = "auto" | "manual" | "hash";

/**
 * Route definition
 */
export interface Route {
  path: string;
  name: string;
  component?: unknown;
  children?: Route[];
  metadata?: Record<string, unknown>;
}

/**
 * Deep link configuration
 */
export interface DeepLinkConfig {
  enabled: boolean;
  parseState?: (hash: string) => Record<string, unknown>;
  serializeState?: (state: Record<string, unknown>) => string;
}

/**
 * Navigation guard function
 */
export interface NavigationGuard {
  beforeNavigate?: (to: Route, from: Route) => boolean | Promise<boolean>;
  afterNavigate?: (to: Route, from: Route) => void;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  routes: Route[];
  baseUrl?: string;
  scrollRestoration?: ScrollRestorationMode;
  deepLink?: DeepLinkConfig;
  guards?: NavigationGuard[];
}

/**
 * Navigation result
 */
export interface NavigationResult {
  success: boolean;
  from?: Route;
  to?: Route;
  timestamp: number;
}

/**
 * OBIX Router interface
 */
export interface ObixRouter {
  navigate(path: string, state?: Record<string, unknown>): Promise<NavigationResult>;
  back(): void;
  forward(): void;
  restoreScroll(position?: { x: number; y: number }): void;
  registerGuard(guard: NavigationGuard): void;
  getDeepLink(): string;
  getCurrentRoute(): Route | undefined;
}

/**
 * Create a router instance
 */
export function createRouter(config: RouterConfig): ObixRouter {
  return {
    navigate(path: string, state?: Record<string, unknown>): Promise<NavigationResult> {
      throw new Error("Not yet implemented");
    },
    back(): void {
      throw new Error("Not yet implemented");
    },
    forward(): void {
      throw new Error("Not yet implemented");
    },
    restoreScroll(position?: { x: number; y: number }): void {
      throw new Error("Not yet implemented");
    },
    registerGuard(guard: NavigationGuard): void {
      throw new Error("Not yet implemented");
    },
    getDeepLink(): string {
      throw new Error("Not yet implemented");
    },
    getCurrentRoute(): Route | undefined {
      throw new Error("Not yet implemented");
    }
  };
}

