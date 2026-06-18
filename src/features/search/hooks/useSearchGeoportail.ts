import { useCallback, useEffect, useRef } from 'react';

import type Map from 'ol/Map';
import Overlay from 'ol/Overlay';
import SearchGeoportail from 'ol-ext/control/SearchGeoportail';
import type { Options as SearchGeoportailOptions } from 'ol-ext/control/SearchGeoportail';
import type { SearchEvent } from 'ol-ext/control/Search';
import 'ol-ext/control/Search.css';

import {
  DEFAULT_MAP_SEARCH_ZOOM,
  GEOPORTAIL_API_KEY,
  SEARCH_ADDRESS_MAX_HISTORY,
} from '@/shared/constants/map';

interface UseSearchGeoportailOptions {
  map: Map | null;
  addressContainerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
}

export interface UseSearchGeoportailReturn {
  clearMarker: () => void;
}

function clearAutocompleteList(container: HTMLElement | null, selector: string) {
  const list = container?.querySelector<HTMLUListElement>(selector);
  if (!list) {
    return;
  }
  list.innerHTML = '';
  list.style.display = 'none';
}

export function useSearchGeoportail({
  map,
  addressContainerRef,
  isOpen,
}: UseSearchGeoportailOptions): UseSearchGeoportailReturn {
  const overlayRef = useRef<Overlay | null>(null);

  const clearMarker = useCallback(() => {
    if (overlayRef.current && map) {
      map.removeOverlay(overlayRef.current);
      overlayRef.current.getElement()?.remove();
      overlayRef.current = null;
    }
  }, [map]);

  const showMarkerAtCoordinate = useCallback(
    (coordinate: number[]) => {
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

      map.getView().animate({
        center: coordinate,
        zoom: Math.max(map.getView().getZoom() ?? DEFAULT_MAP_SEARCH_ZOOM, DEFAULT_MAP_SEARCH_ZOOM),
        duration: 500,
      });
    },
    [clearMarker, map],
  );

  useEffect(() => {
    if (!map || !isOpen || !addressContainerRef.current) {
      return;
    }

    const addressOptions: SearchGeoportailOptions = {
      target: addressContainerRef.current,
      apiKey: GEOPORTAIL_API_KEY,
      className: 'IGNF-gdp-address',
      placeholder: 'Rechercher une adresse',
      collapsed: false,
      noCollapse: true,
      maxHistory: SEARCH_ADDRESS_MAX_HISTORY,
    };
    (addressOptions as Record<string, unknown>).type = 'StreetAddress,PositionOfInterest';

    const addressSearch = new SearchGeoportail(addressOptions);
    addressSearch.setMap(map);

    addressSearch.on('select', (event: SearchEvent) => {
      if (event.coordinate) {
        showMarkerAtCoordinate(event.coordinate);
      }
      clearAutocompleteList(addressContainerRef.current, 'ul.autocomplete');
    });

    return () => {
      addressSearch.setMap(null as unknown as Map);
      clearMarker();
    };
  }, [addressContainerRef, clearMarker, isOpen, map, showMarkerAtCoordinate]);

  return { clearMarker };
}
