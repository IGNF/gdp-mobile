import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { Attribution, defaults as defaultControls } from 'ol/control';
import ScaleLine from 'ol/control/ScaleLine';
import { defaults as defaultInteractions } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import { containsCoordinate } from 'ol/extent';
import { unByKey } from 'ol/Observable';
import 'ol/ol.css';

import {
  Gdp_Geolocation,
  type Position,
  type WatchPositionCallback,
} from '@/platform/device/geolocation';
import {
  DEFAULT_MAP_CENTER_LON_LAT,
  DEFAULT_MAP_FOCUS_ZOOM,
  DEFAULT_MAP_FOCUS_ZOOM_ON_USER_LOCATION,
  DEFAULT_MAP_SHOW_SCALELINE,
  GEOLOCATION_LOCK_RECENTER_ANIMATION_DURATION_MS,
  GEOLOCATION_LOCK_RECENTER_INTERVAL_MS,
  GEOLOCATION_RECENTER_AFTER_MOVEMENT_MS,
  GEOLOCATION_TRACKING_RECENTER_INTERVAL_MS,
} from '@/shared/constants/map';
import {
  createGeoportailLayerGroup,
  preloadGeoportailCapabilities,
} from '@/infra/map/openlayers/geoportailLayers';
import {
  getDefaultMapPreferences,
  getMapPreferences,
  saveMapPreferences,
} from '@/infra/persistence/mapViewportStore';

interface UseMapOptions {
  centerOnUserLocation?: boolean;
}

/**
 * tracking : suivi GPS continu (watchPosition).
 * locked : double-tap sur le bouton géoloc — recentrage périodique animé.
 */
export type UserFollowingMode = 'none' | 'tracking' | 'locked';

type UserLocationViewportStatus = 'inside' | 'border' | 'outside';

const USER_LOCATION_BORDER_PADDING_PX = 48;
const MAP_VIEWPORT_SAVE_DEBOUNCE_MS = 500;
const USER_LOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
};

interface UseMapReturn {
  mapElementRef: React.RefObject<HTMLDivElement | null>;
  map: Map | null;
  centerOnUserLocation: (animationDuration?: number) => Promise<void>;
  focusOnCoordinate: (
    longitude: number,
    latitude: number,
    zoom?: number,
    animationDuration?: number,
  ) => Promise<void>;
  lockUserLocationOnMap: () => void;
  userFollowingMode: UserFollowingMode;
  setUserFollowingMode: Dispatch<SetStateAction<UserFollowingMode>>;
  setIsGeolocationRecenterActive: Dispatch<SetStateAction<boolean>>;
  onUserViewportChange: () => void;
  isLocating: boolean;
  isLockedUserLocation: boolean;
  isMapReady: boolean;
}

export function useMap(options: UseMapOptions = {}): UseMapReturn {
  const { centerOnUserLocation: shouldCenterOnMount = false } = options;

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const isLocatingRef = useRef(false);
  const programmaticViewportChangeCountRef = useRef(0);
  const isUserViewportChangePendingRef = useRef(false);
  const hasManualViewportOverrideRef = useRef(false);
  const userViewportChangeTimeoutRef = useRef<number | null>(null);
  const latestPositionRef = useRef<Position | null>(null);
  const isAutoRecenterActiveRef = useRef(false);
  const [map, setMap] = useState<Map | null>(null);
  const [userFollowingMode, setUserFollowingMode] = useState<UserFollowingMode>('none');
  const [isFeatureGeolocationRecenterActive, setIsGeolocationRecenterActive] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasInitialCenterCompleted, setHasInitialCenterCompleted] = useState(
    () => !shouldCenterOnMount,
  );

  const isLockedUserLocation = userFollowingMode === 'locked';
  const isAutoRecenterActive =
    isFeatureGeolocationRecenterActive || userFollowingMode === 'tracking';

  const markProgrammaticViewportChange = useCallback(() => {
    programmaticViewportChangeCountRef.current += 1;

    return () => {
      programmaticViewportChangeCountRef.current = Math.max(
        programmaticViewportChangeCountRef.current - 1,
        0,
      );
    };
  }, []);

  const runProgrammaticViewportChange = useCallback(
    (change: () => void) => {
      const endProgrammaticViewportChange = markProgrammaticViewportChange();
      try {
        change();
      } finally {
        window.setTimeout(endProgrammaticViewportChange, 0);
      }
    },
    [markProgrammaticViewportChange],
  );

  const animateTo = useCallback(
    async (
      targetMap: Map,
      centerLonLat: [number, number],
      zoom: number = DEFAULT_MAP_FOCUS_ZOOM,
      duration: number = 500,
    ) => {
      await new Promise<void>((resolve) => {
        const endProgrammaticViewportChange = markProgrammaticViewportChange();
        targetMap.getView().animate(
          {
            center: fromLonLat(centerLonLat),
            zoom,
            duration,
          },
          () => {
            endProgrammaticViewportChange();
            resolve();
          },
        );
      });
    },
    [markProgrammaticViewportChange],
  );

  const focusOnCoordinate = useCallback(
    async (
      longitude: number,
      latitude: number,
      zoom: number = DEFAULT_MAP_FOCUS_ZOOM,
      animationDuration: number = 500,
    ) => {
      const targetMap = mapRef.current;
      if (!targetMap) {
        return;
      }

      setUserFollowingMode('none');
      await animateTo(targetMap, [longitude, latitude], zoom, animationDuration);
    },
    [animateTo],
  );

  const lockUserLocationOnMap = useCallback(() => {
    setUserFollowingMode((mode) => (mode === 'locked' ? 'none' : 'locked'));
  }, []);

  const animateToPosition = useCallback(
    async (targetMap: Map, position: Position, animationDuration: number) => {
      const { longitude, latitude } = position.coords;
      await animateTo(
        targetMap,
        [longitude, latitude],
        DEFAULT_MAP_FOCUS_ZOOM_ON_USER_LOCATION,
        animationDuration,
      );
    },
    [animateTo],
  );

  const centerViewOnPosition = useCallback(
    (targetMap: Map, position: Position, shouldResetZoom = false) => {
      const { longitude, latitude } = position.coords;
      const view = targetMap.getView();

      runProgrammaticViewportChange(() => {
        view.setCenter(fromLonLat([longitude, latitude]));
        if (shouldResetZoom) {
          view.setZoom(DEFAULT_MAP_FOCUS_ZOOM_ON_USER_LOCATION);
        }
      });
    },
    [runProgrammaticViewportChange],
  );

  const animateViewToPosition = useCallback(
    (targetMap: Map, position: Position, shouldResetZoom = false) => {
      const { longitude, latitude } = position.coords;
      const view = targetMap.getView();

      const endProgrammaticViewportChange = markProgrammaticViewportChange();
      view.animate(
        {
          center: fromLonLat([longitude, latitude]),
          ...(shouldResetZoom ? { zoom: DEFAULT_MAP_FOCUS_ZOOM_ON_USER_LOCATION } : {}),
          duration: GEOLOCATION_LOCK_RECENTER_ANIMATION_DURATION_MS,
        },
        () => {
          endProgrammaticViewportChange();
        },
      );
    },
    [markProgrammaticViewportChange],
  );

  const getPositionViewportStatus = useCallback(
    (targetMap: Map, position: Position): UserLocationViewportStatus => {
      const size = targetMap.getSize();
      if (!size) {
        return 'outside';
      }

      const coordinate = fromLonLat([position.coords.longitude, position.coords.latitude]);
      const extent = targetMap.getView().calculateExtent(size);
      if (!containsCoordinate(extent, coordinate)) {
        return 'outside';
      }

      const [width, height] = size;
      const [x, y] = targetMap.getPixelFromCoordinate(coordinate);
      if (
        x <= USER_LOCATION_BORDER_PADDING_PX ||
        x >= width - USER_LOCATION_BORDER_PADDING_PX ||
        y <= USER_LOCATION_BORDER_PADDING_PX ||
        y >= height - USER_LOCATION_BORDER_PADDING_PX
      ) {
        return 'border';
      }

      return 'inside';
    },
    [],
  );

  const getLatestPosition = useCallback(async () => {
    if (latestPositionRef.current) {
      return latestPositionRef.current;
    }

    const position = await Gdp_Geolocation.getUsersLocation(USER_LOCATION_OPTIONS);
    latestPositionRef.current = position;
    return position;
  }, []);

  const restoreViewportAfterUserChange = useCallback(async () => {
    userViewportChangeTimeoutRef.current = null;
    isUserViewportChangePendingRef.current = false;

    const currentMap = mapRef.current;
    if (!currentMap || !isAutoRecenterActiveRef.current) {
      return;
    }

    let position: Position | null = null;
    try {
      position = await getLatestPosition();
    } catch (error) {
      console.error('Error restoring map viewport after user movement:', error);
      return;
    }

    if (!position) {
      return;
    }

    const viewportStatus = getPositionViewportStatus(currentMap, position);
    if (viewportStatus === 'outside') {
      hasManualViewportOverrideRef.current = false;
      animateViewToPosition(currentMap, position, true);
      return;
    }

    if (viewportStatus === 'border') {
      animateViewToPosition(currentMap, position, false);
    }
  }, [animateViewToPosition, getLatestPosition, getPositionViewportStatus]);

  const onUserViewportChange = useCallback(() => {
    if (!isAutoRecenterActiveRef.current || programmaticViewportChangeCountRef.current > 0) {
      return;
    }

    hasManualViewportOverrideRef.current = true;
    isUserViewportChangePendingRef.current = true;

    if (userViewportChangeTimeoutRef.current !== null) {
      window.clearTimeout(userViewportChangeTimeoutRef.current);
    }

    userViewportChangeTimeoutRef.current = window.setTimeout(() => {
      void restoreViewportAfterUserChange();
    }, GEOLOCATION_RECENTER_AFTER_MOVEMENT_MS);
  }, [restoreViewportAfterUserChange]);

  const centerOnUserLocation = useCallback(async (animationDuration: number = 500) => {
    const currentMap = mapRef.current;
    if (!currentMap || isLocatingRef.current) {
      return;
    }

    isLocatingRef.current = true;
    setIsLocating(true);

    try {
      const position = await Gdp_Geolocation.getUsersLocation(USER_LOCATION_OPTIONS);

      if (position) {
        latestPositionRef.current = position;
        await animateToPosition(currentMap, position, animationDuration);
      } else {
        await animateTo(currentMap, DEFAULT_MAP_CENTER_LON_LAT, DEFAULT_MAP_FOCUS_ZOOM, animationDuration);
      }
    } catch (error) {
      console.error('Error centering on user location:', error);
      await animateTo(currentMap, DEFAULT_MAP_CENTER_LON_LAT, DEFAULT_MAP_FOCUS_ZOOM, animationDuration);
    } finally {
      isLocatingRef.current = false;
      setIsLocating(false);
    }
  }, [animateTo, animateToPosition]);

  useEffect(() => {
    isAutoRecenterActiveRef.current = isAutoRecenterActive;

    if (isAutoRecenterActive) {
      return;
    }

    hasManualViewportOverrideRef.current = false;
    isUserViewportChangePendingRef.current = false;

    if (userViewportChangeTimeoutRef.current !== null) {
      window.clearTimeout(userViewportChangeTimeoutRef.current);
      userViewportChangeTimeoutRef.current = null;
    }
  }, [isAutoRecenterActive]);

  useEffect(() => {
    if (userFollowingMode !== 'locked') {
      return;
    }

    void centerOnUserLocation(GEOLOCATION_LOCK_RECENTER_ANIMATION_DURATION_MS);

    const intervalId = window.setInterval(() => {
      void centerOnUserLocation(GEOLOCATION_LOCK_RECENTER_ANIMATION_DURATION_MS);
    }, GEOLOCATION_LOCK_RECENTER_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [centerOnUserLocation, userFollowingMode]);

  useEffect(() => {
    if (!isAutoRecenterActive) {
      return;
    }

    const currentMap = mapRef.current;
    if (!currentMap) {
      return;
    }

    let watchId: Awaited<ReturnType<typeof Gdp_Geolocation.watchUsersLocation>> = null;

    void (async () => {
      const onPositionUpdate: WatchPositionCallback = (position) => {
        if (!position) {
          return;
        }

        latestPositionRef.current = position;

        if (isUserViewportChangePendingRef.current) {
          return;
        }

        centerViewOnPosition(currentMap, position, !hasManualViewportOverrideRef.current);
      };

      watchId = await Gdp_Geolocation.watchUsersLocation(onPositionUpdate, {
        ...USER_LOCATION_OPTIONS,
        maximumAge: 1000,
        minimumUpdateInterval: GEOLOCATION_TRACKING_RECENTER_INTERVAL_MS,
        interval: GEOLOCATION_TRACKING_RECENTER_INTERVAL_MS,
      });
    })();

    return () => {
      if (watchId) {
        void Gdp_Geolocation.clearWatch(watchId);
      }
    };
  }, [centerViewOnPosition, isAutoRecenterActive]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    let aborted = false;

    void (async () => {
      preloadGeoportailCapabilities();

      const savedPreferences = (await getMapPreferences()) ?? getDefaultMapPreferences();

      if (aborted || !mapElementRef.current || mapRef.current) {
        return;
      }

      const initializedMap = new Map({
        target: mapElementRef.current,
        layers: [createGeoportailLayerGroup()],
        interactions: defaultInteractions({
          onFocusOnly: true,
          altShiftDragRotate: false,
          pinchRotate: false,
        }),
        controls: defaultControls({ zoom: false, attribution: false, rotate: false }).extend([
          ...(DEFAULT_MAP_SHOW_SCALELINE ? [new ScaleLine()] : []),
          new Attribution({
            collapsible: false,
            collapsed: false,
          }),
        ]),
        view: new View({
          center: fromLonLat([savedPreferences.longitude, savedPreferences.latitude]),
          zoom: savedPreferences.zoom,
          enableRotation: false,
        }),
      });

      mapRef.current = initializedMap;
      setMap(initializedMap);
      setIsMapReady(true);
    })();

    return () => {
      aborted = true;
      mapRef.current?.setTarget(undefined);
      mapRef.current = null;
      setMap(null);
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const olMap = mapRef.current;
    if (!olMap) {
      return;
    }

    const viewport = olMap.getViewport();
    const pointerDragListener = olMap.on('pointerdrag', onUserViewportChange);
    viewport.addEventListener('wheel', onUserViewportChange, { passive: true });
    viewport.addEventListener('touchmove', onUserViewportChange, { passive: true });

    return () => {
      unByKey(pointerDragListener);
      viewport.removeEventListener('wheel', onUserViewportChange);
      viewport.removeEventListener('touchmove', onUserViewportChange);
    };
  }, [map, onUserViewportChange]);

  useEffect(() => {
    const olMap = mapRef.current;
    if (!olMap) {
      return;
    }

    let saveTimeout: number | null = null;

    const persistViewport = () => {
      if (programmaticViewportChangeCountRef.current > 0) {
        return;
      }

      const view = olMap.getView();
      const center = view.getCenter();
      const zoom = view.getZoom();
      if (!center || zoom === undefined) {
        return;
      }

      const [longitude, latitude] = toLonLat(center);
      void saveMapPreferences({ longitude, latitude, zoom });
    };

    const moveEndKey = olMap.on('moveend', () => {
      if (saveTimeout !== null) {
        window.clearTimeout(saveTimeout);
      }
      saveTimeout = window.setTimeout(persistViewport, MAP_VIEWPORT_SAVE_DEBOUNCE_MS);
    });

    return () => {
      unByKey(moveEndKey);
      if (saveTimeout !== null) {
        window.clearTimeout(saveTimeout);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!shouldCenterOnMount || !isMapReady || hasInitialCenterCompleted) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        await centerOnUserLocation();
      } finally {
        if (!cancelled) {
          setHasInitialCenterCompleted(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [centerOnUserLocation, hasInitialCenterCompleted, isMapReady, shouldCenterOnMount]);

  return {
    mapElementRef,
    map,
    centerOnUserLocation,
    focusOnCoordinate,
    lockUserLocationOnMap,
    userFollowingMode,
    setUserFollowingMode,
    setIsGeolocationRecenterActive,
    onUserViewportChange,
    isLocating,
    isLockedUserLocation,
    isMapReady,
  };
}
