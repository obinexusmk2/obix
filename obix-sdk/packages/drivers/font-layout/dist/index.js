/**
 * Font Layout Driver
 * Text measurement, web font loading, and layout calculation
 */
const keyForFont = (descriptor) => JSON.stringify(descriptor);
export function createFontLayoutDriver(config) {
    const loaded = new Set();
    const cache = new Map();
    let fallbackStack = [...(config.fallbackStack ?? [])];
    return {
        async initialize() {
            if (config.preloadFonts?.length) {
                await this.preloadFonts(config.preloadFonts);
            }
        },
        async loadFont(descriptor) {
            loaded.add(keyForFont(descriptor));
        },
        measureText(text, font) {
            const cacheKey = `${text}:${keyForFont(font)}:${fallbackStack.join(",")}`;
            if (config.measureCache !== false && cache.has(cacheKey)) {
                return cache.get(cacheKey);
            }
            const width = text.length * font.size * 0.6;
            const metrics = {
                width,
                height: font.size,
                ascent: font.size * 0.8,
                descent: font.size * 0.2,
                leading: font.size * 0.1,
            };
            if (config.measureCache !== false) {
                cache.set(cacheKey, metrics);
            }
            return metrics;
        },
        isFontLoaded(descriptor) {
            return loaded.has(keyForFont(descriptor));
        },
        async preloadFonts(fonts) {
            for (const font of fonts) {
                await this.loadFont(font, "");
            }
        },
        clearCache() {
            cache.clear();
        },
        setFallbackStack(fonts) {
            fallbackStack = [...fonts];
        },
        async destroy() {
            loaded.clear();
            cache.clear();
            fallbackStack = [];
        },
    };
}
//# sourceMappingURL=index.js.map