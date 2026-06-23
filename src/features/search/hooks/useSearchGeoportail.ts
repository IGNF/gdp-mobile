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
import { SEARCH_GEOPORTAIL_CLASS_NAME } from '@/features/search/constants/searchGeoportail';
import type { AddressSearchHistoryEntry } from '@/features/search/utils/addressSearchHistory';
import { fromLonLat } from 'ol/proj';

interface UseSearchGeoportailOptions {
  map: Map | null;
  addressContainerRef: React.RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onSelect?: () => void;
}

export interface UseSearchGeoportailReturn {
  clearMarker: () => void;
  selectHistoryEntry: (entry: AddressSearchHistoryEntry) => void;
}

function clearAutocompleteList(container: HTMLElement | null, selector: string) {
  const list = container?.querySelector<HTMLUListElement>(selector);
  if (!list) {
    return;
  }
  list.innerHTML = '';
}

export function useSearchGeoportail({
  map,
  addressContainerRef,
  isOpen,
  placeholder = 'Rechercher une adresse',
  onFocus,
  onSelect,
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
      className: SEARCH_GEOPORTAIL_CLASS_NAME,
      placeholder,
      collapsed: false,
      noCollapse: true,
      maxHistory: SEARCH_ADDRESS_MAX_HISTORY,
    };
    (addressOptions as Record<string, unknown>).type = 'StreetAddress,PositionOfInterest';

    const addressSearch = new SearchGeoportail(addressOptions);
    addressSearch.set('copy', null);
    addressSearch.setMap(map);

    const container = addressContainerRef.current;
    const input = container.querySelector<HTMLInputElement>('input.search');

    const hideAutocomplete = () => {
      clearAutocompleteList(container, 'ul.autocomplete');
    };

    const keepFocusForSuggestionPick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const item = target.closest('ul.autocomplete li');
      if (item && !item.classList.contains('copy')) {
        event.preventDefault();
      }
    };

    const handleBlur = () => {
      window.setTimeout(hideAutocomplete, 200);
    };

    const handleFocus = () => {
      onFocus?.();
    };

    container.addEventListener('mousedown', keepFocusForSuggestionPick);
    container.addEventListener('pointerdown', keepFocusForSuggestionPick);
    input?.addEventListener('blur', handleBlur);
    input?.addEventListener('focus', handleFocus);

    addressSearch.on('select', (event: SearchEvent) => {
      if (event.coordinate) {
        showMarkerAtCoordinate(event.coordinate);
      }
      if (input) {
        const label =
          typeof event.search === 'object' &&
          event.search !== null &&
          'fulltext' in event.search &&
          typeof event.search.fulltext === 'string'
            ? event.search.fulltext
            : input.value;
        input.value = label;
      }
      hideAutocomplete();
      input?.blur();
      onSelect?.();
    });

    return () => {
      container.removeEventListener('mousedown', keepFocusForSuggestionPick);
      container.removeEventListener('pointerdown', keepFocusForSuggestionPick);
      input?.removeEventListener('blur', handleBlur);
      input?.removeEventListener('focus', handleFocus);
      addressSearch.setMap(null as unknown as Map);
      clearMarker();
    };
  }, [addressContainerRef, clearMarker, isOpen, map, onFocus, onSelect, placeholder, showMarkerAtCoordinate]);

  const selectHistoryEntry = useCallback(
    (entry: AddressSearchHistoryEntry) => {
      if (!map) {
        return;
      }

      const coordinate = fromLonLat([entry.longitude, entry.latitude]);
      showMarkerAtCoordinate(coordinate);

      const input = addressContainerRef.current?.querySelector<HTMLInputElement>('input.search');
      if (input) {
        input.value = entry.subtitle ? `${entry.title}, ${entry.subtitle}` : entry.title;
        input.blur();
      }

      onSelect?.();
    },
    [addressContainerRef, map, onSelect, showMarkerAtCoordinate],
  );

  return { clearMarker, selectHistoryEntry };
}
