import { Outlet } from 'react-router-dom';

import { NotConnectedFlash } from '@/features/auth/components/NotConnectedFlash';
import { MatomoPageTracker } from '@/infra/analytics/MatomoPageTracker';

/** Layout racine du routeur : suivi Matomo des pages, message « non connecté » + rendu de la route active. */
export function AppLayout() {
  return (
    <>
      <MatomoPageTracker />
      <NotConnectedFlash />
      <Outlet />
    </>
  );
}
