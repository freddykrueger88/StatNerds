// Zentraler In-Memory Cache mit TTL, Stats und flush()
const store = {};
let hits = 0;
let misses = 0;

const cache = {
  get(key) {
    const e = store[key];
    if (!e) { misses++; return null; }
    if (Date.now() - e.ts > e.ttl) { delete store[key]; misses++; return null; }
    hits++;
    return e.data;
  },

  set(key, data, ttlMs) {
    store[key] = { data, ts: Date.now(), ttl: ttlMs };
  },

  del(key) { delete store[key]; },

  flush() {
    Object.keys(store).forEach(k => delete store[k]);
  },

  size() { return Object.keys(store).length; },

  keys() { return Object.keys(store); },

  stats() {
    const now = Date.now();
    return {
      entries: Object.keys(store).length,
      hits,
      misses,
      hitRate: hits + misses > 0 ? ((hits / (hits + misses)) * 100).toFixed(1) + '%' : 'n/a',
      items: Object.entries(store).map(([k, v]) => ({
        key: k,
        expiresIn: Math.max(0, Math.round((v.ttl - (now - v.ts)) / 1000)) + 's',
      })),
    };
  },
};

module.exports = cache;
