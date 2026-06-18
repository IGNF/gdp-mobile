import { ReportStatus } from '@ign/mobile-core';

import type { GroupReport } from '@/domain/report/groupReportModels';
import { parseReportPointGeometry } from '@/shared/utils/reportGeometry';

export interface ApiThemeAttributeBlock {
  community?: number;
  theme?: string;
  attributes?: Record<string, unknown> | unknown[];
}

export interface ApiGroupReportResponse {
  id: number;
  community: number;
  geometry?: string;
  comment?: string;
  status: string;
  opening_date?: string;
  updating_date?: string;
  author?: { id: number; username: string };
  attributes?: ApiThemeAttributeBlock[] | string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeThemeAttributes(value: unknown): Record<string, string> {
  if (!value) {
    return {};
  }

  if (Array.isArray(value)) {
    const fromArray: Record<string, string> = {};
    for (const entry of value) {
      if (!isRecord(entry) || typeof entry.name !== 'string') {
        continue;
      }
      fromArray[entry.name] = String(entry.value ?? '');
    }
    return fromArray;
  }

  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => [key, String(entryValue ?? '')]),
  );
}

function parseApiAttributes(
  attributes: ApiGroupReportResponse['attributes'],
): { themeName?: string; themeAttributes: Record<string, string> } {
  let blocks: ApiThemeAttributeBlock[] = [];

  if (typeof attributes === 'string') {
    try {
      const parsed = JSON.parse(attributes) as unknown;
      if (Array.isArray(parsed)) {
        blocks = parsed as ApiThemeAttributeBlock[];
      } else if (isRecord(parsed)) {
        blocks = [parsed as ApiThemeAttributeBlock];
      }
    } catch {
      blocks = [];
    }
  } else if (Array.isArray(attributes)) {
    blocks = attributes;
  }

  const primary = blocks[0];
  if (!primary) {
    return { themeAttributes: {} };
  }

  return {
    themeName: primary.theme,
    themeAttributes: normalizeThemeAttributes(primary.attributes),
  };
}

export function mapApiReportToGroupReport(apiReport: ApiGroupReportResponse): GroupReport {
  const { themeName, themeAttributes } = parseApiAttributes(apiReport.attributes);
  const geometry = apiReport.geometry ?? '';
  const coordinates = parseReportPointGeometry(geometry);

  return {
    id: apiReport.id,
    communityId: apiReport.community,
    themeName,
    themeAttributes,
    status: apiReport.status as ReportStatus,
    comment: apiReport.comment ?? '',
    geometry,
    longitude: coordinates?.longitude ?? null,
    latitude: coordinates?.latitude ?? null,
    createdAt: apiReport.opening_date ? new Date(apiReport.opening_date) : new Date(),
    modifiedAt: apiReport.updating_date ? new Date(apiReport.updating_date) : undefined,
    authorName: apiReport.author?.username,
  };
}

export function mapApiReportsToGroupReports(apiReports: ApiGroupReportResponse[]): GroupReport[] {
  return apiReports.map(mapApiReportToGroupReport);
}

export function getGroupReportSummaryLabel(report: GroupReport): string {
  const firstValue = Object.values(report.themeAttributes).find((value) => value.trim().length > 0);
  return firstValue ?? report.themeName ?? 'Signalement repère';
}
