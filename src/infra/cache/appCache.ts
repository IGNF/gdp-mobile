import { clearAllGeodesyCaches, getGeodesyCacheStats } from '@ign/gdp-tools';

import { clearCollabApiCache, getCollabApiCacheStats } from '@/infra/api/collabApiCache';

export interface AppCacheStats {
  apiCacheEntryCount: number;
  apiCacheSizeBytes: number;
  geodesyFeatureInfoEntryCount: number;
  geodesyFeatureInfoSizeBytes: number;
  geodesyImageEntryCount: number;
  geodesyImageSizeBytes: number;
}

export function getClearableCacheSizeBytes(stats: AppCacheStats): number {
  return stats.apiCacheSizeBytes + stats.geodesyFeatureInfoSizeBytes + stats.geodesyImageSizeBytes;
}

export async function loadAppCacheStats(): Promise<AppCacheStats> {
  const [apiCache, geodesyCache] = await Promise.all([
    Promise.resolve(getCollabApiCacheStats()),
    Promise.resolve(getGeodesyCacheStats()),
  ]);

  return {
    apiCacheEntryCount: apiCache.entryCount,
    apiCacheSizeBytes: apiCache.sizeBytes,
    geodesyFeatureInfoEntryCount: geodesyCache.featureInfoEntryCount,
    geodesyFeatureInfoSizeBytes: geodesyCache.featureInfoSizeBytes,
    geodesyImageEntryCount: geodesyCache.imageEntryCount,
    geodesyImageSizeBytes: geodesyCache.imageSizeBytes,
  };
}

export function clearAppCaches(): void {
  clearCollabApiCache();
  clearAllGeodesyCaches();
}
