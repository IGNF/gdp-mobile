import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { defaultGeodesyLayerVisibility, isGeodesyLayerReportingEnabled } from '@ign/gdp-tools';
import { useGeodesyOnMap, useGeodesyWfsLoading } from '@ign/gdp-tools/react';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import { LeftMenu, isLeftMenuOverlayRoute, type LeftMenuOverlayRoute } from '@/app/components/LeftMenu';
import { AboutPage } from '@/features/about/pages/AboutPage';
import { LogoutPage } from '@/features/auth/pages/Logout';
import { MyAccountPage } from '@/features/auth/pages/MyAccount';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HelpPage } from '@/features/help/pages/HelpPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { LegendPage } from '@/features/legend/pages/LegendPage';
import { MapBottomSheet } from '@/features/map/components/MapBottomSheet';
import { MapLayersPanelFlow } from '@/features/map/components/MapLayersPanelFlow';
import { countActiveMapGeodesyFilters } from '@/features/map/components/MapGeodesyFiltersPanel';
import type { MapLayerGroupId } from '@/features/map/types/mapLayerGroups';
import type { GroupReport } from '@/domain/report/groupReportModels';
import { useMap } from '@/features/map/hooks/useMap';
import { useMapGeodesyClick } from '@/features/map/hooks/useMapGeodesyClick';
import { useMapClickSelectionMarker } from '@/features/map/hooks/useMapClickSelectionMarker';
import { usePersistedMapLayers } from '@/features/map/hooks/usePersistedMapLayers';
import { useReportMapLayers } from '@/features/map/hooks/useReportMapLayers';
import { useUserLocationMarker } from '@/features/map/hooks/useUserLocationMarker';
import { Gdp_Geolocation } from '@/platform/device/geolocation';
import { Loading } from '@/shared/ui/Loading';
import {
  GEOPORTAIL_LAYERS,
  GROUP_REPORT_MAP_FOCUS_ZOOM,
} from '@/shared/constants/map';
import {
  createGdpGeodesyCatalog,
  DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
  GDP_GEODESY_DEFAULT_MODE,
  GDP_GEODESY_SHOW_WFS_LOADING_INDICATOR,
  getGdpGeodesyDefaultActive,
  getGdpGeodesyDefaultWfsAttributeFilterValues,
  type GdpGeodesyMode,
  type GdpWfsClusterPreferences,
} from '@/shared/constants/geodesy';
import {
  DEFAULT_REPORT_MAP_LAYER_VISIBILITY,
  type ReportMapLayerVisibility,
} from '@/shared/constants/reportMapLayers';
import {
  getGeoportailLayerGroup,
  setActiveGeoportailLayer,
} from '@/infra/map/openlayers/geoportailLayers';

import IconGeolocation from '@/shared/assets/icons/icon-geolocation.svg?react';
import IconFilter from '@/shared/assets/icons/icon-filter.svg?react';
import IconBurger from '@/shared/assets/icons/icon-burger.svg?react';
import IconLayers from '@/shared/assets/icons/icon-layers.svg?react';
import IconLegend from '@/shared/assets/icons/icon-legend.svg?react';

import styles from './MapPage.module.css';

interface MapFocusReportState {
  focusReport?: {
    id: number;
    longitude: number;
    latitude: number;
  };
}

function isMapFocusReportState(value: unknown): value is MapFocusReportState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as MapFocusReportState;
  const focus = candidate.focusReport;
  if (!focus) {
    return false;
  }

  return (
    typeof focus.id === 'number' &&
    typeof focus.longitude === 'number' &&
    typeof focus.latitude === 'number'
  );
}

export function MapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const {
    mapElementRef,
    map,
    centerOnUserLocation,
    focusOnCoordinate,
    isLocating,
    isMapReady,
    userFollowingMode,
    setUserFollowingMode,
  } = useMap();
  const [activeBasemap, setActiveBasemap] = useState<string>(GEOPORTAIL_LAYERS.PLAN_IGN);
  const [geoservicesVisible, setGeoservicesVisible] = useState(true);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [layersPanelFocus, setLayersPanelFocus] = useState<MapLayerGroupId | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [fabSheetOffset, setFabSheetOffset] = useState(0);
  const [isTabbarHiddenByPoint, setIsTabbarHiddenByPoint] = useState(false);
  const [isTabbarHiddenByFilters, setIsTabbarHiddenByFilters] = useState(false);
  const [forceExpandSearch, setForceExpandSearch] = useState(false);
  const [forceCloseSearch, setForceCloseSearch] = useState(false);
  const [forceExpandReports, setForceExpandReports] = useState(false);
  const [forceCloseReports, setForceCloseReports] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [isReportsPanelOpen, setIsReportsPanelOpen] = useState(false);
  // La tabbar reste visible avec le panneau filtres (comme couches / légende).
  const isTabbarVisible = !isTabbarHiddenByPoint;

  useEffect(() => {
    const tabbarHeight = isTabbarVisible ? '6.5rem' : '0px';
    document.documentElement.style.setProperty('--map-tabbar-height', tabbarHeight);

    return () => {
      document.documentElement.style.removeProperty('--map-tabbar-height');
    };
  }, [isTabbarVisible]);
  const [activeOverlay, setActiveOverlay] = useState<LeftMenuOverlayRoute | null>(null);
  const [geodesyMode, setGeodesyMode] = useState<GdpGeodesyMode>(GDP_GEODESY_DEFAULT_MODE);
  const [wfsClusterPreferences, setWfsClusterPreferences] = useState<GdpWfsClusterPreferences>(
    DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
  );
  const [reportMapLayers, setReportMapLayers] = useState<ReportMapLayerVisibility>(
    DEFAULT_REPORT_MAP_LAYER_VISIBILITY,
  );
  const geodesyCatalog = useMemo(
    () => createGdpGeodesyCatalog(geodesyMode, wfsClusterPreferences),
    [geodesyMode, wfsClusterPreferences],
  );
  const geodesyDefaultActive = useMemo(() => getGdpGeodesyDefaultActive(geodesyMode), [geodesyMode]);
  const geodesy = useGeodesyOnMap(map, {
    catalog: geodesyCatalog,
    initialActive: [...geodesyDefaultActive],
    initialWfsAttributeFilterValues: getGdpGeodesyDefaultWfsAttributeFilterValues(geodesyMode),
    popup: false,
  });
  const geodesyWfsLoading = useGeodesyWfsLoading(map, {
    catalog: geodesy.catalog,
    visibility: geodesy.visibility,
    showIndicator: GDP_GEODESY_SHOW_WFS_LOADING_INDICATOR,
  });
  const handleGeodesyModeChange = useCallback(
    (mode: GdpGeodesyMode) => {
      const nextCatalog = createGdpGeodesyCatalog(mode, wfsClusterPreferences);
      const nextActive = getGdpGeodesyDefaultActive(mode);
      setGeodesyMode(mode);
      geodesy.setVisibility(defaultGeodesyLayerVisibility([...nextActive], nextCatalog));
      geodesy.setWfsAttributeFilterValues(getGdpGeodesyDefaultWfsAttributeFilterValues(mode));
    },
    [geodesy.setVisibility, geodesy.setWfsAttributeFilterValues, wfsClusterPreferences],
  );
  const { isHydrated: areMapLayersHydrated } = usePersistedMapLayers({
    isMapReady,
    activeBasemap,
    geodesyMode,
    geodesyVisibility: geodesy.visibility,
    geodesyWfsAttributeFilterValues: geodesy.wfsAttributeFilterValues,
    wfsClusterPreferences,
    reportMapLayers,
    onBasemapChange: setActiveBasemap,
    onGeodesyModeChange: setGeodesyMode,
    onGeodesyVisibilityChange: geodesy.setVisibility,
    onGeodesyWfsAttributeFilterValuesChange: geodesy.setWfsAttributeFilterValues,
    onWfsClusterPreferencesChange: setWfsClusterPreferences,
    onReportMapLayersChange: setReportMapLayers,
  });
  const mapClick = useMapGeodesyClick(map, {
    isMapReady,
    enabled: true,
    attributeCatalog: geodesy.catalog.attributes,
    pictoUrlMaps: geodesy.catalog.wfsPictoUrlMaps,
  });

  useUserLocationMarker({ map, isMapReady });
  useMapClickSelectionMarker({ map, isMapReady, pendingAction: mapClick.pendingAction });

  const handleReportMapSelect = useCallback(
    (report: GroupReport) => {
      if (report.longitude === null || report.latitude === null) {
        return;
      }

      void focusOnCoordinate(report.longitude, report.latitude, GROUP_REPORT_MAP_FOCUS_ZOOM);
    },
    [focusOnCoordinate],
  );

  useReportMapLayers({
    map,
    isMapReady,
    isAuthenticated,
    userId: user?.id,
    visibility: reportMapLayers,
    onReportSelect: handleReportMapSelect,
  });

  // Fermer couches / filtres / légende au clic carte (comme recherche & signalements).
  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    const handleMapClick = () => {
      setIsLayersPanelOpen(false);
      setLayersPanelFocus(null);
      setIsLegendOpen(false);
    };

    map.on('singleclick', handleMapClick);
    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [isMapReady, map]);

  const handleGeolocationButtonClick = () => {
    void Gdp_Geolocation.ensurePermissions();

    // Cycle à 3 clics : none → following → locked → none
    if (userFollowingMode === 'none') {
      // Clic 1 : centrer et activer le suivi (sans recentrage automatique)
      void centerOnUserLocation();
      setUserFollowingMode('following');
    } else if (userFollowingMode === 'following') {
      // Clic 2 : activer le verrouillage (recentrage périodique automatique)
      setUserFollowingMode('locked');
    } else {
      // Clic 3 : désactiver
      setUserFollowingMode('none');
    }
  };

  useEffect(() => {
    if (!isMapReady || !isMapFocusReportState(location.state)) {
      return;
    }

    const { focusReport } = location.state;
    if (!focusReport) {
      return;
    }

    void focusOnCoordinate(focusReport.longitude, focusReport.latitude, GROUP_REPORT_MAP_FOCUS_ZOOM);
    navigate('/map', { replace: true, state: null });
  }, [focusOnCoordinate, isMapReady, location.state, navigate]);

  useEffect(() => {
    if (location.state?.openSearch) {
      setIsLayersPanelOpen(false);
      setIsLegendOpen(false);
      setForceExpandSearch(true);
      navigate('/map', { replace: true, state: null });
      setTimeout(() => setForceExpandSearch(false), 100);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (location.state?.openReports) {
      setIsLayersPanelOpen(false);
      setIsLegendOpen(false);
      setForceExpandReports(true);
      navigate('/map', { replace: true, state: null });
      setTimeout(() => setForceExpandReports(false), 100);
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (!map) {
      return;
    }

    const group = getGeoportailLayerGroup(map);
    if (!group) {
      return;
    }

    group.setVisible(geoservicesVisible);
    if (geoservicesVisible) {
      setActiveGeoportailLayer(group, activeBasemap);
    }
  }, [activeBasemap, geoservicesVisible, map]);

  const pendingAction = mapClick.pendingAction;
  const isGeodesyReportable =
    pendingAction !== null &&
    isGeodesyLayerReportingEnabled(geodesy.catalog, pendingAction.reportContext.layerId);

  const closeBrowsePanels = useCallback(() => {
    setForceCloseSearch(true);
    setForceCloseReports(true);
    window.setTimeout(() => {
      setForceCloseSearch(false);
      setForceCloseReports(false);
    }, 100);
  }, []);

  const handleOpenMenu = useCallback(() => {
    mapClick.closeActionSheet();
    setIsLayersPanelOpen(false);
    setLayersPanelFocus(null);
    setIsLegendOpen(false);
    setActiveOverlay(null);
    closeBrowsePanels();
    setIsMenuOpen(true);
  }, [closeBrowsePanels, mapClick]);

  const handleOpenLayers = () => {
    mapClick.closeActionSheet();
    setIsLegendOpen(false);

    // Filtres ouverts via le même flow : basculer vers la liste des couches
    // au lieu de fermer le panneau (isLayersPanelOpen est déjà true).
    if (isLayersPanelOpen && layersPanelFocus === 'geodesy-filters') {
      setLayersPanelFocus(null);
      return;
    }

    setLayersPanelFocus(null);
    setIsLayersPanelOpen((current) => !current);
    if (!isLayersPanelOpen) {
      closeBrowsePanels();
    }
  };

  const handleOpenFilters = () => {
    mapClick.closeActionSheet();
    setIsLegendOpen(false);
    setLayersPanelFocus('geodesy-filters');
    setIsLayersPanelOpen(true);
    closeBrowsePanels();
  };

  const handleOpenLegend = () => {
    mapClick.closeActionSheet();
    closeBrowsePanels();

    // Depuis filtres/couches : fermer le flow et ouvrir la légende (pas un toggle).
    if (isLayersPanelOpen) {
      setIsLayersPanelOpen(false);
      setLayersPanelFocus(null);
      setIsLegendOpen(true);
      return;
    }

    setIsLegendOpen((current) => !current);
  };

  const handleCloseLayersPanel = () => {
    setIsLayersPanelOpen(false);
    setLayersPanelFocus(null);
  };

  const handleMenuNavigate = (route: string) => {
    if (isLeftMenuOverlayRoute(route)) {
      setActiveOverlay(route);
      return;
    }

    navigate(route);
  };

  const handleFocusCoordinate = useCallback(
    (longitude: number, latitude: number) => {
      void focusOnCoordinate(longitude, latitude);
    },
    [focusOnCoordinate],
  );

  const handleReportPoint = useCallback(() => {
    if (!isGeodesyReportable) {
      return;
    }

    mapClick.reportOnExistingPoint();
  }, [isGeodesyReportable, mapClick]);

  const handleCloseSearch = useCallback(() => {
    setForceCloseSearch(true);
    setTimeout(() => setForceCloseSearch(false), 100);
  }, []);

  const handleCloseReports = useCallback(() => {
    setForceCloseReports(true);
    setTimeout(() => setForceCloseReports(false), 100);
  }, []);

  const hasActiveFilters =
    geodesyMode === 'expert' &&
    countActiveMapGeodesyFilters(
      geodesy.catalog.wfsAttributeFilters,
      geodesy.wfsAttributeFilterValues,
    ) > 0;

  const showExpertFiltersButton = geodesyMode === 'expert';

  return (
    <div
      className={styles.mapPage}
      style={{
        ['--map-sheet-height' as string]: `${sheetHeight}px`,
        ['--map-fab-sheet-offset' as string]: `${fabSheetOffset}px`,
        ['--map-tabbar-height' as string]: isTabbarVisible ? '6.5rem' : '0px',
      }}
    >
      <LeftMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        onNavigate={handleMenuNavigate}
      />

      <div className={styles.mapContainer}>
        <div ref={mapElementRef} className={styles.mapTarget} />

        <div className={styles.mapOverlays}>
          <button
            type="button"
            className={styles.mapFab}
            style={{ top: 'max(0.75rem, var(--safe-top))', left: '1rem' }}
            onClick={handleOpenMenu}
            aria-label="Menu"
          >
            <IconBurger className={styles.mapFabIcon} aria-hidden />
          </button>

          <div className={styles.mapFabStack}>
            {showExpertFiltersButton ? (
              <button
                type="button"
                className={`${styles.mapFab} ${isTabbarHiddenByFilters || hasActiveFilters ? styles.mapFabActive : ''}`}
                aria-label="Filtres d'affichage des points"
                disabled={!isMapReady}
                onClick={handleOpenFilters}
              >
                <IconFilter className={styles.mapFabIcon} aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              className={`${styles.mapFab} ${isLayersPanelOpen && !isTabbarHiddenByFilters ? styles.mapFabActive : ''}`}
              aria-label="Couches"
              disabled={!isMapReady}
              onClick={handleOpenLayers}
            >
              <IconLayers className={styles.mapFabIcon} aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.mapFab} ${isLegendOpen ? styles.mapFabActive : ''}`}
              aria-label="Légende"
              onClick={handleOpenLegend}
            >
              <IconLegend className={styles.mapFabIcon} aria-hidden />
            </button>
          </div>

          {!isMapReady && (
            <div className={styles.loadingOverlay}>
              <Loading label="Chargement de la carte…" />
            </div>
          )}

          {isMapReady && GDP_GEODESY_SHOW_WFS_LOADING_INDICATOR && geodesyWfsLoading.isLoading && (
            <div className={styles.wfsLoadingBadge} aria-live="polite">
              <Loading size="small" />
              <span>
                Chargement des points…{' '}
                {(geodesyWfsLoading.elapsedMs / 1000).toFixed(1).replace('.', ',')} s
              </span>
            </div>
          )}

          <button
            type="button"
            className={[
              styles.mapFab,
              styles.geolocationFab,
              userFollowingMode === 'locked' ? styles.mapFabLocked : '',
              userFollowingMode === 'following' ? styles.mapFabActive : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-label={
              userFollowingMode === 'locked'
                ? 'Géolocalisation verrouillée avec recentrage (clic pour désactiver)'
                : userFollowingMode === 'following'
                  ? 'Suivi de position actif (clic pour verrouiller avec recentrage)'
                  : 'Activer la géolocalisation'
            }
            disabled={!isMapReady || (isLocating && userFollowingMode === 'none')}
            onClick={handleGeolocationButtonClick}
          >
            {isLocating ? (
              <Loading size="small" className={styles.geolocationLoading} />
            ) : (
              <IconGeolocation className={styles.geolocationIcon} aria-hidden />
            )}
          </button>
        </div>

        <div className={styles.mapChrome}>
          <MapBottomSheet
            map={map}
            isMapReady={isMapReady}
            selectedPoint={pendingAction}
            canReportPoint={isGeodesyReportable}
            userFollowingMode={userFollowingMode}
            onClosePoint={mapClick.closeActionSheet}
            onReportPoint={handleReportPoint}
            onFocusCoordinate={handleFocusCoordinate}
            onSheetHeightChange={setSheetHeight}
            onFabSheetOffsetChange={setFabSheetOffset}
            onTabbarVisibleChange={(visible) => setIsTabbarHiddenByPoint(!visible)}
            hideBrowseSheet={isTabbarHiddenByFilters}
            collapseBrowseSearch={isLayersPanelOpen || isTabbarHiddenByFilters}
            forceExpandSearch={forceExpandSearch}
            forceCloseSearch={forceCloseSearch}
            forceExpandReports={forceExpandReports}
            forceCloseReports={forceCloseReports}
            onSearchPanelStateChange={setIsSearchPanelOpen}
            onReportsPanelStateChange={setIsReportsPanelOpen}
          />

          {isTabbarVisible ? (
            <BottomTabbar
              activeTab={isSearchPanelOpen ? 'recherche' : isReportsPanelOpen ? 'signalements' : 'carte'}
              onCloseSearch={handleCloseSearch}
              onCloseReports={handleCloseReports}
              onTabClick={(tab) => {
                setIsLayersPanelOpen(false);
                setIsLegendOpen(false);
                if (tab === 'recherche') {
                  setForceExpandSearch(true);
                  window.setTimeout(() => setForceExpandSearch(false), 100);
                } else if (tab === 'signalements') {
                  setForceExpandReports(true);
                  window.setTimeout(() => setForceExpandReports(false), 100);
                }
              }}
            />
          ) : null}
        </div>
      </div>

      <MapLayersPanelFlow
        isOpen={isLayersPanelOpen}
        onClose={handleCloseLayersPanel}
        focusGroupId={layersPanelFocus}
        map={map}
        activeBasemap={activeBasemap}
        onActiveBasemapChange={setActiveBasemap}
        geoservicesVisible={geoservicesVisible}
        onGeoservicesVisibleChange={setGeoservicesVisible}
        geodesyMode={geodesyMode}
        geodesyVisibility={geodesy.visibility}
        onGeodesyVisibilityChange={geodesy.setVisibility}
        onGeodesyToggle={geodesy.toggleLayer}
        geodesyUiLayers={[
          ...geodesy.uiLayers,
          ...geodesy.uiWfsLayers,
          ...geodesy.uiAnnexLayers,
        ]}
        geodesyCatalog={geodesy.catalog}
        geodesyDefaultActive={geodesyDefaultActive}
        geodesyWfsAttributeFilterValues={geodesy.wfsAttributeFilterValues}
        onGeodesyWfsAttributeFilterValuesChange={geodesy.setWfsAttributeFilterValues}
        onClearGeodesyWfsAttributeFilterValues={geodesy.clearWfsAttributeFilterValues}
        reportMapLayers={reportMapLayers}
        onReportMapLayersChange={setReportMapLayers}
        isAuthenticated={isAuthenticated}
        onFiltersPanelOpenChange={setIsTabbarHiddenByFilters}
      />

      <LegendPage isOpen={isLegendOpen} onClose={() => setIsLegendOpen(false)} />

      <MyAccountPage
        isOpen={activeOverlay === '/my-account'}
        onClose={() => setActiveOverlay(null)}
      />
      <LogoutPage
        isOpen={activeOverlay === '/logout'}
        onClose={() => setActiveOverlay(null)}
        onLogout={logout}
      />
      <SettingsPage
        isOpen={activeOverlay === '/settings'}
        onClose={() => setActiveOverlay(null)}
        geodesyMode={geodesyMode}
        onGeodesyModeChange={handleGeodesyModeChange}
        wfsClusterEnabled={wfsClusterPreferences.enabled}
        onWfsClusterEnabledChange={(enabled) =>
          setWfsClusterPreferences((current) => ({ ...current, enabled }))
        }
        wfsClusterDistance={wfsClusterPreferences.distance}
        onWfsClusterDistanceChange={(distance) =>
          setWfsClusterPreferences((current) => ({ ...current, distance }))
        }
        areMapPreferencesHydrated={areMapLayersHydrated}
      />
      <HelpPage isOpen={activeOverlay === '/help'} onClose={() => setActiveOverlay(null)} />
      <AboutPage isOpen={activeOverlay === '/about'} onClose={() => setActiveOverlay(null)} />
    </div>
  );
}
