import { Storage } from '@ign/mobile-device';

import { storageKey } from '@/shared/constants/storage';

const DISMISSED_NEWS_KEY = storageKey('DISMISSED_NEWS_IDS');

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
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
