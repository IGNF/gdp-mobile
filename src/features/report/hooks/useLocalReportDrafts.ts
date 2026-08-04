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
    void refetch();
  }, [refetch]);

  return { drafts, isLoading, refetch };
}
