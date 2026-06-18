import { Storage } from '@ign/mobile-device';

import { collabApiClient } from '@/infra/api/collabApiClient';
import { isAccessTokenExpired, refreshAccessToken } from '@/infra/auth/authService';
import { storageKey } from '@/shared/constants/storage';

async function applyStoredTokensToClient(): Promise<boolean> {
  const accessToken = await Storage.get(storageKey('access_token'));
  const refreshToken = await Storage.get(storageKey('refresh_token'));

  if (!accessToken && !refreshToken) {
    return false;
  }

  if (accessToken && !(await isAccessTokenExpired())) {
    const expiresAt = await Storage.get(storageKey('access_token_expires_at'));
    const refreshExpiresAt = await Storage.get(storageKey('refresh_token_expires_at'));
    const now = Date.now();

    collabApiClient.setExternalToken(
      accessToken,
      refreshToken ?? '',
      expiresAt ? Math.max(0, Math.floor((parseInt(expiresAt, 10) - now) / 1000)) : 0,
      refreshExpiresAt
        ? Math.max(0, Math.floor((parseInt(refreshExpiresAt, 10) - now) / 1000))
        : 0,
    );

    return true;
  }

  if (!refreshToken) {
    return false;
  }

  const refreshResult = await refreshAccessToken();
  if (!refreshResult.success || !refreshResult.tokens) {
    return false;
  }

  collabApiClient.setExternalToken(
    refreshResult.tokens.accessToken,
    refreshResult.tokens.refreshToken ?? '',
    refreshResult.tokens.expiresIn,
    refreshResult.tokens.refreshExpiresIn,
  );

  return true;
}

/**
 * Synchronise le jeton OAuth stocké vers collaboratif-client-api avant un appel API.
 */
export async function ensureCollabApiSession(): Promise<boolean> {
  try {
    return await applyStoredTokensToClient();
  } catch {
    return false;
  }
}

export function clearCollabApiClientAuth(): void {
  collabApiClient.username = null;
  collabApiClient.password = null;

  if (!collabApiClient.clientAuth) {
    return;
  }

  collabApiClient.clientAuth.started = false;
  collabApiClient.clientAuth.usesExternalToken = false;
  collabApiClient.clientAuth.token = null;
  collabApiClient.clientAuth.refreshToken = null;
  collabApiClient.clientAuth.expirationDate = null;
  collabApiClient.clientAuth.refreshExpirationDate = null;
}
