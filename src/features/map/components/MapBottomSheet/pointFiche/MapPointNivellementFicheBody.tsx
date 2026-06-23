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
  const remark = readProperty(action, 'remarque') ;
  const altitudeType = formatSentenceCase(readProperty(action, 'cp1_altitude_type') ?? '');
  const partenaire = readProperty(action, 'proprio');
  // TODO: brancher l’URL logo quand disponible (ex. table partenaires / champ WFS dédié).
  const partenaireLogoUrl = readProperty(action, 'proprio_logo');

  return (
    <>
      {snapIndex >= 1 ? (
        <>
          <PointImageCarousel items={carouselItems} />

          <section>
            <h3 className={styles.sectionTitle}>Repère de nivellement</h3>
            <div className={styles.fieldGrid}>
              <FieldCard label="Système d'altitude" value={altitudeSystem} />
              <FieldCard label={altitudeType} value={altitude} />
              <FieldCard label="Complément" value={repereTypeComplement} />
              <FieldCard label="Type" value={repereType} />
            </div>
          </section>
        </>
      ) : null}

      {snapIndex >= 2 ? (
        <>
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

      {snapIndex >= 3 ? (
        <p className={styles.placeholderBlock}>Vue complète — à remplir.</p>
      ) : null}

      <UnmappedFieldsDebug fields={unmappedFields} />
    </>
  );
}
