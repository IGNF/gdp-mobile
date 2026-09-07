import { useEffect, useState } from 'react';

import {
  countActiveGeodesyWfsAttributeFilters,
  createDefaultGeodesyWfsAttributeFilterValues,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';
import { Button } from '@/shared/ui/Button';

import { GdpGeodesyFiltersForm } from './GdpGeodesyFiltersForm';

import styles from './MapGeodesyFiltersPanel.module.css';

export interface MapGeodesyFiltersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: readonly GeodesyWfsAttributeFilterDefinition[];
  values: GeodesyWfsAttributeFilterValues;
  onChange: (values: GeodesyWfsAttributeFilterValues) => void;
  onClear: () => void;
}

export function MapGeodesyFiltersPanel({
  isOpen,
  onClose,
  filters,
  values,
  onChange,
}: MapGeodesyFiltersPanelProps) {
  const [draftValues, setDraftValues] = useState(values);

  useEffect(() => {
    if (isOpen) {
      setDraftValues(values);
    }
  }, [isOpen, values]);

  if (!filters.length) {
    return null;
  }

  const activeCount = countActiveMapGeodesyFilters(filters, draftValues);

  const handleReset = () => {
    setDraftValues(createDefaultMapGeodesyFilterValues(filters));
  };

  const handleApply = () => {
    onChange(draftValues);
    onClose();
  };

  return (
    <MapOverlaySheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filtres"
      titleAlign="left"
      titleBadge={activeCount > 0 ? activeCount : undefined}
      sheetClassName={styles.sheetLarge}
      ariaLabel="Filtres des points"
      draggable
      footer={
        <div className={styles.footer}>
          <Button type="button" variant="outline" fullWidth onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button type="button" fullWidth onClick={handleApply}>
            Appliquer
          </Button>
        </div>
      }
    >
      <div className={styles.sheetContent}>
        <GdpGeodesyFiltersForm filters={filters} values={draftValues} onChange={setDraftValues} />
      </div>
    </MapOverlaySheet>
  );
}

function isActiveDateFilterValue(value: boolean | string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

// Chaque paire FROM/TO forme un seul filtre visuellement (une paire de cellules "Du"/"Au"),
// mais compte pour 2 côté gdp-tools (une par id) : on déduit 1 par paire active pour refléter
// un seul filtre dans le badge.
const DATE_RANGE_FILTER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['OBS_DATE_FROM', 'OBS_DATE_TO'],
  ['VIS_DATE_FROM', 'VIS_DATE_TO'],
];

export function countActiveMapGeodesyFilters(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
  values: GeodesyWfsAttributeFilterValues,
): number {
  const baseCount = countActiveGeodesyWfsAttributeFilters(filters, values);

  const activeRangePairs = DATE_RANGE_FILTER_PAIRS.filter(
    ([fromId, toId]) => isActiveDateFilterValue(values[fromId]) && isActiveDateFilterValue(values[toId]),
  ).length;

  return baseCount - activeRangePairs;
}

export function createDefaultMapGeodesyFilterValues(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
): GeodesyWfsAttributeFilterValues {
  return createDefaultGeodesyWfsAttributeFilterValues(filters);
}
