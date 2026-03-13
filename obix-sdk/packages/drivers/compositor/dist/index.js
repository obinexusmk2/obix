/**
 * Compositor Driver
 * Layer management, z-index optimization, and occlusion culling
 */
export function createCompositorDriver(config) {
    const layers = new Map();
    const maxLayers = config.maxLayers ?? Number.MAX_SAFE_INTEGER;
    const recomputeOcclusion = () => {
        if (!config.occlusionCulling) {
            layers.forEach((layer) => {
                layer.isOccluded = false;
            });
            return;
        }
        const sorted = Array.from(layers.values()).sort((a, b) => b.zIndex - a.zIndex);
        const seen = new Set();
        for (const layer of sorted) {
            layer.isOccluded = seen.size > 0;
            seen.add(layer.id);
        }
    };
    return {
        async initialize() { },
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
//# sourceMappingURL=index.js.map