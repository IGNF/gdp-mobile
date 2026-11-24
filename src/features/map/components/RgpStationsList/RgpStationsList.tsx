import { GDP_RGP2_AVAILABILITY_COLORS, GDP_RGP2_AVAILABILITY_LABELS } from '@ign/gdp-tools';

import type { NearestRgpStation } from '@/features/map/hooks/useNearestRgpStations';
import { RgpDispoIndicators } from '@/features/map/components/rgp/RgpDispoIndicators';
import ui from '@/features/map/components/rgp/rgpStationUi.module.css';
import { Loading } from '@/shared/ui/Loading';
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
              <RgpDispoIndicators level={station.availabilityLevel} states={station.dispoStates} />
              <span className={styles.itemText}>
                <span className={ui.nameRow}>
                  <span
                    className={ui.statusDot}
                    style={{ background: GDP_RGP2_AVAILABILITY_COLORS[station.availabilityLevel] }}
                    role="img"
                    aria-label={GDP_RGP2_AVAILABILITY_LABELS[station.availabilityLevel]}
                  />
                  <span className={ui.stationName}>{station.name}</span>
                </span>
                {station.commune ? <span className={ui.commune}>{station.commune}</span> : null}
              </span>
              <span className={styles.distance}>{formatDistanceKm(station.distanceKm)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
