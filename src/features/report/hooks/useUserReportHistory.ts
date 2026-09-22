import { useCallback, useEffect, useState } from 'react';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { loadUserReportHistory } from '@/features/report/utils/loadUserReportHistory';

const HISTORY_PAGE_SIZE = 30;

export interface UseUserReportHistoryResult {
  reports: GroupReport[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Historique des signalements envoyés au serveur par le compte connecté depuis une
 * version précédente de l'application (thème hérité, différent du thème de soumission
 * actuel) — contrairement à `useLocalReportDrafts`, qui ne connaît que les brouillons de
 * l'app actuelle stockés sur cet appareil.
 */
export function useUserReportHistory(): UseUserReportHistoryResult {
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState<GroupReport[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || userId === undefined) {
      setReports([]);
      setHasMore(false);
      setPage(1);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await loadUserReportHistory({ userId, page: 1, limit: HISTORY_PAGE_SIZE });
        if (!cancelled) {
          setReports(result.reports);
          setHasMore(result.hasMore);
          setPage(1);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError : new Error('Impossible de charger vos anciens signalements'),
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
  }, [isAuthenticated, userId]);

  const loadMore = useCallback(() => {
    if (userId === undefined || isLoadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);

    void loadUserReportHistory({ userId, page: nextPage, limit: HISTORY_PAGE_SIZE })
      .then((result) => {
        setReports((current) => [...current, ...result.reports]);
        setHasMore(result.hasMore);
        setPage(nextPage);
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error ? loadError : new Error('Impossible de charger la suite des signalements'),
        );
      })
      .finally(() => {
        setIsLoadingMore(false);
      });
  }, [userId, page, isLoadingMore, hasMore]);

  return {
    reports,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
  };
}
