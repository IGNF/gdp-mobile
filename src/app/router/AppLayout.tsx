import { Outlet } from 'react-router-dom';

import { MatomoPageTracker } from '@/infra/analytics/MatomoPageTracker';

/** Layout racine du routeur : suivi Matomo des pages + rendu de la route active. */
export function AppLayout() {
  return (
    <>
      <MatomoPageTracker />
      <Outlet />
    </>
  );
}
