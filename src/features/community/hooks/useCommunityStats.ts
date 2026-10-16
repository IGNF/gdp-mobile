import { ReportStatus } from '@ign/mobile-core';
import { useEffect, useState } from 'react';

import {
  fetchCommunityMembersCount,
  fetchCommunityReportCount,
  fetchCommunityReportCountSafe,
} from '@/features/community/utils/communityReportCounts';
import {
  GDP_REPORT_COMMUNITY_ID,
  getGdpCommunityReportThemes,
} from '@/features/report/constants/reportApi';
import { getCollabApiCached, peekCollabApiCache, setCollabApiCache } from '@/infra/api/collabApiCache';
import { COLLAB_API_CACHE_KEYS, GDP_COMMUNITY_THEME_CACHE_TTL_MS } from '@/infra/api/collabApiKeys';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
import {
  readPersistedCommunityStats,
  writePersistedCommunityStats,
  type CommunityStatsAudience,
} from '@/infra/storage/communityStatsStore';
import { formatIsoDateDaysAgo } from '@/shared/utils/date';

const DEFAULT_COMMUNITY_TITLE = 'Géodésie';

export const COMMUNITY_RECENT_PERIOD_DAYS = 30;

const TRACKED_STATUSES: ReportStatus[] = [
  ReportStatus.Submit,
  ReportStatus.Pending,
  ReportStatus.Pending_Qualification,
  ReportStatus.Pending_Entry,
  ReportStatus.Pending_Validation,
  ReportStatus.Valid,
  ReportStatus.Valid_Already_Treated,
  ReportStatus.Reject,
  ReportStatus.Reject_Irrelevant,
];

export interface CommunityStatusCount {
  status: ReportStatus;
  count: number;
}

export interface CommunityStatsSnapshot {
  communityName: string;
  /** Présentation communauté (HTML IGN), réservée aux utilisateurs connectés. */
  communityDescriptionHtml: string;
  reportsTotal: number;
  /** Renseigné seulement si connecté (sinon `null`). */
  membersCount: number | null;
  statusCounts: CommunityStatusCount[];
  /** Sur les `COMMUNITY_RECENT_PERIOD_DAYS` derniers jours. */
  recent: {
    opened: number;
    closed: number;
  };
}

interface UseCommunityStatsOptions {
  enabled: boolean;
  isAuthenticated: boolean;
}

interface CachedCommunityStats {
  stats: CommunityStatsSnapshot;
  fetchedAt: number;
}

interface UseCommunityStatsResult {
  stats: CommunityStatsSnapshot | null;
  isLoading: boolean;
  isReloading: boolean;
  /** Date de la récupération mise en cache, `null` tant qu’aucun chargement n’a abouti. */
  lastLoadedAt: Date | null;
  error: Error | null;
  reload: () => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readCommunityText(data: unknown): { name: string; descriptionHtml: string } {
  if (!isRecord(data)) {
    return { name: '', descriptionHtml: '' };
  }

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const editorial = typeof data.editorial === 'string' ? data.editorial.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  const descriptionHtml = editorial || description;

  return { name, descriptionHtml };
}

async function loadAuthenticatedCommunityProfile(): Promise<{
  name: string;
  descriptionHtml: string;
}> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return { name: '', descriptionHtml: '' };
  }

  const response = await getCollabApiCached(
    COLLAB_API_CACHE_KEYS.community(GDP_REPORT_COMMUNITY_ID),
    () => collabApiClient.community.get(GDP_REPORT_COMMUNITY_ID),
    { ttlMs: GDP_COMMUNITY_THEME_CACHE_TTL_MS },
  );

  return readCommunityText(response.data);
}

function communityStatsAudience(isAuthenticated: boolean): CommunityStatsAudience {
  return isAuthenticated ? 'auth' : 'public';
}

function communityStatsCacheKey(isAuthenticated: boolean): string {
  return COLLAB_API_CACHE_KEYS.communityStats(
    GDP_REPORT_COMMUNITY_ID,
    communityStatsAudience(isAuthenticated),
  );
}

function readCachedCommunityStats(isAuthenticated: boolean): CachedCommunityStats | undefined {
  return peekCollabApiCache<CachedCommunityStats>(communityStatsCacheKey(isAuthenticated));
}

async function rememberCommunityStats(
  isAuthenticated: boolean,
  payload: CachedCommunityStats,
): Promise<void> {
  setCollabApiCache(communityStatsCacheKey(isAuthenticated), payload);
  await writePersistedCommunityStats(communityStatsAudience(isAuthenticated), payload);
}

async function fetchCommunityStatsSnapshot(
  isAuthenticated: boolean,
): Promise<CachedCommunityStats> {
  const themes = getGdpCommunityReportThemes();
  const recentSince = formatIsoDateDaysAgo(COMMUNITY_RECENT_PERIOD_DAYS);

  const authenticatedExtrasPromise = isAuthenticated
    ? Promise.all([loadAuthenticatedCommunityProfile(), fetchCommunityMembersCount()])
    : Promise.resolve([{ name: '', descriptionHtml: '' }, null] as const);

  const [authenticatedExtras, reportsTotal, statusTotals, recentOpened, recentClosed] =
    await Promise.all([
      authenticatedExtrasPromise,
      fetchCommunityReportCount({ themes }),
      Promise.all(
        TRACKED_STATUSES.map((status) => fetchCommunityReportCountSafe({ themes, status })),
      ),
      fetchCommunityReportCountSafe({ themes, openedSince: recentSince }),
      fetchCommunityReportCountSafe({ themes, closedSince: recentSince }),
    ]);

  const [profile, membersCount] = authenticatedExtras;

  const statusCounts: CommunityStatusCount[] = TRACKED_STATUSES.map((status, index) => ({
    status,
    count: statusTotals[index] ?? 0,
  })).filter((entry) => entry.count > 0);

  const communityName = isAuthenticated && profile.name ? profile.name : DEFAULT_COMMUNITY_TITLE;

  return {
    fetchedAt: Date.now(),
    stats: {
      communityName,
      communityDescriptionHtml: isAuthenticated ? profile.descriptionHtml : '',
      reportsTotal,
      membersCount: isAuthenticated ? membersCount : null,
      statusCounts,
      recent: { opened: recentOpened, closed: recentClosed },
    },
  };
}

export function useCommunityStats({
  enabled,
  isAuthenticated,
}: UseCommunityStatsOptions): UseCommunityStatsResult {
  const cacheKey = communityStatsCacheKey(isAuthenticated);
  const initialCache = readCachedCommunityStats(isAuthenticated);
  const [stats, setStats] = useState<CommunityStatsSnapshot | null>(initialCache?.stats ?? null);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(
    initialCache ? new Date(initialCache.fetchedAt) : null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [appliedCacheKey, setAppliedCacheKey] = useState(cacheKey);

  if (appliedCacheKey !== cacheKey) {
    const cached = peekCollabApiCache<CachedCommunityStats>(cacheKey);
    setAppliedCacheKey(cacheKey);
    setStats(cached?.stats ?? null);
    setLastLoadedAt(cached ? new Date(cached.fetchedAt) : null);
    setError(null);
  }

  const reload = () => {
    if (isReloading || isLoading) {
      return;
    }

    setIsReloading(true);
    setError(null);

    void getCollabApiCached(cacheKey, () => fetchCommunityStatsSnapshot(isAuthenticated), {
      forceRefresh: true,
    })
      .then(async (payload) => {
        await rememberCommunityStats(isAuthenticated, payload);
        setStats(payload.stats);
        setLastLoadedAt(new Date(payload.fetchedAt));
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError
            : new Error('Impossible de charger les statistiques de la communauté'),
        );
      })
      .finally(() => {
        setIsReloading(false);
      });
  };

  useEffect(() => {
    if (!enabled || peekCollabApiCache<CachedCommunityStats>(cacheKey)) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      const persisted = await readPersistedCommunityStats<CommunityStatsSnapshot>(
        communityStatsAudience(isAuthenticated),
      );

      if (cancelled) {
        return;
      }

      if (persisted) {
        setCollabApiCache(cacheKey, persisted);
        setStats(persisted.stats);
        setLastLoadedAt(new Date(persisted.fetchedAt));
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const payload = await getCollabApiCached(cacheKey, () =>
          fetchCommunityStatsSnapshot(isAuthenticated),
        );
        await rememberCommunityStats(isAuthenticated, payload);

        if (!cancelled) {
          setStats(payload.stats);
          setLastLoadedAt(new Date(payload.fetchedAt));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError
              : new Error('Impossible de charger les statistiques de la communauté'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [cacheKey, enabled, isAuthenticated]);

  return { stats, isLoading, isReloading, lastLoadedAt, error, reload };
}
