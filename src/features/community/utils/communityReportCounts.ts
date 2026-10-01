import {
  GDP_REPORT_COMMUNITY_ID,
  getGdpCommunityReportThemes,
  serializeGdpReportThemeFilters,
} from '@/features/report/constants/reportApi';
import { parseReportsTotal } from '@/features/report/utils/parseReportsTotal';
import { collabApiClient, ensureCollabApiSession } from '@/infra/api';
import type { ApiResponse } from 'collaboratif-client-api';

export interface FetchCommunityReportCountOptions {
  /** Thèmes à inclure dans le filtre `attributes` (obligatoire côté API GDP). */
  themes: readonly string[];
  status?: string;
}

async function readPaginatedTotal(response: ApiResponse): Promise<number> {
  const pageCount = Array.isArray(response.data) ? response.data.length : 0;
  return parseReportsTotal(response.headers?.['content-range'], pageCount);
}

function buildReportCountQueryParams(options: FetchCommunityReportCountOptions): Record<string, unknown> {
  const themes = options.themes.length > 0 ? options.themes : getGdpCommunityReportThemes();

  return {
    communities: GDP_REPORT_COMMUNITY_ID,
    page: 1,
    limit: 1,
    sort: 'id:DESC',
    attributes: serializeGdpReportThemeFilters(themes),
    ...(options.status ? { status: options.status } : {}),
  };
}

/** Total signalements communauté GDP (`GET /reports` + `Content-Range`). */
export async function fetchCommunityReportCount(
  options: FetchCommunityReportCountOptions,
): Promise<number> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return 0;
  }

  const response = await collabApiClient.report.getAll(buildReportCountQueryParams(options));

  return readPaginatedTotal(response);
}

/** Variante tolérante (ex. filtre `status` refusé par l’API pour certaines valeurs). */
export async function fetchCommunityReportCountSafe(
  options: FetchCommunityReportCountOptions,
): Promise<number> {
  try {
    return await fetchCommunityReportCount(options);
  } catch {
    return 0;
  }
}

/** Nombre de membres ; `null` si l’API refuse l’accès ou la session est absente. */
export async function fetchCommunityMembersCount(): Promise<number | null> {
  const sessionReady = await ensureCollabApiSession();
  if (!sessionReady) {
    return null;
  }

  try {
    const response = await collabApiClient.member.getAll(GDP_REPORT_COMMUNITY_ID, {
      page: 1,
      limit: 1,
    });
    return readPaginatedTotal(response);
  } catch {
    return null;
  }
}
