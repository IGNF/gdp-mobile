import type { ReportStatus } from '@ign/mobile-core';

import {
  mapApiReportToGroupReport,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

/**
 * Statut serveur courant de chaque signalement envoyé, indexé par identifiant serveur
 * (`LocalReportDraft.serverId`) — un `GET /reports/:id` par identifiant, comme sur la page
 * de détail. Volontairement pas de requête groupée filtrée par thème (`report.getAll` +
 * `attributes`) : elle dépend d'une correspondance exacte du nom de thème côté serveur et
 * peut silencieusement ne rien renvoyer si ça ne matche pas, alors qu'on connaît déjà
 * l'identifiant exact de chaque signalement envoyé.
 */
export async function loadSentReportRemoteStatuses(serverIds: number[]): Promise<Map<number, ReportStatus>> {
  const statuses = new Map<number, ReportStatus>();
  if (serverIds.length === 0) {
    return statuses;
  }

  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return statuses;
  }

  const results = await Promise.allSettled(
    serverIds.map((serverId) => collabApiClient.report.get(serverId)),
  );

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      return;
    }
    const report = mapApiReportToGroupReport(result.value.data as ApiGroupReportResponse);
    statuses.set(serverIds[index], report.status);
  });

  return statuses;
}
