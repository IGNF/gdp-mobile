import type { CommunityThemeAttribute, CommunityThemeConfig } from '@/domain/community/models';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';

const COMMUNITY_ATTRIBUTE_TYPES = [
  'text',
  'list',
  'checkbox',
  'date',
  'integer',
  'double',
] as const satisfies readonly CommunityThemeAttribute['type'][];

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCommunityThemeAttributeType(value: unknown): CommunityThemeAttribute['type'] {
  if (
    typeof value === 'string' &&
    (COMMUNITY_ATTRIBUTE_TYPES as readonly string[]).includes(value)
  ) {
    return value as CommunityThemeAttribute['type'];
  }

  return 'text';
}

function readCommunityThemeAttributeName(raw: Record<string, unknown>): string | null {
  for (const key of ['name', 'attribute', 'field', 'key'] as const) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function normalizeCommunityThemeAttribute(raw: unknown): CommunityThemeAttribute | null {
  if (!isRecord(raw)) {
    return null;
  }

  const name = readCommunityThemeAttributeName(raw);
  if (!name) {
    return null;
  }

  return {
    name,
    type: normalizeCommunityThemeAttributeType(raw.type),
    mandatory:
      raw.mandatory === true ||
      raw.mandatory === 1 ||
      raw.mandatory === '1' ||
      raw.mandatory === 'true',
    values: Array.isArray(raw.values)
      ? raw.values.map((value) => String(value))
      : undefined,
    default: typeof raw.default === 'string' ? raw.default : undefined,
  };
}

export function normalizeCommunityThemeAttributes(raw: unknown): CommunityThemeAttribute[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((entry) => normalizeCommunityThemeAttribute(entry))
    .filter((entry): entry is CommunityThemeAttribute => entry !== null);
}

function readThemeName(rawTheme: Record<string, unknown>): string | null {
  if (typeof rawTheme.theme === 'string' && rawTheme.theme.trim()) {
    return rawTheme.theme.trim();
  }

  if (typeof rawTheme.name === 'string' && rawTheme.name.trim()) {
    return rawTheme.name.trim();
  }

  return null;
}

function pushThemeConfig(
  configs: CommunityThemeConfig[],
  seen: Set<string>,
  communityId: number,
  rawTheme: Record<string, unknown>,
): void {
  const themeName = readThemeName(rawTheme);
  if (!themeName) {
    return;
  }

  const key = `${communityId}:${themeName}`;
  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  configs.push({
    communityId,
    theme: themeName,
    attributes: normalizeCommunityThemeAttributes(rawTheme.attributes),
    autofilled_attributes: normalizeCommunityThemeAttributes(rawTheme.autofilled_attributes),
  });
}

function extractThemeConfigsFromProfileSources(
  communityId: number,
  profiles: unknown[],
  configs: CommunityThemeConfig[],
  seen: Set<string>,
): void {
  for (const profile of profiles) {
    if (!isRecord(profile) || !Array.isArray(profile.themes)) {
      continue;
    }

    for (const rawTheme of profile.themes) {
      if (!isRecord(rawTheme)) {
        continue;
      }

      pushThemeConfig(configs, seen, communityId, rawTheme);
    }
  }
}

function isCommunityThemeDefinition(raw: unknown): raw is Record<string, unknown> {
  if (!isRecord(raw)) {
    return false;
  }

  if (!readThemeName(raw)) {
    return false;
  }

  return Array.isArray(raw.attributes) || Array.isArray(raw.autofilled_attributes);
}

function collectCommunityRootThemeDefinitions(
  community: Record<string, unknown>,
): Record<string, unknown>[] {
  if (!Array.isArray(community.attributes)) {
    return [];
  }

  return community.attributes.filter(isCommunityThemeDefinition);
}

function collectCommunityProfileSources(community: Record<string, unknown>): unknown[] {
  const profiles: unknown[] = [];

  if (Array.isArray(community.themes)) {
    profiles.push({ themes: community.themes });
  }

  if (isRecord(community.profiles)) {
    profiles.push(...Object.values(community.profiles));
  }

  if (isRecord(community.profile)) {
    if (Array.isArray(community.profile.themes)) {
      profiles.push(community.profile);
    }

    for (const candidate of Object.values(community.profile)) {
      if (isRecord(candidate) && Array.isArray(candidate.themes)) {
        profiles.push(candidate);
      }
    }
  }

  return profiles;
}

/** Thèmes d’une fiche communauté (`GET /communities/{id}`). */
export function extractThemeConfigsFromCommunity(
  community: unknown,
  communityId: number = GDP_REPORT_COMMUNITY_ID,
): CommunityThemeConfig[] {
  if (!isRecord(community)) {
    return [];
  }

  const configs: CommunityThemeConfig[] = [];
  const seen = new Set<string>();

  for (const rawTheme of collectCommunityRootThemeDefinitions(community)) {
    pushThemeConfig(configs, seen, communityId, rawTheme);
  }

  extractThemeConfigsFromProfileSources(
    communityId,
    collectCommunityProfileSources(community),
    configs,
    seen,
  );

  return configs;
}

export function listGdpCommunityThemeNamesFromConfigs(
  configs: CommunityThemeConfig[],
): string[] {
  return configs
    .filter((entry) => entry.communityId === GDP_REPORT_COMMUNITY_ID)
    .map((entry) => entry.theme);
}

export function extractCommunityReportThemeFromConfigs(
  configs: CommunityThemeConfig[],
  themeName: string,
  communityId: number = GDP_REPORT_COMMUNITY_ID,
): CommunityThemeConfig | null {
  const normalizedTarget = themeName.trim().toLowerCase();

  return (
    configs.find(
      (theme) =>
        theme.communityId === communityId && theme.theme.toLowerCase() === normalizedTarget,
    ) ?? null
  );
}

function buildDefaultThemeAttributeValues(
  attributes: CommunityThemeAttribute[],
): Record<string, string> {
  const values: Record<string, string> = {};

  for (const attribute of attributes) {
    values[attribute.name] = attribute.default ?? '';
  }

  return values;
}

export function mergeThemeAttributeValues(
  attributes: CommunityThemeAttribute[],
  currentValues: Record<string, string>,
): Record<string, string> {
  const defaults = buildDefaultThemeAttributeValues(attributes);

  return {
    ...defaults,
    ...currentValues,
  };
}

export function validateThemeAttributeValue(
  attribute: CommunityThemeAttribute,
  value: string,
): string | undefined {
  const trimmedValue = value.trim();

  if (attribute.mandatory && !trimmedValue) {
    return 'Ce champ est obligatoire.';
  }

  if (!trimmedValue) {
    return undefined;
  }

  if (attribute.type === 'integer' && !/^-?\d+$/.test(trimmedValue)) {
    return 'Valeur entière invalide.';
  }

  if (attribute.type === 'double' && !/^-?\d+(\.\d+)?$/.test(trimmedValue)) {
    return 'Valeur décimale invalide.';
  }

  return undefined;
}

export function getThemeAttributeListOptions(
  attribute: CommunityThemeAttribute,
): readonly { value: string; label: string }[] {
  return [
    { value: '', label: 'Sélectionner…' },
    ...(attribute.values ?? []).map((optionValue) => ({
      value: optionValue,
      label: optionValue,
    })),
  ];
}
