import {
  buildGeodesyPointDisplay,
  buildGeodesyPointReportContext,
  type BuildGeodesyPointDisplayOptions,
  type GeodesyFeatureInfoHit,
} from '@ign/gdp-tools';
import type { Coordinate } from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { toLonLat } from 'ol/proj';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

function resolveFallbackCoordinate(hit: GeodesyFeatureInfoHit): Coordinate {
  const geometry = hit.feature.getGeometry();
  if (geometry instanceof Point) {
    return geometry.getCoordinates();
  }

  const stored = hit.feature.get('coordinate') as Coordinate | undefined;
  if (stored) {
    return stored;
  }

  return toLonLat([0, 0]);
}

export function buildMapGeodesyClickActionFromHit(
  hit: GeodesyFeatureInfoHit,
  displayOptions: BuildGeodesyPointDisplayOptions,
): MapGeodesyClickAction {
  const coordinate = resolveFallbackCoordinate(hit);
  const point = buildGeodesyPointDisplay(hit, coordinate, {
    ...displayOptions,
    layerId: hit.layerId,
  });
  const reportContext = buildGeodesyPointReportContext(hit, coordinate, {
    ...displayOptions,
    layerId: hit.layerId,
  });

  return {
    kind: 'geodesy',
    point,
    reportContext,
  };
}
