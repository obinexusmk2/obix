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

export function createCompositorDriver(
  config: CompositorDriverConfig
): CompositorDriverAPI {
  const layers = new Map<string, CompositorLayer>();
  const maxLayers = config.maxLayers ?? Number.MAX_SAFE_INTEGER;

  const recomputeOcclusion = () => {
    if (!config.occlusionCulling) {
      layers.forEach((layer) => {
        layer.isOccluded = false;
      });
      return;
    }
    const sorted = Array.from(layers.values()).sort((a, b) => b.zIndex - a.zIndex);
    const seen = new Set<string>();
    for (const layer of sorted) {
      layer.isOccluded = seen.size > 0;
      seen.add(layer.id);
    }
  };

  return {
    async initialize() {},
    async createLayer(id, element, zIndex) {
      if (layers.size >= maxLayers) {
        throw new Error("Maximum layer count reached");
      }
      layers.set(id, { id, element, zIndex, isVisible: true, isOccluded: false });
      recomputeOcclusion();
    },
    async removeLayer(id) {
      layers.delete(id);
      recomputeOcclusion();
    },
    setZIndex(id, zIndex) {
      const layer = layers.get(id);
      if (!layer) {
        return;
      }
      layer.zIndex = zIndex;
      recomputeOcclusion();
    },
    getLayers() {
      return Array.from(layers.values()).sort((a, b) => a.zIndex - b.zIndex);
    },
    getLayer(id) {
      return layers.get(id) ?? null;
    },
    isOccluded(id) {
      return Boolean(layers.get(id)?.isOccluded);
    },
    optimize() {
      recomputeOcclusion();
    },
    async rebuildStackingContext() {
      recomputeOcclusion();
    },
    getOcclusionMap() {
      return new Map(Array.from(layers.entries()).map(([id, layer]) => [id, Boolean(layer.isOccluded)]));
    },
    async destroy() {
      layers.clear();
    },
  };
}
