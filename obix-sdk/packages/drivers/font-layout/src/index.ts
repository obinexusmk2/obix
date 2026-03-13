/**
 * Font Layout Driver
 * Text measurement, web font loading, and layout calculation
 */

export interface TextMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
  leading: number;
}

export interface FontDescriptor {
  family: string;
  size: number;
  weight?: number;
  style?: "normal" | "italic";
  variant?: string;
}

export interface FontLayoutDriverConfig {
  preloadFonts?: FontDescriptor[];
  measureCache?: boolean;
  fallbackStack?: string[];
}

export interface FontLayoutDriverAPI {
  initialize(): Promise<void>;
  loadFont(descriptor: FontDescriptor, url: string): Promise<void>;
  measureText(text: string, font: FontDescriptor): TextMetrics;
  isFontLoaded(descriptor: FontDescriptor): boolean;
  preloadFonts(fonts: FontDescriptor[]): Promise<void>;
  clearCache(): void;
  setFallbackStack(fonts: string[]): void;
  destroy(): Promise<void>;
}

const keyForFont = (descriptor: FontDescriptor) => JSON.stringify(descriptor);

export function createFontLayoutDriver(
  config: FontLayoutDriverConfig
): FontLayoutDriverAPI {
  const loaded = new Set<string>();
  const cache = new Map<string, TextMetrics>();
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
        return cache.get(cacheKey) as TextMetrics;
      }
      const width = text.length * font.size * 0.6;
      const metrics: TextMetrics = {
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
