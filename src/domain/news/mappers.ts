import type {
  GdpNewsAudience,
  GdpNewsCta,
  GdpNewsDisplay,
  GdpNewsFeed,
  GdpNewsItem,
  GdpNewsPlatform,
  GdpNewsSeverity,
} from './models';

const SEVERITIES = new Set<GdpNewsSeverity>(['info', 'warning', 'error']);
const AUDIENCES = new Set<GdpNewsAudience>(['all', 'authenticated']);
const DISPLAYS = new Set<GdpNewsDisplay>(['banner', 'modal']);
const PLATFORMS = new Set<GdpNewsPlatform>(['web', 'android', 'ios']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseIsoDate(value: unknown): string | null {
  const raw = asTrimmedString(value);
  if (!raw) {
    return null;
  }
  const time = Date.parse(raw);
  return Number.isNaN(time) ? null : raw;
}

function parsePlatforms(value: unknown): GdpNewsPlatform[] {
  if (!Array.isArray(value) || value.length === 0) {
    return ['web', 'android', 'ios'];
  }

  const platforms = value.filter((item): item is GdpNewsPlatform =>
    typeof item === 'string' && PLATFORMS.has(item as GdpNewsPlatform),
  );

  return platforms.length > 0 ? platforms : ['web', 'android', 'ios'];
}

function parseCta(value: unknown): GdpNewsCta | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const label = asTrimmedString(value.label);
  const url = asTrimmedString(value.url);
  if (!label || !url) {
    return undefined;
  }

  return { label, url };
}

function parseItem(value: unknown): GdpNewsItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asTrimmedString(value.id);
  const title = asTrimmedString(value.title);
  const body = asTrimmedString(value.body);
  const startsAt = parseIsoDate(value.startsAt);
  const endsAt = parseIsoDate(value.endsAt);
  const severity = asTrimmedString(value.severity);

  if (!id || !title || !body || !startsAt || !endsAt || !severity || !SEVERITIES.has(severity as GdpNewsSeverity)) {
    return null;
  }

  const audienceRaw = asTrimmedString(value.audience);
  const displayRaw = asTrimmedString(value.display);

  return {
    id,
    title,
    body,
    startsAt,
    endsAt,
    severity: severity as GdpNewsSeverity,
    platforms: parsePlatforms(value.platforms),
    audience: audienceRaw && AUDIENCES.has(audienceRaw as GdpNewsAudience)
      ? (audienceRaw as GdpNewsAudience)
      : 'all',
    display: displayRaw && DISPLAYS.has(displayRaw as GdpNewsDisplay)
      ? (displayRaw as GdpNewsDisplay)
      : 'banner',
    dismissible: value.dismissible !== false,
    showOnce: value.showOnce === true,
    cta: parseCta(value.cta),
  };
}

export function parseGdpNewsFeed(value: unknown): GdpNewsFeed {
  if (!isRecord(value)) {
    return { schemaVersion: 1, items: [] };
  }

  const schemaVersion =
    typeof value.schemaVersion === 'number' && Number.isFinite(value.schemaVersion)
      ? value.schemaVersion
      : 1;

  const rawItems = Array.isArray(value.items) ? value.items : [];
  const items = rawItems
    .map(parseItem)
    .filter((item): item is GdpNewsItem => item !== null);

  return { schemaVersion, items };
}
