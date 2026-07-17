import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
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
  GEOLOCATION_DOUBLE_TAP_DELAY_MS,
  GEOPORTAIL_LAYERS,
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
    lockUserLocationOnMap,
    isLocating,
    isLockedUserLocation,
    isMapReady,
    userFollowingMode,
  } = useMap();
  const [activeBasemap, setActiveBasemap] = useState<string>(GEOPORTAIL_LAYERS.PLAN_IGN);
  const [geoservicesVisible, setGeoservicesVisible] = useState(true);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState(false);
  const [layersPanelFocus, setLayersPanelFocus] = useState<MapLayerGroupId | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [sheetHeight, setSheetHeight] = useState(88);
  const [fabSheetOffset, setFabSheetOffset] = useState(88);
  const [isTabbarHiddenByPoint, setIsTabbarHiddenByPoint] = useState(false);
  const [isTabbarHiddenByFilters, setIsTabbarHiddenByFilters] = useState(false);
  const isTabbarVisible = !isTabbarHiddenByPoint && !isTabbarHiddenByFilters;

  useEffect(() => {
    const tabbarHeight = isTabbarVisible ? '5.5rem' : '0px';
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
  const geolocationLastTapRef = useRef(0);
  const geolocationTapTimeoutRef = useRef<number | null>(null);

  useUserLocationMarker({ map, isMapReady });
  useMapClickSelectionMarker({ map, isMapReady, pendingAction: mapClick.pendingAction });

  const handleReportMapSelect = useCallback(
    (report: GroupReport) => {
      if (report.longitude === null || report.latitude === null) {
        return;
      }

      void focusOnCoordinate(report.longitude, report.latitude);
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

  const handleGeolocationButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    const now = event.timeStamp;

    void Gdp_Geolocation.ensurePermissions();

    if (
      geolocationTapTimeoutRef.current !== null &&
      now - geolocationLastTapRef.current <= GEOLOCATION_DOUBLE_TAP_DELAY_MS
    ) {
      window.clearTimeout(geolocationTapTimeoutRef.current);
      geolocationTapTimeoutRef.current = null;
      lockUserLocationOnMap();
      return;
    }

    geolocationLastTapRef.current = now;
    geolocationTapTimeoutRef.current = window.setTimeout(() => {
      geolocationTapTimeoutRef.current = null;
      void centerOnUserLocation();
    }, GEOLOCATION_DOUBLE_TAP_DELAY_MS);
  };

  useEffect(() => {
    if (!isMapReady || !isMapFocusReportState(location.state)) {
      return;
    }

    const { focusReport } = location.state;
    if (!focusReport) {
      return;
    }

    void focusOnCoordinate(focusReport.longitude, focusReport.latitude);
    navigate('/map', { replace: true, state: null });
  }, [focusOnCoordinate, isMapReady, location.state, navigate]);

  useEffect(() => {
    return () => {
      if (geolocationTapTimeoutRef.current !== null) {
        window.clearTimeout(geolocationTapTimeoutRef.current);
      }
    };
  }, []);

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

  const handleOpenLayers = () => {
    mapClick.closeActionSheet();
    setLayersPanelFocus(null);
    setIsLayersPanelOpen((current) => !current);
  };

  const handleOpenFilters = () => {
    mapClick.closeActionSheet();
    setLayersPanelFocus('geodesy-filters');
    setIsLayersPanelOpen(true);
  };

  const handleOpenLegend = () => {
    mapClick.closeActionSheet();
    setIsLegendOpen(true);
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
        ['--map-tabbar-height' as string]: isTabbarVisible ? '5.5rem' : '0px',
      }}
    >
      <LeftMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        user={user}
        isAuthenticated={isAuthenticated}
        onNavigate={handleMenuNavigate}
      />

      <div id="main-content" className={styles.mapContainer}>
        <div ref={mapElementRef} className={styles.mapTarget} />

        <div className={styles.mapOverlays}>
          <button
            type="button"
            className={styles.mapFab}
            style={{ top: 'max(0.75rem, var(--safe-top))', left: '1rem' }}
            onClick={() => setIsMenuOpen(true)}
            aria-label="Menu"
          >
            <IconBurger className={styles.mapFabIcon} aria-hidden />
          </button>

          <div className={styles.mapFabStack}>
            {showExpertFiltersButton ? (
              <button
                type="button"
                className={`${styles.mapFab} ${isTabbarHiddenByFilters || hasActiveFilters ? styles.mapFabActive : ''}`}
                aria-label="Filtres d'affichage des repères"
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
              className={styles.mapFab}
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
            className={`${styles.mapFab} ${styles.geolocationFab} ${isLockedUserLocation ? styles.mapFabActive : ''}`}
            aria-label={
              isLockedUserLocation
                ? 'Désactiver le verrouillage de position'
                : 'Centrer sur ma position (double-tap pour verrouiller)'
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
            onClosePoint={mapClick.closeActionSheet}
            onReportPoint={handleReportPoint}
            onFocusCoordinate={handleFocusCoordinate}
            onSheetHeightChange={setSheetHeight}
            onFabSheetOffsetChange={setFabSheetOffset}
            onTabbarVisibleChange={(visible) => setIsTabbarHiddenByPoint(!visible)}
            hideBrowseSheet={isTabbarHiddenByFilters}
            collapseBrowseSearch={isLayersPanelOpen || isTabbarHiddenByFilters}
          />

          {isTabbarVisible ? <BottomTabbar activeTab="carte" /> : null}
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
