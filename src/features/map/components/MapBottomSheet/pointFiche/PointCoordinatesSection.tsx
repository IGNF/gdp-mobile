import { useMemo, useState } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import {
  buildPointCoordinatesView,
  type CoordinateField,
  type CoordinateTabId,
} from './pointFicheCoordinates';

import styles from './MapPointSheet.module.css';

export interface PointCoordinatesSectionProps {
  action: MapGeodesyClickAction;
}

function CoordinateFieldCard({ label, value, wide = false }: CoordinateField) {
  return (
    <div className={wide ? `${styles.fieldCard} ${styles.fieldCardWide}` : styles.fieldCard}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

export function PointCoordinatesSection({ action }: PointCoordinatesSectionProps) {
  const coordinates = useMemo(() => buildPointCoordinatesView(action), [action]);
  const [activeTab, setActiveTab] = useState<CoordinateTabId>(coordinates.defaultTab);

  const hasGeographic = coordinates.geographic.length > 0;
  const hasProjection = coordinates.projection.length > 0;

  if (!hasGeographic && !hasProjection) {
    return null;
  }

  const resolvedTab: CoordinateTabId =
    activeTab === 'geographic' && hasGeographic
      ? 'geographic'
      : activeTab === 'projection' && hasProjection
        ? 'projection'
        : coordinates.defaultTab;

  const resolvedFields = resolvedTab === 'geographic' ? coordinates.geographic : coordinates.projection;

  return (
    <section className={styles.coordSection}>
      <h3 className={styles.sectionTitle}>Coordonnées</h3>
      <div className={styles.coordTabs} role="tablist" aria-label="Type de coordonnées">
        <button
          type="button"
          role="tab"
          className={resolvedTab === 'geographic' ? styles.coordTabActive : styles.coordTab}
          aria-selected={resolvedTab === 'geographic'}
          disabled={!hasGeographic}
          onClick={() => setActiveTab('geographic')}
        >
          Géographique
        </button>
        <button
          type="button"
          role="tab"
          className={resolvedTab === 'projection' ? styles.coordTabActive : styles.coordTab}
          aria-selected={resolvedTab === 'projection'}
          disabled={!hasProjection}
          onClick={() => setActiveTab('projection')}
        >
          Projection
        </button>
      </div>

      <div
        className={styles.coordPanel}
        role="tabpanel"
        aria-label={resolvedTab === 'geographic' ? 'Coordonnées géographiques' : 'Coordonnées projetées'}
      >
        {resolvedFields.length > 0 ? (
          <div className={styles.fieldGrid}>
            {resolvedFields.map((field) => (
              <CoordinateFieldCard key={`${resolvedTab}-${field.label}`} {...field} />
            ))}
          </div>
        ) : (
          <p className={styles.placeholderBlock}>Aucune coordonnée disponible pour cet onglet.</p>
        )}
      </div>
    </section>
  );
}
