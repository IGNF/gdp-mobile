import type {
  GeodesyFeatureInfoHit,
  GeodesyPointAttribute,
  GeodesyPointDisplay,
} from '@ign/gdp-tools';
import {
  buildGeodesyPointDisplay,
  extractGeodesyCoordinates,
  formatGeodesyHitAsComment,
  formatMapCoordinateSubtitle,
} from '@ign/gdp-tools';

import { GDP_GEODESY_CATALOG } from '@/shared/constants/geodesy';

import type { Coordinate } from 'ol/coordinate';

export type { GeodesyPointAttribute, GeodesyPointDisplay };

export const GDP_GEODESY_EXTERNAL_URL_SOURCE = 'gdp-mobile';

const GDP_DISPLAY_OPTIONS = {
  attributeCatalog: GDP_GEODESY_CATALOG.attributes,
  externalUrlSource: GDP_GEODESY_EXTERNAL_URL_SOURCE,
};

export function buildGdpGeodesyPointDisplay(
  hit: GeodesyFeatureInfoHit,
  fallbackCoordinate: Coordinate,
): GeodesyPointDisplay {
  return buildGeodesyPointDisplay(hit, fallbackCoordinate, GDP_DISPLAY_OPTIONS);
}

export {
  extractGeodesyCoordinates,
  formatGeodesyHitAsComment,
  formatMapCoordinateSubtitle,
};

export { GDP_DISPLAY_OPTIONS as GDP_GEODESY_POINT_DISPLAY_OPTIONS };
