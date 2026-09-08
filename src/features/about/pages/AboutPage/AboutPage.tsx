import { AppLogo } from '@/shared/ui/AppLogo';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';

import screen from '@/shared/styles/screen.module.css';
import styles from './AboutPage.module.css';

export interface AboutPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutPage({ isOpen, onClose }: AboutPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="À propos" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <AppLogo size="sm" />
        <p className="page-subtitle">Application mobile Géodésie de poche.</p>

        <section className={styles.section}>
          <p className="body">
            Cette application permet de consulter la cartographie IGN, les repères géodésiques
            en mode expert (WFS) et de signaler leur état sur le terrain.
          </p>
          <p className="body">
            Éditée par l’
            <ExternalLink href="https://www.ign.fr/">Institut national de l’information géographique et forestière</ExternalLink>
            .
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Mentions légales</h2>
          <p className="body">
            Pour les conditions d’utilisation et la protection des données, consultez{' '}
            <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>
              l’Espace collaboratif IGN
            </ExternalLink>
            .
          </p>
        </section>
      </main>
    </SlideUpPage>
  );
}
