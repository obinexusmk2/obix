/**
 * Constants related to automaton state minimization
 */
import { OptimizationLevel } from '../types/minimization-types.js';

/**
 * Maximum number of equivalence classes allowed
 * (to prevent excessive computation)
 */
export const MAX_EQUIVALENCE_CLASSES = 10000;

/**
 * Threshold for applying memory optimizations
 * (only apply when states > threshold)
 */
export const MEMORY_OPTIMIZATION_THRESHOLD = 100;

/**
 * Default optimization level
 */
export const DEFAULT_OPTIMIZATION_LEVEL = OptimizationLevel.STANDARD;

/**
 * Maximum iterations for fixed-point algorithms
 * (to prevent infinite loops)
 */
export const MAX_MINIMIZATION_ITERATIONS = 100;

/**
 * Default timeout for minimization operations in milliseconds
 */
export const MINIMIZATION_TIMEOUT = 30000;

/**
 * Size threshold for parallel minimization
 * (use parallel algorithm when states > threshold)
 */
export const PARALLEL_MINIMIZATION_THRESHOLD = 500;

/**
 * Maximum worker threads for parallel minimization
 */
export const MAX_MINIMIZATION_WORKERS = 4;

/**
 * Batch size for processing states in minimization
 */
export const MINIMIZATION_BATCH_SIZE = 100;

/**
 * Memory usage threshold for automatic optimization
 * (in bytes)
 */
export const MEMORY_USAGE_THRESHOLD = 50 * 1024 * 1024; // 50MB

/**
 * Default string interning cache size
 */
export const STRING_INTERN_CACHE_SIZE = 10000;

/**
 * Default chunk size for incremental minimization
 */
export const INCREMENTAL_CHUNK_SIZE = 50;