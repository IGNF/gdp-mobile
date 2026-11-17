import { useEffect } from 'react';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import type Map from 'ol/Map';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';

import { createMapPointMarkerStyle } from '@/features/map/utils/mapPointMarkerStyle';
import {
  MAP_PDF_CART_MARKER_LAYER_NAME,
  MAP_PDF_CART_MARKER_Z_INDEX,
} from '@/shared/constants/map';
import { getColorCode } from '@/shared/utils/color';

import type { WebPdfCartEntry } from './pdfCartTypes';

interface UseWebPdfCartMarkersOptions {
  map: Map | null;
  isMapReady: boolean;
  enabled: boolean;
  entries: readonly WebPdfCartEntry[];
}

export function useWebPdfCartMarkers({
  map,
  isMapReady,
  enabled,
  entries,
}: UseWebPdfCartMarkersOptions): void {
  useEffect(() => {
    if (!map || !isMapReady || !enabled) {
      return;
    }

    const source = new VectorSource<Feature<Point>>();
    const markerLayer = new VectorLayer({
      source,
      properties: {
        name: MAP_PDF_CART_MARKER_LAYER_NAME,
        title: 'Repères du panier PDF',
        displayInLayerSwitcher: false,
      },
      zIndex: MAP_PDF_CART_MARKER_Z_INDEX,
    });

    map.addLayer(markerLayer);

    const markerColor = getColorCode('primary');
    if (markerColor) {
      for (const entry of entries) {
        const { longitude, latitude } = entry;
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
          continue;
        }

        const feature = new Feature<Point>(new Point(fromLonLat([longitude, latitude])));
        feature.setId(entry.key);
        feature.setStyle(createMapPointMarkerStyle(markerColor, 'filled', 0.85));
        source.addFeature(feature);
      }
    }

    return () => {
      map.removeLayer(markerLayer);
    };
  }, [enabled, entries, isMapReady, map]);
}
