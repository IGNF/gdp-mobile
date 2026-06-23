import type { GdpRgp2DispoState } from '@ign/gdp-tools';

import type { NearestRgpStation } from '@/features/map/hooks/useNearestRgpStations';
import { Loading } from '@/shared/ui/Loading';
import IconArrowLeft from '@/shared/assets/icons/icon-arrow-left.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconReset from '@/shared/assets/icons/icon-reset.svg?react';
import { formatDateTime } from '@/shared/utils/date';
import { formatDistanceKm } from '@/shared/utils/geo';

import styles from './MapBottomSheet.module.css';

export interface BrowseRgpStationsListProps {
  stations: readonly NearestRgpStation[];
  isLoading: boolean;
  isReloading: boolean;
  lastLoadedAt: Date | null;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onSelectStation: (longitude: number, latitude: number) => void;
}

function RgpDispoIndicators({ states }: { states: readonly GdpRgp2DispoState[] }) {
  const indicators = states.length > 0 ? states : (['unavailable'] as const);

  return (
    <div className={styles.rgpDispoGroup} aria-hidden>
      {indicators.map((state, index) => (
        <span
          key={`${state}-${index}`}
          className={state === 'available' ? styles.rgpDispoOk : styles.rgpDispoBad}
        >
          {state === 'available' ? (
            <IconCheck className={styles.rgpDispoGlyph} />
          ) : (
            <IconClose className={styles.rgpDispoGlyph} />
          )}
        </span>
      ))}
    </div>
  );
}

export function BrowseRgpStationsList({
  stations,
  isLoading,
  isReloading,
  lastLoadedAt,
  error,
  onBack,
  onRefresh,
  onSelectStation,
}: BrowseRgpStationsListProps) {
  return (
    <div className={styles.browseRgpPanel}>
      <header className={styles.browseRgpHeader}>
        <button type="button" className={styles.browseRgpBackButton} onClick={onBack} aria-label="Retour">
          <IconArrowLeft className={styles.browseRgpBackIcon} aria-hidden />
        </button>
        <h2 className={styles.browseRgpTitle}>Stations RGP</h2>
      </header>

      <div className={styles.rgpUpdateRow}>
        <p className={styles.rgpUpdateText}>
          {lastLoadedAt
            ? `Dernière MAJ : ${formatDateTime(lastLoadedAt)}`
            : 'Données non chargées'}
        </p>
        <button
          type="button"
          className={styles.rgpRefreshButton}
          onClick={onRefresh}
          disabled={isReloading}
        >
          <IconReset className={styles.rgpRefreshIcon} aria-hidden />
          {isReloading ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {isLoading ? (
        <div className={styles.rgpLoading}>
          <Loading size="small" label="Chargement des stations…" />
        </div>
      ) : null}

      {error ? <p className={styles.rgpError}>{error}</p> : null}

      {!isLoading && !error && stations.length === 0 ? (
        <p className={styles.rgpEmpty}>Aucune station RGP à proximité.</p>
      ) : null}

      <ul className={styles.rgpList}>
        {stations.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className={styles.rgpItem}
              onClick={() => onSelectStation(station.longitude, station.latitude)}
            >
              <RgpDispoIndicators states={station.dispoStates} />
              <span className={styles.rgpItemText}>
                <span className={styles.rgpName}>{station.name}</span>
                {station.commune ? <span className={styles.rgpCommune}>{station.commune}</span> : null}
              </span>
              <span className={styles.rgpDistance}>{formatDistanceKm(station.distanceKm)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
