import type { GeodesyPointPhoto } from '@ign/gdp-tools';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

const SKIPPED_PROPERTY_KEYS = new Set([
  'geometry',
  'features',
  'coordinate',
  'boundedBy',
]);

export interface PointFieldEntry {
  id: string;
  label: string;
  value: string;
}

export interface PointCarouselItem {
  id: string;
  label: string;
  imageUrl: string;
  caption?: string;
}

export function formatSentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

const ALTITUDE_SYSTEM_LABEL_PREFIX = /^syst[eè]me\s+altim[eé]trique\s*:\s*/i;

/** Retire le libellé « Système altimétrique : » en tête de `cp1_srv` / `systeme_altitude`. */
export function stripAltitudeSystemLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const stripped = trimmed.replace(ALTITUDE_SYSTEM_LABEL_PREFIX, '').trim();
  return stripped || trimmed;
}

const CG1_SRT_ELLIPSOID_SEPARATOR = /\s*-\s*ellipso[iï]de\s*:\s*/i;
const CG1_SRT_SYSTEM_PREFIX = /^syst[eè]me\s*:\s*/i;

function parseCg1SrtParts(cg1Srt: string): { system: string; ellipsoid: string } {
  const trimmed = cg1Srt.trim();
  if (!trimmed) {
    return { system: '', ellipsoid: '' };
  }

  const [systemPart, ellipsoidPart] = trimmed.split(CG1_SRT_ELLIPSOID_SEPARATOR);
  const system = (systemPart ?? '').replace(CG1_SRT_SYSTEM_PREFIX, '').trim();

  return {
    system: system || trimmed,
    ellipsoid: ellipsoidPart?.trim() ?? '',
  };
}

/** Extrait le système de référence depuis `cg1_srt` (ex. « RGF93 v1 (ETRS89) »). */
export function parseGeographicReferenceSystem(cg1Srt: string): string {
  return parseCg1SrtParts(cg1Srt).system;
}

/** Extrait l’ellipsoïde depuis `cg1_srt` (ex. « IAG GRS 1980 »). */
export function parseGeographicEllipsoid(cg1Srt: string): string {
  return parseCg1SrtParts(cg1Srt).ellipsoid;
}

const CP1_SRT_PROJECTION_SEPARATOR = /\s*-\s*projection\s*:\s*/i;
const CP1_SRT_PROJECTION_PREFIX = /^projection\s*:\s*/i;
const CP1_SRT_SYSTEM_PREFIX = /^syst[eè]me(?:\s+de\s+projection)?\s*:\s*/i;

/** Extrait la projection depuis `cp1_srt` (ex. « Lambert-93 »). */
export function parseProjectedProjection(cp1Srt: string): string {
  const trimmed = cp1Srt.trim();
  if (!trimmed) {
    return '';
  }

  const [, projectionPart] = trimmed.split(CP1_SRT_PROJECTION_SEPARATOR);
  if (projectionPart?.trim()) {
    return projectionPart.trim();
  }

  for (const prefix of [CP1_SRT_PROJECTION_PREFIX, CP1_SRT_SYSTEM_PREFIX]) {
    const stripped = trimmed.replace(prefix, '').trim();
    if (stripped !== trimmed) {
      return stripped;
    }
  }

  return trimmed;
}

export function normalizeEtatLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .trim();
}

export function isBonEtatLabel(etatLabel: string): boolean {
  return normalizeEtatLabel(etatLabel) === 'BON ETAT';
}

function isScalarPropertyValue(value: unknown): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function readProperty(action: MapGeodesyClickAction, key: string): string | null {
  const properties = action.reportContext.properties;
  const raw = properties[key] ?? properties[key.toUpperCase()];
  if (raw === null || raw === undefined) {
    return null;
  }

  const text = String(raw).trim();
  return text || null;
}

export function findAttributeByLabel(
  action: MapGeodesyClickAction,
  matcher: (label: string) => boolean,
): string | null {
  const attribute = action.point.attributes.find((item) => matcher(item.label.toLowerCase()));
  return attribute?.value?.trim() || null;
}

export function findEtatLabel(action: MapGeodesyClickAction): string | null {
  return (
    readProperty(action, 'etat') ??
    readProperty(action, 'ETAT') ??
    findAttributeByLabel(action, (label) => label.includes('état') || label.includes('etat'))
  );
}

export function findVisitYear(action: MapGeodesyClickAction): string | null {
  const visDate =
    readProperty(action, 'vis_date') ??
    findAttributeByLabel(action, (label) => label.includes('visite') || label.includes('vis_date'));

  if (!visDate) {
    return null;
  }

  const yearMatch = visDate.match(/\d{4}/);
  return yearMatch?.[0] ?? null;
}

function normalizeCarouselImageUrl(url: string): string {
  return url.trim().toLowerCase();
}

function photoToCarouselItem(photo: GeodesyPointPhoto): PointCarouselItem {
  return {
    id: photo.key,
    label: photo.label,
    imageUrl: photo.displayUrl || photo.url,
    caption: photo.label,
  };
}

/** Photos et croquis pour le carrousel horizontal. */
export function buildPointCarouselItems(action: MapGeodesyClickAction): PointCarouselItem[] {
  const items: PointCarouselItem[] = [];
  const seenUrls = new Set<string>();

  action.point.photos.forEach((photo) => {
    const item = photoToCarouselItem(photo);
    const urlKey = normalizeCarouselImageUrl(item.imageUrl);

    if (seenUrls.has(urlKey)) {
      return;
    }

    seenUrls.add(urlKey);
    items.push(item);
  });

  return items;
}

export function collectAllPointFields(action: MapGeodesyClickAction): PointFieldEntry[] {
  const byId = new Map<string, PointFieldEntry>();

  for (const [key, value] of Object.entries(action.reportContext.properties)) {
    if (SKIPPED_PROPERTY_KEYS.has(key) || !isScalarPropertyValue(value)) {
      continue;
    }

    const text = String(value).trim();
    if (!text) {
      continue;
    }

    byId.set(key.toLowerCase(), { id: key, label: key, value: text });
  }

  action.point.attributes.forEach((attribute, index) => {
    const id = `attribute:${attribute.label}:${index}`;
    if (!attribute.value?.trim()) {
      return;
    }

    byId.set(id, {
      id,
      label: attribute.label,
      value: attribute.value.trim(),
    });
  });

  if (action.point.comment.trim()) {
    byId.set('comment', {
      id: 'comment',
      label: 'comment',
      value: action.point.comment.trim(),
    });
  }

  return Array.from(byId.values()).sort((left, right) => left.label.localeCompare(right.label, 'fr'));
}

export function filterUnmappedPointFields(
  fields: readonly PointFieldEntry[],
  displayedIds: ReadonlySet<string>,
): PointFieldEntry[] {
  return fields.filter((field) => {
    const normalizedId = field.id.toLowerCase();
    return !displayedIds.has(field.id) && !displayedIds.has(normalizedId);
  });
}

export function mergeDisplayedFieldIds(...groups: readonly string[][]): Set<string> {
  const ids = new Set<string>();
  groups.flat().forEach((id) => {
    ids.add(id);
    ids.add(id.toLowerCase());
  });
  return ids;
}
