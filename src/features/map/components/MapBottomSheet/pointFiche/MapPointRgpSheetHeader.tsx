import { useState } from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { distanceKm, formatDistanceFromReference } from '@/shared/utils/geo';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconCopy from '@/shared/assets/icons/icon-copy.svg?react';

import type { DistanceReference } from './MapPointSheetHeader';
import { buildRgpStationView } from './rgpStationFromAction';

import styles from './MapPointSheet.module.css';

const COPY_FEEDBACK_DURATION_MS = 1500;

export interface MapPointRgpSheetHeaderProps {
  action: MapGeodesyClickAction;
  referencePosition: DistanceReference | null;
}

export function MapPointRgpSheetHeader({ action, referencePosition }: MapPointRgpSheetHeaderProps) {
  const station = buildRgpStationView(action);
  const [isCopied, setIsCopied] = useState(false);

  const copyLabel = station.commune ? `${station.name} — ${station.commune}` : station.name;

  const handleCopyStationName = async () => {
    try {
      await navigator.clipboard.writeText(copyLabel);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), COPY_FEEDBACK_DURATION_MS);
    } catch {
      // Presse-papier indisponible.
    }
  };

  const distanceLabel = referencePosition
    ? formatDistanceFromReference(
        distanceKm(referencePosition, {
          longitude: action.point.longitude,
          latitude: action.point.latitude,
        }),
        referencePosition.kind,
      )
    : null;

  const metaParts = [station.commune, distanceLabel].filter(Boolean);

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{station.name}</h1>
          <button
            type="button"
            className={styles.copyButton}
            onClick={handleCopyStationName}
            onPointerDown={(event) => event.stopPropagation()}
            aria-label={isCopied ? 'Nom de station copié' : 'Copier le nom de la station'}
          >
            {isCopied ? (
              <IconCheck className={styles.copyIcon} aria-hidden />
            ) : (
              <IconCopy className={styles.copyIcon} aria-hidden />
            )}
          </button>
        </div>
      </div>
      {metaParts.length > 0 ? (
        <div className={styles.statusMetaRow}>
          <p className={styles.meta}>{metaParts.join('  •  ')}</p>
        </div>
      ) : null}
    </header>
  );
}