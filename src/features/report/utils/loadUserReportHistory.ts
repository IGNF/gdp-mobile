import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportsToGroupReports,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import { matchesGeodesyReportThemeName } from '@/features/report/constants/geodesyReportApi';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

interface LoadUserReportHistoryOptions {
  userId: number;
  page: number;
  limit: number;
}

export interface UserReportHistoryPage {
  reports: GroupReport[];
  /** Reste-t-il des pages à consulter côté serveur (toutes thématiques confondues) ? */
  hasMore: boolean;
}

/**
 * Historique des signalements d'un compte envoyés depuis l'ancienne version de
 * l'application (tout thème différent de celui de soumission actuel, ex. « Géodésie ») —
 * pas de filtre d'emprise carte, contrairement à `loadReportsInMapBbox`. Les signalements
 * envoyés depuis l'app actuelle (thème `gdp-tools`) sont volontairement exclus : ils
 * vivent dans `useLocalReportDrafts` / `MyReportsPage`, pas dans cet historique.
 *
 * Le tri par thème se fait ici, côté client, sur `themeName` (propre à chaque
 * signalement, fiable) plutôt que via le paramètre `attributes` de `GET /reports` :
 * ce filtre serveur par thème s'est révélé peu fiable en pratique (voir aussi
 * `loadSentReportRemoteStatuses`, qui a rencontré le même problème).
 */
export async function loadUserReportHistory({
  userId,
  page,
  limit,
}: LoadUserReportHistoryOptions): Promise<UserReportHistoryPage> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return { reports: [], hasMore: false };
  }

  const response = await collabApiClient.report.getAll({
    communities: GDP_REPORT_COMMUNITY_ID,
    author: userId,
    page,
    limit,
    sort: 'id:DESC',
  });

  const apiReports = (response.data as ApiGroupReportResponse[]) ?? [];
  const legacyReports = mapApiReportsToGroupReports(apiReports).filter(
    (report) => !matchesGeodesyReportThemeName(report.themeName ?? ''),
  );

  return {
    reports: legacyReports,
    // Basé sur la taille de la page brute (avant filtrage thème), pas sur le nombre
    // d'éléments légués trouvés sur CETTE page : une page peut ne contenir que des
    // signalements gdp-tools et se retrouver filtrée à vide alors qu'il en reste plus loin.
    hasMore: apiReports.length === limit,
  };
}
