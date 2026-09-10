import type { GdpNewsItem } from '@/domain/news/models';
import { GdpNewsBanner } from '@/features/news/components/GdpNewsBanner/GdpNewsBanner';
import { formatDate } from '@/shared/utils/date';
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
              return (
                <li key={item.id} className={styles.item}>
                  {period ? <p className={styles.period}>{period}</p> : null}
                  <GdpNewsBanner item={item} />
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </SlideUpPage>
  );
}
