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
  const actDate = readProperty(action, 'action_date');
  const remark = action.point.comment.trim() || null;

  const voieSuivie = readProperty(action, 'voie_suivie');
  const voieDe = readProperty(action, 'voie_de');
  const voieVers = readProperty(action, 'voie_vers');
  const voieSuivieValue = [voieSuivie, voieDe && voieVers ? `De ${voieDe} à ${voieVers}` : null]
    .filter(Boolean)
    .join(', ') || null;

  const voisinDistance = readProperty(action, 'voisin_distance');
  const voisin = readProperty(action, 'voisin');
  const distance = voisinDistance ? `${voisinDistance} Km${voisin ? ` du repère ${voisin}` : ''}` : null;

  const cote = readProperty(action, 'voie_cote');
  const support = readProperty(action, 'support');
  const supportPart = readProperty(action, 'support_part');

  const repHori = readProperty(action, 'rep_hori');
  const repVert = readProperty(action, 'rep_vert');
  const reperements = [repHori, repVert].filter(Boolean).join('; ') || null;

  const hasDetails = voieSuivieValue || distance || cote || support || supportPart || reperements;

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
                <FieldCard label="Localisation" value={description} wide />
                <FieldCard label="Type" value={repereType} wide />
              </div>
            </section>
          ) : null}

          {hasDetails ? (
            <section>
              <h3 className={styles.sectionTitle}>Détails</h3>
              <div className={styles.fieldGrid}>
                <FieldCard label="Voie suivie" value={voieSuivieValue} wide />
                <FieldCard label="Distance" value={distance} wide />
                <FieldCard label="Côté" value={cote} />
                <FieldCard label="Support" value={support} />
                <FieldCard label="Partie support" value={supportPart} wide />
                <FieldCard label="Repèrements" value={reperements} wide />
              </div>
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
