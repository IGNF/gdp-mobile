import type { GdpNewsItem } from '@/domain/news/models';
import { FaqList } from '@/features/help/components/FaqList';
import { NewsTimeline } from '@/features/news/components/NewsTimeline';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import screen from '@/shared/styles/screen.module.css';
import styles from './HelpPage.module.css';

export interface HelpPageProps {
  isOpen: boolean;
  onClose: () => void;
  newsItems?: readonly GdpNewsItem[];
  isNewsLoading?: boolean;
}

export function HelpPage({
  isOpen,
  onClose,
  newsItems = [],
  isNewsLoading = false,
}: HelpPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Aide" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Questions fréquentes</h2>
          <FaqList active={isOpen} />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Actualités</h2>
          <NewsTimeline items={newsItems} isLoading={isNewsLoading} />
        </section>
      </main>
    </SlideUpPage>
  );
}
