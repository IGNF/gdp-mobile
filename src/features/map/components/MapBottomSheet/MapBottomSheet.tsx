import type Map from 'ol/Map';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toLonLat } from 'ol/proj';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';
import { useNearestRgpStations } from '@/features/map/hooks/useNearestRgpStations';
import { useAddressSearchHistory } from '@/features/search/hooks/useAddressSearchHistory';
import { useSearchGeoportail } from '@/features/search/hooks/useSearchGeoportail';

import { BrowseRgpStationsList } from './BrowseRgpStationsList';
import { BrowseSearchHome } from './BrowseSearchHome';
import { MapPointSheet } from './pointFiche/MapPointSheet';
import styles from './MapBottomSheet.module.css';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';

type BrowsePanelView = 'search' | 'rgp';

function getBrowseSnapHeights(viewportHeight: number): readonly number[] {
  return [88, Math.min(Math.round(viewportHeight * 0.58), 560)];
}

function getPointSnapHeights(viewportHeight: number): readonly number[] {
  return [
    220,
    Math.round(viewportHeight * 0.48),
    Math.round(viewportHeight * 0.68),
    Math.min(Math.round(viewportHeight * 0.82), 720),
  ];
}

export interface MapBottomSheetProps {
  map: Map | null;
  isMapReady: boolean;
  selectedPoint: MapGeodesyClickAction | null;
  canReportPoint: boolean;
  onClosePoint: () => void;
  onReportPoint: () => void;
  onFocusCoordinate: (longitude: number, latitude: number) => void;
  onSheetHeightChange?: (height: number) => void;
  /** Offset carte pour GPS / échelle — suit la hauteur de la sheet, 0 quand elle est en mini-fiche. */
  onFabSheetOffsetChange?: (offset: number) => void;
  onTabbarVisibleChange?: (visible: boolean) => void;
  hideBrowseSheet?: boolean;
  /** Replie la recherche (snap 0) quand un panneau latéral (couches, filtres) s’ouvre. */
  collapseBrowseSearch?: boolean;
}

export function MapBottomSheet({
  map,
  isMapReady,
  selectedPoint,
  canReportPoint,
  onClosePoint,
  onReportPoint,
  onFocusCoordinate,
  onSheetHeightChange,
  onFabSheetOffsetChange,
  onTabbarVisibleChange,
  hideBrowseSheet = false,
  collapseBrowseSearch = false,
}: MapBottomSheetProps) {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const browseSnapIndexRef = useRef(0);
  const isPointMode = selectedPoint !== null;
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [browseView, setBrowseView] = useState<BrowsePanelView>('search');

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const browseSnapHeights = useMemo(() => getBrowseSnapHeights(viewportHeight), [viewportHeight]);
  const pointSnapHeights = useMemo(() => getPointSnapHeights(viewportHeight), [viewportHeight]);

  const browseSnap = useBottomSheetSnap({
    snapHeights: browseSnapHeights,
    initialIndex: 0,
    enabled: !isPointMode,
  });

  const pointSnap = useBottomSheetSnap({
    snapHeights: pointSnapHeights,
    initialIndex: 0,
    enabled: isPointMode,
  });

  const { currentHeight, dragHandleProps, snapIndex, dragOffset, setSnapIndex } = isPointMode
    ? pointSnap
    : browseSnap;
  const isBrowseCollapsed = !isPointMode && browseSnap.snapIndex === 0;
  const isBrowseExpanded = !isPointMode && browseSnap.snapIndex > 0;
  const isPointMiniFiche = isPointMode && snapIndex === 0;
  const isSheetAuto = (isBrowseCollapsed || isPointMiniFiche) && dragOffset === 0;

  browseSnapIndexRef.current = isPointMode ? 0 : browseSnap.snapIndex;

  useEffect(() => {
    if (isBrowseCollapsed) {
      setBrowseView('search');
    }
  }, [isBrowseCollapsed]);

  const expandBrowseSheet = useCallback(() => {
    if (!isPointMode) {
      setSnapIndex(1);
    }
  }, [isPointMode, setSnapIndex]);

  const focusSearchInput = useCallback(() => {
    const input = searchContainerRef.current?.querySelector<HTMLInputElement>('input.search');
    input?.focus();
  }, []);

  const handleSearchActivate = useCallback(() => {
    expandBrowseSheet();
    window.requestAnimationFrame(() => {
      focusSearchInput();
    });
  }, [expandBrowseSheet, focusSearchInput]);

  const collapseBrowseSheet = useCallback(() => {
    setSnapIndex(0);
    setBrowseView('search');
    searchContainerRef.current?.querySelector<HTMLInputElement>('input.search')?.blur();
  }, [setSnapIndex]);

  useEffect(() => {
    if (!collapseBrowseSearch || isPointMode) {
      return;
    }

    collapseBrowseSheet();
  }, [collapseBrowseSearch, collapseBrowseSheet, isPointMode]);

  useEffect(() => {
    if (!map || !isMapReady || isPointMode) {
      return;
    }

    const handleMapClick = () => {
      if (browseSnapIndexRef.current > 0) {
        collapseBrowseSheet();
      }
    };

    map.on('singleclick', handleMapClick);
    return () => {
      map.un('singleclick', handleMapClick);
    };
  }, [collapseBrowseSheet, isMapReady, isPointMode, map]);

  const { entries: historyEntries, refresh: refreshSearchHistory } = useAddressSearchHistory(isBrowseExpanded);

  const {
    stations,
    isLoading: isRgpLoading,
    isReloading: isRgpReloading,
    lastLoadedAt: rgpLastLoadedAt,
    error: rgpError,
    reloadFromServer,
  } = useNearestRgpStations({
    map,
    isMapReady,
  });

  const { selectHistoryEntry } = useSearchGeoportail({
    map,
    addressContainerRef: searchContainerRef,
    isOpen: isMapReady && !isPointMode,
    placeholder: 'Rechercher un point, une adresse…',
    onFocus: expandBrowseSheet,
    onSelect: refreshSearchHistory,
  });

  useEffect(() => {
    onTabbarVisibleChange?.(!isPointMode);
    return () => {
      onTabbarVisibleChange?.(true);
    };
  }, [isPointMode, onTabbarVisibleChange]);

  useEffect(() => {
    if (!isPointMode && hideBrowseSheet) {
      onSheetHeightChange?.(0);
      onFabSheetOffsetChange?.(0);
      return;
    }

    const reportOffsets = (height: number) => {
      onSheetHeightChange?.(height);
      onFabSheetOffsetChange?.(isPointMiniFiche ? 0 : height);
    };

    if (!isSheetAuto) {
      reportOffsets(currentHeight);
      return;
    }

    const sheetElement = sheetRef.current;
    if (!sheetElement) {
      return;
    }

    const reportHeight = () => {
      reportOffsets(sheetElement.getBoundingClientRect().height);
    };

    reportHeight();

    const resizeObserver = new ResizeObserver(reportHeight);
    resizeObserver.observe(sheetElement);
    return () => resizeObserver.disconnect();
  }, [
    currentHeight,
    hideBrowseSheet,
    isPointMiniFiche,
    isPointMode,
    isSheetAuto,
    onFabSheetOffsetChange,
    onSheetHeightChange,
  ]);

  const center = map?.getView().getCenter();
  const referencePosition = center
    ? (() => {
        const [longitude, latitude] = toLonLat(center);
        return { longitude, latitude };
      })()
    : null;

  const handleNavigateToPoint = () => {
    if (!selectedPoint) {
      return;
    }

    onFocusCoordinate(selectedPoint.point.longitude, selectedPoint.point.latitude);
  };

  const handleRgpSelect = (longitude: number, latitude: number) => {
    onFocusCoordinate(longitude, latitude);
  };

  if (!isPointMode && hideBrowseSheet) {
    return null;
  }

  return (
    <section
      ref={sheetRef}
      className={`${styles.sheet} ${isSheetAuto ? styles.sheetAuto : ''} ${isPointMode ? styles.sheetPointFiche : ''}`}
      style={
        isSheetAuto
          ? undefined
          : { height: `${currentHeight}px`, ['--map-sheet-height' as string]: `${currentHeight}px` }
      }
      aria-label={isPointMode ? 'Fiche repère' : 'Recherche et stations RGP'}
    >
      {!isPointMode ? (
        <div
          className={styles.handleArea}
          {...dragHandleProps}
          aria-hidden={browseSnapHeights.length < 2}
        >
          <span className={styles.handle} />
        </div>
      ) : null}

      {isPointMode && selectedPoint ? (
        <div
          className={`${styles.content} ${isPointMiniFiche ? styles.contentPointMini : styles.contentPointSheet}`}
        >
          <MapPointSheet
            action={selectedPoint}
            snapIndex={snapIndex}
            referencePosition={referencePosition}
            canReport={canReportPoint}
            dragHandleProps={dragHandleProps}
            onClose={onClosePoint}
            onReport={onReportPoint}
            onNavigate={handleNavigateToPoint}
          />
        </div>
      ) : (
        <div className={isBrowseExpanded ? styles.contentExpanded : styles.contentCompact}>
          <div className={styles.searchArea}>
            <div
              className={styles.searchField}
              onPointerDown={(event) => {
                if (event.target instanceof HTMLInputElement) {
                  return;
                }

                handleSearchActivate();
              }}
            >
              <IconSearch className={styles.searchIcon} aria-hidden />
              <div ref={searchContainerRef} className={styles.searchContainer} />
            </div>
          </div>

          {isBrowseExpanded ? (
            <div className={styles.browsePanel} data-scroll-root="true">
              {browseView === 'search' ? (
                <BrowseSearchHome
                  historyEntries={historyEntries}
                  onOpenRgpList={() => setBrowseView('rgp')}
                  onSelectHistoryEntry={selectHistoryEntry}
                />
              ) : (
                <BrowseRgpStationsList
                  stations={stations}
                  isLoading={isRgpLoading}
                  isReloading={isRgpReloading}
                  lastLoadedAt={rgpLastLoadedAt}
                  error={rgpError}
                  onBack={() => setBrowseView('search')}
                  onRefresh={() => {
                    void reloadFromServer();
                  }}
                  onSelectStation={handleRgpSelect}
                />
              )}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
