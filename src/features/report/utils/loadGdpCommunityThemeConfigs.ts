import type { CommunityThemeConfig } from '@/domain/community/models';
import { GDP_REPORT_COMMUNITY_ID } from '@/features/report/constants/reportApi';
import { extractThemeConfigsFromCommunity } from '@/features/report/utils/communityReportTheme';
import { fetchCommunity, type FetchCommunityOptions } from '@/infra/community/fetchCommunity';

/** Thèmes signalement de la communauté GDP (vide sans session API ou en cas d'échec). */
export async function loadGdpCommunityThemeConfigs(
  options?: FetchCommunityOptions,
): Promise<CommunityThemeConfig[]> {
  const community = await fetchCommunity(GDP_REPORT_COMMUNITY_ID, options);
  return extractThemeConfigsFromCommunity(community, GDP_REPORT_COMMUNITY_ID);
}
