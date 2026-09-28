import {
  buildGdpPointReportThemeAttributes,
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

/** Attributs thème envoyés au collaboratif (whitelist thème `gdp-tools`, sans sketch). */
export function buildGeodesyPointReportThemeAttributesForSubmit(
  context: GeodesyPointReportContext,
  theme: CommunityThemeConfig | null,
  formThemeAttributes: Record<string, string>,
  _themeName: string = GEODESY_REPORT_THEME,
): Record<string, string> {
  const themeAttributeNames = [...getGeodesyThemeAttributeNames(theme, context)];

  return buildGdpPointReportThemeAttributes(context, {
    themeAttributeNames: themeAttributeNames.length > 0 ? themeAttributeNames : undefined,
    formAttributes: formThemeAttributes,
    autofilledAttributes: theme?.autofilled_attributes,
    themeAttributeDefs: [
      ...(theme?.attributes ?? []),
      ...(theme?.autofilled_attributes ?? []),
    ],
  });
}




export function buildGeodesyReportSubmissionComment(
  userComment: string,
  deviceInfo: ReportSubmissionDeviceInfo,
): string {
  return appendDeviceInfoToReportComment(userComment.trim(), deviceInfo);
}
