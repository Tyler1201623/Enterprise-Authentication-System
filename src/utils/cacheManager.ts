/**
 * Advanced browser cache management utility
 * Provides memory caching, local storage caching, and request deduplication
 */

type CacheStrategy = "memory" | "localStorage" | "both";

interface CacheOptions {
  /** Cache key prefix for namespacing */
  prefix?: string;
  /** Where to store the cached data */
  strategy?: CacheStrategy;
  /** Time-to-live in milliseconds */
  ttl?: number;
  /** Compress data when storing in localStorage (good for large objects) */
  compress?: boolean;
}

// In-memory cache storage
const memoryCache: Map<
  string,
  {
    value: any;
    expiry: number;
  }
> = new Map();

// Default options
const defaultOptions: CacheOptions = {
  prefix: "app_cache_",
  strategy: "memory",
  ttl: 5 * 60 * 1000, // 5 minutes
  compress: false,
};

// Pending promises tracker to deduplicate in-flight requests
const pendingPromises: Map<string, Promise<any>> = new Map();

/**
 * Store a value in the cache
 */
export const cacheSet = <T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): void => {
  const opts = { ...defaultOptions, ...options };
  const cacheKey = `${opts.prefix}${key}`;
  const now = Date.now();
  const expiry = now + (opts.ttl || 0);

  // Store in memory if strategy is memory or both
  if (opts.strategy === "memory" || opts.strategy === "both") {
    memoryCache.set(cacheKey, {
      value,
      expiry,
    });
  }

  // Store in localStorage if strategy is localStorage or both
  if (
    (opts.strategy === "localStorage" || opts.strategy === "both") &&
    typeof window !== "undefined"
  ) {
    try {
      const item = {
        value,
        expiry,
      };

      // Convert the value to a string for localStorage
      const serialized = JSON.stringify(item);

      localStorage.setItem(cacheKey, serialized);
    } catch (error) {
      console.error("Failed to store in localStorage:", error);
    }
  }
};

/**
 * Get a value from the cache
 */
export const cacheGet = <T>(
  key: string,
  options: CacheOptions = {}
): T | null => {
  const opts = { ...defaultOptions, ...options };
  const cacheKey = `${opts.prefix}${key}`;
  const now = Date.now();

  // Try memory cache first if strategy is memory or both
  if (opts.strategy === "memory" || opts.strategy === "both") {
    const memoryItem = memoryCache.get(cacheKey);

    if (memoryItem && memoryItem.expiry > now) {
      return memoryItem.value as T;
    } else if (memoryItem) {
      // Remove expired items from memory
      memoryCache.delete(cacheKey);
    }
  }

  // Try localStorage if strategy is localStorage or both
  if (
    (opts.strategy === "localStorage" || opts.strategy === "both") &&
    typeof window !== "undefined"
  ) {
    try {
      const storedItem = localStorage.getItem(cacheKey);

      if (storedItem) {
        const item = JSON.parse(storedItem);

        if (item.expiry > now) {
          // Refresh in memory for faster access next time
          if (opts.strategy === "both") {
            memoryCache.set(cacheKey, item);
          }
          return item.value as T;
        } else {
          // Remove expired items
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error("Failed to retrieve from localStorage:", error);
    }
  }

  return null;
};

/**
 * Remove a value from the cache
 */
export const cacheRemove = (key: string, options: CacheOptions = {}): void => {
  const opts = { ...defaultOptions, ...options };
  const cacheKey = `${opts.prefix}${key}`;

  // Remove from memory
  memoryCache.delete(cacheKey);

  // Remove from localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(cacheKey);
    } catch (error) {
      console.error("Failed to remove from localStorage:", error);
    }
  }
};

/**
 * Clear all cache entries or entries with a specific prefix
 */
export const cacheClear = (
  prefixFilter?: string,
  options: CacheOptions = {}
): void => {
  const opts = { ...defaultOptions, ...options };
  const prefix = opts.prefix || "";
  const fullPrefix = prefixFilter ? `${prefix}${prefixFilter}` : prefix;

  // Clear memory cache
  if (prefixFilter) {
    // Remove only items with the specified prefix
    for (const key of memoryCache.keys()) {
      if (key.startsWith(fullPrefix)) {
        memoryCache.delete(key);
      }
    }
  } else {
    // Clear all items
    memoryCache.clear();
  }

  // Clear localStorage
  if (typeof window !== "undefined") {
    try {
      if (prefixFilter) {
        // Remove only items with the specified prefix
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(fullPrefix)) {
            localStorage.removeItem(key);
          }
        }
      } else {
        // Only clear items with our cache prefix to avoid affecting other app data
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith(prefix)) {
            localStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
    }
  }
};

/**
 * Cache the result of an async function call
 * Includes request deduplication to prevent redundant API calls
 */
export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> => {
  const opts = { ...defaultOptions, ...options };
  const cacheKey = `${opts.prefix}${key}`;

  // Check cache first
  const cachedValue = cacheGet<T>(key, opts);
  if (cachedValue !== null) {
    return cachedValue;
  }

  // Check if we already have a pending promise for this key
  if (pendingPromises.has(cacheKey)) {
    return pendingPromises.get(cacheKey) as Promise<T>;
  }

  // Create and store the promise
  const promise = fn()
    .then((result) => {
      // Cache the result
      cacheSet(key, result, opts);
      // Remove from pending promises
      pendingPromises.delete(cacheKey);
      return result;
    })
    .catch((error) => {
      // Remove from pending promises on error
      pendingPromises.delete(cacheKey);
      throw error;
    });

  // Store the pending promise
  pendingPromises.set(cacheKey, promise);

  return promise;
};
