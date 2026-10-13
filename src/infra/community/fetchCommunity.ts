import { getCollabApiCached } from '@/infra/api/collabApiCache';
import {
  COLLAB_API_CACHE_KEYS,
  GDP_COMMUNITY_THEME_CACHE_TTL_MS,
} from '@/infra/api/collabApiKeys';
import { collabApiClient } from '@/infra/api/collabApiClient';
import { ensureCollabApiSession } from '@/infra/api/ensureCollabApiSession';

export interface FetchCommunityOptions {
  forceRefresh?: boolean;
}

const COMMUNITY_FETCH_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Community fetch timeout'));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

/** Fiche brute `/communities/{id}` (mise en cache), ou `null` sans session API ou en cas d'échec. */
export async function fetchCommunity(
  communityId: number,
  options?: FetchCommunityOptions,
): Promise<unknown> {
  try {
    const sessionReady = await ensureCollabApiSession();
    if (!sessionReady) {
      return null;
    }

    const response = await withTimeout(
      getCollabApiCached(
        COLLAB_API_CACHE_KEYS.community(communityId),
        () => collabApiClient.community.get(communityId),
        options?.forceRefresh
          ? { forceRefresh: true }
          : { ttlMs: GDP_COMMUNITY_THEME_CACHE_TTL_MS },
      ),
      COMMUNITY_FETCH_TIMEOUT_MS,
    );

    return response.data;
  } catch {
    return null;
  }
}
