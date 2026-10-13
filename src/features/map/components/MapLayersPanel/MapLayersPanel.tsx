import { MapOverlaySheet } from '@/features/map/components/MapOverlaySheet';
import { MapSheetSection } from '@/features/map/components/MapSheetSection';
import type { MapLayerSheetGroup, MapLayerSheetItem } from '@/features/map/types/mapLayerSheet';

import IconCheck from '@/shared/assets/icons/icon-check.svg?react';

import styles from './MapLayersPanel.module.css';

const LAYER_GROUPS: readonly { id: MapLayerSheetGroup; title: string }[] = [
  { id: 'data', title: 'Données' },
  { id: 'basemap', title: 'Fonds de carte' },
];

export interface MapLayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: readonly MapLayerSheetItem[];
  onOpacityChange: (layerId: string, opacity: number) => void;
}

function MapLayerCard({
  item,
  onOpacityChange,
}: {
  item: MapLayerSheetItem;
  onOpacityChange: MapLayersPanelProps['onOpacityChange'];
}) {
  return (
    <div className={`${styles.layerCard} ${item.toggleDisabled ? styles.layerCardDisabled : ''}`}>
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
      </div>

      <div className={styles.cardContent}>
        <p className={styles.cardTitle}>{item.title}</p>
      </div>
    </div>
  );
}

export function MapLayersPanel({ isOpen, onClose, items, onOpacityChange }: MapLayersPanelProps) {
  return (
    <MapOverlaySheet
      isOpen={isOpen}
      onClose={onClose}
      title="Couches"
      ariaLabel="Couches de la carte"
      size="large"
      draggable
      compactHeightRatio={0.5}
    >
      {LAYER_GROUPS.map((group) => {
        const groupItems = items.filter((item) => item.group === group.id);
        if (groupItems.length === 0) {
          return null;
        }

        return (
          <MapSheetSection key={group.id} title={group.title}>
            <div className={styles.layerGrid}>
              {groupItems.map((item) => (
                <MapLayerCard key={item.id} item={item} onOpacityChange={onOpacityChange} />
              ))}
            </div>
          </MapSheetSection>
        );
      })}
    </MapOverlaySheet>
  );
}
