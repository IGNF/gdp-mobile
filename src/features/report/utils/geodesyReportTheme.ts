import {
  buildGeodesyPointReportPrefillMap,
  buildGeodesyPointReportThemeAttributes,
  mergeGeodesyPointReportMandatoryThemeAttributes,
  resolveGeodesyPointReportPrefillValue,
  type GeodesyPointReportContext,
} from '@ign/gdp-tools';
import type { CommunityThemeAttribute, CommunityThemeConfig } from '@/domain/community/models';
import {
  GEODESY_REPORT_THEME,
  matchesGeodesyReportThemeName,
} from '@/features/report/constants/geodesyReportApi';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import {
  extractCommunityReportThemeFromConfigs,
} from '@/features/report/utils/communityReportTheme';
import {
  buildInitialThemeAttributeValuesFromRepere,
  getThemeFormAttributesFromRepere,
} from '@/features/report/utils/reportThemePrefill';
import {
  appendDeviceInfoToReportComment,
  type ReportSubmissionDeviceInfo,
} from '@/platform/device/reportDeviceMetadata';

function listGdpCommunityThemes(configs: CommunityThemeConfig[]): CommunityThemeConfig[] {
  return configs.filter((theme) => theme.communityId === GDP_REPORT_COMMUNITY_ID);
}

/** Thème collaboratif signalement sur point ({@link GEODESY_REPORT_THEME} + alias). */
export function extractGeodesyReportThemeFromConfigs(
  configs: CommunityThemeConfig[],
): CommunityThemeConfig | null {
  const exactMatch = extractCommunityReportThemeFromConfigs(configs, GEODESY_REPORT_THEME);
  if (exactMatch) {
    return exactMatch;
  }

  return (
    listGdpCommunityThemes(configs).find((theme) =>
      matchesGeodesyReportThemeName(theme.theme),
    ) ?? null
  );
}

/** Attributs éditables dans le formulaire (hors champs auto-remplis côté serveur). */
export function getGeodesyThemeFormAttributes(
  theme: CommunityThemeConfig | null,
  context?: GeodesyPointReportContext,
): CommunityThemeAttribute[] {
  return getThemeFormAttributesFromRepere(theme, context);
}

/** Valeurs initiales des champs thème préremplies depuis le repère cliqué. */
export function buildInitialGeodesyThemeAttributeValues(
  context: GeodesyPointReportContext,
  theme: CommunityThemeConfig | null,
): Record<string, string> {
  return buildInitialThemeAttributeValuesFromRepere(theme, context);
}

function getGeodesyThemeAttributeNames(
  theme: CommunityThemeConfig | null,
  context?: GeodesyPointReportContext,
): Set<string> {
  const names = new Set<string>();

  for (const attribute of getGeodesyThemeFormAttributes(theme, context)) {
    names.add(attribute.name);
  }

  for (const attribute of theme?.autofilled_attributes ?? []) {
    names.add(attribute.name);
  }

  return names;
}

/** Attributs thème envoyés au collaboratif (repère, champs auto, saisie formulaire). */
export function buildGeodesyPointReportThemeAttributesForSubmit(
  context: GeodesyPointReportContext,
  theme: CommunityThemeConfig | null,
  formThemeAttributes: Record<string, string>,
  themeName: string = GEODESY_REPORT_THEME,
): Record<string, string> {
  const themeAttributeNames = getGeodesyThemeAttributeNames(theme, context);
  const prefillMap = buildGeodesyPointReportPrefillMap(context);
  const attributes: Record<string, string> = {};

  if (themeAttributeNames.size > 0) {
    for (const name of themeAttributeNames) {
      const candidate = resolveGeodesyPointReportPrefillValue(context, name, prefillMap);
      if (candidate === undefined) {
        continue;
      }

      attributes[name] = candidate;
    }
  } else if (matchesGeodesyReportThemeName(themeName)) {
    Object.assign(attributes, buildGeodesyPointReportThemeAttributes(context));
  }

  for (const attribute of theme?.autofilled_attributes ?? []) {
    if (attributes[attribute.name] !== undefined) {
      continue;
    }

    const fromContext = context.properties[attribute.name];
    if (fromContext !== null && fromContext !== undefined && String(fromContext).trim()) {
      attributes[attribute.name] = String(fromContext).trim();
      continue;
    }

    if (attribute.default) {
      attributes[attribute.name] = attribute.default;
    }
  }

  for (const [name, rawValue] of Object.entries(formThemeAttributes)) {
    if (themeAttributeNames.size > 0 && !themeAttributeNames.has(name)) {
      continue;
    }

    const value = rawValue.trim();
    if (value) {
      attributes[name] = value;
    }
  }

  return mergeGeodesyPointReportMandatoryThemeAttributes(context, attributes);
}

export function formatGeodesyThemeLookupHint(themeNames: readonly string[]): string {
  const available = [...themeNames];
  if (available.length === 0) {
    return `Aucun thème trouvé pour la communauté ${GDP_REPORT_COMMUNITY_ID}. À l'envoi, le thème configuré « ${GEODESY_REPORT_THEME} » sera utilisé.`;
  }

  return `Thèmes disponibles dans la communauté : ${available.join(', ')}. Attendu : « ${GEODESY_REPORT_THEME} ».`;
}

/** Nom de thème envoyé au collaboratif (fiche communauté ou repli configuré). */
export function resolveGeodesyReportThemeNameFromConfigs(
  configs: CommunityThemeConfig[],
): string {
  return extractGeodesyReportThemeFromConfigs(configs)?.theme ?? GEODESY_REPORT_THEME;
}

export function buildGeodesyReportSubmissionComment(
  userComment: string,
  themeName: string,
  deviceInfo: ReportSubmissionDeviceInfo,
): string {
  const themeLine = `Thème collaboratif : ${themeName}`;
  const trimmedComment = userComment.trim();
  const withTheme = trimmedComment ? `${trimmedComment}\n\n${themeLine}` : themeLine;

  return appendDeviceInfoToReportComment(withTheme, deviceInfo);
}
