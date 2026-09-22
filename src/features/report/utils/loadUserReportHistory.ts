import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportsToGroupReports,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import {
  GDP_REPORT_COMMUNITY_ID,
  GDP_REPORT_LEGACY_THEMES,
  serializeGdpReportLegacyThemeFilters,
} from '@/features/report/constants/reportApi';
import { parseReportsTotal } from '@/features/report/utils/parseReportsTotal';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

interface LoadUserReportHistoryOptions {
  userId: number;
  page: number;
  limit: number;
}

export interface UserReportHistoryPage {
  reports: GroupReport[];
  total: number;
}

/**
 * Historique des signalements d'un compte envoyés depuis l'ancienne version de
 * l'application (thème Espace Collaboratif hérité, ex. « Géodésie ») — pas de filtre
 * d'emprise carte, contrairement à `loadReportsInMapBbox`. Les signalements envoyés
 * depuis l'app actuelle (thème `gdp-tools`) sont volontairement exclus : ils vivent dans
 * `useLocalReportDrafts` / `MyReportsPage`, pas dans cet historique.
 */
export async function loadUserReportHistory({
  userId,
  page,
  limit,
}: LoadUserReportHistoryOptions): Promise<UserReportHistoryPage> {
  if (GDP_REPORT_LEGACY_THEMES.length === 0) {
    return { reports: [], total: 0 };
  }

  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return { reports: [], total: 0 };
  }

  const response = await collabApiClient.report.getAll({
    communities: GDP_REPORT_COMMUNITY_ID,
    author: userId,
    page,
    limit,
    sort: 'id:DESC',
    attributes: serializeGdpReportLegacyThemeFilters(),
  });

  const apiReports = (response.data as ApiGroupReportResponse[]) ?? [];

  return {
    reports: mapApiReportsToGroupReports(apiReports),
    total: parseReportsTotal(response.headers?.['content-range'], apiReports.length),
  };
}
