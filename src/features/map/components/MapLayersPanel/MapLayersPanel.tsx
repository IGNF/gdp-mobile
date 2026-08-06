import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';
import type { MapLayerSheetItem } from '@/features/map/types/mapLayerSheet';

import IconInfo from '@/shared/assets/icons/icon-info.svg?react';
import IconReset from '@/shared/assets/icons/icon-reset.svg?react';
import IconCheck from '@/shared/assets/icons/icon-check.svg?react';

import styles from './MapLayersPanel.module.css';

export interface MapLayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: readonly MapLayerSheetItem[];
  onOpacityChange: (layerId: string, opacity: number) => void;
  onInfo: (layerId: string) => void;
  onRefresh?: (layerId: string) => void;
}

export function MapLayersPanel({
  isOpen,
  onClose,
  items,
  onOpacityChange,
  onInfo,
  onRefresh,
}: MapLayersPanelProps) {
  return (
    <MapOverlaySheet isOpen={isOpen} onClose={onClose} ariaLabel="Couches de la carte">
      <div className={styles.layerGrid}> 
        {items.map((item) => (
          <div
            key={item.id}
            className={`${styles.layerCard} ${item.toggleDisabled ? styles.layerCardDisabled : ''}`}
          >
            <div className={`${styles.cardThumbnail} ${item.visible ? styles.cardThumbnailActive : ''}`}>
              <button
                type="button"
                className={styles.cardThumbnailButton}
                onClick={() => onOpacityChange(item.id, item.visible ? 0 : 100)}
                disabled={item.toggleDisabled}
                aria-label={item.visible ? `Masquer ${item.title}` : `Afficher ${item.title}`}
              >
                {item.thumbnail ? <img src={item.thumbnail} alt="" className={styles.cardThumbnailImage} /> : null}
                {item.visible ? (
                  <span className={styles.cardCheck}>
                    <IconCheck className={styles.cardCheckIcon} aria-hidden />
                  </span>
                ) : null}
              </button>
              <div className={styles.cardActions}>
                {item.showRefresh && onRefresh ? (
                  <button
                    type="button"
                    className={styles.cardActionButton}
                    onClick={() => onRefresh(item.id)}
                    aria-label={`Rafraîchir ${item.title}`}
                  >
                    <IconReset className={styles.cardActionIcon} aria-hidden />
                  </button>
                ) : null}
                {item.showInfo !== false ? (
                  <button
                    type="button"
                    className={styles.cardActionButton}
                    onClick={() => onInfo(item.id)}
                    aria-label={`Informations sur ${item.title}`}
                  >
                    <IconInfo className={styles.cardActionIcon} aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>

            <div className={styles.cardContent}>
              <p className={styles.cardTitle}>{item.title}</p>
            </div>
          </div>
        ))}
      </div>
    </MapOverlaySheet>
  );
}
