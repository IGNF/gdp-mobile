import type { Extent } from 'ol/extent';

import type { GroupReport } from '@/domain/report/groupReportModels';
import {
  mapApiReportsToGroupReports,
  type ApiGroupReportResponse,
} from '@/domain/report/groupReportMappers';
import {
  GDP_REPORT_COMMUNITY_ID,
  serializeGdpReportThemeFilters,
} from '@/features/report/constants/reportApi';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';

const MAP_BBOX_PAGE_SIZE = 100;

interface LoadReportsInMapBboxOptions {
  extent4326: Extent;
  authorId?: number;
}

export async function loadReportsInMapBbox({
  extent4326,
  authorId,
}: LoadReportsInMapBboxOptions): Promise<GroupReport[]> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return [];
  }

  const response = await collabApiClient.report.getAll({
    communities: GDP_REPORT_COMMUNITY_ID,
    box: extent4326.join(','),
    page: 1,
    limit: MAP_BBOX_PAGE_SIZE,
    sort: 'id:DESC',
    ...(authorId !== undefined ? { author: authorId } : {}),
    attributes: serializeGdpReportThemeFilters(),
  });

  return mapApiReportsToGroupReports(response.data as ApiGroupReportResponse[]).filter((report) =>
    hasValidCoordinates(report.longitude, report.latitude),
  );
}

function hasValidCoordinates(longitude: number | null, latitude: number | null): boolean {
  return (
    longitude !== null &&
    latitude !== null &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude)
  );
}
