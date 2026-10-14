import {
  countActiveGeodesyWfsAttributeFilters,
  createDefaultGeodesyWfsAttributeFilterValues,
  getGeodesyWfsMultiChoiceSelectedValues,
  type GeodesyWfsAttributeFilterDefinition,
  type GeodesyWfsAttributeFilterValues,
} from '@ign/gdp-tools';

import type { GeodesyFilterCriterion } from '@/infra/analytics/matomo';

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

const DATE_RANGE_MATOMO_SECTIONS: ReadonlyArray<{
  fromId: string;
  toId: string;
  title: string;
}> = [
  { fromId: 'VIS_DATE_FROM', toId: 'VIS_DATE_TO', title: 'Vu en place' },
  { fromId: 'OBS_DATE_FROM', toId: 'OBS_DATE_TO', title: 'Année de détermination' },
];

function appendDateRangeCriterion(
  criteria: GeodesyFilterCriterion[],
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

  criteria.push({ title, value: `${fromYear || '…'}–${toYear || '…'}` });
}

/** Critères actifs lisibles pour Matomo (sans identifiants de points), une entrée par valeur. */
export function listGeodesyFiltersMatomoCriteria(
  filters: readonly GeodesyWfsAttributeFilterDefinition[],
  values: GeodesyWfsAttributeFilterValues,
): GeodesyFilterCriterion[] {
  const criteria: GeodesyFilterCriterion[] = [];

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

      for (const option of filter.options) {
        if (selected.has(option.value)) {
          criteria.push({ title: filter.title, value: option.label });
        }
      }
      continue;
    }

    if (value === null || value === undefined) {
      continue;
    }

    if (filter.type === 'choice') {
      const option = filter.options.find((entry) => entry.value === value);
      criteria.push({ title: filter.title, value: option?.label ?? String(value) });
      continue;
    }

    if (filter.type === 'boolean') {
      criteria.push({
        title: filter.title,
        value: (value ? filter.trueLabel : filter.falseLabel) ?? (value ? 'Oui' : 'Non'),
      });
    }
  }

  for (const section of DATE_RANGE_MATOMO_SECTIONS) {
    appendDateRangeCriterion(criteria, values, section.fromId, section.toId, section.title);
  }

  return criteria;
}
