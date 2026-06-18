/** Thème collaboratif signalement sur point géodésique (communauté 96). */
export const GEODESY_REPORT_THEME = 'gdp-tools';

/** Alias acceptés pour le thème géodésie (variantes de nommage API). */
export const GEODESY_REPORT_THEME_ALIASES = [
  GEODESY_REPORT_THEME,
  'mobile-geodesy',
  'mobile_geodesy',
  'mobilegeodesy',
] as const;

/** Normalise un identifiant de thème pour comparaison (casse, accents, tirets, espaces). */
export function normalizeReportThemeName(themeName: string): string {
  return themeName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[-_\s]+/g, '');
}

const NORMALIZED_GEODESY_THEME_ALIASES = new Set(
  GEODESY_REPORT_THEME_ALIASES.map((entry) => normalizeReportThemeName(entry)),
);

/** Vrai si `themeName` correspond au thème géodésie configuré ou à un alias connu. */
export function matchesGeodesyReportThemeName(themeName: string): boolean {
  return NORMALIZED_GEODESY_THEME_ALIASES.has(normalizeReportThemeName(themeName));
}
