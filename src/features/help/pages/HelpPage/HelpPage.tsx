import { useEffect, useState } from 'react';

import type { GdpNewsItem } from '@/domain/news/models';
import { NewsPage } from '@/features/news/pages/NewsPage';
import { AppLogo } from '@/shared/ui/AppLogo';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';

import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';

import screen from '@/shared/styles/screen.module.css';
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
  newsItems?: readonly GdpNewsItem[];
  isNewsLoading?: boolean;
}

export function HelpPage({
  isOpen,
  onClose,
  newsItems = [],
  isNewsLoading = false,
}: HelpPageProps) {
  const [isNewsOpen, setIsNewsOpen] = useState(false);
  const hasNews = newsItems.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setIsNewsOpen(false);
    }
  }, [isOpen]);

  return (
    <>
      <SlideUpPage isOpen={isOpen} onClose={onClose}>
        <PageHeader title="Aide" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose} />

        <main className={`${screen.screenContainer} ${styles.content}`}>
          <AppLogo size="sm" />
          <p className="page-subtitle">Questions fréquentes sur Géodésie de poche.</p>

          <button
            type="button"
            className={styles.newsLink}
            onClick={() => setIsNewsOpen(true)}
          >
            <IconArticle className={styles.newsLinkIcon} aria-hidden />
            <span className={styles.newsLinkLabel}>Actualités</span>
            {hasNews ? <span className={styles.newsBadge}>News</span> : null}
            <IconAngleRight className={styles.newsLinkChevron} aria-hidden />
          </button>

          <section className={styles.faqSection}>
            {FAQ_ITEMS.map((item) => (
              <article key={item.question} className={styles.faqItem}>
                <p className={styles.question}>{item.question}</p>
                {item.answer === 'menu' ? (
                  <p className="body">
                    Ouvrez le menu latéral, section « Mon compte », puis « Se connecter ». Vous pouvez
                    aussi créer un compte sur{' '}
                    <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>
                      l’Espace collaboratif IGN
                    </ExternalLink>
                    .
                  </p>
                ) : (
                  <p className="body">{item.answer}</p>
                )}
              </article>
            ))}
          </section>
        </main>
      </SlideUpPage>

      <NewsPage
        isOpen={isOpen && isNewsOpen}
        onClose={() => setIsNewsOpen(false)}
        items={newsItems}
        isLoading={isNewsLoading}
        level={2}
      />
    </>
  );
}
