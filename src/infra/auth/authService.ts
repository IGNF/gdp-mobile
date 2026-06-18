import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { AuthManager, type AuthTokens as CoreAuthTokens } from '@ign/mobile-core';
import { Storage } from '@ign/mobile-device';

import type { AuthResult, RefreshResult } from '@/domain/auth/models';
import type { AppUser } from '@/domain/user/models';
import { mapApiUserToAppUser } from '@/domain/user/mappers';
import { collabApiClient } from '@/infra/api/collabApiClient';
import { clearCollabApiCache, getCollabApiCached } from '@/infra/api/collabApiCache';
import { COLLAB_API_CACHE_KEYS } from '@/infra/api/collabApiKeys';
import { clearCollabApiClientAuth, ensureCollabApiSession } from '@/infra/api/ensureCollabApiSession';
import {
  generateCodeChallengeFromVerifier,
  generateCodeVerifier,
} from '@/infra/auth/oauthPkce';
import { config } from '@/shared/config/env';
import { storageKey } from '@/shared/constants/storage';
import { getRedirectUri } from '@/shared/utils/auth';

export type { AuthResult, RefreshResult } from '@/domain/auth/models';

/** Préfixe proxy OAuth web same-origin (Vite en dev, reverse proxy nginx en prod). */
const OAUTH_WEB_PROXY_PREFIX = '/__sso';
const OAUTH_CODE_VERIFIER_KEY = 'temp_code_verifier';

let authManagerInstance: AuthManager | null = null;
let authManagerTokenBaseUrl: string | null = null;

function oauthWebProxyPath(): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${basePath}${OAUTH_WEB_PROXY_PREFIX}`;
}

/** Base URL pour /token et /revoke — proxy same-origin en web (évite CORS Keycloak). */
function resolveOAuthTokenBaseUrl(): string {
  if (!Capacitor.isNativePlatform()) {
    const proxyPath = oauthWebProxyPath();
    if (typeof window !== 'undefined' && window.location.origin) {
      return `${window.location.origin}${proxyPath}`;
    }
    return proxyPath;
  }
  return config.oAuth.ssoBaseUrl;
}

function getAuthManager(): AuthManager {
  const oAuthBaseUrl = resolveOAuthTokenBaseUrl();
  if (!authManagerInstance || authManagerTokenBaseUrl !== oAuthBaseUrl) {
    authManagerInstance = new AuthManager({
      apiBaseUrl: config.api.baseUrl,
      oAuthBaseUrl,
      oAuthClientId: config.oAuth.clientId,
    });
    authManagerTokenBaseUrl = oAuthBaseUrl;
  }
  return authManagerInstance;
}

/** Redirection navigateur vers Keycloak (URL réelle, pas le proxy). */
async function redirectWebOAuthLogin(redirectUri: string): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallengeFromVerifier(codeVerifier);
  localStorage.setItem(OAUTH_CODE_VERIFIER_KEY, codeVerifier);

  const authUrl =
    `${config.oAuth.ssoBaseUrl}/auth?` +
    new URLSearchParams({
      client_id: config.oAuth.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString();

  window.location.href = authUrl;
}

export interface FetchCurrentUserOptions {
  forceRefresh?: boolean;
}

export async function fetchCurrentUser(options?: FetchCurrentUserOptions): Promise<AuthResult> {
  try {
    const sessionReady = await ensureCollabApiSession();
    if (!sessionReady) {
      return {
        success: false,
        user: null,
        error: authError('Session API absente'),
      };
    }

    const response = await getCollabApiCached(
      COLLAB_API_CACHE_KEYS.currentUser,
      () => collabApiClient.user.get('me'),
      options?.forceRefresh ? { forceRefresh: true } : {},
    );
    const user = mapApiUserToAppUser(response.data as Record<string, unknown>);

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      user: null,
      error: authError('Impossible de charger le profil utilisateur', error),
    };
  }
}

async function storeTokens(tokens: CoreAuthTokens): Promise<void> {
  const now = Date.now();

  await Storage.set(storageKey('access_token'), tokens.accessToken);

  if (tokens.expiresIn) {
    await Storage.set(storageKey('access_token_expires_at'), String(now + tokens.expiresIn * 1000));
  } else {
    await Storage.remove(storageKey('access_token_expires_at'));
  }

  if (tokens.refreshToken) {
    await Storage.set(storageKey('refresh_token'), tokens.refreshToken);
  } else {
    await Storage.remove(storageKey('refresh_token'));
  }

  if (tokens.refreshToken && tokens.refreshExpiresIn) {
    await Storage.set(
      storageKey('refresh_token_expires_at'),
      String(now + tokens.refreshExpiresIn * 1000),
    );
  } else {
    await Storage.remove(storageKey('refresh_token_expires_at'));
  }

  if (tokens.idToken) {
    await Storage.set(storageKey('id_token'), tokens.idToken);
  } else {
    await Storage.remove(storageKey('id_token'));
  }
}

function syncCollabApiClient(tokens: {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  refreshExpiresIn?: number;
}): void {
  collabApiClient.setExternalToken(
    tokens.accessToken,
    tokens.refreshToken ?? '',
    tokens.expiresIn,
    tokens.refreshExpiresIn,
  );
}

async function clearStoredAuthState(): Promise<void> {
  const keys = [
    'access_token',
    'access_token_expires_at',
    'refresh_token',
    'refresh_token_expires_at',
    'id_token',
    'temp_code_verifier',
  ];
  await Promise.all(keys.map((key) => Storage.remove(storageKey(key))));
}

function authError(message: string, cause?: unknown): Error {
  const error = new Error(message);
  if (cause instanceof Error) {
    error.cause = cause;
  }
  return error;
}

function parseOAuthTokenError(data: unknown): string | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const payload = data as { error?: string; error_description?: string };
  if (payload.error_description) {
    return payload.error_description;
  }

  if (payload.error === 'invalid_grant') {
    return 'Code d’autorisation invalide ou déjà utilisé. Relancez la connexion.';
  }

  if (payload.error === 'invalid_client') {
    return 'Client OAuth inconnu ou mal configuré (VITE_OAUTH_CLIENT_ID).';
  }

  return null;
}

function formatOAuthExchangeFailure(cause?: unknown): string {
  if (!(cause instanceof Error)) {
    return 'Échec de l’échange du code OAuth (Token exchange failed).';
  }

  if (cause.message === 'Code verifier missing') {
    return 'Session OAuth expirée. Relancez la connexion depuis la page de login.';
  }

  if (cause.message !== 'Token exchange failed') {
    return cause.message;
  }

  return (
    'Échec de l’échange du code OAuth. Vérifiez que l’URI de redirection ' +
    'enregistrée côté Keycloak correspond exactement à VITE_OAUTH_WEB_REDIRECT_URI ' +
    "(ou l’URI mobile pour l’APK), puis relancez la connexion."
  );
}

async function diagnoseOAuthTokenExchange(
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const codeVerifier = localStorage.getItem(OAUTH_CODE_VERIFIER_KEY);
  if (!codeVerifier) {
    return null;
  }

  const tokenUrl = `${resolveOAuthTokenBaseUrl()}/token`;
  if (!config.oAuth.ssoBaseUrl) {
    return 'VITE_OAUTH_BASE_URL est absent.';
  }

  try {
    const response = await CapacitorHttp.post({
      url: tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.oAuth.clientId,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }).toString(),
    });

    if (response.status < 400) {
      return null;
    }

    return parseOAuthTokenError(response.data) ?? `HTTP ${response.status} sur ${tokenUrl}`;
  } catch {
    return null;
  }
}

export async function loginWithOAuth(): Promise<AuthResult> {
  try {
    const redirectUri = getRedirectUri();

    if (!Capacitor.isNativePlatform()) {
      await redirectWebOAuthLogin(redirectUri);
      return { success: false, user: null, error: authError('OAuth redirect') };
    }

    const result = await getAuthManager().loginWithOAuth(redirectUri);

    if (!result.success) {
      if (result.error?.message === 'OAuth redirect') {
        return { success: false, user: null, error: result.error };
      }

      return {
        success: false,
        user: null,
        error: authError(result.error?.message ?? 'Échec de la connexion OAuth', result.error),
      };
    }

    if (!result.user || !result.tokens?.accessToken) {
      return {
        success: false,
        user: null,
        error: authError('Informations utilisateur ou jeton manquants après connexion'),
      };
    }

    await storeTokens(result.tokens);
    syncCollabApiClient(result.tokens);

    const user = result.user as AppUser;

    return {
      success: true,
      user,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : 'Échec de la connexion OAuth';
    return {
      success: false,
      user: null,
      error: authError(message, error),
    };
  } finally {
    if (Capacitor.isNativePlatform()) {
      try {
        await Browser.close();
      } catch {
        // Le navigateur in-app peut déjà être fermé.
      }
    }
  }
}

export async function handleOAuthCallback(code: string): Promise<AuthResult> {
  try {
    const redirectUri = getRedirectUri();
    const result = await getAuthManager().completeOAuthCallback(code, redirectUri);

    if (!result.success) {
      let message = formatOAuthExchangeFailure(result.error);
      if (result.error?.message === 'Token exchange failed') {
        const detail = await diagnoseOAuthTokenExchange(code, redirectUri);
        if (detail) {
          message = detail;
        }
      }

      return {
        success: false,
        user: null,
        error: authError(message, result.error),
      };
    }

    if (!result.user || !result.tokens?.accessToken) {
      return {
        success: false,
        user: null,
        error: authError('Informations utilisateur ou jeton manquants après échange du code'),
      };
    }

    await storeTokens(result.tokens);
    syncCollabApiClient(result.tokens);

    const user = result.user as AppUser;

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      user: null,
      error: authError('Échec du callback OAuth', error),
    };
  }
}

export async function refreshAccessToken(): Promise<RefreshResult> {
  try {
    const refreshToken = await Storage.get(storageKey('refresh_token'));

    if (!refreshToken) {
      return {
        success: false,
        error: authError('Jeton de rafraîchissement absent'),
      };
    }

    const refreshExpiresAt = await Storage.get(storageKey('refresh_token_expires_at'));
    if (refreshExpiresAt && Date.now() >= parseInt(refreshExpiresAt, 10)) {
      return {
        success: false,
        error: authError('Session expirée'),
      };
    }

    const result = await getAuthManager().refreshAccessToken(refreshToken);

    if (!result.success || !result.tokens) {
      return {
        success: false,
        error: authError(result.error?.message ?? 'Échec du rafraîchissement du jeton', result.error),
      };
    }

    await storeTokens(result.tokens);
    syncCollabApiClient(result.tokens);

    return {
      success: true,
      tokens: {
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresIn: result.tokens.expiresIn,
        refreshExpiresIn: result.tokens.refreshExpiresIn,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: authError('Échec du rafraîchissement du jeton', error),
    };
  }
}

export async function isAccessTokenExpired(bufferSeconds: number = 60): Promise<boolean> {
  try {
    const expiresAt = await Storage.get(storageKey('access_token_expires_at'));
    if (!expiresAt) {
      return true;
    }
    return Date.now() >= parseInt(expiresAt, 10) - bufferSeconds * 1000;
  } catch {
    return true;
  }
}

export async function logout(): Promise<void> {
  const [accessToken, refreshToken] = await Promise.all([
    Storage.get(storageKey('access_token')),
    Storage.get(storageKey('refresh_token')),
  ]);

  await clearStoredAuthState();
  clearCollabApiClientAuth();
  clearCollabApiCache();
  await getAuthManager().logout(accessToken ?? '', refreshToken ?? '');
}

export async function restoreSession(): Promise<boolean> {
  try {
    const accessToken = await Storage.get(storageKey('access_token'));
    const refreshToken = await Storage.get(storageKey('refresh_token'));

    if (!accessToken && !refreshToken) {
      return false;
    }

    if (accessToken && !(await isAccessTokenExpired())) {
      const expiresAt = await Storage.get(storageKey('access_token_expires_at'));
      const refreshExpiresAt = await Storage.get(storageKey('refresh_token_expires_at'));
      const now = Date.now();

      syncCollabApiClient({
        accessToken,
        refreshToken: refreshToken ?? '',
        expiresIn: expiresAt ? Math.max(0, Math.floor((parseInt(expiresAt, 10) - now) / 1000)) : 0,
        refreshExpiresIn: refreshExpiresAt
          ? Math.max(0, Math.floor((parseInt(refreshExpiresAt, 10) - now) / 1000))
          : 0,
      });

      return true;
    }

    if (!refreshToken) {
      return false;
    }

    const refreshResult = await refreshAccessToken();
    return refreshResult.success;
  } catch {
    return false;
  }
}
