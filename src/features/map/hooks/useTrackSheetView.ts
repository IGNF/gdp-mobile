import { useCallback } from 'react';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { trackViewedSheet } from '@/infra/storage/viewedSheetsStore';

/**
 * Enregistre une consultation de fiche géodésique pour l'utilisateur connecté.
 * Une même fiche n'est comptée qu'une fois.
 */
export function useTrackSheetView() {
  const { user } = useAuth();

  const trackSheetView = useCallback(
    // Avertissement propre au futur compilateur React (non activé dans ce projet — aucun
    // `babel-plugin-react-compiler` dans la config) : sans effet sur le comportement actuel.
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    (sheetId: string | number) => {
      if (user?.id === undefined) {
        return;
      }

      void trackViewedSheet(user.id, String(sheetId)).catch((error: unknown) => {
        console.error('[useTrackSheetView] Failed to persist sheet view', error);
      });
    },
    [user?.id],
  );

  return { trackSheetView };
}
