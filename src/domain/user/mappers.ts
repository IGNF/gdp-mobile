import type { User } from '@ign/mobile-core';

import type { AppUser } from '@/domain/user/models';

export function mapApiUserToAppUser(apiUser: Record<string, unknown>): AppUser {
  return {
    id: apiUser.id as number,
    email: apiUser.email as string | undefined,
    firstName: apiUser.firstName as string | undefined,
    lastName: apiUser.lastName as string | undefined,
    username: apiUser.username as string,
    avatar: apiUser.avatar as string | undefined,
    description: apiUser.description as string | undefined,
    communities: (apiUser.communities as User['communities']) || [],
    communities_member: (apiUser.communities_member as User['communities_member']) || [],
  };
}
