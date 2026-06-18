import type { MapLayerGroupDetails as MapLayerGroupDetailsType } from '@/features/map/types/mapLayerGroups';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import IconCheck from '@/shared/assets/icons/icon-check.svg?react';
import IconEye from '@/shared/assets/icons/icon-eye.svg?react';
import IconEyeOff from '@/shared/assets/icons/icon-access.svg?react';

import styles from './MapLayerGroupDetails.module.css';

export interface MapLayerGroupDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  group: MapLayerGroupDetailsType | null;
  onToggleLayer: (layerId: string) => void;
  onSelectLayer: (layerId: string) => void;
}

export function MapLayerGroupDetails({
  isOpen,
  onClose,
  group,
  onToggleLayer,
  onSelectLayer,
}: MapLayerGroupDetailsProps) {
  if (!group) {
    return null;
  }

  const isSingleSelect = group.id === 'geoservices';

  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose} level={2}>
      <PageHeader
        title={group.title}
        showBackButton
        showCloseButton={false}
        onBack={onClose}
      />
      {isSingleSelect && (
        <p className={styles.hint}>Un seul fond de carte peut être affiché à la fois.</p>
      )}
      <div className={styles.content}>
        {group.items.map((item) => {
          if (item.selectionMode === 'single') {
            return (
              <div key={item.id} className={styles.layerItem}>
                <button
                  type="button"
                  className={styles.layerSelectButton}
                  onClick={() => onSelectLayer(item.id)}
                  aria-pressed={item.visible}
                >
                  <span className={styles.layerTitle}>{item.title}</span>
                  {item.visible && (
                    <span className={styles.layerActiveBadge} aria-hidden>
                      <IconCheck className={styles.checkIcon} />
                    </span>
                  )}
                </button>
              </div>
            );
          }

          return (
            <div key={item.id} className={styles.layerItem}>
              <button
                type="button"
                className={styles.layerToggleButton}
                onClick={() => onToggleLayer(item.id)}
                aria-label={item.visible ? 'Masquer la couche' : 'Afficher la couche'}
                aria-pressed={item.visible}
              >
                {item.visible ? (
                  <IconEye className={styles.layerToggleIcon} aria-hidden />
                ) : (
                  <IconEyeOff className={styles.layerToggleIcon} aria-hidden />
                )}
              </button>
              <span className={styles.layerRowTitle}>{item.title}</span>
            </div>
          );
        })}
      </div>
    </SlideUpPage>
  );
}
