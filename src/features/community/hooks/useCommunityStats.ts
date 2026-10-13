import { ReportStatus } from '@ign/mobile-core';
import { useCallback, useEffect, useState } from 'react';

import {
  fetchCommunityMembersCount,
  fetchCommunityReportCount,
  fetchCommunityReportCountSafe,
} from '@/features/community/utils/communityReportCounts';
import {
  GDP_REPORT_COMMUNITY_ID,
  getGdpCommunityReportThemes,
} from '@/features/report/constants/reportApi';
import { getCollabApiCached } from '@/infra/api/collabApiCache';
import { COLLAB_API_CACHE_KEYS, GDP_COMMUNITY_THEME_CACHE_TTL_MS } from '@/infra/api/collabApiKeys';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
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

interface UseCommunityStatsResult {
  stats: CommunityStatsSnapshot | null;
  isLoading: boolean;
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

export function useCommunityStats({
  enabled,
  isAuthenticated,
}: UseCommunityStatsOptions): UseCommunityStatsResult {
  const [stats, setStats] = useState<CommunityStatsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const themes = getGdpCommunityReportThemes();
        const recentSince = formatIsoDateDaysAgo(COMMUNITY_RECENT_PERIOD_DAYS);

        const authenticatedExtrasPromise = isAuthenticated
          ? Promise.all([
              loadAuthenticatedCommunityProfile(),
              fetchCommunityMembersCount(),
            ])
          : Promise.resolve([{ name: '', descriptionHtml: '' }, null] as const);

        const [authenticatedExtras, reportsTotal, statusTotals, recentOpened, recentClosed] =
          await Promise.all([
            authenticatedExtrasPromise,
            fetchCommunityReportCount({ themes }),
            Promise.all(
              TRACKED_STATUSES.map((status) =>
                fetchCommunityReportCountSafe({ themes, status }),
              ),
            ),
            fetchCommunityReportCountSafe({ themes, openedSince: recentSince }),
            fetchCommunityReportCountSafe({ themes, closedSince: recentSince }),
          ]);

        const [profile, membersCount] = authenticatedExtras;

        const statusCounts: CommunityStatusCount[] = TRACKED_STATUSES.map((status, index) => ({
          status,
          count: statusTotals[index] ?? 0,
        })).filter((entry) => entry.count > 0);

        const communityName =
          isAuthenticated && profile.name ? profile.name : DEFAULT_COMMUNITY_TITLE;

        if (!cancelled) {
          setStats({
            communityName,
            communityDescriptionHtml: isAuthenticated ? profile.descriptionHtml : '',
            reportsTotal,
            membersCount: isAuthenticated ? membersCount : null,
            statusCounts,
            recent: { opened: recentOpened, closed: recentClosed },
          });
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
  }, [enabled, isAuthenticated, reloadToken]);

  return { stats, isLoading, error, reload };
}
