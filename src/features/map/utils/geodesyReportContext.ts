import type {
  GeodesyPointAttribute,
  GeodesyPointDisplay,
} from '@ign/gdp-tools';



import { GDP_GEODESY_EXPERT_CATALOG } from '@/shared/constants/geodesy';

export type { GeodesyPointAttribute, GeodesyPointDisplay };

const GDP_GEODESY_EXTERNAL_URL_SOURCE = 'gdp-mobile';

const GDP_DISPLAY_OPTIONS = {
  attributeCatalog: GDP_GEODESY_EXPERT_CATALOG.attributes,
  externalUrlSource: GDP_GEODESY_EXTERNAL_URL_SOURCE,
};

export { GDP_DISPLAY_OPTIONS as GDP_GEODESY_POINT_DISPLAY_OPTIONS };
