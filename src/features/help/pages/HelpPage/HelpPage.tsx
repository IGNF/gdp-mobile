import { AppLogo } from '@/shared/ui/AppLogo';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';

import screen from '@/shared/styles/screen.module.css';
import typography from '@/shared/styles/typography.module.css';

import styles from './HelpPage.module.css';

const FAQ_ITEMS = [
  {
    question: 'Comment créer un signalement ?',
    answer:
      'Sur la carte, touchez un repère géodésique pour consulter sa fiche et créer un signalement. Vous pouvez aussi ouvrir « Nouveau signalement repère » dans le menu.',
  },
  {
    question: 'Où sont stockés mes brouillons ?',
    answer:
      'Les brouillons sont enregistrés localement sur votre appareil. Consultez-les via « Mes signalements » dans le menu. Une fois connecté, la même page affiche aussi vos signalements déjà envoyés sur le serveur.',
  },
  {
    question: 'Dois-je être connecté ?',
    answer:
      'La connexion est nécessaire pour consulter vos signalements envoyés et pour transmettre vos contributions.',
  },
  {
    question: 'Comment me connecter ?',
    answer: 'menu',
  },
] as const;

export interface HelpPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpPage({ isOpen, onClose }: HelpPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose}>
      <PageHeader title="Aide" onClose={onClose} />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <AppLogo size="sm" />
        <h1 className={typography.title}>Aide</h1>
        <p className={typography.subtitle}>Questions fréquentes sur Géodésie de poche.</p>

        <section className={styles.faqSection}>
          {FAQ_ITEMS.map((item) => (
            <article key={item.question} className={styles.faqItem}>
              <p className={styles.question}>{item.question}</p>
              {item.answer === 'menu' ? (
                <p className={typography.paragraph}>
                  Ouvrez le menu latéral, section « Mon compte », puis « Se connecter ». Vous pouvez
                  aussi créer un compte sur{' '}
                  <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>
                    l’Espace collaboratif IGN
                  </ExternalLink>
                  .
                </p>
              ) : (
                <p className={typography.paragraph}>{item.answer}</p>
              )}
            </article>
          ))}
        </section>
      </main>
    </SlideUpPage>
  );
}
