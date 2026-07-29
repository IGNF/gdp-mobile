import { useNavigate } from 'react-router-dom';

import { BottomTabbar } from '@/app/components/BottomTabbar';
import { PageHeader } from '@/shared/ui/PageHeader';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './MyReportsPage.module.css';

export function MyReportsPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <PageHeader
        title="Signalements"
        subtitle="Mes signalements"
        showBackButton
        showCloseButton={false}
        onBack={() => navigate('/map')}
      />

      <main className={`${styles.main} ${screen.screenContainer}`}>
        <div className={styles.titleSection}>
          <h1 className={typography.title}>Mes signalements</h1>
          <p className={typography.subtitle}>Écran en cours de reconstruction.</p>
        </div>
      </main>

      <BottomTabbar activeTab="signalements" />
    </div>
  );
}
