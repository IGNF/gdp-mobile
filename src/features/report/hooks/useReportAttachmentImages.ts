import { useEffect, useState } from 'react';

import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

export interface UseReportAttachmentImagesResult {
  imageUrls: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Télécharge les pièces jointes d'un signalement (URLs auth-gated côté API — pas utilisables
 * directement comme `src` d'`<img>`) et les convertit en URLs `blob:` locales affichables.
 */
export function useReportAttachmentImages(photoUrls: string[]): UseReportAttachmentImagesResult {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(photoUrls.length > 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (photoUrls.length === 0) {
      setImageUrls([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const objectUrls: string[] = [];

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const sessionReady = await ensureCollabApiSession();
        if (!sessionReady) {
          if (!cancelled) {
            setImageUrls([]);
          }
          return;
        }

        const results = await Promise.all(
          photoUrls.map(async (url) => {
            try {
              const response = await collabApiClient.getDocument(url);
              const contentType =
                (response.headers?.['content-type'] as string | undefined) ?? 'image/jpeg';
              const blob = new Blob([response.data], { type: contentType });
              return URL.createObjectURL(blob);
            } catch {
              return null;
            }
          }),
        );

        const loaded = results.filter((url): url is string => url !== null);
        objectUrls.push(...loaded);

        if (!cancelled) {
          setImageUrls(loaded);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError : new Error('Impossible de charger les photos du signalement'),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- comparer par contenu, pas par référence de tableau
  }, [photoUrls.join('|')]);

  return { imageUrls, isLoading, error };
}
