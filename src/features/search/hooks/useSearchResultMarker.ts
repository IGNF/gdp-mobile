import { useCallback, useEffect, useRef } from 'react';

import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import Overlay from 'ol/Overlay';
import '@/features/search/styles/searchMarker.css';

import { DEFAULT_MAP_SEARCH_ZOOM } from '@/shared/constants/map';

const SEARCH_MARKER_DURATION_MS = 5000;

/**
 * Marqueur du dernier résultat de recherche. Vit avec la carte (`MapPage`), pas avec l'écran de
 * recherche : il reste affiché une fois revenu sur la carte, pendant `SEARCH_MARKER_DURATION_MS`.
 */
export function useSearchResultMarker(map: Map | null) {
  const overlayRef = useRef<Overlay | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const clearMarker = useCallback(() => {
    if (hideTimeoutRef.current !== null) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (overlayRef.current && map) {
      map.removeOverlay(overlayRef.current);
      overlayRef.current.getElement()?.remove();
      overlayRef.current = null;
    }
  }, [map]);

  const showSearchResult = useCallback(
    (coordinate: Coordinate) => {
      if (!map) {
        return;
      }

      clearMarker();

      const markerEl = document.createElement('div');
      markerEl.className = 'search-marker-pulse';

      const overlay = new Overlay({
        element: markerEl,
        position: coordinate,
        positioning: 'center-center',
        stopEvent: false,
      });

      overlayRef.current = overlay;
      map.addOverlay(overlay);
      hideTimeoutRef.current = window.setTimeout(clearMarker, SEARCH_MARKER_DURATION_MS);

      map.getView().animate({
        center: coordinate,
        zoom: Math.max(map.getView().getZoom() ?? DEFAULT_MAP_SEARCH_ZOOM, DEFAULT_MAP_SEARCH_ZOOM),
        duration: 500,
      });
    },
    [clearMarker, map],
  );

  useEffect(() => clearMarker, [clearMarker]);

  return { showSearchResult };
}
