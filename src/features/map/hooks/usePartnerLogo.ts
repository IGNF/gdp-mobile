import { useEffect, useState } from 'react';

import { buildPartnerLogoUrl, prefetchPartnerLogoById, resolvePartnerLogoDisplayUrl } from '@ign/gdp-tools';

export interface UsePartnerLogoResult {
  /** URL d'affichage du logo (blob:// si en cache, URL originale sinon). */
  logoUrl: string | null;
  /** Indique si le logo est en cours de chargement. */
  isLoading: boolean;
}

/**
 * Hook React pour gérer le chargement et la mise en cache d'un logo de partenaire.
 * Précharge automatiquement le logo dans le cache lors du montage ou du changement de partnerId.
 *
 * @param partnerId Identifiant du partenaire (proprio_id)
 * @returns Objet contenant l'URL d'affichage et l'état de chargement
 *
 * @example
 * ```tsx
 * const { logoUrl, isLoading } = usePartnerLogo(partenaireId);
 * return logoUrl ? <img src={logoUrl} alt="" /> : <span>Logo</span>;
 * ```
 */
export function usePartnerLogo(partnerId: string | null | undefined): UsePartnerLogoResult {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    // Initialisation synchrone : si déjà en cache, on l'affiche immédiatement
    const url = buildPartnerLogoUrl(partnerId);
    return url ? resolvePartnerLogoDisplayUrl(url) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!partnerId) {
      setLogoUrl(null);
      setIsLoading(false);
      return;
    }

    const originalUrl = buildPartnerLogoUrl(partnerId);
    if (!originalUrl) {
      setLogoUrl(null);
      setIsLoading(false);
      return;
    }

    // Vérifier si déjà en cache (synchrone)
    const cachedUrl = resolvePartnerLogoDisplayUrl(originalUrl);
    if (cachedUrl.startsWith('blob:')) {
      // Déjà en cache
      setLogoUrl(cachedUrl);
      setIsLoading(false);
      return;
    }

    // Précharger l'image
    setIsLoading(true);
    let cancelled = false;

    void prefetchPartnerLogoById(partnerId).then((blobUrl) => {
      if (cancelled) {
        return;
      }

      setLogoUrl(blobUrl ?? originalUrl);
      setIsLoading(false);
    }).catch(() => {
      if (cancelled) {
        return;
      }

      // En cas d'erreur, utiliser l'URL originale
      setLogoUrl(originalUrl);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [partnerId]);

  return { logoUrl, isLoading };
}
