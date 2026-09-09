import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportsToGroupReports,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import {
  GDP_REPORT_COMMUNITY_ID,
  serializeGdpReportThemeFilters,
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
 * Historique complet des signalements d'un compte (pas de filtre d'emprise carte,
 * contrairement à `loadReportsInMapBbox`) — inclut notamment les signalements envoyés
 * depuis une version précédente de l'application.
 */
export async function loadUserReportHistory({
  userId,
  page,
  limit,
}: LoadUserReportHistoryOptions): Promise<UserReportHistoryPage> {
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
    attributes: serializeGdpReportThemeFilters(),
  });

  const apiReports = (response.data as ApiGroupReportResponse[]) ?? [];

  return {
    reports: mapApiReportsToGroupReports(apiReports),
    total: parseReportsTotal(response.headers?.['content-range'], apiReports.length),
  };
}
