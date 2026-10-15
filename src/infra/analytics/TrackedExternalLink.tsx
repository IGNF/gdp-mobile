import type { MouseEvent } from 'react';

import { ExternalLink, type ExternalLinkProps } from '@/shared/ui/ExternalLink';

import { trackOutlinkOpen } from './matomo';

export interface TrackedExternalLinkProps extends ExternalLinkProps {
  /** Nom Matomo `Contexte – Libellé` (ex. `À propos – Accessibilité`). */
  tracking: {
    context: string;
    label: string;
  };
}

/** `ExternalLink` avec événement Matomo « Lien sortant » au clic. */
export function TrackedExternalLink({ tracking, onClick, ...rest }: TrackedExternalLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    trackOutlinkOpen(tracking.context, tracking.label);
    onClick?.(event);
  };

  return <ExternalLink {...rest} onClick={handleClick} />;
}
