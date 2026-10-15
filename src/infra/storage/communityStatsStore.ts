import { Storage } from '@ign/mobile-device';

import { storageKey } from '@/shared/constants/storage';

const COMMUNITY_STATS_KEY = storageKey('COMMUNITY_STATS');

export type CommunityStatsAudience = 'auth' | 'public';

export interface PersistedCommunityStats<T> {
  stats: T;
  fetchedAt: number;
}

interface StoredCommunityStatsFile {
  auth?: PersistedCommunityStats<unknown>;
  public?: PersistedCommunityStats<unknown>;
}

function isPersistedEntry(value: unknown): value is PersistedCommunityStats<unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Partial<PersistedCommunityStats<unknown>>;
  return typeof entry.fetchedAt === 'number' && !!entry.stats && typeof entry.stats === 'object';
}

async function readFile(): Promise<StoredCommunityStatsFile> {
  const stored = await Storage.get(COMMUNITY_STATS_KEY, 'object');
  if (!stored || typeof stored !== 'object') {
    return {};
  }

  return stored as StoredCommunityStatsFile;
}

export async function readPersistedCommunityStats<T>(
  audience: CommunityStatsAudience,
): Promise<PersistedCommunityStats<T> | null> {
  const file = await readFile();
  const entry = file[audience];
  if (!isPersistedEntry(entry)) {
    return null;
  }

  return entry as PersistedCommunityStats<T>;
}

export async function writePersistedCommunityStats<T>(
  audience: CommunityStatsAudience,
  payload: PersistedCommunityStats<T>,
): Promise<void> {
  const file = await readFile();
  file[audience] = payload;
  await Storage.set(COMMUNITY_STATS_KEY, file, 'object');
}

export async function clearPersistedCommunityStats(): Promise<void> {
  await Storage.remove(COMMUNITY_STATS_KEY);
}

export async function getPersistedCommunityStatsSizeBytes(): Promise<number> {
  const stored = await Storage.get(COMMUNITY_STATS_KEY, 'object');
  if (!stored) {
    return 0;
  }

  try {
    return new TextEncoder().encode(JSON.stringify(stored)).length;
  } catch {
    return 0;
  }
}
