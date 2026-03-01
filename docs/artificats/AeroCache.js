const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AeroCache {
  constructor(options = {}) {
    this.options = {
      cacheDir: '.cache',
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 1000 * 60 * 60, // 1 hour
      ...options
    };

    this.memoryCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      writes: 0
    };

    // Ensure cache directory exists
    if (!fs.existsSync(this.options.cacheDir)) {
      fs.mkdirSync(this.options.cacheDir, { recursive: true });
    }

    // Initialize cache cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Generate cache key from content and metadata
   */
  generateKey(content, metadata = {}) {
    const hash = crypto.createHash('sha256');
    hash.update(content);
    
    // Add metadata to hash
    if (metadata) {
      hash.update(JSON.stringify(metadata));
    }
    
    return hash.digest('hex');
  }

/**
 * Synchronous get - for use in bundler
 */
get(key) {
  // Check memory cache first
  const memoryItem = this.memoryCache.get(key);
  if (memoryItem && !this.isExpired(memoryItem)) {
    this.stats.hits++;
    return memoryItem.data;
  }

  // Check file cache
  const cacheFile = path.join(this.options.cacheDir, key);
  try {
    if (fs.existsSync(cacheFile)) {
      const content = fs.readFileSync(cacheFile, 'utf8');
      const item = JSON.parse(content);

      if (this.isExpired(item)) {
        this.delete(key);
        this.stats.misses++;
        return null;
      }

      // Add to memory cache
      this.memoryCache.set(key, item);
      this.stats.hits++;
      return item.data;
    }
  } catch (error) {
    console.warn(`Cache read failed for key ${key}:`, error);
  }

  this.stats.misses++;
  return null;
}

/**
 * Synchronous set - for use in bundler
 */
set(key, data, metadata = {}) {
  const item = {
    data,
    metadata,
    timestamp: Date.now(),
    expires: Date.now() + this.options.ttl
  };

  // Update memory cache
  this.memoryCache.set(key, item);

  // Write to file cache
  const cacheFile = path.join(this.options.cacheDir, key);
  try {
    fs.writeFileSync(cacheFile, JSON.stringify(item), 'utf8');
    this.stats.writes++;
    this.updateSize();
  } catch (error) {
    console.warn(`Cache write failed for key ${key}:`, error);
  }
}

/**
 * Get cache statistics
 */
getStats() {
  return {
    hits: this.stats.hits,
    misses: this.stats.misses,
    size: this.stats.size,
    writes: this.stats.writes
  };
}

  /**
   * Delete item from cache
   */
  delete(key) {
    this.memoryCache.delete(key);
    
    const cacheFile = path.join(this.options.cacheDir, key);
    try {
      if (fs.existsSync(cacheFile)) {
        fs.unlinkSync(cacheFile);
      }
    } catch (error) {
      console.warn(`Cache delete failed for key ${key}:`, error);
    }
  }

/**
 * Clear entire cache and reset stats
 */
clear() {
  this.memoryCache.clear();
  
  try {
    if (fs.existsSync(this.options.cacheDir)) {
      const files = fs.readdirSync(this.options.cacheDir);
      for (const file of files) {
        fs.unlinkSync(path.join(this.options.cacheDir, file));
      }
    }
  } catch (error) {
    console.warn('Cache clear failed:', error);
  }

  this.stats = {
    hits: 0,
    misses: 0,
    size: 0,
    writes: 0
  };
}

  /**
   * Check if cache entry is expired
   */
  isExpired(item) {
    return item.expires && item.expires < Date.now();
  }



  /**
   * Update cache size calculation
   */
  updateSize() {
    try {
      let size = 0;
      const files = fs.readdirSync(this.options.cacheDir);
      for (const file of files) {
        const stats = fs.statSync(path.join(this.options.cacheDir, file));
        size += stats.size;
      }
      this.stats.size = size;

      // If cache exceeds max size, trigger cleanup
      if (size > this.options.maxSize) {
        this.cleanup();
      }
    } catch (error) {
      console.warn('Cache size calculation failed:', error);
    }
  }

  /**
   * Start cleanup interval
   */
  startCleanupInterval() {
    // Clean up every hour by default
    const interval = this.options.cleanupInterval || 1000 * 60 * 60;
    
    setInterval(() => {
      this.cleanup();
    }, interval);
  }

  /**
   * Clean up expired and excess cache entries
   */
  cleanup() {
    try {
      const files = fs.readdirSync(this.options.cacheDir);
      const entries = [];

      // Collect all cache entries with their metadata
      for (const file of files) {
        const filePath = path.join(this.options.cacheDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const item = JSON.parse(content);
          entries.push({
            key: file,
            path: filePath,
            ...item
          });
        } catch (error) {
          // If entry is corrupted, delete it
          fs.unlinkSync(filePath);
        }
      }

      // Remove expired entries
      const now = Date.now();
      entries
        .filter(entry => entry.expires && entry.expires < now)
        .forEach(entry => {
          this.delete(entry.key);
        });

      // If still over max size, remove oldest entries
      if (this.stats.size > this.options.maxSize) {
        entries
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, Math.ceil(entries.length * 0.2)) // Remove oldest 20%
          .forEach(entry => {
            this.delete(entry.key);
          });
      }

      this.updateSize();
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }
}

module.exports = AeroCache;