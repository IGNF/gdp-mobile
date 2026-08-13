import type { GeodesyPointReportContext } from '@ign/gdp-tools';

export interface GeodesyPointReportMapContext {
  source: 'map';
  reportContext: GeodesyPointReportContext;
}
