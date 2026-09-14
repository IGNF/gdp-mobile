import IconAlertCircle from '@/shared/assets/icons/icon-alert-circle.svg?react';
import IconClose from '@/shared/assets/icons/icon-close.svg?react';
import IconInfo from '@/shared/assets/icons/icon-info.svg?react';
import type { GdpNewsItem } from '@/domain/news/models';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { joinCSSClassNames } from '@/shared/utils/join';

import styles from './GdpNewsBanner.module.css';

export interface GdpNewsBannerProps {
  item: GdpNewsItem;
  onDismiss?: (item: GdpNewsItem) => void;
}

export function GdpNewsBanner({ item, onDismiss }: GdpNewsBannerProps) {
  const Icon = item.severity === 'info' ? IconInfo : IconAlertCircle;

  return (
    <article
      className={joinCSSClassNames(styles.banner, styles[item.severity])}
      role={item.severity === 'error' ? 'alert' : 'status'}
    >
      <Icon className={styles.icon} aria-hidden />
      <div className={styles.body}>
        <p className={styles.title}>{item.title}</p>
        <p className={styles.text}>{item.body}</p>
        {item.cta ? (
          <ExternalLink href={item.cta.url} className={styles.cta}>
            {item.cta.label}
          </ExternalLink>
        ) : null}
      </div>
      {item.dismissible && onDismiss ? (
        <button
          type="button"
          className={styles.close}
          onClick={() => onDismiss(item)}
          aria-label="Fermer"
        >
          <IconClose className={styles.closeIcon} aria-hidden />
        </button>
      ) : null}
    </article>
  );
}
