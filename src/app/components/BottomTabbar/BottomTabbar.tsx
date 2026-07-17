import { useNavigate } from 'react-router-dom';
import { IonTabBar, IonTabButton } from '@ionic/react';

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
    <IonTabBar selectedTab={activeTab} className={styles.tabbar} aria-label="Navigation principale">
      <IonTabButton
        tab="carte"
        className={styles.tab}
        onClick={() => handleTabClick('carte')}
      >
        <span className={`${styles.iconCircle} ${activeTab === 'carte' ? styles.iconCircleActive : ''}`}>
          <IconMap className={styles.tabIcon} aria-hidden />
        </span>
        <span className={`${styles.tabLabel} ${activeTab === 'carte' ? styles.tabLabelActive : ''}`}>
          Carte
        </span>
      </IonTabButton>
      <IonTabButton
        tab="signalements"
        className={styles.tab}
        onClick={() => handleTabClick('signalements')}
      >
        <span
          className={`${styles.iconCircle} ${activeTab === 'signalements' ? styles.iconCircleActive : ''}`}
        >
          <IconArticle className={styles.tabIcon} aria-hidden />
        </span>
        <span className={`${styles.tabLabel} ${activeTab === 'signalements' ? styles.tabLabelActive : ''}`}>
          Signalements
        </span>
      </IonTabButton>
    </IonTabBar>
  );
}
