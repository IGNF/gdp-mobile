export type GdpNewsSeverity = 'info' | 'warning' | 'error';
export type GdpNewsAudience = 'all' | 'authenticated';
export type GdpNewsDisplay = 'banner' | 'modal';
export type GdpNewsPlatform = 'web' | 'android' | 'ios';

export interface GdpNewsCta {
  label: string;
  url: string;
}

export interface GdpNewsItem {
  id: string;
  severity: GdpNewsSeverity;
  title: string;
  body: string;
  startsAt: string;
  endsAt: string;
  platforms: GdpNewsPlatform[];
  audience: GdpNewsAudience;
  display: GdpNewsDisplay;
  dismissible: boolean;
  showOnce: boolean;
  cta?: GdpNewsCta;
}

export interface GdpNewsFeed {
  schemaVersion: number;
  items: GdpNewsItem[];
}
