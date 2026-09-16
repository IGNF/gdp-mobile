import { Alert } from '@/shared/ui/Alert';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import type { GdpNewsItem } from '@/domain/news/models';
import { NEWS_SEVERITY_VISUALS } from '@/features/news/utils/newsSeverityVisuals';

export interface GdpNewsBannersProps {
  items: GdpNewsItem[];
  onDismiss: (item: GdpNewsItem) => void;
}

/** N'affiche que l'item le plus sévère ; le suivant apparaît une fois celui-ci fermé. */
export function GdpNewsBanners({ items, onDismiss }: GdpNewsBannersProps) {
  const current = items[0] ?? null;

  if (!current) {
    return null;
  }

  const visual = NEWS_SEVERITY_VISUALS[current.severity];

  return (
    <Alert
      isOpen
      title={current.title}
      subtitle={current.body}
      showCloseButton={current.dismissible}
      onClose={() => onDismiss(current)}
      placement="bottom"
      icon={<visual.Icon aria-hidden />}
      iconBackground={visual.background}
      iconColor={visual.color}
      buttons={
        current.dismissible
          ? [{ label: 'J’ai compris', onClick: () => onDismiss(current) }]
          : []
      }
    >
      {current.cta ? (
        <ExternalLink href={current.cta.url}>{current.cta.label}</ExternalLink>
      ) : null}
    </Alert>
  );
}
