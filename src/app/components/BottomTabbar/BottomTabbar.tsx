import { useNavigate } from 'react-router-dom';

import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconMap from '@/shared/assets/icons/icon-map.svg?react';
import IconSearch from '@/shared/assets/icons/icon-search.svg?react';
import styles from './BottomTabbar.module.css';

export type AppTabId = 'carte' | 'signalements' | 'recherche';

export interface BottomTabbarProps {
  activeTab: AppTabId;
  onCloseSearch?: () => void;
  onCloseReports?: () => void;
  /** Appelé à chaque clic d’onglet (ex. fermer le sélecteur de couches). */
  onTabClick?: (tab: AppTabId) => void;
}

export function BottomTabbar({
  activeTab,
  onCloseSearch,
  onCloseReports,
  onTabClick,
}: BottomTabbarProps) {
  const navigate = useNavigate();

  const handleTabClick = (tab: AppTabId) => {
    onTabClick?.(tab);

    if (tab === 'carte' && activeTab === 'recherche') {
      onCloseSearch?.();
      return;
    }

    if (tab === 'carte' && activeTab === 'signalements') {
      onCloseReports?.();
      return;
    }

    if (tab === activeTab) {
      return;
    }

    if (tab === 'recherche') {
      navigate('/map', { state: { openSearch: true } });
    } else if (tab === 'signalements') {
      navigate('/map', { state: { openReports: true } });
    } else {
      navigate('/map');
    }
  };

  return (
    <nav className={styles.tabbar} aria-label="Navigation principale">
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'carte' ? styles.active : ''}`}
        onClick={() => handleTabClick('carte')}
        aria-current={activeTab === 'carte' ? 'page' : undefined}
      >
        <IconMap className={styles.tabIcon} aria-hidden />
        <span className={styles.tabLabel}>Carte</span>
      </button>
      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'signalements' ? styles.active : ''}`}
        onClick={() => handleTabClick('signalements')}
        aria-current={activeTab === 'signalements' ? 'page' : undefined}
      >
        <IconArticle className={styles.tabIcon} aria-hidden />
        <span className={styles.tabLabel}>Signalements</span>
      </button>

      <button
        type="button"
        className={`${styles.tab} ${activeTab === 'recherche' ? styles.active : ''}`}
        onClick={() => handleTabClick('recherche')}
        aria-current={activeTab === 'recherche' ? 'page' : undefined}
      >
        <IconSearch className={styles.tabIcon} aria-hidden />
        <span className={styles.tabLabel}>Recherche</span>
      </button>
    </nav>
  );
}
