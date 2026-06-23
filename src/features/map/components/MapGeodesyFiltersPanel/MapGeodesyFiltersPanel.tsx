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
      ariaLabel="Filtres repères"
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

export function countActiveMapGeodesyFilters(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
  values: GeodesyWfsAttributeFilterValues,
): number {
  return countActiveGeodesyWfsAttributeFilters(filters, values);
}

export function createDefaultMapGeodesyFilterValues(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
): GeodesyWfsAttributeFilterValues {
  return createDefaultGeodesyWfsAttributeFilterValues(filters);
}
