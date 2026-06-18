import type { GeodesyPointReportContext } from '@ign/gdp-tools';
import {
  buildGeodesyPointReportPrefillMap,
  normalizeGeodesyPointReportAttributeName,
  resolveGeodesyPointReportPrefillValue,
  shouldShowGeodesyPointReportThemeAttribute,
} from '@ign/gdp-tools';

import type { CommunityThemeAttribute, CommunityThemeConfig } from '@/domain/community/models';
import { mergeThemeAttributeValues } from '@/features/report/utils/communityReportTheme';

function matchThemeListValue(attribute: CommunityThemeAttribute, value: string): string {
  if (attribute.type !== 'list' || !attribute.values?.length) {
    return value;
  }

  const exact = attribute.values.find((option) => option === value);
  if (exact) {
    return exact;
  }

  const insensitive = attribute.values.find(
    (option) => option.toLowerCase() === value.toLowerCase(),
  );
  return insensitive ?? value;
}

function resolveThemeAttributePrefillValue(
  context: GeodesyPointReportContext,
  attribute: CommunityThemeAttribute,
  prefillMap: Record<string, string>,
): string {
  const raw =
    resolveGeodesyPointReportPrefillValue(context, attribute.name, prefillMap) ??
    attribute.default ??
    '';
  const normalized = String(raw).trim();
  if (!normalized) {
    return '';
  }

  return matchThemeListValue(attribute, normalized);
}

/** Champs thème visibles, avec repli repère géodésique (`id` / `domaine` conditionnels). */
export function getThemeFormAttributesFromRepere(
  theme: CommunityThemeConfig | null,
  context?: GeodesyPointReportContext,
): CommunityThemeAttribute[] {
  if (!theme) {
    return [];
  }

  if (!context) {
    return theme.attributes;
  }

  const prefillMap = buildGeodesyPointReportPrefillMap(context);
  const editable = theme.attributes.filter((attribute) =>
    shouldShowGeodesyPointReportThemeAttribute(context, attribute.name, prefillMap),
  );
  const editableNames = new Set(
    editable.map((attribute) => normalizeGeodesyPointReportAttributeName(attribute.name)),
  );

  const autofilled = (theme.autofilled_attributes ?? []).filter((attribute) => {
    const normalizedName = normalizeGeodesyPointReportAttributeName(attribute.name);
    if (editableNames.has(normalizedName)) {
      return false;
    }

    return resolveGeodesyPointReportPrefillValue(context, attribute.name, prefillMap) !== undefined;
  });

  return [...editable, ...autofilled];
}

/** Valeurs initiales des champs thème préremplies depuis un repère géodésique cliqué. */
export function buildInitialThemeAttributeValuesFromRepere(
  theme: CommunityThemeConfig | null,
  context?: GeodesyPointReportContext,
): Record<string, string> {
  const formAttributes = getThemeFormAttributesFromRepere(theme, context);
  if (!context) {
    return mergeThemeAttributeValues(formAttributes, {});
  }

  const prefillMap = buildGeodesyPointReportPrefillMap(context);
  const prefilled: Record<string, string> = {};

  for (const attribute of formAttributes) {
    const candidate = resolveThemeAttributePrefillValue(context, attribute, prefillMap);
    if (candidate) {
      prefilled[attribute.name] = candidate;
    }
  }

  return mergeThemeAttributeValues(formAttributes, prefilled);
}
