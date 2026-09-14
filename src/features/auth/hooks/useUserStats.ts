import { useEffect, useState } from 'react';

import {
  GDP_REPORT_COMMUNITY_ID,
  serializeGdpReportThemeFilters,
} from '@/features/report/constants/reportApi';
import { parseReportsTotal } from '@/features/report/utils/parseReportsTotal';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
import { getViewedSheetsCount, subscribeViewedSheets } from '@/infra/storage/viewedSheetsStore';

import { useAuth } from './useAuth';

export interface UserStats {
  reportsCount: number;
  viewedSheetsCount: number;
}

interface UseUserStatsResult {
  stats: UserStats;
  isLoading: boolean;
  error: Error | null;
}

const EMPTY_STATS: UserStats = {
  reportsCount: 0,
  viewedSheetsCount: 0,
};

async function fetchUserReportsCount(userId: number): Promise<number> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return 0;
  }

  const response = await collabApiClient.report.getAll({
    communities: GDP_REPORT_COMMUNITY_ID,
    author: userId,
    page: 1,
    limit: 1,
    sort: 'id:DESC',
    attributes: serializeGdpReportThemeFilters(),
  });

  const pageCount = Array.isArray(response.data) ? response.data.length : 0;
  return parseReportsTotal(response.headers?.['content-range'], pageCount);
}

/**
 * Statistiques du compte :
 * - signalements : total renvoyé par GET /reports (filtre `author`)
 * - fiches consultées : stockage local lié au compte (voir `viewedSheetsStore`)
 */
export function useUserStats(): UseUserStatsResult {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.id === undefined) {
      setStats(EMPTY_STATS);
      setIsLoading(false);
      setError(null);
      return;
    }

    const userId = user.id;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [reportsCount, viewedSheetsCount] = await Promise.all([
          fetchUserReportsCount(userId),
          getViewedSheetsCount(userId),
        ]);

        if (!cancelled) {
          setStats({ reportsCount, viewedSheetsCount });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError : new Error('Impossible de charger les statistiques'));
          const viewedSheetsCount = await getViewedSheetsCount(userId).catch(() => 0);
          setStats((current) => ({
            reportsCount: current.reportsCount,
            viewedSheetsCount,
          }));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    const unsubscribe = subscribeViewedSheets(() => {
      void getViewedSheetsCount(userId).then((viewedSheetsCount) => {
        if (!cancelled) {
          setStats((current) => ({ ...current, viewedSheetsCount }));
        }
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isAuthenticated, user?.id]);

  return { stats, isLoading, error };
}
