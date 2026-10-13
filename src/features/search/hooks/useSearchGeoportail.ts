import { useCallback, useEffect } from 'react';

import type Map from 'ol/Map';
import type { Coordinate } from 'ol/coordinate';
import SearchGeoportail from 'ol-ext/control/SearchGeoportail';
import type { Options as SearchGeoportailOptions } from 'ol-ext/control/SearchGeoportail';
import type { SearchEvent } from 'ol-ext/control/Search';
import 'ol-ext/control/Search.css';

import {
  GEOPORTAIL_API_KEY,
  SEARCH_ADDRESS_MAX_HISTORY,
} from '@/shared/constants/map';
import { SEARCH_GEOPORTAIL_CLASS_NAME } from '@/features/search/constants/searchGeoportail';
import type { AddressSearchHistoryEntry } from '@/features/search/utils/addressSearchHistory';
import { fromLonLat } from 'ol/proj';

interface UseSearchGeoportailOptions {
  map: Map | null;
  /** Conteneur DOM actuel — à passer via callback ref, pas un `useRef` (le nœud peut être remonté). */
  addressContainer: HTMLElement | null;
  isOpen: boolean;
  placeholder?: string;
  /** Coordonnée du résultat choisi, en projection carte. */
  onSelect?: (coordinate: Coordinate) => void;
}

export interface UseSearchGeoportailReturn {
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
  addressContainer,
  isOpen,
  placeholder = 'Rechercher une adresse',
  onSelect,
}: UseSearchGeoportailOptions): UseSearchGeoportailReturn {
  useEffect(() => {
    if (!map || !isOpen || !addressContainer) {
      return;
    }

    const addressOptions: SearchGeoportailOptions = {
      target: addressContainer,
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

    const container = addressContainer;
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

    container.addEventListener('mousedown', keepFocusForSuggestionPick);
    container.addEventListener('pointerdown', keepFocusForSuggestionPick);
    input?.addEventListener('blur', handleBlur);

    addressSearch.on('select', (event: SearchEvent) => {
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
      if (event.coordinate) {
        onSelect?.(event.coordinate);
      }
    });

    return () => {
      container.removeEventListener('mousedown', keepFocusForSuggestionPick);
      container.removeEventListener('pointerdown', keepFocusForSuggestionPick);
      input?.removeEventListener('blur', handleBlur);
      addressSearch.setMap(null as unknown as Map);
    };
  }, [addressContainer, isOpen, map, onSelect, placeholder]);

  const selectHistoryEntry = useCallback(
    (entry: AddressSearchHistoryEntry) => {
      const input = addressContainer?.querySelector<HTMLInputElement>('input.search');
      if (input) {
        input.value = entry.subtitle ? `${entry.title}, ${entry.subtitle}` : entry.title;
        input.blur();
      }

      onSelect?.(fromLonLat([entry.longitude, entry.latitude]));
    },
    [addressContainer, onSelect],
  );

  return { selectHistoryEntry };
}
