import type { GdpRgp2DispoState } from '@ign/gdp-tools';

import type { NearestRgpStation } from '@/features/map/hooks/useNearestRgpStations';
import { Loading } from '@/shared/ui/Loading';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconReset from '@/shared/assets/icons/icon-reset.svg?react';
import { formatDateTime } from '@/shared/utils/date';
import { formatDistanceKm } from '@/shared/utils/geo';
import { joinCSSClassNames } from '@/shared/utils/join';
import layout from '@/shared/styles/tabPage.module.css';

import styles from './RgpStationsList.module.css';

export interface RgpStationsListProps {
  stations: readonly NearestRgpStation[];
  isLoading: boolean;
  isReloading: boolean;
  lastLoadedAt: Date | null;
  error: string | null;
  onRefresh: () => void;
  onSelectStation: (longitude: number, latitude: number) => void;
}

function RgpDispoIndicators({ states }: { states: readonly GdpRgp2DispoState[] }) {
  const indicators = states.length > 0 ? states : (['unavailable'] as const);

  return (
    <div className={styles.dispoGroup} aria-hidden>
      {indicators.map((state, index) => (
        <span
          key={`${state}-${index}`}
          className={state === 'available' ? styles.dispoOk : styles.dispoBad}
        >
          {state === 'available' ? (
            <IconCheck className={styles.dispoGlyph} />
          ) : (
            <IconClose className={styles.dispoGlyph} />
          )}
        </span>
      ))}
    </div>
  );
}

export function RgpStationsList({
  stations,
  isLoading,
  isReloading,
  lastLoadedAt,
  error,
  onRefresh,
  onSelectStation,
}: RgpStationsListProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.updateRow}>
        <p className={styles.updateText}>
          {lastLoadedAt
            ? `Dernière MAJ : ${formatDateTime(lastLoadedAt)}`
            : 'Données non chargées'}
        </p>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={isReloading}
        >
          <IconReset className={styles.refreshIcon} aria-hidden />
          {isReloading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Loading size="small" label="Chargement des stations…" />
        </div>
      ) : null}

      {error ? <p className={styles.error}>{error}</p> : null}

      {!isLoading && !error && stations.length === 0 ? (
        <p className={layout.empty}>Aucune station RGP à proximité.</p>
      ) : null}

      <ul className={layout.cardList}>
        {stations.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className={joinCSSClassNames(layout.card, styles.item)}
              onClick={() => onSelectStation(station.longitude, station.latitude)}
            >
              <RgpDispoIndicators states={station.dispoStates} />
              <span className={styles.itemText}>
                <span className={styles.name}>{station.name}</span>
                {station.commune ? <span className={styles.commune}>{station.commune}</span> : null}
              </span>
              <span className={styles.distance}>{formatDistanceKm(station.distanceKm)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
