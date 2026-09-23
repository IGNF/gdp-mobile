import { useEffect, useMemo, useState } from 'react';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { matchesGeodesyReportThemeName } from '@/features/report/constants/geodesyReportApi';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { loadUserServerReports } from '@/features/report/utils/loadUserServerReports';

export interface UseUserServerReportsResult {
  /** Signalements envoyés depuis l'app actuelle (thème `gdp-tools`), quel que soit l'appareil. */
  currentReports: GroupReport[];
  /** Signalements envoyés depuis l'ancienne version de l'app (tout autre thème, ex. « Géodésie »). */
  legacyReports: GroupReport[];
  isLoading: boolean;
  error: Error | null;
}

/** Vrai si le signalement a été envoyé depuis l'app actuelle (thème `gdp-tools` ou alias). */
export function isCurrentAppReport(report: GroupReport): boolean {
  return matchesGeodesyReportThemeName(report.themeName ?? '');
}

/**
 * Signalements du compte connecté côté serveur, répartis par version d'app d'après leur
 * thème. Complète `useLocalReportDrafts`, qui ne connaît que les brouillons stockés sur
 * cet appareil (un signalement envoyé depuis un autre appareil n'y figure pas).
 */
export function useUserServerReports(): UseUserServerReportsResult {
  const { user, isAuthenticated } = useAuth();
  const [reports, setReports] = useState<GroupReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || userId === undefined) {
      setReports([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void loadUserServerReports(userId)
      .then((result) => {
        if (!cancelled) {
          setReports(result);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError : new Error('Impossible de charger vos signalements'),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, userId]);

  const { currentReports, legacyReports } = useMemo(
    () => ({
      currentReports: reports.filter(isCurrentAppReport),
      legacyReports: reports.filter((report) => !isCurrentAppReport(report)),
    }),
    [reports],
  );

  return { currentReports, legacyReports, isLoading, error };
}
