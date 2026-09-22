import { config } from '@/shared/config/env';

import {
  GEODESY_REPORT_THEME,
  matchesGeodesyReportThemeName,
} from '@/features/report/constants/geodesyReportApi';

/** Communauté EspaceCo pour les signalements géodésie GDP. */
export const GDP_REPORT_COMMUNITY_ID = Number(config.report.communityId) || 96;

/** Thèmes à afficher sur la carte (filtre GET /reports) — toutes versions d'app confondues. */
const GDP_REPORT_DISPLAY_THEMES = config.report.displayThemes.length > 0
  ? config.report.displayThemes
  : [GEODESY_REPORT_THEME];

/** Thème utilisé lors de la création d'un signalement. */
export const GDP_REPORT_SUBMISSION_THEME = config.report.submissionTheme || GEODESY_REPORT_THEME;

/**
 * Thèmes « anciens signalements » : les thèmes affichés sur la carte, moins celui de
 * soumission de l'app actuelle (gdp-tools) — ce qui reste, ce sont les signalements
 * envoyés depuis la version précédente de l'application (ancien thème Espace
 * Collaboratif, ex. « Géodésie »). Vide si aucun thème hérité n'est configuré.
 */
export const GDP_REPORT_LEGACY_THEMES = GDP_REPORT_DISPLAY_THEMES.filter(
  (theme) => !matchesGeodesyReportThemeName(theme),
);

export interface GdpReportThemeFilter {
  community: number;
  theme: string;
}

function serializeThemeFilters(themes: string[]): string {
  return JSON.stringify(themes.map((theme) => ({ community: GDP_REPORT_COMMUNITY_ID, theme })));
}

/** Filtre API `GET /reports` (carte : tous les signalements repère géodésique). */
export function serializeGdpReportThemeFilters(): string {
  return serializeThemeFilters(GDP_REPORT_DISPLAY_THEMES);
}

/** Filtre API `GET /reports` pour « Anciens signalements » (thème(s) hérité(s) uniquement). */
export function serializeGdpReportLegacyThemeFilters(): string {
  return serializeThemeFilters(GDP_REPORT_LEGACY_THEMES);
}
