/**
 * server/utils/memoryCache.js
 * Tiny in-memory TTL cache shared by dashboard controllers.
 *
 * Phase 1 runs single-instance (no Redis). The factory keeps each cache's
 * namespace independent, so invalidating one dashboard never clears another.
 * Swap the internals for Redis later without changing call sites.
 */

/**
 * @param {number} ttlMs Time-to-live in milliseconds.
 * @returns {{ get: Function, set: Function, clear: Function, size: Function }}
 */
const createCache = (ttlMs = 5 * 60 * 1000) => {
  const store = new Map();

  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      if (Date.now() - entry.timestamp > ttlMs) {
        store.delete(key);
        return null;
      }
      return entry.data;
    },
    set(key, data) {
      store.set(key, { data, timestamp: Date.now() });
    },
    clear() {
      store.clear();
    },
    size() {
      return store.size;
    },
  };
};

module.exports = { createCache };
