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
  /** True dès que la première page a été chargée avec succès. */
  isLoaded: boolean;
  hasMore: boolean;
  loadMore: () => void;
}

/**
 * Historique des signalements envoyés au serveur par le compte connecté — y compris ceux
 * envoyés depuis une version précédente de l'application (contrairement à
 * `useLocalReportDrafts`, qui ne connaît que les brouillons stockés sur cet appareil).
 */
export function useUserReportHistory(themes?: readonly string[]): UseUserReportHistoryResult {
  const { user, isAuthenticated } = useAuth();
  // Clé stable : un nouveau tableau à chaque rendu ne doit pas relancer le chargement.
  const themesKey = themes?.join(',');
  const [reports, setReports] = useState<GroupReport[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const userId = user?.id;

  // Déconnecté : état vidé pendant le rendu plutôt que dans l'effet ci-dessous, qui n'a alors
  // plus qu'à charger l'historique (une vraie resynchronisation avec l'API). Un seul
  // déclenchement par passage à « non prêt » (cf. `wasReady`).
  const isReady = isAuthenticated && userId !== undefined;
  const [wasReady, setWasReady] = useState(isReady);
  if (isReady !== wasReady) {
    setWasReady(isReady);
    if (!isReady) {
      setReports([]);
      setTotal(0);
      setPage(1);
      setIsLoading(false);
      setError(null);
      setIsLoaded(false);
    }
  }

  useEffect(() => {
    if (!isAuthenticated || userId === undefined) {
      return;
    }

    let cancelled = false;
    const themeList = themesKey ? themesKey.split(',') : undefined;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      setIsLoaded(false);

      try {
        const result = await loadUserReportHistory({
          userId,
          page: 1,
          limit: HISTORY_PAGE_SIZE,
          themes: themeList,
        });
        if (!cancelled) {
          setReports(result.reports);
          setTotal(result.total);
          setPage(1);
          setIsLoaded(true);
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
  }, [isAuthenticated, userId, themesKey]);

  const loadMore = useCallback(() => {
    if (userId === undefined || isLoadingMore || reports.length >= total) {
      return;
    }

    const nextPage = page + 1;
    setIsLoadingMore(true);

    void loadUserReportHistory({
      userId,
      page: nextPage,
      limit: HISTORY_PAGE_SIZE,
      themes: themesKey ? themesKey.split(',') : undefined,
    })
      .then((result) => {
        setReports((current) => [...current, ...result.reports]);
        setTotal(result.total);
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
  }, [userId, page, isLoadingMore, reports.length, total, themesKey]);

  return {
    reports,
    isLoading,
    isLoadingMore,
    error,
    isLoaded,
    hasMore: reports.length < total,
    loadMore,
  };
}
