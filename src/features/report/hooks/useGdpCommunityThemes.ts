import { useCallback, useEffect, useSyncExternalStore } from 'react';

import type { CommunityThemeConfig } from '@/domain/community/models';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchGdpCommunityThemeConfigs } from '@/infra/community/gdpCommunityThemes';

interface GdpCommunityThemesState {
  themes: CommunityThemeConfig[];
  isLoading: boolean;
  error: string | null;
}

let state: GdpCommunityThemesState = {
  themes: [],
  isLoading: false,
  error: null,
};

let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): GdpCommunityThemesState {
  return state;
}

async function loadThemes(forceRefresh = false): Promise<void> {
  if (loadPromise && !forceRefresh) {
    return loadPromise;
  }

  state = { ...state, isLoading: true, error: null };
  emitChange();

  loadPromise = (async () => {
    try {
      const themes = await fetchGdpCommunityThemeConfigs({ forceRefresh });
      state = { themes, isLoading: false, error: null };
    } catch {
      state = {
        ...state,
        isLoading: false,
        error: 'Impossible de charger les thèmes collaboratifs.',
      };
    } finally {
      loadPromise = null;
      emitChange();
    }
  })();

  return loadPromise;
}

export interface UseGdpCommunityThemesOptions {
  enabled?: boolean;
}

export function useGdpCommunityThemes(options?: UseGdpCommunityThemesOptions) {
  const { isLoading: isAuthLoading } = useAuth();
  const enabled = options?.enabled ?? !isAuthLoading;
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadThemes();
  }, [enabled]);

  const refreshThemes = useCallback(async () => {
    await loadThemes(true);
  }, []);

  return {
    themes: snapshot.themes,
    isLoading: enabled && snapshot.isLoading,
    error: snapshot.error,
    refreshThemes,
  };
}
