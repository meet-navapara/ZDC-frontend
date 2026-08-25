/**
 * Browser-side GET dedupe + short TTL cache.
 * - Concurrent identical keys share one in-flight Promise (fixes Strict Mode double-fetch).
 * - Successful responses are reused for ttlMs so layout + page don't hit the network twice.
 */

type CacheEntry = { expires: number; data: unknown };

const inflight = new Map<string, Promise<unknown>>();
const cache = new Map<string, CacheEntry>();

export function cachedRequest<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 15_000
): Promise<T> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) {
    return Promise.resolve(hit.data as T);
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = fn()
    .then((data) => {
      if (ttlMs > 0) {
        cache.set(key, { expires: Date.now() + ttlMs, data });
      }
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, p);
  return p;
}

/** Drop cached entries whose key starts with prefix (or all if omitted). */
export function invalidateFetchCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      cache.delete(key);
    }
  }
}

export function peekFetchCache<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit || hit.expires <= Date.now()) return undefined;
  return hit.data as T;
}
