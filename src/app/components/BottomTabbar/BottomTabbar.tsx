import styles from './BottomTabbar.module.css';

import IconLayers from '@/shared/assets/icons/icon-layers.svg?react';
import IconLocation from '@/shared/assets/icons/icon-location.svg?react';

export type MapTabId = 'signalement' | 'couches';

export interface BottomTabbarProps {
  activeTab?: MapTabId | null;
  onTabClick?: (tab: MapTabId) => void;
}

export function BottomTabbar({ activeTab, onTabClick }: BottomTabbarProps) {
  const getTabClassName = (tab: MapTabId) => {
    const classes = [styles.tab];
    if (activeTab === tab) {
      classes.push(styles.active);
    }
    return classes.join(' ');
  };

  return (
    <nav className={styles.tabbar} aria-label="Actions carte">
      <button
        type="button"
        className={getTabClassName('signalement')}
        onClick={() => onTabClick?.('signalement')}
      >
        <IconLocation className={styles.tabIcon} aria-hidden />
        Signalement
      </button>
      <button
        type="button"
        className={getTabClassName('couches')}
        onClick={() => onTabClick?.('couches')}
      >
        <IconLayers className={styles.tabIcon} aria-hidden />
        Couches
      </button>
    </nav>
  );
}
