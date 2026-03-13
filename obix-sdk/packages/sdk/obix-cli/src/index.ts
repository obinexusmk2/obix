/**
 * OBIX CLI - Build tooling, schema validation, semantic version X management
 * Command-line interface for OBIX SDK build and validation
 */

/**
 * Build target platforms
 */
export type BuildTarget = "esm" | "cjs" | "umd" | "iife";

/**
 * Schema validation result
 */
export interface SchemaValidation {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
  }>;
  warnings?: Array<{
    path: string;
    message: string;
  }>;
}

/**
 * Semantic version X (flexible versioning)
 */
export interface SemanticVersionX {
  major: number;
  minor: number;
  patch: number;
  suffix?: string; // alpha, beta, rc, etc.
  prerelease?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Hot swap configuration for development
 */
export interface HotSwapConfig {
  enabled: boolean;
  watchPaths?: string[];
  excludePatterns?: string[];
  delay?: number; // ms
}

/**
 * Build configuration
 */
export interface BuildConfig {
  targets: BuildTarget[];
  outputDir?: string;
  sourceMap?: boolean;
  minify?: boolean;
  hotSwap?: HotSwapConfig;
}

/**
 * CLI configuration
 */
export interface CLIConfig {
  packageRoot: string;
  buildConfig?: BuildConfig;
  strictMode?: boolean;
}

/**
 * Build result
 */
export interface BuildResult {
  success: boolean;
  outputs: Array<{
    target: BuildTarget;
    path: string;
    size: number;
  }>;
  duration: number; // ms
  errors?: string[];
}

/**
 * OBIX CLI interface
 */
export interface ObixCLI {
  build(config?: BuildConfig): Promise<BuildResult>;
  validate(schemaPath: string): Promise<SchemaValidation>;
  version(): SemanticVersionX;
  hotSwap(config: HotSwapConfig): void;
  migrate(fromVersion: string, toVersion: string): Promise<void>;
}

/**
 * Create a CLI instance
 */
export function createCLI(config: CLIConfig): ObixCLI {
  return {
    build(buildConfig?: BuildConfig): Promise<BuildResult> {
      throw new Error("Not yet implemented");
    },
    validate(schemaPath: string): Promise<SchemaValidation> {
      throw new Error("Not yet implemented");
    },
    version(): SemanticVersionX {
      throw new Error("Not yet implemented");
    },
    hotSwap(config: HotSwapConfig): void {
      throw new Error("Not yet implemented");
    },
    migrate(fromVersion: string, toVersion: string): Promise<void> {
      throw new Error("Not yet implemented");
    }
  };
}

