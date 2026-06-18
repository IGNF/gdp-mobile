import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { defaultGeodesyLayerVisibility, isGeodesyLayerReportingEnabled } from '@ign/gdp-tools';
import { GeodesyPointDetails, GeodesyPointTitle, useGeodesyOnMap, useGeodesyWfsLoading } from '@ign/gdp-tools/react';

import { BottomTabbar, type MapTabId } from '@/app/components/BottomTabbar';
import { LeftMenu, isLeftMenuOverlayRoute, type LeftMenuOverlayRoute } from '@/app/components/LeftMenu';
import { AboutPage } from '@/features/about/pages/AboutPage';
import { LogoutPage } from '@/features/auth/pages/Logout';
import { MyAccountPage } from '@/features/auth/pages/MyAccount';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { HelpPage } from '@/features/help/pages/HelpPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { SearchPanel } from '@/features/search/components/SearchPanel';
import { MapLayersPanelFlow } from '@/features/map/components/MapLayersPanelFlow';
import { countActiveMapGeodesyFilters } from '@/features/map/components/MapGeodesyFiltersPanel';
import type { MapLayerGroupId } from '@/features/map/types/mapLayerGroups';
import { useMap } from '@/features/map/hooks/useMap';
import { useMapGeodesyClick } from '@/features/map/hooks/useMapGeodesyClick';
import { useMapClickSelectionMarker } from '@/features/map/hooks/useMapClickSelectionMarker';
import { usePersistedMapLayers } from '@/features/map/hooks/usePersistedMapLayers';
import { useUserLocationMarker } from '@/features/map/hooks/useUserLocationMarker';
import { Gdp_Geolocation } from '@/platform/device/geolocation';
import { Loading } from '@/shared/ui/Loading';
import { ActionSheet } from '@/shared/ui/ActionSheet';
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
  getGeoportailLayerGroup,
  setActiveGeoportailLayer,
} from '@/infra/map/openlayers/geoportailLayers';

import IconGeolocation from '@/shared/assets/icons/icon-geolocation.svg?react';
import IconFilter from '@/shared/assets/icons/icon-filter.svg?react';
import IconBurger from '@/shared/assets/icons/icon-burger.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<LeftMenuOverlayRoute | null>(null);
  const [geodesyMode, setGeodesyMode] = useState<GdpGeodesyMode>(GDP_GEODESY_DEFAULT_MODE);
  const [wfsClusterPreferences, setWfsClusterPreferences] = useState<GdpWfsClusterPreferences>(
    DEFAULT_GDP_WFS_CLUSTER_PREFERENCES,
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
    onBasemapChange: setActiveBasemap,
    onGeodesyModeChange: setGeodesyMode,
    onGeodesyVisibilityChange: geodesy.setVisibility,
    onGeodesyWfsAttributeFilterValuesChange: geodesy.setWfsAttributeFilterValues,
    onWfsClusterPreferencesChange: setWfsClusterPreferences,
  });
  const mapClick = useMapGeodesyClick(map, {
    isMapReady,
    enabled: !isSearchOpen,
    attributeCatalog: geodesy.catalog.attributes,
    pictoUrlMaps: geodesy.catalog.wfsPictoUrlMaps,
  });
  const geolocationLastTapRef = useRef(0);
  const geolocationTapTimeoutRef = useRef<number | null>(null);

  useUserLocationMarker({ map, isMapReady });
  useMapClickSelectionMarker({ map, isMapReady, pendingAction: mapClick.pendingAction });

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
    if (!map || !isSearchOpen) {
      return;
    }

    const handleMapClick = () => {
      setIsSearchOpen(false);
    };

    map.on('singleclick', handleMapClick);
    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [isSearchOpen, map]);

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

  const handleSearchClick = () => {
    mapClick.closeActionSheet();
    setIsLayersPanelOpen(false);
    setLayersPanelFocus(null);
    setIsSearchOpen((current) => !current);
  };

  const handleTabClick = (tab: MapTabId) => {
    mapClick.closeActionSheet();
    setIsSearchOpen(false);

    if (tab === 'couches') {
      setLayersPanelFocus(null);
      setIsLayersPanelOpen((current) => !current);
    }
  };

  const handleOpenFilters = () => {
    mapClick.closeActionSheet();
    setIsSearchOpen(false);
    setLayersPanelFocus('geodesy-filters');
    setIsLayersPanelOpen(true);
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

  const hasActiveFilters =
    geodesyMode === 'expert' &&
    countActiveMapGeodesyFilters(
      geodesy.catalog.wfsAttributeFilters,
      geodesy.wfsAttributeFilterValues,
    ) > 0;

  const showExpertFiltersButton = geodesyMode === 'expert';

  return (
    <div className={styles.mapPage}>
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
          <div className={styles.mapTopBar}>
            <button
              type="button"
              className={styles.menuButton}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Menu"
            >
              <IconBurger className={styles.menuIcon} aria-hidden />
            </button>
            <button
              type="button"
              className={`${styles.searchButton} ${isSearchOpen ? styles.searchButtonActive : ''}`}
              onClick={handleSearchClick}
              aria-label="Rechercher"
              aria-pressed={isSearchOpen}
            >
              <IconSearch className={styles.searchIcon} aria-hidden />
            </button>
          </div>

          <SearchPanel
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            map={map}
          />

          {!isMapReady && (
            <div className={styles.loadingOverlay}>
              <Loading label="Chargement de la carte…" />
            </div>
          )}

          {isMapReady && GDP_GEODESY_SHOW_WFS_LOADING_INDICATOR && geodesyWfsLoading.isLoading && (
            <div className={styles.wfsLoadingBadge} aria-live="polite">
              <Loading size="small" />
              <span>
                Chargement des repères…{' '}
                {(geodesyWfsLoading.elapsedMs / 1000).toFixed(1).replace('.', ',')} s
              </span>
            </div>
          )}

          {showExpertFiltersButton && (
            <button
              type="button"
              className={`${styles.filterButton} ${hasActiveFilters ? styles.filterButtonActive : ''}`}
              aria-label="Filtres d'affichage des repères"
              disabled={!isMapReady}
              onClick={handleOpenFilters}
            >
              <IconFilter className={styles.filterIcon} aria-hidden />
            </button>
          )}

          <button
            type="button"
            className={`${styles.geolocationButton} ${isLockedUserLocation ? styles.locked : ''}`}
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
      </div>

      <p className={styles.mapHint}>
        Touchez un repère géodésique pour consulter sa fiche.
        {' '}
        Fond Géoportail
        {geodesy.activeLabels.length > 0 ? (
          <>
            {' '}
            + géodésie
            {geodesyMode === 'expert' ? ' (expert)' : ' (public)'}
            {' '}
            : <strong>{geodesy.activeLabels.join(', ')}</strong>
          </>
        ) : (
          <> — aucune couche géodésie active</>
        )}
      </p>

      <BottomTabbar
        activeTab={isLayersPanelOpen ? 'couches' : null}
        onTabClick={handleTabClick}
      />

      <MapLayersPanelFlow
        isOpen={isLayersPanelOpen}
        onClose={handleCloseLayersPanel}
        focusGroupId={layersPanelFocus}
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
      />

      <ActionSheet
        isOpen={pendingAction !== null}
        onClose={mapClick.closeActionSheet}
        title={
          pendingAction ? (
            <GeodesyPointTitle
              title={pendingAction.point.title}
              picto={pendingAction.point.titlePicto}
            />
          ) : (
            'Repère géodésique'
          )
        }
        buttons={
          isGeodesyReportable
            ? [
                {
                  label: 'Faire un signalement sur ce point',
                  onClick: mapClick.reportOnExistingPoint,
                },
                { label: 'Fermer', onClick: mapClick.closeActionSheet },
              ]
            : [{ label: 'Fermer', onClick: mapClick.closeActionSheet }]
        }
      >
        {pendingAction && (
          <GeodesyPointDetails
            layerTitle={pendingAction.point.layerTitle}
            longitude={pendingAction.point.longitude}
            latitude={pendingAction.point.latitude}
            attributes={pendingAction.point.attributes}
          />
        )}
      </ActionSheet>

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
