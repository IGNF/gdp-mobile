export const COLLAB_API_CACHE_KEYS = {
  currentUser: 'collab:user:me',
  community: (communityId: number) => `collab:community:${communityId}`,
  communityMember: (communityId: number, memberId: number) =>
    `collab:community:${communityId}:member:${memberId}`,
} as const;

/** Thèmes communauté : rechargés au lancement si plus vieux que 15 min. */
export const GDP_COMMUNITY_THEME_CACHE_TTL_MS = 15 * 60 * 1000;
