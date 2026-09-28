import { useCallback, useState } from 'react';

import { Alert } from '@/shared/ui/Alert';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import type { GdpNewsItem } from '@/domain/news/models';
import { NEWS_SEVERITY_VISUALS } from '@/features/news/utils/newsSeverityVisuals';

export interface GdpNewsBannersProps {
  items: GdpNewsItem[];
  onDismiss: (item: GdpNewsItem) => void;
}

/**
 * N'affiche qu'un seul item à la fois dans la fenêtre glissante ; le suivant apparaît une
 * fois celui-ci fermé. La fenêtre doit toujours être fermable (poignée, clic sur la carte,
 * bouton). Un `dismissible: false` du flux n'empêche pas la fermeture : il empêche
 * seulement la mémorisation (l'item revient au prochain chargement).
 */
export function GdpNewsBanners({ items, onDismiss }: GdpNewsBannersProps) {
  const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set());

  const current = items.find((item) => !closedIds.has(item.id)) ?? null;

  const handleClose = useCallback(() => {
    if (!current) {
      return;
    }
    setClosedIds((previous) => new Set(previous).add(current.id));
    onDismiss(current);
  }, [current, onDismiss]);

  const visual = current ? NEWS_SEVERITY_VISUALS[current.severity] : null;

  if (!current || !visual) {
    return null;
  }

  return (
    <Alert
      key={current.id}
      isOpen
      nonBlocking
      title={current.title}
      subtitle={current.body}
      onClose={handleClose}
      placement="bottom"
      icon={<visual.Icon aria-hidden />}
      iconBackground={visual.background}
      iconColor={visual.color}
      buttons={[{ label: 'J’ai compris', onClick: handleClose }]}
    >
      {current.cta ? <ExternalLink href={current.cta.url}>{current.cta.label}</ExternalLink> : null}
    </Alert>
  );
}
