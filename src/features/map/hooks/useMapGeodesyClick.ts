import type { BuildGeodesyPointDisplayOptions, GeodesyPointReportContext } from '@ign/gdp-tools';
import { useGeodesyMapClick } from '@ign/gdp-tools/react';
import type Map from 'ol/Map';
import { useCallback, useEffect, useMemo, useRef } from 'react';

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

  // Mémorise le point actuellement affiché pour permettre un clic-bascule : recliquer sur le
  // même repère referme la fiche au lieu de la rouvrir à l'identique (le clic carte "ne fait
  // rien" sinon, faute de zone vide à cliquer sur une carte dense en points géodésiques).
  const openPointKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pendingAction) {
      openPointKeyRef.current = null;
      return;
    }

    const pointKey = [
      pendingAction.reportContext.layerId ?? '',
      pendingAction.reportContext.geodesyId ?? '',
      pendingAction.point.title,
      pendingAction.point.longitude,
      pendingAction.point.latitude,
    ].join(':');

    if (pointKey === openPointKeyRef.current) {
      openPointKeyRef.current = null;
      clearPendingClick();
      return;
    }

    openPointKeyRef.current = pointKey;
  }, [pendingAction, clearPendingClick]);

  const closeActionSheet = useCallback(() => {
    openPointKeyRef.current = null;
    clearPendingClick();
  }, [clearPendingClick]);

  return {
    pendingAction,
    closeActionSheet,
  };
}
