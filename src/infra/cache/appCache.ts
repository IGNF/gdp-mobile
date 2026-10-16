import { clearAllGeodesyCaches, getGeodesyCacheStats } from '@ign/gdp-tools';

import { clearCollabApiCache, getCollabApiCacheStats } from '@/infra/api/collabApiCache';
import { clearPersistedCommunityStats, getPersistedCommunityStatsSizeBytes } from '@/infra/storage/communityStatsStore';

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
  const [apiCache, geodesyCache, persistedCommunityStatsBytes] = await Promise.all([
    Promise.resolve(getCollabApiCacheStats()),
    Promise.resolve(getGeodesyCacheStats()),
    getPersistedCommunityStatsSizeBytes(),
  ]);

  return {
    apiCacheEntryCount:
      apiCache.entryCount + (persistedCommunityStatsBytes > 0 ? 1 : 0),
    apiCacheSizeBytes: apiCache.sizeBytes + persistedCommunityStatsBytes,
    geodesyFeatureInfoEntryCount: geodesyCache.featureInfoEntryCount,
    geodesyFeatureInfoSizeBytes: geodesyCache.featureInfoSizeBytes,
    geodesyImageEntryCount: geodesyCache.imageEntryCount,
    geodesyImageSizeBytes: geodesyCache.imageSizeBytes,
  };
}

export async function clearAppCaches(): Promise<void> {
  clearCollabApiCache();
  clearAllGeodesyCaches();
  await clearPersistedCommunityStats();
}
