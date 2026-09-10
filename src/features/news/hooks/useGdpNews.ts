import { useCallback, useEffect, useMemo, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

import { selectCurrentNews, selectVisibleNews } from '@/domain/news/selectVisibleNews';
import type { GdpNewsItem, GdpNewsPlatform } from '@/domain/news/models';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchGdpNews } from '@/infra/news/fetchGdpNews';
import {
  getPersistedDismissedNewsIds,
  persistDismissedNewsId,
} from '@/infra/storage/dismissedNewsStore';
import { config } from '@/shared/config/env';

function resolveNewsPlatform(): GdpNewsPlatform {
  const platform = Capacitor.getPlatform();
  if (platform === 'android' || platform === 'ios') {
    return platform;
  }
  return 'web';
}

export function useGdpNews() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<GdpNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionDismissedIds, setSessionDismissedIds] = useState<Set<string>>(() => new Set());
  const [persistedDismissedIds, setPersistedDismissedIds] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    try {
      const [feedItems, dismissed] = await Promise.all([
        fetchGdpNews(config.news.feedUrl),
        getPersistedDismissedNewsIds(),
      ]);
      setItems(feedItems);
      setPersistedDismissedIds(new Set(dismissed));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void load();
      }
    });

    return () => {
      void listenerPromise.then((handle) => handle.remove());
    };
  }, [load]);

  const platform = resolveNewsPlatform();

  const currentItems = useMemo(
    () =>
      selectCurrentNews({
        items,
        platform,
        isAuthenticated,
      }),
    [items, isAuthenticated, platform],
  );

  const visibleItems = useMemo(
    () =>
      selectVisibleNews({
        items,
        platform,
        isAuthenticated,
        sessionDismissedIds,
        persistedDismissedIds,
      }),
    [items, isAuthenticated, platform, sessionDismissedIds, persistedDismissedIds],
  );

  const dismiss = useCallback(async (item: GdpNewsItem) => {
    if (!item.dismissible) {
      return;
    }

    setSessionDismissedIds((current) => {
      const next = new Set(current);
      next.add(item.id);
      return next;
    });

    if (item.showOnce) {
      const persisted = await persistDismissedNewsId(item.id);
      setPersistedDismissedIds(new Set(persisted));
    }
  }, []);

  return {
    isLoading,
    items: visibleItems,
    currentItems,
    banners: visibleItems.filter((item) => item.display !== 'modal'),
    modal: visibleItems.find((item) => item.display === 'modal') ?? null,
    dismiss,
  };
}
