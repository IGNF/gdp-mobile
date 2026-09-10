import type { GdpNewsItem, GdpNewsPlatform } from './models';

const SEVERITY_ORDER: Record<GdpNewsItem['severity'], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export interface SelectCurrentNewsParams {
  items: readonly GdpNewsItem[];
  now?: Date;
  platform: GdpNewsPlatform;
  isAuthenticated: boolean;
}

export interface SelectVisibleNewsParams extends SelectCurrentNewsParams {
  sessionDismissedIds: ReadonlySet<string>;
  persistedDismissedIds: ReadonlySet<string>;
}

export function isNewsItemActive(item: GdpNewsItem, now: Date): boolean {
  const start = Date.parse(item.startsAt);
  const end = Date.parse(item.endsAt);
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return false;
  }
  const time = now.getTime();
  return time >= start && time <= end;
}

/** News encore valides (dates, plateforme, audience), y compris celles déjà fermées. */
export function selectCurrentNews({
  items,
  now = new Date(),
  platform,
  isAuthenticated,
}: SelectCurrentNewsParams): GdpNewsItem[] {
  return items
    .filter((item) => isNewsItemActive(item, now))
    .filter((item) => item.platforms.includes(platform))
    .filter((item) => item.audience === 'all' || isAuthenticated)
    .sort((left, right) => SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity]);
}

export function selectVisibleNews({
  sessionDismissedIds,
  persistedDismissedIds,
  ...currentParams
}: SelectVisibleNewsParams): GdpNewsItem[] {
  return selectCurrentNews(currentParams)
    .filter((item) => !sessionDismissedIds.has(item.id))
    .filter((item) => !(item.showOnce && persistedDismissedIds.has(item.id)));
}
