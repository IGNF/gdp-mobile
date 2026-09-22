import { useCallback, useMemo, useState } from 'react';

import { Alert } from '@/shared/ui/Alert';
import { ExternalLink } from '@/shared/ui/ExternalLink';
import { ToastStack } from '@/shared/ui/Toast';
import type { GdpNewsItem } from '@/domain/news/models';
import { NEWS_SEVERITY_VISUALS } from '@/features/news/utils/newsSeverityVisuals';

export interface GdpNewsBannersProps {
  items: GdpNewsItem[];
  onDismiss: (item: GdpNewsItem) => void;
}

/**
 * N'affiche qu'un seul item à la fois dans la fenêtre glissante ; le suivant apparaît une
 * fois celui-ci fermé. Chaque fermeture laisse derrière elle un flash message, empilé dans
 * `ToastStack` (le plus ancien fermé au plus près du coin, les suivants au-dessus).
 *
 * À REPRODUIRE POUR TOUTE NOUVELLE FENÊTRE OUVERTE AUTOMATIQUEMENT : elle doit toujours
 * être fermable (poignée, clic sur la carte, bouton) ET laisser un flash message derrière
 * elle. Sans ce flash, fermer le message le rend définitivement inaccessible — c'est le
 * seul chemin de retour vers son contenu. Un `dismissible: false` du flux ne doit plus
 * empêcher la fermeture : il empêche seulement la mémorisation (l'item revient au
 * prochain chargement).
 */
export function GdpNewsBanners({ items, onDismiss }: GdpNewsBannersProps) {
  const [closedIds, setClosedIds] = useState<Set<string>>(() => new Set());
  const [flashes, setFlashes] = useState<GdpNewsItem[]>([]);
  const [reopened, setReopened] = useState<GdpNewsItem | null>(null);

  const current = reopened ?? items.find((item) => !closedIds.has(item.id)) ?? null;

  const handleClose = useCallback(() => {
    if (!current) {
      return;
    }
    setReopened(null);
    setClosedIds((previous) => new Set(previous).add(current.id));
    setFlashes((previous) => [...previous, current]);
    onDismiss(current);
  }, [current, onDismiss]);

  const handleFlashClick = useCallback(
    (id: string) => {
      const item = flashes.find((flash) => flash.id === id);
      if (!item) {
        return;
      }
      setFlashes((previous) => previous.filter((flash) => flash.id !== id));
      setReopened(item);
    },
    [flashes],
  );

  const handleFlashDismiss = useCallback((id: string) => {
    setFlashes((previous) => previous.filter((flash) => flash.id !== id));
  }, []);

  const visual = current ? NEWS_SEVERITY_VISUALS[current.severity] : null;

  const toastItems = useMemo(
    () =>
      flashes.map((flash) => {
        const flashVisual = NEWS_SEVERITY_VISUALS[flash.severity];
        return {
          id: flash.id,
          message: flash.title,
          icon: <flashVisual.Icon aria-hidden />,
          iconBackground: flashVisual.background,
          iconColor: flashVisual.color,
        };
      }),
    [flashes],
  );

  return (
    <>
      {current && visual ? (
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
          {current.cta ? (
            <ExternalLink href={current.cta.url}>{current.cta.label}</ExternalLink>
          ) : null}
        </Alert>
      ) : null}

      <ToastStack items={toastItems} onItemClick={handleFlashClick} onItemDismiss={handleFlashDismiss} />
    </>
  );
}
