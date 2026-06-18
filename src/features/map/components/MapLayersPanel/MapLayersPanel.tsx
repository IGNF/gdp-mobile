import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import type { MapLayerGroupId, MapLayerGroupSummary } from '@/features/map/types/mapLayerGroups';

import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconEye from '@/shared/assets/icons/icon-eye.svg?react';
import IconEyeOff from '@/shared/assets/icons/icon-access.svg?react';
import IconArrowRight from '@/shared/assets/icons/icon-angle-right.svg?react';

import styles from './MapLayersPanel.module.css';

const ANIMATION_DURATION = 300;

export interface MapLayersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: MapLayerGroupSummary[];
  onOpenGroup: (groupId: MapLayerGroupId) => void;
  onToggleGroupVisibility: (groupId: MapLayerGroupId) => void;
}

export function MapLayersPanel({
  isOpen,
  onClose,
  groups,
  onOpenGroup,
  onToggleGroupVisibility,
}: MapLayersPanelProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }
  if (!isOpen && isVisible) {
    setIsVisible(false);
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 20);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setShouldRender(false), ANIMATION_DURATION);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!shouldRender) {
    return null;
  }

  const overlayClasses = [styles.overlay, isVisible ? styles.overlayVisible : '']
    .filter(Boolean)
    .join(' ');
  const panelClasses = [styles.panel, isVisible ? styles.panelVisible : '']
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className={overlayClasses} onClick={onClose} aria-hidden />
      <div className={panelClasses} role="dialog" aria-label="Couches de la carte">
        <div className={styles.header}>
          <h2 className={styles.title}>Mes couches</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer"
          >
            <IconClose className={styles.closeIcon} aria-hidden />
          </button>
        </div>
        <div className={styles.content}>
          <ul className={styles.groupList}>
            {groups.map((group) => (
              <li key={group.id} className={styles.groupItem}>
                <button
                  type="button"
                  className={styles.groupVisibilityButton}
                  onClick={() => onToggleGroupVisibility(group.id)}
                  disabled={!group.canToggle}
                  aria-label={group.visible ? 'Masquer le groupe' : 'Afficher le groupe'}
                >
                  {group.visible ? (
                    <IconEye className={styles.groupVisibilityIcon} aria-hidden />
                  ) : (
                    <IconEyeOff className={styles.groupVisibilityIcon} aria-hidden />
                  )}
                </button>
                <button
                  type="button"
                  className={styles.groupButton}
                  onClick={() => onOpenGroup(group.id)}
                  aria-label={group.title}
                >
                  <span className={styles.groupTitle}>{group.title}</span>
                  <span className={styles.groupMeta}>
                    <span className={styles.groupCount}>{group.count}</span>
                    <IconArrowRight className={styles.groupArrowIcon} aria-hidden />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
