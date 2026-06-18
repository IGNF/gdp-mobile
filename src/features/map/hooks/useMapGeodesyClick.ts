import type { BuildGeodesyPointDisplayOptions, GeodesyPointReportContext } from '@ign/gdp-tools';
import { useGeodesyMapClick } from '@ign/gdp-tools/react';
import type Map from 'ol/Map';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import type { GeodesyPointReportMapContext } from '@/domain/report/geodesyPointMapContext';
import type { GeodesyPointDisplay } from '@/features/map/utils/geodesyReportContext';
import { GDP_GEODESY_POINT_DISPLAY_OPTIONS } from '@/features/map/utils/geodesyReportContext';

export type MapGeodesyClickAction = {
  kind: 'geodesy';
  point: GeodesyPointDisplay;
  reportContext: GeodesyPointReportContext;
};

export interface UseMapGeodesyClickOptions extends BuildGeodesyPointDisplayOptions {
  enabled?: boolean;
  isMapReady?: boolean;
}

export function useMapGeodesyClick(map: Map | null, options: UseMapGeodesyClickOptions) {
  const { enabled = true, isMapReady = false, attributeCatalog, pictoUrlMaps } = options;
  const navigate = useNavigate();

  const { pendingClick, clearPendingClick } = useGeodesyMapClick(map, {
    enabled,
    isMapReady,
    attributeCatalog,
    externalUrlSource: GDP_GEODESY_POINT_DISPLAY_OPTIONS.externalUrlSource,
    pictoUrlMaps,
  });

  const pendingAction = useMemo<MapGeodesyClickAction | null>(() => {
    if (!pendingClick || pendingClick.kind !== 'geodesy') {
      return null;
    }

    return {
      kind: 'geodesy',
      point: pendingClick.display,
      reportContext: pendingClick.reportContext,
    };
  }, [pendingClick]);

  const closeActionSheet = useCallback(() => {
    clearPendingClick();
  }, [clearPendingClick]);

  const reportOnExistingPoint = useCallback(() => {
    if (!pendingAction) {
      return;
    }

    const state: GeodesyPointReportMapContext = {
      source: 'map',
      reportContext: pendingAction.reportContext,
    };

    navigate('/report/geodesy/new', { state });
    clearPendingClick();
  }, [clearPendingClick, navigate, pendingAction]);

  return {
    pendingAction,
    closeActionSheet,
    reportOnExistingPoint,
  };
}
