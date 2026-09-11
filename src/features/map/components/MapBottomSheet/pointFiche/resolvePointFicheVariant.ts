import { extractGeodesyPointReportDomaine, type GeodesyPointReportContext } from '@ign/gdp-tools';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

export type PointFicheVariant = 'geodesy' | 'nivellement';

const NIVELLEMENT_DOMAINES = new Set(['nivf', 'nivo', 'nive']);
const GEODESY_DOMAINES = new Set(['rsgf', 'rsgo', 'rsge']);

export function resolvePointVariantFromReportContext(
  reportContext: GeodesyPointReportContext,
): PointFicheVariant {
  const domaine = extractGeodesyPointReportDomaine(reportContext);

  if (domaine && NIVELLEMENT_DOMAINES.has(domaine)) {
    return 'nivellement';
  }

  if (domaine && GEODESY_DOMAINES.has(domaine)) {
    return 'geodesy';
  }

  const layerId = reportContext.layerId;
  if (layerId === 'RN' || layerId === 'DOMAIN_NIVELLEMENT') {
    return 'nivellement';
  }

  return 'geodesy';
}

export function resolvePointFicheVariant(action: MapGeodesyClickAction): PointFicheVariant {
  return resolvePointVariantFromReportContext(action.reportContext);
}
