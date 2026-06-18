import type { ReportStatus } from '@ign/mobile-core';

export interface GroupReport {
  id: number;
  communityId: number;
  themeName?: string;
  themeAttributes: Record<string, string>;
  status: ReportStatus;
  comment: string;
  geometry: string;
  longitude: number | null;
  latitude: number | null;
  createdAt: Date;
  modifiedAt?: Date;
  authorName?: string;
}
