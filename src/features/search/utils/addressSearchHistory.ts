import { SEARCH_HISTORY_STORAGE_KEY } from '@/features/search/constants/searchGeoportail';

export interface AddressSearchHistoryEntry {
  id: string;
  title: string;
  subtitle: string;
  longitude: number;
  latitude: number;
}

function buildSubtitle(record: Record<string, unknown>, fulltext: string, title: string): string {
  const city = typeof record.city === 'string' ? record.city.trim() : '';
  const zipcode =
    (typeof record.zipcode === 'string' ? record.zipcode : typeof record.postcode === 'string' ? record.postcode : '').trim();

  if (city && zipcode) {
    return `${city}${zipcode ? `, ${zipcode}` : ''}`;
  }

  if (city) {
    return city;
  }

  const remainder = fulltext
    .split(',')
    .slice(1)
    .join(',')
    .trim();

  if (remainder && remainder !== title) {
    return remainder;
  }

  return '';
}

function parseHistoryItem(item: unknown, index: number): AddressSearchHistoryEntry | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const record = item as Record<string, unknown>;
  const longitude = Number(record.x);
  const latitude = Number(record.y);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  const fulltext = typeof record.fulltext === 'string' ? record.fulltext.trim() : '';
  const title = fulltext.split(',')[0]?.trim() || fulltext || 'Recherche';
  const subtitle = buildSubtitle(record, fulltext, title);

  return {
    id: `${longitude}-${latitude}-${index}`,
    title,
    subtitle,
    longitude,
    latitude,
  };
}

/** Lit l’historique des recherches adresse mémorisé par ol-ext. */
export function readAddressSearchHistory(): AddressSearchHistoryEntry[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item, index) => parseHistoryItem(item, index))
      .filter((entry): entry is AddressSearchHistoryEntry => entry !== null);
  } catch {
    return [];
  }
}
