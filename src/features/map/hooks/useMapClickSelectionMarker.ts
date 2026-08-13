import { useEffect } from 'react';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import type Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { createMapPointMarkerStyle } from '@/features/map/utils/mapPointMarkerStyle';
import {
  MAP_CLICK_SELECTION_MARKER_LAYER_NAME,
  MAP_CLICK_SELECTION_MARKER_Z_INDEX,
} from '@/shared/constants/map';
import { getColorCode } from '@/shared/utils/color';

const REPORTING_MARKER_SCALE = 1.4;

export interface MapClickSelectionMarkerPosition {
  longitude: number;
  latitude: number;
}

interface UseMapClickSelectionMarkerOptions {
  map: Map | null;
  isMapReady: boolean;
  pendingAction: MapGeodesyClickAction | null;
  /**
   * When set (report wizard open), pins the marker at this position — independently of
   * `pendingAction`, which gets cleared as soon as the point action sheet closes — and
   * enlarges it to keep the reported point visible behind the wizard sheet.
   */
  reportingPosition?: MapClickSelectionMarkerPosition | null;
}

export function useMapClickSelectionMarker({
  map,
  isMapReady,
  pendingAction,
  reportingPosition = null,
}: UseMapClickSelectionMarkerOptions): void {
  useEffect(() => {
    if (!map || !isMapReady) {
      return;
    }

    const source = new VectorSource<Feature<Point>>();
    const markerLayer = new VectorLayer({
      source,
      properties: {
        name: MAP_CLICK_SELECTION_MARKER_LAYER_NAME,
        title: 'Point sélectionné',
        displayInLayerSwitcher: false,
      },
      zIndex: MAP_CLICK_SELECTION_MARKER_Z_INDEX,
    });

    map.addLayer(markerLayer);

    const position = reportingPosition ?? pendingAction?.point ?? null;

    if (position) {
      const { longitude, latitude } = position;

      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        const feature = new Feature<Point>(new Point(fromLonLat([longitude, latitude])));
        const markerColor = getColorCode('primary');

        if (markerColor) {
          feature.setStyle(
            createMapPointMarkerStyle(markerColor, 'ring', reportingPosition ? REPORTING_MARKER_SCALE : 1),
          );
          source.addFeature(feature);
        }
      }
    }

    return () => {
      map.removeLayer(markerLayer);
    };
  }, [isMapReady, map, pendingAction, reportingPosition]);
}
