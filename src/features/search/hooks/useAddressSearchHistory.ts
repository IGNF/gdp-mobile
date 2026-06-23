import { useCallback, useEffect, useState } from 'react';

import {
  readAddressSearchHistory,
  type AddressSearchHistoryEntry,
} from '@/features/search/utils/addressSearchHistory';

export function useAddressSearchHistory(isActive: boolean) {
  const [entries, setEntries] = useState<AddressSearchHistoryEntry[]>([]);

  const refresh = useCallback(() => {
    setEntries(readAddressSearchHistory());
  }, []);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    refresh();
  }, [isActive, refresh]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.includes('ol@search-IGNF-gdp-address')) {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isActive, refresh]);

  return { entries, refresh };
}
