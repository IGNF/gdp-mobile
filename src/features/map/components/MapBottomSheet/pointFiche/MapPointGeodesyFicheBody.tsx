import { useMemo } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import {
  buildPointCarouselItems,
  collectAllPointFields,
  filterUnmappedPointFields,
  normalizeLabel,
  readProperty,
} from './pointFicheUtils';
import { getDisplayedFieldIds } from './getDisplayedFieldIds';
import { resolveGpsExploitabilityVariant } from './gpsExploitabilityBadge';
import { PartenaireSection } from './PartenaireSection';
import { PointCoordinatesSection } from './PointCoordinatesSection';
import { PointImageCarousel } from './PointImageCarousel';
import { UnmappedFieldsDebug } from './UnmappedFieldsDebug';
import IconAlertCircle from '@/shared/assets/icons/icon-alert-circle.svg?react';

import styles from './MapPointSheet.module.css';

export interface MapPointGeodesyFicheBodyProps {
  action: MapGeodesyClickAction;
  snapIndex: number;
}

function deriveDepartementFromInsee(insee: string | null): string | null {
  if (!insee) {
    return null;
  }

  const paddedInsee = insee.padStart(5, '0');
  return Number(insee) >= 97000 ? paddedInsee.slice(0, 3) : paddedInsee.slice(0, 2);
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
  const explGps = readProperty(action, 'expl_gps');
  const explGpsCode = readProperty(action, 'expl_gpscode');
  const explGpsVariant = explGps ? resolveGpsExploitabilityVariant(explGps, explGpsCode) : null;
  const explGpsLabel = explGpsVariant === 'inexploitable' ? 'Inexploitable' : 'Exploitable par GPS';
  const repereType = readProperty(action, 'type');
  const actDate = readProperty(action, 'action_date');
  const remark = readProperty(action, 'remarque');
  const partenaire = readProperty(action, 'proprio');
  const partenaireLogoUrl = readProperty(action, 'proprio_logo');

  const insee = readProperty(action, 'insee');
  const entiteNature = readProperty(action, 'entite_nature');
  const entiteNo = readProperty(action, 'entite_no');
  const entiteIsDepartement = entiteNature ? normalizeLabel(entiteNature).includes('DEPARTEMENT') : false;
  const departement = (entiteIsDepartement ? entiteNo : null) ?? deriveDepartementFromInsee(insee);
  const commune = readProperty(action, 'commune');
  const siteType = readProperty(action, 'groupe_type');
  const localisation = readProperty(action, 'localisation');
  const hasGeodesyDetails = departement || insee || commune || siteType || localisation;

  return (
    <>
      {snapIndex >= 1 ? (
        <>
          <PointImageCarousel items={carouselItems} />

          {actDate ? <p className={styles.carouselCaption}>Determiné en {actDate}</p> : null}

          <section>
            <h3 className={styles.sectionTitle}>Point géodésique</h3>
            <div className={styles.fieldGrid}>
              <FieldCard label="Numéro du point" value={pointNumber || null} />
              <FieldCard label="ID croquis" value={sketchId} />
            </div>
          </section>

          {localisation || explGps || repereType ? (
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
                <FieldCard label="Localisation" value={localisation} wide />
                <FieldCard label="Type" value={repereType} wide />
              </div>
            </section>
          ) : null}

          {hasGeodesyDetails ? (
            <section>
              <h3 className={styles.sectionTitle}>Détails</h3>
              <div className={styles.fieldGrid}>
                <FieldCard label="Département" value={departement} />
                <FieldCard label="Numéro Insee" value={insee} />
                <FieldCard label="Commune" value={commune} />
                <FieldCard label="Type du site" value={siteType} />
                <FieldCard label="Localisation" value={localisation} wide />
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {snapIndex >= 2 ? (
        <>
          <PointCoordinatesSection action={action} />

          {remark ? (
            <section>
              <h3 className={styles.sectionTitle}>Remarques</h3>
              <p className={styles.remarkBlock}>{remark}</p>
            </section>
          ) : null}

          {partenaire ? (
            <PartenaireSection name={partenaire} logoUrl={partenaireLogoUrl} />
          ) : null}
        </>
      ) : null}

      <UnmappedFieldsDebug fields={unmappedFields} />
    </>
  );
}
