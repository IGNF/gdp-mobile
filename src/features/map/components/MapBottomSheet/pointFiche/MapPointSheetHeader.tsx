import { useState } from 'react';
import { GeodesyPointTitle } from '@ign/gdp-tools/react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { distanceKm, formatDistanceFromReference } from '@/shared/utils/geo';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconCopy from '@/shared/assets/icons/icon-copy.svg?react';
// Favori désactivé pour cette version — sera réactivé avec la fonctionnalité (cf. bouton commenté ci-dessous).
// import IconHeart from '@/shared/assets/icons/icon-heart.svg?react';

import { findEtatLabel, findVisitYear, formatEtatLabel, isBonEtatLabel } from './pointFicheUtils';

import styles from './MapPointSheet.module.css';

const COPY_FEEDBACK_DURATION_MS = 1500;

/** Point de départ de la distance affichée : l'utilisateur (GPS actif) ou le centre de la carte. */
export interface DistanceReference {
  longitude: number;
  latitude: number;
  kind: 'user' | 'mapCenter';
}

export interface MapPointSheetHeaderProps {
  action: MapGeodesyClickAction;
  referencePosition: DistanceReference | null;
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

  const etatLabel = findEtatLabel(action);
  const visitYear = findVisitYear(action);

  const distanceLabel = referencePosition
    ? formatDistanceFromReference(
        distanceKm(referencePosition, {
          longitude: point.longitude,
          latitude: point.latitude,
        }),
        referencePosition.kind,
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
        </div>
        {/* Favori désactivé pour cette version — fonctionnalité prévue pour une version ultérieure.
        <button type="button" className={styles.favoriteButton} aria-label="Favori (à venir)" disabled>
          <IconHeart className={styles.favoriteIcon} aria-hidden />
        </button>
        */}
      </div>
      {etatLabel || metaParts.length > 0 ? (
        <div className={styles.statusMetaRow}>
          {etatLabel ? (
            <span
              className={joinCSSClassNames(
                styles.statusBadge,
                isBonEtatLabel(etatLabel) && styles.statusBadgeGood,
              )}
            >
              {formatEtatLabel(etatLabel)}
            </span>
          ) : null}

          {metaParts.length > 0 ? <p className={styles.meta}>{metaParts.join('  •  ')}</p> : null}
        </div>
      ) : null}
    </header>
  );
}
