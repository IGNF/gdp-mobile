import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import screen from '@/shared/styles/screen.module.css';
import styles from './FavoritesPage.module.css';

export interface FavoritesPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesPage({ isOpen, onClose }: FavoritesPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Mes favoris" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose}  />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <section className={styles.section}>
          <p className="body">
            Vos favoris seront affichés ici.
          </p>
        </section>
      </main>
    </SlideUpPage>
  );
}
