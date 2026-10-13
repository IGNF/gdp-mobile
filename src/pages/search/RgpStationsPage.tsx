import { useNavigate } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import { RgpStationsList } from '@/features/map/components/RgpStationsList';
import { useNearestRgpStations } from '@/features/map/hooks/useNearestRgpStations';
import { useMapOutletContext } from '@/pages/map/mapOutletContext';
import { PageHeader } from '@/shared/ui/PageHeader';
import { joinCSSClassNames } from '@/shared/utils/join';
import layout from '@/shared/styles/tabPage.module.css';

export function RgpStationsPage() {
  const navigate = useNavigate();
  const { map, isMapReady, onSelectRgpStation } = useMapOutletContext();
  const {
    stations,
    isLoading,
    isReloading,
    lastLoadedAt,
    error,
    reloadFromServer,
  } = useNearestRgpStations({ map, isMapReady });

  return (
    <div className={joinCSSClassNames(layout.page, layout.pageOverlay)}>
      <PageHeader
        title="Stations RGP"
        className={layout.pageHeader}
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/map/search')}
      />

      <main className={layout.main}>
        <RgpStationsList
          stations={stations}
          isLoading={isLoading}
          isReloading={isReloading}
          lastLoadedAt={lastLoadedAt}
          error={error}
          onRefresh={() => {
            void reloadFromServer();
          }}
          onSelectStation={onSelectRgpStation}
        />
      </main>

      <div className={layout.tabbarBand}>
        <BottomTabbar activeTab="recherche" />
      </div>
    </div>
  );
}
