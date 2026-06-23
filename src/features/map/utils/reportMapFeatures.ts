import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { createReportStatusMapMarkerStyle } from '@/features/map/utils/reportStatusMapMarkerStyle';

function hasValidCoordinates(longitude: number | null, latitude: number | null): boolean {
  return (
    longitude !== null &&
    latitude !== null &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude)
  );
}

export function createGroupReportMapFeature(report: GroupReport): Feature<Point> | null {
  if (!hasValidCoordinates(report.longitude, report.latitude)) {
    return null;
  }

  const feature = new Feature<Point>(
    new Point(fromLonLat([report.longitude!, report.latitude!])),
  );

  feature.setId(`server-${report.id}`);
  feature.set('groupReport', report);
  feature.set('status', report.status);
  feature.set('reportSource', 'server');
  feature.setStyle(createReportStatusMapMarkerStyle(report.status));

  return feature;
}

export function createGroupReportMapFeatures(reports: GroupReport[]): Feature<Point>[] {
  return reports
    .map(createGroupReportMapFeature)
    .filter((feature): feature is Feature<Point> => feature !== null);
}

export function getGroupReportFromMapFeature(feature: Feature): GroupReport | null {
  const report = feature.get('groupReport');
  return report && typeof report === 'object' ? (report as GroupReport) : null;
}
