import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import screen from '@/shared/styles/screen.module.css';
import styles from './CommunityPage.module.css';

export interface CommunityPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommunityPage({ isOpen, onClose }: CommunityPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Communauté" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose}  />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <section className={styles.section}>
          <p className="body">
            Votre communauté sera affichée ici.
          </p>
        </section>
      </main>
    </SlideUpPage>
  );
}
