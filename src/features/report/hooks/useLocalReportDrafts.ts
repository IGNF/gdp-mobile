import { useCallback, useEffect, useState } from 'react';

import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { listLocalReportDrafts } from '@/infra/storage/localReportDraftsStore';

export function useLocalReportDrafts() {
  const [drafts, setDrafts] = useState<LocalReportDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    const list = await listLocalReportDrafts();
    setDrafts(list);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Chargement au montage, pas déclenché par une prop qui change : rien à dériver pendant
    // le rendu ici. `refetch` marque `isLoading` avant d'attendre la lecture du stockage local
    // — le pattern même que la doc React donne pour un fetch dans un effet.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { drafts, isLoading, refetch };
}
