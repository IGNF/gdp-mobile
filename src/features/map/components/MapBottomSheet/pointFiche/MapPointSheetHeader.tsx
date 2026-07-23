import { useState } from 'react';
import { GeodesyPointTitle } from '@ign/gdp-tools/react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { formatDistanceFromMapCenter, distanceKm } from '@/shared/utils/geo';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconCopy from '@/shared/assets/icons/icon-copy.svg?react';
import IconHeart from '@/shared/assets/icons/icon-heart.svg?react';
import IconPdf from '@/shared/assets/icons/icon-pdf.svg?react';

import { findEtatLabel, findVisitYear, isBonEtatLabel, readProperty } from './pointFicheUtils';

import styles from './MapPointSheet.module.css';

const COPY_FEEDBACK_DURATION_MS = 1500;

export interface MapPointSheetHeaderProps {
  action: MapGeodesyClickAction;
  referencePosition: { longitude: number; latitude: number } | null;
}

export function MapPointSheetHeader({ action, referencePosition }: MapPointSheetHeaderProps) {
  const { point } = action;
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPointTitle = async () => {
    try {
      await navigator.clipboard.writeText(point.title);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch {
      // Presse-papier indisponible (permissions, contexte non sécurisé) — pas de retour visuel.
    }
  };

  // TODO: supprimer l'affichage debug de l'id repère (pointId + bloc JSX + .debug-banner dans global.css).
  const pointId = action.reportContext.geodesyId ?? readProperty(action, 'id');
  const etatLabel = findEtatLabel(action);
  const visitYear = findVisitYear(action);
  const pdfUrl = readProperty(action, 'url_pdf');

  const distanceLabel = referencePosition
    ? formatDistanceFromMapCenter(
        distanceKm(referencePosition, {
          longitude: point.longitude,
          latitude: point.latitude,
        }),
      )
    : null;

  const metaParts = [visitYear ? `Visité en ${visitYear}` : null, distanceLabel].filter(Boolean);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.titleRow}>
          <GeodesyPointTitle title={point.title} picto={point.titlePicto} className={styles.title} />
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopyPointTitle}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={isCopied ? 'Numéro de point copié' : 'Copier le numéro de point'}
          >
            {isCopied ? (
              <IconCheck className={styles.copyIcon} aria-hidden />
            ) : (
              <IconCopy className={styles.copyIcon} aria-hidden />
            )}
          </button>
          {pdfUrl ? (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.copyButton}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label="Ouvrir la fiche PDF"
            >
              <IconPdf className={styles.copyIcon} aria-hidden />
            </a>
          ) : null}
        </div>
        <button type="button" className={styles.favoriteButton} aria-label="Favori (à venir)" disabled>
          <IconHeart className={styles.favoriteIcon} aria-hidden />
        </button>
      </div>
      {/* TODO: supprimer — debug id repère */}
      {pointId ? <p className="debug-banner">DEBUG — id : {pointId}</p> : null}

      {etatLabel || metaParts.length > 0 ? (
        <div className={styles.statusMetaRow}>
          {etatLabel ? (
            <span
              className={joinCSSClassNames(
                styles.statusBadge,
                isBonEtatLabel(etatLabel) && styles.statusBadgeGood,
              )}
            >
              {etatLabel}
            </span>
          ) : null}

          {metaParts.length > 0 ? <p className={styles.meta}>{metaParts.join('  •  ')}</p> : null}
        </div>
      ) : null}
    </header>
  );
}
