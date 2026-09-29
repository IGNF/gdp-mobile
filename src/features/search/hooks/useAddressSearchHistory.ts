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

  // Recharge à l'activation, pendant le rendu : lecture localStorage pure et synchrone, sûre
  // pendant le rendu (pas de resynchronisation externe ici).
  const [wasActive, setWasActive] = useState(isActive);
  if (isActive !== wasActive) {
    setWasActive(isActive);
    if (isActive) {
      setEntries(readAddressSearchHistory());
    }
  }

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
