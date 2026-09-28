import { useEffect, useState, type ReactNode } from 'react';

import type { GdpNewsItem } from '@/domain/news/models';
import { NewsPage } from '@/features/news/pages/NewsPage';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { EXTERNAL_LINKS } from '@/shared/constants/externalLinks';

import IconAngleRight from '@/shared/assets/icons/icon-angle-right.svg?react';
import IconArticle from '@/shared/assets/icons/icon-article.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';

import screen from '@/shared/styles/screen.module.css';
import styles from './HelpPage.module.css';

const FAQ_ITEMS: ReadonlyArray<{ question: string; answer: ReactNode }> = [
  {
    question: 'Comment créer un signalement ?',
    answer:
      'Rendez-vous dans le menu Carte, puis appuyez sur le bouton de téléchargement. Sélectionnez la zone souhaitée et confirmez.',
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
    answer: (
      <>
        Ouvrez le menu latéral, section « Mon compte », puis « Se connecter ». Vous pouvez aussi créer un
        compte sur{' '}
        <ExternalLink href={EXTERNAL_LINKS.ESPACE_COLLABORATIF}>l’Espace collaboratif IGN</ExternalLink>.
      </>
    ),
  },
];

function FaqEntry({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <article className={styles.faqItem}>
      <button type="button" className={styles.faqTrigger} aria-expanded={isOpen} onClick={onToggle}>
        <span className={styles.question}>{question}</span>
        {isOpen ? (
          <span className={styles.faqClose}>
            <IconClose className={styles.faqIcon} aria-hidden />
          </span>
        ) : (
          <span className={styles.faqPlus} aria-hidden>
            +
          </span>
        )}
      </button>
      {isOpen ? <p className={styles.answer}>{answer}</p> : null}
    </article>
  );
}

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
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);
  const hasNews = newsItems.length > 0;

  useEffect(() => {
    if (!isOpen) {
      setIsNewsOpen(false);
      setOpenQuestion(null);
    }
  }, [isOpen]);

  return (
    <>
      <SlideUpPage isOpen={isOpen} onClose={onClose}>
        <PageHeader title="Aide" onClose={onClose} showCloseButton={false} showBackButton={true} onBack={onClose} />

        <main className={`${screen.screenContainer} ${styles.content}`}>
          <h2 className={styles.faqTitle}>Questions fréquentes</h2>

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
              <FaqEntry
                key={item.question}
                question={item.question}
                answer={item.answer}
                isOpen={openQuestion === item.question}
                onToggle={() =>
                  setOpenQuestion((current) => (current === item.question ? null : item.question))
                }
              />
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
