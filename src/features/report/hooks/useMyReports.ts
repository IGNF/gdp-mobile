import { useCallback, useEffect, useRef, useState } from 'react';

import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportsToGroupReports,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  GDP_REPORT_COMMUNITY_ID,
  serializeGdpReportThemeFilters,
} from '@/features/report/constants/reportApi';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

const SERVER_PAGE_SIZE = 20;

interface UseMyReportsResult {
  serverReports: GroupReport[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
}

export function useMyReports(): UseMyReportsResult {
  const { user, isAuthenticated } = useAuth();
  const [serverReports, setServerReports] = useState<GroupReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const pageRef = useRef(1);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(false);

  const fetchReports = useCallback(
    async (page: number, append: boolean): Promise<void> => {
      if (!user) {
        setServerReports([]);
        setHasMore(false);
        hasMoreRef.current = false;
        return;
      }

      if (isLoadingRef.current) {
        return;
      }

      isLoadingRef.current = true;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const sessionReady = await ensureCollabApiSession();
        if (!sessionReady) {
          throw new Error('Session expirée. Reconnectez-vous.');
        }

        const response = await collabApiClient.report.getAll({
          communities: GDP_REPORT_COMMUNITY_ID,
          author: user.id,
          page,
          limit: SERVER_PAGE_SIZE,
          sort: 'id:DESC',
          attributes: serializeGdpReportThemeFilters(),
        });

        const reports = mapApiReportsToGroupReports(response.data as ApiGroupReportResponse[]);
        const receivedLessThanLimit = reports.length < SERVER_PAGE_SIZE;

        setHasMore(!receivedLessThanLimit);
        hasMoreRef.current = !receivedLessThanLimit;

        if (append) {
          setServerReports((previous) => [...previous, ...reports]);
        } else {
          setServerReports(reports);
        }

        pageRef.current = page + 1;
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'Impossible de charger vos signalements.';
        setError(message);
        if (!append) {
          setServerReports([]);
          setHasMore(false);
          hasMoreRef.current = false;
        }
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    [user],
  );

  const refetch = useCallback(async () => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);

    if (isAuthenticated && user) {
      await fetchReports(1, false);
    } else {
      setServerReports([]);
      setError(null);
      setHasMore(false);
      hasMoreRef.current = false;
    }
  }, [fetchReports, isAuthenticated, user]);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || isLoadingRef.current) {
      return;
    }

    await fetchReports(pageRef.current, true);
  }, [fetchReports]);

  useEffect(() => {
    pageRef.current = 1;
    hasMoreRef.current = true;
    setHasMore(true);

    if (isAuthenticated && user) {
      void fetchReports(1, false);
    } else {
      setServerReports([]);
      setError(null);
      setHasMore(false);
      hasMoreRef.current = false;
    }
  }, [fetchReports, isAuthenticated, user?.id]);

  return {
    serverReports,
    isLoading: isAuthenticated && isLoading && serverReports.length === 0,
    isLoadingMore,
    error,
    hasMore,
    refetch,
    loadMore,
  };
}
