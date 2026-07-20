import { useMemo } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import {
  buildPointCarouselItems,
  collectAllPointFields,
  filterUnmappedPointFields,
  readProperty,
} from './pointFicheUtils';
import { getDisplayedFieldIds } from './getDisplayedFieldIds';
import { PointCoordinatesSection } from './PointCoordinatesSection';
import { PointImageCarousel } from './PointImageCarousel';
import { UnmappedFieldsDebug } from './UnmappedFieldsDebug';

import styles from './MapPointSheet.module.css';

export interface MapPointGeodesyFicheBodyProps {
  action: MapGeodesyClickAction;
  snapIndex: number;
}

function FieldCard({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  if (!value) {
    return null;
  }

  return (
    <div className={wide ? `${styles.fieldCard} ${styles.fieldCardWide}` : styles.fieldCard}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldValue}>{value}</span>
    </div>
  );
}

export function MapPointGeodesyFicheBody({ action, snapIndex }: MapPointGeodesyFicheBodyProps) {
  const carouselItems = useMemo(() => buildPointCarouselItems(action), [action]);
  const unmappedFields = useMemo(() => {
    const displayedIds = getDisplayedFieldIds('geodesy', snapIndex);
    return filterUnmappedPointFields(collectAllPointFields(action), displayedIds);
  }, [action, snapIndex]);

  const pointNumber = [readProperty(action, 'nom'), readProperty(action, 'no')].filter(Boolean).join(' — ');
  const sketchId = readProperty(action, 'id') ?? action.reportContext.geodesyId ?? null;
  const description = readProperty(action, 'localisation');
  const explGps = readProperty(action, 'expl_gps');
  const commune = readProperty(action, 'commune');
  const pdfUrl = readProperty(action, 'url_pdf');
  const majDate = readProperty(action, 'maj_date');
  const remark = action.point.comment.trim() || null;

  return (
    <>
      {snapIndex >= 1 ? (
        <>
          <PointImageCarousel items={carouselItems} />

          {majDate ? <p className={styles.carouselCaption}>Determiné en {majDate}</p> : null}

          <section>
            <h3 className={styles.sectionTitle}>Point géodésique</h3>
            <div className={styles.fieldGrid}>
              <FieldCard label="Numéro du point" value={pointNumber || null} />
              <FieldCard label="ID croquis" value={sketchId} />
            </div>
          </section>

          {description || explGps ? (
            <section>
              <div className={styles.fieldGrid}>
                {explGps ? (
                  <div className={`${styles.fieldCard} ${styles.fieldCardWide}`}>
                    <span className={styles.fieldLabel}>Exploitabilité GPS</span>
                    <span className={styles.badge}>{explGps}</span>
                  </div>
                ) : null}
              </div>
              {description ? (
                <>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <p className={styles.textBlock}>{description}</p>
                </>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      {snapIndex >= 2 ? (
        <>
          <PointCoordinatesSection action={action} />

          {commune || pdfUrl ? (
            <section>
              <div className={styles.fieldGrid}>
                <FieldCard label="Commune" value={commune} wide />
                <FieldCard label="Fiche PDF" value={pdfUrl} wide />
              </div>
            </section>
          ) : null}

          {remark ? (
            <section>
              <h3 className={styles.sectionTitle}>Remarques</h3>
              <p className={styles.remarkBlock}>{remark}</p>
            </section>
          ) : null}

          <section>
            <h3 className={styles.sectionTitle}>Partenaire</h3>
            <p className={styles.placeholderBlock}>Informations partenaire — à remplir.</p>
          </section>
        </>
      ) : null}

      {snapIndex >= 3 ? (
        <p className={styles.placeholderBlock}>Vue complète — à remplir.</p>
      ) : null}

      <UnmappedFieldsDebug fields={unmappedFields} />
    </>
  );
}
