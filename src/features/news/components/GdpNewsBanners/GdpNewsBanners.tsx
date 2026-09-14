import { Alert } from '@/shared/ui/Alert';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import type { GdpNewsItem } from '@/domain/news/models';

import { GdpNewsBanner } from '../GdpNewsBanner/GdpNewsBanner';
import styles from './GdpNewsBanners.module.css';

export interface GdpNewsBannersProps {
  banners: GdpNewsItem[];
  modal: GdpNewsItem | null;
  onDismiss: (item: GdpNewsItem) => void;
}

export function GdpNewsBanners({ banners, modal, onDismiss }: GdpNewsBannersProps) {
  if (banners.length === 0 && !modal) {
    return null;
  }

  return (
    <>
      {banners.length > 0 ? (
        <div className={styles.stack}>
          {banners.map((item) => (
            <GdpNewsBanner key={item.id} item={item} onDismiss={onDismiss} />
          ))}
        </div>
      ) : null}

      {modal ? (
        <Alert
          isOpen
          title={modal.title}
          subtitle={modal.body}
          showCloseButton={modal.dismissible}
          onClose={() => onDismiss(modal)}
        >
          {modal.cta ? (
            <ExternalLink href={modal.cta.url}>{modal.cta.label}</ExternalLink>
          ) : null}
        </Alert>
      ) : null}
    </>
  );
}
