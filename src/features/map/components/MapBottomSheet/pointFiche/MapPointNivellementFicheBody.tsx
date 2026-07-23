import { useMemo } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import {
  buildPointCarouselItems,
  collectAllPointFields,
  filterUnmappedPointFields,
  formatSentenceCase,
  readProperty,
  stripAltitudeSystemLabel,
} from './pointFicheUtils';
import { getDisplayedFieldIds } from './getDisplayedFieldIds';
import { PointCoordinatesSection } from './PointCoordinatesSection';
import { PointImageCarousel } from './PointImageCarousel';
import { PartenaireSection } from './PartenaireSection';
import { UnmappedFieldsDebug } from './UnmappedFieldsDebug';

import styles from './MapPointSheet.module.css';

export interface MapPointNivellementFicheBodyProps {
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

export function MapPointNivellementFicheBody({ action, snapIndex }: MapPointNivellementFicheBodyProps) {
  const carouselItems = useMemo(() => buildPointCarouselItems(action), [action]);
  const unmappedFields = useMemo(() => {
    const displayedIds = getDisplayedFieldIds('nivellement', snapIndex);
    return filterUnmappedPointFields(collectAllPointFields(action), displayedIds);
  }, [action, snapIndex]);

  const altitudeSystemRaw =
    readProperty(action, 'cp1_srv') ??
    readProperty(action, 'systeme_altitude');
  const altitudeSystem = altitudeSystemRaw
    ? stripAltitudeSystemLabel(altitudeSystemRaw)
    : null;
  const altitude =
    readProperty(action, 'cp1_coord3') + " m" ;

  const repereTypeComplement = readProperty(action, 'complement');
  const repereType = readProperty(action, 'type');
  const actDate = readProperty(action, 'action_date');
  const remark = readProperty(action, 'remarque') ;
  const altitudeType = formatSentenceCase(readProperty(action, 'cp1_altitude_type') ?? '');
  const partenaire = readProperty(action, 'proprio');
  // TODO: brancher l’URL logo quand disponible (ex. table partenaires / champ WFS dédié).
  const partenaireLogoUrl = readProperty(action, 'proprio_logo');

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
  const localisation = readProperty(action, 'localisation');
  const supportPart = readProperty(action, 'support_part');

  const repHori = readProperty(action, 'rep_hori');
  const repVert = readProperty(action, 'rep_vert');
  const reperements = [repHori, repVert].filter(Boolean).join('; ') || null;

  const hasDetails =
    voieSuivieValue || distance || cote || support || localisation || supportPart || reperements;

  return (
    <>
      {snapIndex >= 1 ? (
        <>
          <PointImageCarousel items={carouselItems} />

          {actDate ? <p className={styles.carouselCaption}>Determiné en {actDate}</p> : null}

          <section>
            <h3 className={styles.sectionTitle}>Repère de nivellement</h3>
            <div className={styles.fieldGrid}>
              <FieldCard label="Système d'altitude" value={altitudeSystem} />
              <FieldCard label={altitudeType} value={altitude} />
              <FieldCard label="Complément" value={repereTypeComplement} />
              <FieldCard label="Type" value={repereType} />
            </div>
          </section>

          {hasDetails ? (
            <section>
              <h3 className={styles.sectionTitle}>Détails</h3>
              <div className={styles.fieldGrid}>
                <FieldCard label="Voie suivie" value={voieSuivieValue} wide />
                <FieldCard label="Distance" value={distance} wide />
                <FieldCard label="Côté" value={cote} />
                <FieldCard label="Support" value={support} />
                <FieldCard label="Localisation" value={localisation} wide />
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

          {/* Partenaire avant remarques */}
          {partenaire ? (
            <PartenaireSection name={partenaire} logoUrl={partenaireLogoUrl} />
          ) : null}


          {remark ? (
            <section>
              <h3 className={styles.sectionTitle}>Remarques</h3>
              <p className={styles.remarkBlock}>{remark}</p>
            </section>
          ) : null}
        </>
      ) : null}

      <UnmappedFieldsDebug fields={unmappedFields} />
    </>
  );
}
