import type { User } from '@ign/mobile-core';
import { Storage } from '@ign/mobile-device';

import { storageKey } from '@/shared/constants/storage';

const USER_KEY = 'USER';

export async function saveUser(user: User): Promise<void> {
  await Storage.set(storageKey(USER_KEY), user, 'object');
}

export async function getUser(): Promise<User | null> {
  const userData = await Storage.get(storageKey(USER_KEY), 'object');
  return (userData as User | null) ?? null;
}

export async function clearUser(): Promise<void> {
  await Storage.remove(storageKey(USER_KEY));
}

export async function clearAll(): Promise<void> {
  await clearUser();
}
