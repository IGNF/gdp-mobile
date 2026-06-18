import { useCallback, useState } from 'react';

import {
  clearAppCaches,
  loadAppCacheStats,
  type AppCacheStats,
} from '@/infra/cache/appCache';

export function useAppCacheMaintenance() {
  const [stats, setStats] = useState<AppCacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);

    try {
      setStats(await loadAppCacheStats());
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCaches = useCallback(async () => {
    setIsClearing(true);

    try {
      clearAppCaches();
      setStats(await loadAppCacheStats());
    } finally {
      setIsClearing(false);
    }
  }, []);

  return {
    stats,
    isLoading,
    isClearing,
    loadStats,
    clearCaches,
  };
}
