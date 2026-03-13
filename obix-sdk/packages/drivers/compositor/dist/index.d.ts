/**
 * Compositor Driver
 * Layer management, z-index optimization, and occlusion culling
 */
export type ZIndexStrategy = "auto" | "manual" | "stacking-context";
export interface CompositorLayer {
    id: string;
    zIndex: number;
    element: Element;
    isVisible: boolean;
    isOccluded?: boolean;
    bounds?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export interface CompositorDriverConfig {
    maxLayers?: number;
    occlusionCulling?: boolean;
    zIndexStrategy?: ZIndexStrategy;
}
export interface CompositorDriverAPI {
    initialize(): Promise<void>;
    createLayer(id: string, element: Element, zIndex: number): Promise<void>;
    removeLayer(id: string): Promise<void>;
    setZIndex(id: string, zIndex: number): void;
    getLayers(): CompositorLayer[];
    getLayer(id: string): CompositorLayer | null;
    isOccluded(id: string): boolean;
    optimize(): void;
    rebuildStackingContext(): Promise<void>;
    getOcclusionMap(): Map<string, boolean>;
    destroy(): Promise<void>;
}
export declare function createCompositorDriver(config: CompositorDriverConfig): CompositorDriverAPI;
//# sourceMappingURL=index.d.ts.map