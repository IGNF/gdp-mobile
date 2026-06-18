import {
  countActiveGeodesyWfsAttributeFilters,
  createDefaultGeodesyWfsAttributeFilterValues,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';
import { GeodesyWfsAttributeFiltersPanel } from '@ign/gdp-tools/react';

import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

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
  onClear,
}: MapGeodesyFiltersPanelProps) {
  if (!filters.length) {
    return null;
  }

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose} level={2}>
      <PageHeader title="Filtres repères" showBackButton showCloseButton={false} onBack={onClose} />
      <div className={styles.content}>
        <GeodesyWfsAttributeFiltersPanel
          filters={filters}
          values={values}
          onChange={onChange}
          onClear={onClear}
        />
      </div>
    </SlideUpPage>
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
