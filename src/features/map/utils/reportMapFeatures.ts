import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';

import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import {
  createLocalReportDraftMapMarkerStyle,
  createReportStatusMapMarkerStyle,
} from '@/features/map/utils/reportStatusMapMarkerStyle';

function hasValidCoordinates(longitude: number | null, latitude: number | null): boolean {
  return (
    longitude !== null &&
    latitude !== null &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude)
  );
}

function createGroupReportMapFeature(report: GroupReport): Feature<Point> | null {
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

function createLocalReportDraftMapFeature(draft: LocalReportDraft): Feature<Point> | null {
  if (!hasValidCoordinates(draft.longitude, draft.latitude)) {
    return null;
  }

  const feature = new Feature<Point>(new Point(fromLonLat([draft.longitude, draft.latitude])));

  feature.setId(`local-${draft.id}`);
  feature.set('localReportDraft', draft);
  feature.set('status', draft.status);
  feature.set('reportSource', 'local');
  feature.setStyle(createLocalReportDraftMapMarkerStyle(draft.status));

  return feature;
}

export function createLocalReportDraftMapFeatures(drafts: readonly LocalReportDraft[]): Feature<Point>[] {
  return drafts
    .map(createLocalReportDraftMapFeature)
    .filter((feature): feature is Feature<Point> => feature !== null);
}

export function getLocalReportDraftFromMapFeature(feature: Feature): LocalReportDraft | null {
  const draft = feature.get('localReportDraft');
  return draft && typeof draft === 'object' ? (draft as LocalReportDraft) : null;
}
