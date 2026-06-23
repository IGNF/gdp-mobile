import { useEffect, useRef, useState } from 'react';

import type { GeodesyLayerVisibility, GeodesyWfsAttributeFilterValues } from '@ign/gdp-tools';

import {
  getDefaultMapPreferences,
  getMapPreferences,
  saveMapPreferences,
} from '@/infra/persistence/mapViewportStore';
import type { GdpGeodesyMode, GdpWfsClusterPreferences } from '@/shared/constants/geodesy';
import type { ReportMapLayerVisibility } from '@/shared/constants/reportMapLayers';

const LAYER_SAVE_DEBOUNCE_MS = 300;

interface UsePersistedMapLayersOptions {
  isMapReady: boolean;
  activeBasemap: string;
  geodesyMode: GdpGeodesyMode;
  geodesyVisibility: GeodesyLayerVisibility;
  geodesyWfsAttributeFilterValues: GeodesyWfsAttributeFilterValues;
  wfsClusterPreferences: GdpWfsClusterPreferences;
  reportMapLayers: ReportMapLayerVisibility;
  onBasemapChange: (basemap: string) => void;
  onGeodesyModeChange: (mode: GdpGeodesyMode) => void;
  onGeodesyVisibilityChange: (visibility: GeodesyLayerVisibility) => void;
  onGeodesyWfsAttributeFilterValuesChange: (values: GeodesyWfsAttributeFilterValues) => void;
  onWfsClusterPreferencesChange: (preferences: GdpWfsClusterPreferences) => void;
  onReportMapLayersChange: (layers: ReportMapLayerVisibility) => void;
}

export function usePersistedMapLayers({
  isMapReady,
  activeBasemap,
  geodesyMode,
  geodesyVisibility,
  geodesyWfsAttributeFilterValues,
  wfsClusterPreferences,
  reportMapLayers,
  onBasemapChange,
  onGeodesyModeChange,
  onGeodesyVisibilityChange,
  onGeodesyWfsAttributeFilterValuesChange,
  onWfsClusterPreferencesChange,
  onReportMapLayersChange,
}: UsePersistedMapLayersOptions) {
  const [isHydrated, setIsHydrated] = useState(false);
  const onBasemapChangeRef = useRef(onBasemapChange);
  const onGeodesyModeChangeRef = useRef(onGeodesyModeChange);
  const onGeodesyVisibilityChangeRef = useRef(onGeodesyVisibilityChange);
  const onGeodesyWfsAttributeFilterValuesChangeRef = useRef(onGeodesyWfsAttributeFilterValuesChange);
  const onWfsClusterPreferencesChangeRef = useRef(onWfsClusterPreferencesChange);
  const onReportMapLayersChangeRef = useRef(onReportMapLayersChange);
  onBasemapChangeRef.current = onBasemapChange;
  onGeodesyModeChangeRef.current = onGeodesyModeChange;
  onGeodesyVisibilityChangeRef.current = onGeodesyVisibilityChange;
  onGeodesyWfsAttributeFilterValuesChangeRef.current = onGeodesyWfsAttributeFilterValuesChange;
  onWfsClusterPreferencesChangeRef.current = onWfsClusterPreferencesChange;
  onReportMapLayersChangeRef.current = onReportMapLayersChange;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const preferences = (await getMapPreferences()) ?? getDefaultMapPreferences();
      if (cancelled) {
        return;
      }

      onBasemapChangeRef.current(preferences.basemap);
      onGeodesyModeChangeRef.current(preferences.geodesyMode);
      onGeodesyVisibilityChangeRef.current(preferences.geodesyVisibility);
      onGeodesyWfsAttributeFilterValuesChangeRef.current(preferences.geodesyWfsAttributeFilterValues);
      onWfsClusterPreferencesChangeRef.current(preferences.wfsClusterPreferences);
      onReportMapLayersChangeRef.current(preferences.reportMapLayers);
      setIsHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMapReady || !isHydrated) {
      return;
    }

    const preferences = {
      basemap: activeBasemap,
      geodesyMode,
      geodesyVisibility,
      geodesyWfsAttributeFilterValues,
      wfsClusterPreferences,
      reportMapLayers,
    };

    const timeoutId = window.setTimeout(() => {
      void saveMapPreferences(preferences);
    }, LAYER_SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
      void saveMapPreferences(preferences);
    };
  }, [
    activeBasemap,
    geodesyMode,
    geodesyVisibility,
    geodesyWfsAttributeFilterValues,
    wfsClusterPreferences,
    reportMapLayers,
    isHydrated,
    isMapReady,
  ]);

  return { isHydrated };
}
