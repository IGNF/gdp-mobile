import { config } from '@/shared/config/env';

import { GEODESY_REPORT_THEME } from '@/features/report/constants/geodesyReportApi';

/** Communauté EspaceCo pour les signalements géodésie GDP. */
export const GDP_REPORT_COMMUNITY_ID = Number(config.report.communityId) || 96;

/** Thèmes à afficher sur la carte (filtre GET /reports). */
export const GDP_REPORT_DISPLAY_THEMES = config.report.displayThemes.length > 0
  ? config.report.displayThemes
  : [GEODESY_REPORT_THEME];

/** Thème utilisé lors de la création d'un signalement. */
export const GDP_REPORT_SUBMISSION_THEME = config.report.submissionTheme || GEODESY_REPORT_THEME;

export interface GdpReportThemeFilter {
  community: number;
  theme: string;
}

/** Filtre API `GET /reports` (signalements repère géodésique). */
export function serializeGdpReportThemeFilters(): string {
  return JSON.stringify(
    GDP_REPORT_DISPLAY_THEMES.map((theme) => ({
      community: GDP_REPORT_COMMUNITY_ID,
      theme,
    })),
  );
}
