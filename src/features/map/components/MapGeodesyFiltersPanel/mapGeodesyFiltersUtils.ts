import {
  countActiveGeodesyWfsAttributeFilters,
  createDefaultGeodesyWfsAttributeFilterValues,
  getGeodesyWfsMultiChoiceSelectedValues,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

function isActiveDateFilterValue(value: boolean | string | null | undefined): boolean {
  return typeof value === 'string' && value.trim() !== '';
}

// Chaque paire FROM/TO forme un seul filtre visuellement (une paire de cellules "Du"/"Au"),
// mais compte pour 2 côté gdp-tools (une par id) : on déduit 1 par paire active pour refléter
// un seul filtre dans le badge.
const DATE_RANGE_FILTER_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['OBS_DATE_FROM', 'OBS_DATE_TO'],
  ['VIS_DATE_FROM', 'VIS_DATE_TO'],
];

export function countActiveMapGeodesyFilters(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
  values: GeodesyWfsAttributeFilterValues,
): number {
  const baseCount = countActiveGeodesyWfsAttributeFilters(filters, values);

  const activeRangePairs = DATE_RANGE_FILTER_PAIRS.filter(
    ([fromId, toId]) => isActiveDateFilterValue(values[fromId]) && isActiveDateFilterValue(values[toId]),
  ).length;

  return baseCount - activeRangePairs;
}

export function createDefaultMapGeodesyFilterValues(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
): GeodesyWfsAttributeFilterValues {
  return createDefaultGeodesyWfsAttributeFilterValues(filters);
}

const MATOMO_SUMMARY_MAX_LENGTH = 150;

const DATE_RANGE_MATOMO_SECTIONS: ReadonlyArray<{
  fromId: string;
  toId: string;
  title: string;
}> = [
  { fromId: 'VIS_DATE_FROM', toId: 'VIS_DATE_TO', title: 'Vu en place' },
  { fromId: 'OBS_DATE_FROM', toId: 'OBS_DATE_TO', title: 'Année de détermination' },
];

function appendDateRangeSummary(
  parts: string[],
  values: GeodesyWfsAttributeFilterValues,
  fromId: string,
  toId: string,
  title: string,
): void {
  const from = values[fromId];
  const to = values[toId];
  const fromYear = typeof from === 'string' ? from.trim() : '';
  const toYear = typeof to === 'string' ? to.trim() : '';

  if (!fromYear && !toYear) {
    return;
  }

  parts.push(`${title}: ${fromYear || '…'}–${toYear || '…'}`);
}

/** Résumé lisible pour Matomo (sans identifiants de points). */
export function buildGeodesyFiltersMatomoSummary(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
  values: GeodesyWfsAttributeFilterValues,
): string {
  const parts: string[] = [];

  for (const filter of filters) {
    if (filter.type === 'date') {
      continue;
    }

    const value = values[filter.id];

    if (filter.type === 'multiChoice') {
      if (value === null || value === undefined) {
        continue;
      }

      const selected = getGeodesyWfsMultiChoiceSelectedValues(filter, value);
      if (selected.size === filter.options.length) {
        continue;
      }

      const labels = filter.options
        .filter((option) => selected.has(option.value))
        .map((option) => option.label);

      if (labels.length > 0) {
        parts.push(`${filter.title}: ${labels.join(', ')}`);
      }
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (filter.type === 'choice') {
      const option = filter.options.find((entry) => entry.value === value);
      parts.push(`${filter.title}: ${option?.label ?? String(value)}`);
      continue;
    }

    if (filter.type === 'boolean') {
      parts.push(`${filter.title}: ${value ? filter.trueLabel : filter.falseLabel}`);
    }
  }

  for (const section of DATE_RANGE_MATOMO_SECTIONS) {
    appendDateRangeSummary(parts, values, section.fromId, section.toId, section.title);
  }

  if (parts.length === 0) {
    return 'Par défaut';
  }

  const summary = parts.join(' · ');
  return summary.length > MATOMO_SUMMARY_MAX_LENGTH
    ? `${summary.slice(0, MATOMO_SUMMARY_MAX_LENGTH - 1)}…`
    : summary;
}
