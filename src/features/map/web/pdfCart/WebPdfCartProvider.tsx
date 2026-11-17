import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import { IS_WEB_PLATFORM } from '@/platform/web/isWebPlatform';

import { buildPdfCartEntry, buildPdfCartEntryKey } from './buildPdfCartEntry';
import { WEB_PDF_CART_MAX_ENTRIES } from './pdfCartConstants';
import {
  clearPdfCartSessionStorage,
  loadPdfCartFromSessionStorage,
  savePdfCartToSessionStorage,
} from './pdfCartSessionStorage';
import type {
  WebPdfCartAddManyResult,
  WebPdfCartAddResult,
  WebPdfCartEntry,
  WebPdfCartToggleResult,
} from './pdfCartTypes';
import { WebPdfCartContext, type WebPdfCartContextValue } from './webPdfCartContextState';

export function WebPdfCartProvider({ children }: { children: ReactNode }) {
  const enabled = IS_WEB_PLATFORM;
  const [entries, setEntries] = useState<WebPdfCartEntry[]>(() =>
    enabled ? loadPdfCartFromSessionStorage() : [],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    savePdfCartToSessionStorage(entries);
  }, [enabled, entries]);

  const keySet = useMemo(() => new Set(entries.map((entry) => entry.key)), [entries]);

  const isKeyInCart = useCallback((key: string) => keySet.has(key), [keySet]);

  const isInCart = useCallback(
    (action: MapGeodesyClickAction) => keySet.has(buildPdfCartEntryKey(action)),
    [keySet],
  );

  const add = useCallback(
    (action: MapGeodesyClickAction): WebPdfCartAddResult => {
      if (!enabled) {
        return 'already';
      }

      const entry = buildPdfCartEntry(action);
      if (keySet.has(entry.key)) {
        return 'already';
      }

      if (entries.length >= WEB_PDF_CART_MAX_ENTRIES) {
        return 'limit';
      }

      setEntries((current) => [...current, entry]);
      return 'added';
    },
    [enabled, entries.length, keySet],
  );

  const addMany = useCallback(
    (actions: readonly MapGeodesyClickAction[]): WebPdfCartAddManyResult => {
      if (!enabled || actions.length === 0) {
        return { added: 0, alreadyInCart: 0, limitReached: false };
      }

      let added = 0;
      let alreadyInCart = 0;
      let limitReached = false;

      setEntries((current) => {
        const next = [...current];
        const keys = new Set(next.map((entry) => entry.key));

        for (const action of actions) {
          const entry = buildPdfCartEntry(action);
          if (keys.has(entry.key)) {
            alreadyInCart += 1;
            continue;
          }

          if (next.length >= WEB_PDF_CART_MAX_ENTRIES) {
            limitReached = true;
            break;
          }

          keys.add(entry.key);
          next.push(entry);
          added += 1;
        }

        return next;
      });

      return { added, alreadyInCart, limitReached };
    },
    [enabled],
  );

  const remove = useCallback(
    (key: string) => {
      if (!enabled) {
        return;
      }

      setEntries((current) => current.filter((entry) => entry.key !== key));
    },
    [enabled],
  );

  const toggle = useCallback(
    (action: MapGeodesyClickAction): WebPdfCartToggleResult => {
      if (!enabled) {
        return 'removed';
      }

      const key = buildPdfCartEntryKey(action);
      if (keySet.has(key)) {
        remove(key);
        return 'removed';
      }

      const addResult = add(action);
      if (addResult === 'limit') {
        return 'limit';
      }

      return 'added';
    },
    [add, enabled, keySet, remove],
  );

  const clear = useCallback(() => {
    if (!enabled) {
      return;
    }

    setEntries([]);
    clearPdfCartSessionStorage();
  }, [enabled]);

  const value = useMemo<WebPdfCartContextValue>(
    () => ({
      enabled,
      entries,
      count: entries.length,
      isInCart,
      isKeyInCart,
      add,
      addMany,
      remove,
      toggle,
      clear,
    }),
    [add, addMany, clear, enabled, entries, isInCart, isKeyInCart, remove, toggle],
  );

  return <WebPdfCartContext.Provider value={value}>{children}</WebPdfCartContext.Provider>;
}
