import { useState } from 'react';

import { storageKey } from '@/shared/constants/storage';

export const WELCOME_SEEN_STORAGE_KEY = storageKey('welcome_seen');

export function isWelcomeSeen(): boolean {
  return localStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true';
}

export function useFirstRun() {
  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => !isWelcomeSeen());

  const markAsSeen = () => {
    localStorage.setItem(WELCOME_SEEN_STORAGE_KEY, 'true');
    setIsFirstRun(false);
  };

  return {
    isFirstRun,
    markAsSeen,
  };
}
