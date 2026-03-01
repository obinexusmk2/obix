/**
 * Constants related to state machine transition caching
 */
import { CacheStrategy } from '../types/cache-types.js';

/**
 * Default maximum cache size
 */
export const DEFAULT_CACHE_SIZE = 1000;

/**
 * Default time-to-live for cache entries in milliseconds (1 hour)
 */
export const DEFAULT_CACHE_TTL = 3600000;

/**
 * Default cache invalidation interval in milliseconds (10 minutes)
 */
export const INVALIDATION_INTERVAL = 600000;

/**
 * Default cache eviction strategy
 */
export const DEFAULT_CACHE_STRATEGY = CacheStrategy.LRU;

/**
 * Key prefix for persistent cache storage
 */
export const STORAGE_KEY_PREFIX = 'obix_sm_cache_';

/**
 * Maximum payload size for cache entries in bytes
 */
export const MAX_PAYLOAD_SIZE = 10485760; // 10MB

/**
 * Maximum number of entries to process in one batch
 * (for background operations like invalidation)
 */
export const BATCH_PROCESSING_LIMIT = 100;

/**
 * Default sample size for cache warmup
 */
export const DEFAULT_WARMUP_SAMPLE_SIZE = 100;

/**
 * High water mark ratio for cache cleanup
 * (when cache reaches [maxSize * HIGH_WATER_MARK], cleanup starts)
 */
export const HIGH_WATER_MARK = 0.9;

/**
 * Low water mark ratio for cache cleanup
 * (cleanup continues until cache size is below [maxSize * LOW_WATER_MARK])
 */
export const LOW_WATER_MARK = 0.7;

/**
 * Threshold for auto-adapting cache size based on hit ratio
 */
export const HIT_RATIO_THRESHOLD = 0.8;