import type {
  BuildGeodesyPointDisplayOptions,
  GeodesyFeatureInfoHit,
  GeodesyWfsAttributeFilterDefinition,
  GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';
import { shiftKeyOnly } from 'ol/events/condition';
import DragBox from 'ol/interaction/DragBox';
import type Map from 'ol/Map';
import { useEffect, useRef } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import { buildMapGeodesyClickActionFromHit } from './buildMapGeodesyClickActionFromHit';
import { fetchGeodesyHitsInMapExtent } from './fetchGeodesyHitsInMapExtent';

export interface UseWebPdfCartAreaSelectOptions {
  map: Map | null;
  isMapReady: boolean;
  enabled: boolean;
  /** Ignore un rectangle terminé pendant une requête en cours. */
  selectingDisabled?: boolean;
  displayOptions: BuildGeodesyPointDisplayOptions;
  wfsAttributeFilters?: readonly GeodesyWfsAttributeFilterDefinition[];
  wfsAttributeFilterValues?: GeodesyWfsAttributeFilterValues;
  onAreaSelectStart?: () => void;
  onAreaSelect: (actions: readonly MapGeodesyClickAction[]) => void;
  onAreaSelectError?: (message: string) => void;
}

export function useWebPdfCartAreaSelect({
  map,
  isMapReady,
  enabled,
  selectingDisabled = false,
  displayOptions,
  wfsAttributeFilters,
  wfsAttributeFilterValues,
  onAreaSelectStart,
  onAreaSelect,
  onAreaSelectError,
}: UseWebPdfCartAreaSelectOptions): void {
  const onAreaSelectRef = useRef(onAreaSelect);
  const onAreaSelectStartRef = useRef(onAreaSelectStart);
  const onAreaSelectErrorRef = useRef(onAreaSelectError);
  const displayOptionsRef = useRef(displayOptions);
  const fetchOptionsRef = useRef({
    wfsAttributeFilters,
    wfsAttributeFilterValues,
  });
  const selectingDisabledRef = useRef(selectingDisabled);

  useEffect(() => {
    selectingDisabledRef.current = selectingDisabled;
  }, [selectingDisabled]);

  useEffect(() => {
    onAreaSelectRef.current = onAreaSelect;
    onAreaSelectStartRef.current = onAreaSelectStart;
    onAreaSelectErrorRef.current = onAreaSelectError;
    displayOptionsRef.current = displayOptions;
    fetchOptionsRef.current = {
      wfsAttributeFilters,
      wfsAttributeFilterValues,
    };
  }, [
    displayOptions,
    onAreaSelect,
    onAreaSelectError,
    onAreaSelectStart,
    wfsAttributeFilterValues,
    wfsAttributeFilters,
  ]);

  useEffect(() => {
    if (!map || !isMapReady || !enabled) {
      return;
    }

    const dragBox = new DragBox({
      className: 'gdp-pdf-cart-dragbox',
      minArea: 16,
      condition: shiftKeyOnly,
    });

    const handleBoxEnd = () => {
      if (selectingDisabledRef.current) {
        return;
      }

      const extent = dragBox.getGeometry().getExtent();
      onAreaSelectStartRef.current?.();

      void (async () => {
        try {
          const hits = await fetchGeodesyHitsInMapExtent(map, extent, fetchOptionsRef.current);
          const actions = hits.map((hit: GeodesyFeatureInfoHit) =>
            buildMapGeodesyClickActionFromHit(hit, displayOptionsRef.current),
          );
          onAreaSelectRef.current(actions);
        } catch {
          onAreaSelectErrorRef.current?.(
            'Impossible d’interroger les repères dans cette zone. Réessayez sur une zone plus petite.',
          );
          onAreaSelectRef.current([]);
        }
      })();
    };

    dragBox.on('boxend', handleBoxEnd);
    map.addInteraction(dragBox);

    return () => {
      dragBox.un('boxend', handleBoxEnd);
      map.removeInteraction(dragBox);
    };
  }, [enabled, isMapReady, map]);
}
