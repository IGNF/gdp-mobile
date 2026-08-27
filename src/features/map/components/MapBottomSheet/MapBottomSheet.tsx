import type Map from 'ol/Map';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { useBottomSheetSnap } from '@/features/map/hooks/useBottomSheetSnap';
import { useNearestRgpStations } from '@/features/map/hooks/useNearestRgpStations';
import { useUserLocation } from '@/features/map/hooks/useUserLocation';
import { useAddressSearchHistory } from '@/features/search/hooks/useAddressSearchHistory';
import type { AddressSearchHistoryEntry } from '@/features/search/utils/addressSearchHistory';
import { useSearchGeoportail } from '@/features/search/hooks/useSearchGeoportail';
import type { UserFollowingMode } from '@/features/map/hooks/useMap';
import { openExternalNavigation } from '@/shared/utils/externalNavigation';

import sheetChrome from '@/features/map/styles/mapSheet.module.css';

import { BrowseRgpStationsList } from './BrowseRgpStationsList';
import { BrowseSearchHome } from './BrowseSearchHome';
import { BrowseReportsPanel } from './BrowseReportsPanel';
import { MapPointSheet } from './pointFiche/MapPointSheet';
import styles from './MapBottomSheet.module.css';
import { RiSearchLine } from 'react-icons/ri';

type BrowsePanelView = 'search' | 'rgp' | 'reports';

const BROWSE_SHEET_SLIDE_MS = 300;

function getBrowseSnapHeights(viewportHeight: number): readonly number[] {
  // Snap 0 = fermé ; snap 1 = taille normale ; snap 2 = étiré au maximum
  const normalHeight = Math.min(Math.round(viewportHeight * 0.58), 560);
  const maxHeight = Math.round(viewportHeight * 0.85);
  return [0, normalHeight, maxHeight];
}

// 3 boutons de 3rem + 2 espaces de 0.5rem + 0.75rem de marge = 10.75rem (172px),
// doit rester cohérent avec le max-height de .sheetPointFiche (MapBottomSheet.module.css)
// pour que la fiche ne recouvre jamais la pile de FAB (filtre/couches/légende).
const FAB_STACK_RESERVE_PX = 172;

function getSafeAreaTopPx(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const parsed = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
  );
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPointSnapHeights(viewportHeight: number, safeAreaTop: number): readonly number[] {
  const maxHeight = Math.max(220, viewportHeight - Math.max(12, safeAreaTop) - FAB_STACK_RESERVE_PX);

  return [
    220,
    Math.min(Math.round(viewportHeight * 0.48), maxHeight),
    Math.min(Math.round(viewportHeight * 0.68), maxHeight),
    maxHeight,
  ];
}

export interface MapBottomSheetProps {
  map: Map | null;
  isMapReady: boolean;
  selectedPoint: MapGeodesyClickAction | null;
  canReportPoint: boolean;
  userFollowingMode: UserFollowingMode;
  reportDisabledReason?: 'auth' | 'canevas' | null;
  onClosePoint: () => void;
  onReportPoint: () => void;
  onFocusCoordinate: (longitude: number, latitude: number) => void;
  /** Désactive le suivi GPS (following / locked) après une recherche d’adresse ou de commune. */
  onDisableUserFollowing?: () => void;
  onSheetHeightChange?: (height: number) => void;
  /** Offset carte pour GPS / échelle — suit la hauteur de la sheet, y compris en mini-fiche. */
  onFabSheetOffsetChange?: (offset: number) => void;
  onTabbarVisibleChange?: (visible: boolean) => void;
  hideBrowseSheet?: boolean;
  /** Replie la recherche (snap 0) quand un panneau latéral (couches, filtres) s’ouvre. */
  collapseBrowseSearch?: boolean;
  /** Force l'ouverture du panneau de recherche depuis l'extérieur. */
  forceExpandSearch?: boolean;
  /** Force la fermeture du panneau de recherche depuis l'extérieur. */
  /** Force l'ouverture du panneau de signalements depuis l'extérieur. */
  forceExpandReports?: boolean;
  /** Force la fermeture du panneau de signalements depuis l'extérieur. */
  forceCloseReports?: boolean;
  /** Callback appelé quand le panneau de signalements change d'état (ouvert/fermé). */
  onReportsPanelStateChange?: (isOpen: boolean) => void;
  forceCloseSearch?: boolean;
  /** Callback appelé quand le panneau de recherche change d'état (ouvert/fermé). */
  onSearchPanelStateChange?: (isOpen: boolean) => void;
}

export function MapBottomSheet({
  map,
  isMapReady,
  selectedPoint,
  canReportPoint,
  userFollowingMode,
  reportDisabledReason = null,
  onClosePoint,
  onReportPoint,
  onFocusCoordinate,
  onDisableUserFollowing,
  onSheetHeightChange,
  onFabSheetOffsetChange,
  onTabbarVisibleChange,
  hideBrowseSheet = false,
  collapseBrowseSearch = false,
  forceExpandSearch = false,
  forceCloseSearch = false,
  forceExpandReports = false,
  forceCloseReports = false,
  onSearchPanelStateChange,
  onReportsPanelStateChange,
}: MapBottomSheetProps) {
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLElement>(null);
  const browseSnapIndexRef = useRef(0);
  const browseViewRef = useRef<BrowsePanelView>('search');
  const pendingBrowseViewRef = useRef<BrowsePanelView | null>(null);
  const browseSwitchTimeoutRef = useRef<number | null>(null);
  const isPointMode = selectedPoint !== null;
  const [viewportHeight, setViewportHeight] = useState(() => window.innerHeight);
  const [safeAreaTop, setSafeAreaTop] = useState(() => getSafeAreaTopPx());
  const [browseView, setBrowseView] = useState<BrowsePanelView>('search');
  browseViewRef.current = browseView;

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
      setSafeAreaTop(getSafeAreaTopPx());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const browseSnapHeights = useMemo(() => getBrowseSnapHeights(viewportHeight), [viewportHeight]);
  const pointSnapHeights = useMemo(
    () => getPointSnapHeights(viewportHeight, safeAreaTop),
    [viewportHeight, safeAreaTop],
  );

  const browseSnap = useBottomSheetSnap({
    snapHeights: browseSnapHeights,
    initialIndex: 0,
    enabled: !isPointMode,
  });

  const pointSnap = useBottomSheetSnap({
    snapHeights: pointSnapHeights,
    initialIndex: 0,
    enabled: isPointMode,
    onDismiss: onClosePoint,
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
    if (isBrowseCollapsed && !pendingBrowseViewRef.current) {
      setBrowseView('search');
    }
  }, [isBrowseCollapsed]);

  useEffect(() => {
    return () => {
      if (browseSwitchTimeoutRef.current !== null) {
        window.clearTimeout(browseSwitchTimeoutRef.current);
      }
    };
  }, []);

  const expandBrowseSheet = useCallback(() => {
    if (!isPointMode) {
      setSnapIndex(1);
    }
  }, [isPointMode, setSnapIndex]);

  const handleSearchActivate = useCallback(() => {
    expandBrowseSheet();
  }, [expandBrowseSheet]);

  const collapseBrowseSheet = useCallback(() => {
    if (browseSwitchTimeoutRef.current !== null) {
      window.clearTimeout(browseSwitchTimeoutRef.current);
      browseSwitchTimeoutRef.current = null;
    }
    pendingBrowseViewRef.current = null;
    setSnapIndex(0);
    setBrowseView('search');
    searchContainerRef.current?.querySelector<HTMLInputElement>('input.search')?.blur();
  }, [setSnapIndex]);

  /** Ouvre une vue browse ; si une autre vue est déjà ouverte, rejoue le glissé haut. */
  const openBrowseView = useCallback(
    (view: BrowsePanelView) => {
      if (isPointMode) {
        return;
      }

      const isExpanded = browseSnapIndexRef.current > 0;
      const currentView = browseViewRef.current;

      if (isExpanded && currentView !== view && view !== 'rgp' && currentView !== 'rgp') {
        if (browseSwitchTimeoutRef.current !== null) {
          window.clearTimeout(browseSwitchTimeoutRef.current);
        }

        pendingBrowseViewRef.current = view;
        setSnapIndex(0);
        browseSwitchTimeoutRef.current = window.setTimeout(() => {
          setBrowseView(view);
          setSnapIndex(1);
          pendingBrowseViewRef.current = null;
          browseSwitchTimeoutRef.current = null;
        }, BROWSE_SHEET_SLIDE_MS);
        return;
      }

      setBrowseView(view);
      expandBrowseSheet();
    },
    [expandBrowseSheet, isPointMode, setSnapIndex],
  );

  useEffect(() => {
    if (!collapseBrowseSearch || isPointMode) {
      return;
    }

    collapseBrowseSheet();
  }, [collapseBrowseSearch, collapseBrowseSheet, isPointMode]);

  useEffect(() => {
    if (forceExpandSearch && !isPointMode) {
      openBrowseView('search');
    }
  }, [forceExpandSearch, isPointMode, openBrowseView]);

  useEffect(() => {
    if (forceCloseSearch && !isPointMode) {
      collapseBrowseSheet();
    }
  }, [forceCloseSearch, isPointMode, collapseBrowseSheet]);

  useEffect(() => {
    if (forceExpandReports && !isPointMode) {
      openBrowseView('reports');
    }
  }, [forceExpandReports, isPointMode, openBrowseView]);

  useEffect(() => {
    if (forceCloseReports && !isPointMode) {
      collapseBrowseSheet();
    }
  }, [forceCloseReports, isPointMode, collapseBrowseSheet]);

  useEffect(() => {
    const isSearchOpen = isBrowseExpanded && (browseView === 'search' || browseView === 'rgp');
    const isReportsOpen = isBrowseExpanded && browseView === 'reports';
    onSearchPanelStateChange?.(isSearchOpen);
    onReportsPanelStateChange?.(isReportsOpen);
  }, [isBrowseExpanded, browseView, onSearchPanelStateChange, onReportsPanelStateChange]);

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

  const handleSearchSelect = useCallback(() => {
    onDisableUserFollowing?.();
    refreshSearchHistory();
    collapseBrowseSheet();
  }, [collapseBrowseSheet, onDisableUserFollowing, refreshSearchHistory]);

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
    isOpen: isMapReady && !isPointMode && isBrowseExpanded,
    placeholder: 'Rechercher un point, une adresse…',
    onFocus: expandBrowseSheet,
    onSelect: handleSearchSelect,
  });

  const handleSelectHistoryEntry = useCallback(
    (entry: AddressSearchHistoryEntry) => {
      selectHistoryEntry(entry);
      collapseBrowseSheet();
    },
    [selectHistoryEntry, collapseBrowseSheet],
  );

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
      // Bouton recherche seul (collapsed) : ne pousse pas le FAB géoloc.
      onFabSheetOffsetChange?.(isBrowseCollapsed ? 0 : height);
    };

    if (isBrowseCollapsed) {
      reportOffsets(0);
      return;
    }

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
    isBrowseCollapsed,
    isPointMode,
    isSheetAuto,
    onFabSheetOffsetChange,
    onSheetHeightChange,
  ]);

  const referencePosition = useUserLocation({ enabled: userFollowingMode !== 'none' });

  const handleNavigateToPoint = () => {
    if (!selectedPoint) {
      return;
    }

    void openExternalNavigation({
      longitude: selectedPoint.point.longitude,
      latitude: selectedPoint.point.latitude,
      label: selectedPoint.point.title,
    });
  };

  const handleRgpSelect = (longitude: number, latitude: number) => {
    onFocusCoordinate(longitude, latitude);
    collapseBrowseSheet();
  };

  const handleReportSelect = useCallback(
    (longitude: number, latitude: number) => {
      onFocusCoordinate(longitude, latitude);
      collapseBrowseSheet();
    },
    [onFocusCoordinate, collapseBrowseSheet],
  );

  if (!isPointMode && hideBrowseSheet) {
    return null;
  }

  return (
    <section
      ref={sheetRef}
      className={[
        sheetChrome.surface,
        styles.sheet,
        dragOffset !== 0 ? styles.sheetDragging : '',
        isSheetAuto ? styles.sheetAuto : '',
        isPointMode ? styles.sheetPointFiche : '',
        isBrowseCollapsed ? styles.sheetCollapsed : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        isBrowseCollapsed
          ? { height: 0, ['--map-sheet-height' as string]: '0px' }
          : isSheetAuto
            ? undefined
            : { height: `${currentHeight}px`, ['--map-sheet-height' as string]: `${currentHeight}px` }
      }
      aria-label={isPointMode ? 'Fiche repère' : 'Recherche et stations RGP'}
    >
      {!isPointMode && isBrowseExpanded ? (
        <div
          className={`${sheetChrome.handleArea} ${styles.handleAreaDraggable}`}
          {...dragHandleProps}
          aria-hidden={browseSnapHeights.length < 2}
        >
          <span className={sheetChrome.handle} />
        </div>
      ) : null}

      {isPointMode && selectedPoint ? (
        <div
          className={`${sheetChrome.body} ${isPointMiniFiche ? styles.contentPointMini : styles.contentPointSheet}`}
        >
          <MapPointSheet
            action={selectedPoint}
            snapIndex={snapIndex}
            referencePosition={referencePosition}
            canReport={canReportPoint}
            reportDisabledReason={reportDisabledReason}
            dragHandleProps={dragHandleProps}
            onReport={onReportPoint}
            onNavigate={handleNavigateToPoint}
          />
        </div>
      ) : isBrowseCollapsed ? null : (
        <div className={styles.contentExpanded}>
          {browseView === 'search' ? (
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
                <RiSearchLine className={styles.searchIcon} aria-hidden />
                <div ref={searchContainerRef} className={styles.searchContainer} />
              </div>
            </div>
          ) : null}

          <div className={styles.browsePanel} data-scroll-root="true">
            {browseView === 'search' ? (
              <BrowseSearchHome
                historyEntries={historyEntries}
                onOpenRgpList={() => setBrowseView('rgp')}
                onSelectHistoryEntry={handleSelectHistoryEntry}
              />
            ) : browseView === 'rgp' ? (
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
            ) : (
              <BrowseReportsPanel onReportSelect={handleReportSelect} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
