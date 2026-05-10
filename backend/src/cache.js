// Zentraler In-Memory Cache (geteilt zwischen Scheduler + Routen)
const store = {};

const cache = {
  get(key) {
    const e = store[key];
    if (!e) return null;
    if (Date.now() - e.ts > e.ttl) { delete store[key]; return null; }
    return e.data;
  },
  set(key, data, ttlMs) {
    store[key] = { data, ts: Date.now(), ttl: ttlMs };
  },
  del(key) { delete store[key]; },
  keys() { return Object.keys(store); },
  stats() {
    return Object.entries(store).map(([k, v]) => ({
      key: k,
      expiresIn: Math.max(0, Math.round((v.ttl - (Date.now() - v.ts)) / 1000)) + 's'
    }));
  }
};

module.exports = cache;
