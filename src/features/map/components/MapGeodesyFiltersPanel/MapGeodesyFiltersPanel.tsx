import { useState } from 'react';

import type {
  GeodesyWfsAttributeFilterDefinition,
  GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';
import { Button } from '@/shared/ui/Button';

import {
  trackGeodesyFiltersApplied,
  trackGeodesyFiltersResetDraft,
} from '@/infra/analytics/matomo';

import { GdpGeodesyFiltersForm } from './GdpGeodesyFiltersForm';
import {
  buildGeodesyFiltersMatomoSummary,
  countActiveMapGeodesyFilters,
  createDefaultMapGeodesyFilterValues,
} from './mapGeodesyFiltersUtils';

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
  // Réinitialise le brouillon à l'ouverture (transition false → true), pendant le rendu
  // plutôt que dans un effet : pas de resynchronisation externe, juste une remise à zéro
  // déclenchée par le changement de `isOpen`.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setDraftValues(values);
    }
  }

  if (!filters.length) {
    return null;
  }

  const activeCount = countActiveMapGeodesyFilters(filters, draftValues);

  const handleReset = () => {
    setDraftValues(createDefaultMapGeodesyFilterValues(filters));
    trackGeodesyFiltersResetDraft();
  };

  const handleApply = () => {
    const activeCount = countActiveMapGeodesyFilters(filters, draftValues);
    trackGeodesyFiltersApplied(buildGeodesyFiltersMatomoSummary(filters, draftValues), activeCount);
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
