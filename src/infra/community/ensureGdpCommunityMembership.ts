import type { CommunityMember } from '@ign/mobile-core';

import type { AppUser } from '@/domain/user/models';
import {
  trackCommunityAutoJoinFailed,
  trackCommunityAutoJoinRequested,
} from '@/infra/analytics/matomo';
import { collabApiClient } from '@/infra/api/collabApiClient';
import { config } from '@/shared/config/env';

const GDP_COMMUNITY_ID = Number(config.report.communityId) || 96;

function hasActiveGdpCommunityMembership(
  memberships: CommunityMember[] | undefined,
  communityId = GDP_COMMUNITY_ID,
): boolean {
  return (
    memberships?.some(
      (membership) => membership.community_id === communityId && membership.role !== 'pending',
    ) ?? false
  );
}

/**
 * Demande l’adhésion à la communauté géodésie (signalements) si l’utilisateur n’y est pas membre actif.
 * @returns `true` si l’API a été appelée (recharger le profil via GET user/me).
 */
export async function ensureGdpCommunityMembership(user: AppUser): Promise<boolean> {
  if (user.id === undefined) {
    return false;
  }

  if (hasActiveGdpCommunityMembership(user.communities_member)) {
    return false;
  }

  try {
    await collabApiClient.member.add(GDP_COMMUNITY_ID, { user_id: user.id });
    trackCommunityAutoJoinRequested();
    return true;
  } catch {
    trackCommunityAutoJoinFailed();
    return false;
  }
}