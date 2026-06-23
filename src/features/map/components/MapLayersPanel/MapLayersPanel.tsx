import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';
import type { MapLayerSheetItem } from '@/features/map/types/mapLayerSheet';
import { Slider } from '@/shared/ui/Slider';

import IconDrag from '@/shared/assets/icons/icon-drag\'n-drop.svg?react';
import IconInfo from '@/shared/assets/icons/icon-info.svg?react';
import IconReset from '@/shared/assets/icons/icon-reset.svg?react';

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
      {/* TODO: panneau couches — en cours de développement, à remplir. */}
      <p className="debug-banner">DOING — en cours de développement</p>
      <ul className={styles.layerList}>
        {items.map((item) => (
          <li
            key={item.id}
            className={item.toggleDisabled ? `${styles.layerRow} ${styles.layerRowDisabled}` : styles.layerRow}
          >
            <span className={styles.dragHandle} aria-hidden>
              <IconDrag className={styles.dragIcon} />
            </span>

            <div className={styles.thumbnail} aria-hidden />

            <div className={styles.layerBody}>
              <div className={styles.layerTitleRow}>
                <div className={styles.layerTitleBlock}>
                  <span className={styles.layerTitle}>{item.title}</span>
                  {item.subtitle ? <span className={styles.layerSubtitle}>{item.subtitle}</span> : null}
                </div>
                <div className={styles.layerActions}>
                  {item.showRefresh && onRefresh ? (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => onRefresh(item.id)}
                      aria-label={`Rafraîchir ${item.title}`}
                    >
                      <IconReset className={styles.actionIcon} aria-hidden />
                    </button>
                  ) : null}
                  {item.showInfo !== false ? (
                    <button
                      type="button"
                      className={styles.iconButton}
                      onClick={() => onInfo(item.id)}
                      aria-label={`Informations sur ${item.title}`}
                    >
                      <IconInfo className={styles.actionIcon} aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>0</span>
                <Slider
                  className={styles.slider}
                  binary
                  min={0}
                  max={100}
                  value={item.visible ? 100 : 0}
                  disabled={item.toggleDisabled}
                  ariaLabel={
                    item.toggleDisabled
                      ? `${item.title} indisponible`
                      : item.visible
                        ? `Masquer ${item.title}`
                        : `Afficher ${item.title}`
                  }
                  onChange={(value) => onOpacityChange(item.id, value)}
                />
                <span className={styles.sliderLabel}>100%</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </MapOverlaySheet>
  );
}
