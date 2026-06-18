import { config } from '@/shared/config/env';

import { GEODESY_REPORT_THEME } from '@/features/report/constants/geodesyReportApi';

/** Communauté EspaceCo pour les signalements géodésie GDP. */
export const GDP_REPORT_COMMUNITY_ID = Number(config.report.communityId) || 96;

/** Thème collaboratif configuré (repli si la fiche communauté n’est pas chargée). */
export const GDP_REPORT_THEME = config.report.theme || GEODESY_REPORT_THEME;

export interface GdpReportThemeFilter {
  community: number;
  theme: string;
}

/** Filtre API `GET /reports` (signalements repère géodésique). */
export function serializeGdpReportThemeFilters(): string {
  return JSON.stringify([
    { community: GDP_REPORT_COMMUNITY_ID, theme: GDP_REPORT_THEME },
  ] satisfies GdpReportThemeFilter[]);
}
