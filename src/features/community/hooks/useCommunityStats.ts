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

export const COMMUNITY_THEME_FILTER_ALL = '__all__';

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
  /** Présentation communauté (HTML IGN). */
  communityDescriptionHtml: string;
  themeOptions: string[];
  reportsTotal: number;
  membersCount: number | null;
  statusCounts: CommunityStatusCount[];
}

interface UseCommunityStatsOptions {
  enabled: boolean;
  themeFilter: string;
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

/** Texte éditorial communauté (HTML fourni par l’Espace collaboratif). */
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

function buildThemeOptions(): string[] {
  return [...getGdpCommunityReportThemes()].sort((a, b) => a.localeCompare(b, 'fr'));
}

function resolveThemesForFilter(themeFilter: string): readonly string[] {
  const gdpThemes = getGdpCommunityReportThemes();

  if (themeFilter === COMMUNITY_THEME_FILTER_ALL) {
    return gdpThemes;
  }

  return gdpThemes.includes(themeFilter) ? [themeFilter] : gdpThemes;
}

async function loadCommunityProfile(): Promise<{
  name: string;
  descriptionHtml: string;
  themeOptions: string[];
}> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return {
      name: '',
      descriptionHtml: '',
      themeOptions: buildThemeOptions(),
    };
  }

  const response = await getCollabApiCached(
    COLLAB_API_CACHE_KEYS.community(GDP_REPORT_COMMUNITY_ID),
    () => collabApiClient.community.get(GDP_REPORT_COMMUNITY_ID),
    { ttlMs: GDP_COMMUNITY_THEME_CACHE_TTL_MS },
  );

  const { name, descriptionHtml } = readCommunityText(response.data);

  return {
    name,
    descriptionHtml,
    themeOptions: buildThemeOptions(),
  };
}

export function useCommunityStats({
  enabled,
  themeFilter,
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
        const profile = await loadCommunityProfile();
        const themes = resolveThemesForFilter(themeFilter);

        const [reportsTotal, membersCount, statusTotals] = await Promise.all([
          fetchCommunityReportCount({ themes }),
          fetchCommunityMembersCount(),
          Promise.all(
            TRACKED_STATUSES.map((status) =>
              fetchCommunityReportCountSafe({ themes, status }),
            ),
          ),
        ]);

        const statusCounts: CommunityStatusCount[] = TRACKED_STATUSES.map((status, index) => ({
          status,
          count: statusTotals[index] ?? 0,
        })).filter((entry) => entry.count > 0);

        if (!cancelled) {
          setStats({
            communityName: profile.name,
            communityDescriptionHtml: profile.descriptionHtml,
            themeOptions: profile.themeOptions,
            reportsTotal,
            membersCount,
            statusCounts,
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
  }, [enabled, themeFilter, reloadToken]);

  return { stats, isLoading, error, reload };
}
