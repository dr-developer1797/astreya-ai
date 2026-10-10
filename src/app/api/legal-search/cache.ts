const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ENTRIES = 200;

type CacheEntry = { at: number; body: unknown };

const store = new Map<string, CacheEntry>();

export function legalSearchCacheKey(query: string, page: number, enrich: boolean) {
  return `${query.toLowerCase()}::${page}::${enrich ? "1" : "0"}`;
}

export function getLegalSearchCached(key: string): unknown | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.body;
}

export function setLegalSearchCache(key: string, body: unknown) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { at: Date.now(), body });
}

export function clearLegalSearchCacheForTests() {
  store.clear();
}
