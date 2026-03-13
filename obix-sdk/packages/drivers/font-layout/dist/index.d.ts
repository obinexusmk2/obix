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
export declare function createFontLayoutDriver(config: FontLayoutDriverConfig): FontLayoutDriverAPI;
//# sourceMappingURL=index.d.ts.map