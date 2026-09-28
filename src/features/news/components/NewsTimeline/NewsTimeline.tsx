import type { GdpNewsItem, GdpNewsSeverity } from '@/domain/news/models';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { Loading } from '@/shared/ui/Loading';

import styles from './NewsTimeline.module.css';

export interface NewsTimelineProps {
  items: readonly GdpNewsItem[];
  isLoading?: boolean;
}

const NEWS_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const NEWS_BADGE: Record<GdpNewsSeverity, { label: string; className: string }> = {
  info: { label: 'Mise à jour', className: styles.badgeInfo },
  warning: { label: 'Alerte', className: styles.badgeWarning },
  error: { label: 'Incident', className: styles.badgeError },
};

function formatNewsDate(iso: string): string | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return NEWS_DATE.format(date).replace(/[\u202f\u00a0]/g, ' ');
}

export function NewsTimeline({ items, isLoading = false }: NewsTimelineProps) {
  if (isLoading) {
    return <Loading size="small" label="Chargement des actualités…" />;
  }

  if (items.length === 0) {
    return <p className="body">Aucune actualité en cours.</p>;
  }

  return (
    <ol className={styles.timeline}>
      {items.map((item) => {
        const dateLabel = formatNewsDate(item.startsAt);
        const badge = NEWS_BADGE[item.severity];
        return (
          <li key={item.id} className={styles.entry}>
            <span className={styles.dot} aria-hidden />
            <div className={styles.entryBody}>
              <div className={styles.meta}>
                <span className={`${styles.badge} ${badge.className}`}>
                  {item.severityLabel ?? badge.label}
                </span>
                {dateLabel ? <time dateTime={item.startsAt}>{dateLabel}</time> : null}
              </div>
              <p className={styles.title}>{item.title}</p>
              <p className={styles.text}>{item.body}</p>
              {item.cta ? (
                <ExternalLink href={item.cta.url} className={styles.cta}>
                  {item.cta.label}
                </ExternalLink>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
