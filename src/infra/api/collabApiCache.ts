interface CollabApiCacheEntry<T> {
  value: T;
  cachedAt: number;
}

const memoryCache = new Map<string, CollabApiCacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

export interface CollabApiCacheOptions {
  /** Durée de validité en ms (défaut : session, pas d’expiration). */
  ttlMs?: number;
  /** Ignore le cache et relance la requête. */
  forceRefresh?: boolean;
}

function isCacheEntryFresh<T>(entry: CollabApiCacheEntry<T>, ttlMs?: number): boolean {
  if (ttlMs === undefined) {
    return true;
  }

  return Date.now() - entry.cachedAt <= ttlMs;
}

/**
 * Cache mémoire + déduplication des requêtes en cours (pattern proche de layerCache EspaceCo).
 */
export async function getCollabApiCached<T>(
  cacheKey: string,
  fetcher: () => Promise<T>,
  options: CollabApiCacheOptions = {},
): Promise<T> {
  if (!options.forceRefresh) {
    const cached = memoryCache.get(cacheKey) as CollabApiCacheEntry<T> | undefined;
    if (cached && isCacheEntryFresh(cached, options.ttlMs)) {
      return cached.value;
    }
  }

  const inflight = inflightRequests.get(cacheKey) as Promise<T> | undefined;
  if (inflight) {
    return inflight;
  }

  const request = fetcher()
    .then((value) => {
      memoryCache.set(cacheKey, { value, cachedAt: Date.now() });
      return value;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request);
  return request;
}

export function clearCollabApiCache(): void {
  memoryCache.clear();
  inflightRequests.clear();
}

function estimateJsonSizeBytes(value: unknown): number {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).length;
  } catch {
    return 0;
  }
}

export function getCollabApiCacheStats(): { entryCount: number; sizeBytes: number } {
  let sizeBytes = 0;

  for (const [key, entry] of memoryCache.entries()) {
    sizeBytes += key.length * 2;
    sizeBytes += estimateJsonSizeBytes(entry.value);
  }

  return {
    entryCount: memoryCache.size,
    sizeBytes,
  };
}
