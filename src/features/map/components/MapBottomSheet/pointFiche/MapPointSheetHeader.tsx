import { GeodesyPointTitle } from '@ign/gdp-tools/react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { formatDistanceFromMapCenter, distanceKm } from '@/shared/utils/geo';
import { joinCSSClassNames } from '@/shared/utils/join';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconHeart from '@/shared/assets/icons/icon-heart.svg?react';

import { findEtatLabel, findVisitYear, isBonEtatLabel, readProperty } from './pointFicheUtils';

import styles from './MapPointSheet.module.css';

export interface MapPointSheetHeaderProps {
  action: MapGeodesyClickAction;
  referencePosition: { longitude: number; latitude: number } | null;
  onClose: () => void;
}

export function MapPointSheetHeader({ action, referencePosition, onClose }: MapPointSheetHeaderProps) {
  const { point } = action;
  // TODO: supprimer l'affichage debug de l'id repère (pointId + bloc JSX + .debug-banner dans global.css).
  const pointId = action.reportContext.geodesyId ?? readProperty(action, 'id');
  const etatLabel = findEtatLabel(action);
  const visitYear = findVisitYear(action);

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
          <button type="button" className={styles.favoriteButton} aria-label="Favori (à venir)" disabled>
            <IconHeart className={styles.favoriteIcon} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label="Fermer la fiche"
        >
          <IconClose className={styles.closeIcon} aria-hidden />
        </button>
      </div>
      {/* TODO: supprimer — debug id repère */}
      {pointId ? <p className="debug-banner">DEBUG — id : {pointId}</p> : null}

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

      {metaParts.length > 0 ? <p className={styles.meta}>{metaParts.join(' • ')}</p> : null}
    </header>
  );
}
