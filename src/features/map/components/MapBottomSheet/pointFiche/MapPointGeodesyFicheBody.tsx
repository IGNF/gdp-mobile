import { useMemo } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import {
  buildPointCarouselItems,
  collectAllPointFields,
  filterUnmappedPointFields,
  readProperty,
} from './pointFicheUtils';
import { getDisplayedFieldIds } from './getDisplayedFieldIds';
import { resolveGpsExploitabilityVariant } from './gpsExploitabilityBadge';
import { PointCoordinatesSection } from './PointCoordinatesSection';
import { PointImageCarousel } from './PointImageCarousel';
import { UnmappedFieldsDebug } from './UnmappedFieldsDebug';
import IconAlertCircle from '@/shared/assets/icons/icon-alert-circle.svg?react';

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
  const explGpsCode = readProperty(action, 'expl_gpscode');
  const explGpsVariant = explGps ? resolveGpsExploitabilityVariant(explGps, explGpsCode) : null;
  const explGpsLabel = explGpsVariant === 'inexploitable' ? 'Inexploitable' : 'Exploitable par GPS';
  const repereType = readProperty(action, 'type');
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

          {description || explGps || repereType ? (
            <section>
              <div className={styles.descriptionHeader}>
                <h3 className={styles.sectionTitle}>Description</h3>
                {explGps ? (
                  <span className={styles.gpsExploitabilityBadge} data-variant={explGpsVariant}>
                    <IconAlertCircle className={styles.gpsExploitabilityIcon} aria-hidden />
                    {explGpsLabel}
                  </span>
                ) : null}
              </div>
              <div className={styles.fieldGrid}>
                <FieldCard label="Type" value={repereType} wide />
              </div>
              {description ? <p className={styles.textBlock}>{description}</p> : null}
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
