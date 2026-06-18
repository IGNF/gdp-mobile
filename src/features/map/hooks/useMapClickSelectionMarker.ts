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

interface UseMapClickSelectionMarkerOptions {
  map: Map | null;
  isMapReady: boolean;
  pendingAction: MapGeodesyClickAction | null;
}

export function useMapClickSelectionMarker({
  map,
  isMapReady,
  pendingAction,
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

    if (pendingAction) {
      const { longitude, latitude } = pendingAction.point;

      if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
        const feature = new Feature<Point>(new Point(fromLonLat([longitude, latitude])));
        const markerColor = getColorCode('primary') || '#26a581';

        feature.setStyle(createMapPointMarkerStyle(markerColor, 'ring'));
        source.addFeature(feature);
      }
    }

    return () => {
      map.removeLayer(markerLayer);
    };
  }, [isMapReady, map, pendingAction]);
}
