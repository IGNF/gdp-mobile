import { parseGdpNewsFeed } from '@/domain/news/mappers';
import type { GdpNewsItem } from '@/domain/news/models';

const FETCH_TIMEOUT_MS = 8000;

export async function fetchGdpNews(feedUrl: string): Promise<GdpNewsItem[]> {
  const url = feedUrl.trim();
  if (!url) {
    return [];
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();
    return parseGdpNewsFeed(payload).items;
  } catch {
    return [];
  } finally {
    window.clearTimeout(timeoutId);
  }
}
