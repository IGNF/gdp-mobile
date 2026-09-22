import type { GdpNewsItem } from '@/domain/news/models';
import { NEWS_SEVERITY_VISUALS } from '@/features/news/utils/newsSeverityVisuals';
import { formatDate } from '@/shared/utils/date';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { Loading } from '@/shared/ui/Loading';
import { PageHeader } from '@/shared/ui/PageHeader';
import { SlideUpPage } from '@/shared/ui/SlideUpPage';

import screen from '@/shared/styles/screen.module.css';
import styles from './NewsPage.module.css';

export interface NewsPageProps {
  isOpen: boolean;
  onClose: () => void;
  items: readonly GdpNewsItem[];
  isLoading?: boolean;
  level?: number;
}

function formatNewsPeriod(startsAt: string, endsAt: string): string | null {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return `Du ${formatDate(start)} au ${formatDate(end)}`;
}

export function NewsPage({ isOpen, onClose, items, isLoading = false, level = 1 }: NewsPageProps) {
  return (
    <SlideUpPage isOpen={isOpen} onClose={onClose} level={level}>
      <PageHeader
        title="Actualités"
        onClose={onClose}
        showCloseButton={false}
        showBackButton={true}
        onBack={onClose}
      />

      <main className={`${screen.screenContainer} ${styles.content}`}>
        <p className="page-subtitle">Informations et alertes en cours.</p>

        {isLoading ? (
          <Loading size="small" label="Chargement des actualités…" />
        ) : items.length === 0 ? (
          <p className="body">Aucune actualité en cours.</p>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => {
              const period = formatNewsPeriod(item.startsAt, item.endsAt);
              const visual = NEWS_SEVERITY_VISUALS[item.severity];
              return (
                <li key={item.id} className={styles.item}>
                  {period ? <p className={styles.period}>{period}</p> : null}
                  <div className={styles.card}>
                    <span
                      className={styles.iconBadge}
                      style={{ background: visual.background, color: visual.color }}
                    >
                      <visual.Icon aria-hidden />
                    </span>
                    <div className={styles.cardBody}>
                      <p className={styles.cardTitle}>{item.title}</p>
                      <p className={styles.cardText}>{item.body}</p>
                      {item.cta ? (
                        <ExternalLink href={item.cta.url} className={styles.cardCta}>
                          {item.cta.label}
                        </ExternalLink>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </SlideUpPage>
  );
}
