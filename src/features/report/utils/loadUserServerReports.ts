import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportsToGroupReports,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

const PAGE_SIZE = 100;
/** Garde-fou : 20 × 100 signalements par compte, largement au-delà de l'usage réel. */
const MAX_PAGES = 20;

/**
 * Tous les signalements du compte sur la communauté GDP, toutes thématiques confondues —
 * pas de filtre d'emprise carte ni de filtre thème serveur (`attributes`), qui dépend d'une
 * correspondance exacte du nom de thème et peut silencieusement ne rien renvoyer. La
 * répartition « signalements de l'app actuelle (`gdp-tools`) / anciens signalements » se
 * fait côté client sur `themeName`, voir `isCurrentAppReport`.
 */
export async function loadUserServerReports(userId: number): Promise<GroupReport[]> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return [];
  }

  const reports: GroupReport[] = [];

  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const response = await collabApiClient.report.getAll({
      communities: GDP_REPORT_COMMUNITY_ID,
      author: userId,
      page,
      limit: PAGE_SIZE,
      sort: 'id:DESC',
    });

    const apiReports = (response.data as ApiGroupReportResponse[]) ?? [];
    reports.push(...mapApiReportsToGroupReports(apiReports));

    if (apiReports.length < PAGE_SIZE) {
      break;
    }
  }

  return reports;
}
