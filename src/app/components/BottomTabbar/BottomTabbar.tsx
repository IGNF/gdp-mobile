import { useNavigate } from 'react-router-dom';

import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconMap from '@/shared/assets/icons/icon-map.svg?react';

import styles from './BottomTabbar.module.css';

export type AppTabId = 'carte' | 'signalements';

export interface BottomTabbarProps {
  activeTab: AppTabId;
}

export function BottomTabbar({ activeTab }: BottomTabbarProps) {
  const navigate = useNavigate();

  const handleTabClick = (tab: AppTabId) => {
    if (tab === activeTab) {
      return;
    }

    navigate(tab === 'carte' ? '/map' : '/reports');
  };

  return (
    <nav className={styles.tabbar} aria-label="Navigation principale">
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'carte' ? styles.active : ''}`}
        onClick={() => handleTabClick('carte')}
        aria-current={activeTab === 'carte' ? 'page' : undefined}
      >
        <span className={`${styles.iconCircle} ${activeTab === 'carte' ? styles.iconCircleActive : ''}`}>
          <IconMap className={styles.tabIcon} aria-hidden />
        </span>
        <span className={styles.tabLabel}>Carte</span>
      </button>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'signalements' ? styles.active : ''}`}
        onClick={() => handleTabClick('signalements')}
        aria-current={activeTab === 'signalements' ? 'page' : undefined}
      >
        <span
          className={`${styles.iconCircle} ${activeTab === 'signalements' ? styles.iconCircleActive : ''}`}
        >
          <IconArticle className={styles.tabIcon} aria-hidden />
        </span>
        <span className={styles.tabLabel}>Signalements</span>
      </button>
    </nav>
  );
}
