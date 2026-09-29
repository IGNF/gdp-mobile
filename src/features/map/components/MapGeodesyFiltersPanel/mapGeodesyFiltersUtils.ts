import {
  countActiveGeodesyWfsAttributeFilters,
  createDefaultGeodesyWfsAttributeFilterValues,
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
