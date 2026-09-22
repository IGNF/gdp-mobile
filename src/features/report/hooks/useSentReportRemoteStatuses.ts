import { useEffect, useState } from 'react';
import type { ReportStatus } from '@ign/mobile-core';

import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { loadSentReportRemoteStatuses } from '@/features/report/utils/loadSentReportRemoteStatuses';

/**
 * Statuts serveur (badge « Reçu / Pris en compte / Rejeté ») des brouillons locaux déjà
 * envoyés, indexés par `serverId`. Séparé de `useLocalReportDrafts` (pur stockage local,
 * réutilisé par la carte) pour ne déclencher cet appel réseau que là où le badge est
 * affiché.
 */
export function useSentReportRemoteStatuses(drafts: LocalReportDraft[]): Map<number, ReportStatus> {
  const { isAuthenticated } = useAuth();
  const [statuses, setStatuses] = useState<Map<number, ReportStatus>>(() => new Map());

  useEffect(() => {
    const serverIds = drafts
      .map((draft) => draft.serverId)
      .filter((serverId): serverId is number => serverId !== undefined);

    // Rien à réinitialiser explicitement : les entrées obsolètes d'anciens brouillons ne
    // sont jamais consultées (recherche par `serverId` des brouillons actuellement affichés).
    if (!isAuthenticated || serverIds.length === 0) {
      return;
    }

    let cancelled = false;
    void loadSentReportRemoteStatuses(serverIds)
      .then((result) => {
        if (!cancelled) {
          setStatuses(result);
        }
      })
      .catch((error: unknown) => {
        console.error('Error loading sent report remote statuses:', error);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, drafts]);

  return statuses;
}
