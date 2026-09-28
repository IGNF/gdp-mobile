import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { initMatomo, trackPageView } from './matomo';

export function MatomoPageTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    initMatomo();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
