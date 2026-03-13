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
  /** Fonts to preload */
  preloadFonts?: FontDescriptor[];
  /** Enable text measurement cache */
  measureCache?: boolean;
  /** Fallback font stack */
  fallbackStack?: string[];
}

export interface FontLayoutDriverAPI {
  /** Initialize font layout driver */
  initialize(): Promise<void>;
  /** Load a web font */
  loadFont(descriptor: FontDescriptor, url: string): Promise<void>;
  /** Measure text with a specific font */
  measureText(text: string, font: FontDescriptor): TextMetrics;
  /** Check if a font is loaded */
  isFontLoaded(descriptor: FontDescriptor): boolean;
  /** Preload multiple fonts */
  preloadFonts(fonts: FontDescriptor[]): Promise<void>;
  /** Clear measurement cache */
  clearCache(): void;
  /** Set fallback font stack */
  setFallbackStack(fonts: string[]): void;
  /** Destroy the driver */
  destroy(): Promise<void>;
}

export function createFontLayoutDriver(
  config: FontLayoutDriverConfig
): FontLayoutDriverAPI {
  throw new Error("Font Layout Driver not yet implemented");
}
