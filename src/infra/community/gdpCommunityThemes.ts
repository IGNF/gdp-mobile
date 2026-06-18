import type { CommunityThemeConfig } from '@/domain/community/models';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import { extractThemeConfigsFromCommunity } from '@/features/report/utils/communityReportTheme';
import { getCollabApiCached } from '@/infra/api/collabApiCache';
import {
  COLLAB_API_CACHE_KEYS,
  GDP_COMMUNITY_THEME_CACHE_TTL_MS,
} from '@/infra/api/collabApiKeys';
import { collabApiClient } from '@/infra/api/collabApiClient';
import { ensureCollabApiSession } from '@/infra/api/ensureCollabApiSession';

export interface FetchGdpCommunityThemeConfigsOptions {
  forceRefresh?: boolean;
}

const COMMUNITY_FETCH_TIMEOUT_MS = 15_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error('Community themes fetch timeout'));
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

/** Charge les thèmes signalement depuis `/communities/{id}`. */
export async function fetchGdpCommunityThemeConfigs(
  options?: FetchGdpCommunityThemeConfigsOptions,
): Promise<CommunityThemeConfig[]> {
  try {
    const sessionReady = await ensureCollabApiSession();
    if (!sessionReady) {
      return [];
    }

    const response = await withTimeout(
      getCollabApiCached(
        COLLAB_API_CACHE_KEYS.community(GDP_REPORT_COMMUNITY_ID),
        () => collabApiClient.community.get(GDP_REPORT_COMMUNITY_ID),
        options?.forceRefresh
          ? { forceRefresh: true }
          : { ttlMs: GDP_COMMUNITY_THEME_CACHE_TTL_MS },
      ),
      COMMUNITY_FETCH_TIMEOUT_MS,
    );

    return extractThemeConfigsFromCommunity(response.data, GDP_REPORT_COMMUNITY_ID);
  } catch {
    return [];
  }
}
