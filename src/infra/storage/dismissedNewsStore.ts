import { Storage } from '@ign/mobile-device';

import { storageKey } from '@/shared/constants/storage';

const DISMISSED_NEWS_KEY = storageKey('DISMISSED_NEWS_IDS');

/** News déjà vues ou fermées pendant cette session d’app (survit au démontage de la carte). */
const sessionSeenNewsIds = new Set<string>();

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function getSessionSeenNewsIds(): string[] {
  return [...sessionSeenNewsIds];
}

/** Mémorise des news pour le reste de la session (fermeture ou simple affichage). */
export function rememberSessionNewsIds(ids: readonly string[]): void {
  for (const id of ids) {
    const trimmed = id.trim();
    if (trimmed) {
      sessionSeenNewsIds.add(trimmed);
    }
  }
}

export async function getPersistedDismissedNewsIds(): Promise<string[]> {
  const stored = await Storage.get(DISMISSED_NEWS_KEY, 'array');
  if (!isStringArray(stored)) {
    return [];
  }
  return stored.filter((id) => id.trim().length > 0);
}

export async function persistDismissedNewsId(id: string): Promise<string[]> {
  const current = await getPersistedDismissedNewsIds();
  if (current.includes(id)) {
    return current;
  }
  const next = [...current, id];
  await Storage.set(DISMISSED_NEWS_KEY, next, 'array');
  return next;
}
