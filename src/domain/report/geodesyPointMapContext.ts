import type { GeodesyPointReportContext } from '@ign/gdp-tools';

export interface GeodesyPointReportMapContext {
  source: 'map';
  reportContext: GeodesyPointReportContext;
}

export function isGeodesyPointReportMapContext(
  value: unknown,
): value is GeodesyPointReportMapContext {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<GeodesyPointReportMapContext>;
  if (candidate.source !== 'map' || !candidate.reportContext) {
    return false;
  }

  const context = candidate.reportContext;
  return (
    typeof context.title === 'string' &&
    typeof context.longitude === 'number' &&
    typeof context.latitude === 'number' &&
    typeof context.comment === 'string'
  );
}
