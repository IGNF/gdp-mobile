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
import { getUser as getStoredUser } from '@/infra/storage/UserStorage';
import { config } from '@/shared/config/env';
import { storageKey } from '@/shared/constants/storage';
import { getRedirectUri } from '@/shared/utils/auth';

export type { AuthResult, RefreshResult } from '@/domain/auth/models';

/** Préfixe proxy OAuth web same-origin (Vite en dev, reverse proxy nginx en prod). */
const OAUTH_WEB_PROXY_PREFIX = '/__sso';
const OAUTH_CODE_VERIFIER_KEY = 'temp_code_verifier';
/** Après une déconnexion explicite, force une saisie SSO (évite un SSO « fantôme »). */
const OAUTH_FORCE_LOGIN_KEY = 'gdp_oauth_force_login';
const REVOKE_TIMEOUT_MS = 2500;
/** Timeouts natifs du refresh : évite de bloquer le démarrage en zone blanche. */
const REFRESH_CONNECT_TIMEOUT_MS = 10000;
const REFRESH_READ_TIMEOUT_MS = 20000;

let authManagerInstance: AuthManager | null = null;
let authManagerTokenBaseUrl: string | null = null;

/** Un code OAuth n’est échangeable qu’une fois (double-mount StrictMode, rechargement). */
let inflightOAuthCallback: { code: string; promise: Promise<AuthResult> } | null = null;
let lastOAuthCallback: { code: string; result: AuthResult } | null = null;

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

  const params = new URLSearchParams({
    client_id: config.oAuth.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  if (localStorage.getItem(OAUTH_FORCE_LOGIN_KEY) === '1') {
    params.set('prompt', 'login');
    params.set('max_age', '0');
    localStorage.removeItem(OAUTH_FORCE_LOGIN_KEY);
  }

  window.location.href = `${config.oAuth.ssoBaseUrl}/auth?${params.toString()}`;
}

async function revokeOAuthToken(token: string | null): Promise<void> {
  if (!token) {
    return;
  }

  try {
    await CapacitorHttp.post({
      url: `${resolveOAuthTokenBaseUrl()}/revoke`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        client_id: config.oAuth.clientId,
        token,
      }).toString(),
    });
  } catch {
    // Révocation best-effort : ne bloque pas la déconnexion locale.
  }
}

async function revokeOAuthTokensWithTimeout(
  accessToken: string | null,
  refreshToken: string | null,
): Promise<void> {
  await Promise.race([
    Promise.allSettled([revokeOAuthToken(accessToken), revokeOAuthToken(refreshToken)]),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, REVOKE_TIMEOUT_MS);
    }),
  ]);
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

async function persistSuccessfulAuth(tokens: CoreAuthTokens, user: AppUser): Promise<AuthResult> {
  await storeTokens(tokens);
  syncCollabApiClient(tokens);
  return { success: true, user };
}

async function tryRestoreExistingSession(): Promise<AuthResult | null> {
  const restored = await restoreSession();
  if (!restored) {
    return null;
  }

  const current = await fetchCurrentUser();
  if (current.success && current.user) {
    return current;
  }

  const storedUser = await getStoredUser();
  if (storedUser) {
    return { success: true, user: storedUser };
  }

  return null;
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

    return persistSuccessfulAuth(result.tokens, result.user as AppUser);
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

async function exchangeAuthorizationCode(code: string): Promise<AuthResult> {
  try {
    const verifierMissing = !localStorage.getItem(OAUTH_CODE_VERIFIER_KEY);
    if (verifierMissing) {
      const restored = await tryRestoreExistingSession();
      if (restored) {
        return restored;
      }

      return {
        success: false,
        user: null,
        error: authError('Session OAuth expirée. Relancez la connexion depuis la page de login.'),
      };
    }

    const result = await getAuthManager().completeOAuthCallback(code, getRedirectUri());

    if (!result.success) {
      const restored = await tryRestoreExistingSession();
      if (restored) {
        return restored;
      }

      return {
        success: false,
        user: null,
        error: authError(formatOAuthExchangeFailure(result.error), result.error),
      };
    }

    if (!result.user || !result.tokens?.accessToken) {
      return {
        success: false,
        user: null,
        error: authError('Informations utilisateur ou jeton manquants après échange du code'),
      };
    }

    return persistSuccessfulAuth(result.tokens, result.user as AppUser);
  } catch (error) {
    return {
      success: false,
      user: null,
      error: authError('Échec du callback OAuth', error),
    };
  }
}

export function handleOAuthCallback(code: string): Promise<AuthResult> {
  if (inflightOAuthCallback?.code === code) {
    return inflightOAuthCallback.promise;
  }

  if (lastOAuthCallback?.code === code) {
    return Promise.resolve(lastOAuthCallback.result);
  }

  const promise = exchangeAuthorizationCode(code)
    .then((result) => {
      lastOAuthCallback = { code, result };
      return result;
    })
    .finally(() => {
      if (inflightOAuthCallback?.promise === promise) {
        inflightOAuthCallback = null;
      }
    });

  inflightOAuthCallback = { code, promise };
  return promise;
}

/** Déduplique les rafraîchissements concurrents : un refresh token Keycloak est à usage unique. */
let inflightRefresh: Promise<RefreshResult> | null = null;

export function refreshAccessToken(): Promise<RefreshResult> {
  if (inflightRefresh) {
    return inflightRefresh;
  }

  const promise = performRefreshAccessToken().finally(() => {
    if (inflightRefresh === promise) {
      inflightRefresh = null;
    }
  });
  inflightRefresh = promise;
  return promise;
}

async function performRefreshAccessToken(): Promise<RefreshResult> {
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

    const outcome = await requestTokenRefresh(refreshToken);

    if (outcome.kind === 'transient') {
      return {
        success: false,
        transient: true,
        error: authError('Serveur d’authentification injoignable', outcome.cause),
      };
    }

    if (outcome.kind === 'rejected') {
      return {
        success: false,
        error: authError('Jeton de rafraîchissement refusé'),
      };
    }

    await storeTokens(outcome.tokens);
    syncCollabApiClient(outcome.tokens);

    return {
      success: true,
      tokens: {
        accessToken: outcome.tokens.accessToken,
        refreshToken: outcome.tokens.refreshToken,
        expiresIn: outcome.tokens.expiresIn,
        refreshExpiresIn: outcome.tokens.refreshExpiresIn,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: authError('Échec du rafraîchissement du jeton', error),
    };
  }
}

type TokenRefreshOutcome =
  | { kind: 'success'; tokens: CoreAuthTokens }
  | { kind: 'rejected' }
  | { kind: 'transient'; cause?: unknown };

/** Statuts /token après lesquels le refresh token n'a pas été invalidé (réseau, proxy, Keycloak indisponible). */
function isTransientTokenStatus(status: number): boolean {
  return status === 0 || status === 408 || status === 429 || status >= 500;
}

/**
 * Appel /token direct (plutôt que AuthManager.refreshAccessToken) pour distinguer
 * un refus Keycloak (invalid_grant) d'une coupure réseau : AuthManager renvoie la même erreur.
 */
async function requestTokenRefresh(refreshToken: string): Promise<TokenRefreshOutcome> {
  try {
    const response = await CapacitorHttp.post({
      url: `${resolveOAuthTokenBaseUrl()}/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.oAuth.clientId,
        refresh_token: refreshToken,
      }).toString(),
      connectTimeout: REFRESH_CONNECT_TIMEOUT_MS,
      readTimeout: REFRESH_READ_TIMEOUT_MS,
    });

    if (response.status < 200 || response.status >= 300) {
      return isTransientTokenStatus(response.status) ? { kind: 'transient' } : { kind: 'rejected' };
    }

    const data = response.data as Record<string, unknown> | null;
    if (!data || typeof data.access_token !== 'string') {
      return { kind: 'transient' };
    }

    return {
      kind: 'success',
      tokens: {
        accessToken: data.access_token,
        refreshToken: typeof data.refresh_token === 'string' ? data.refresh_token : undefined,
        idToken: typeof data.id_token === 'string' ? data.id_token : undefined,
        expiresIn: typeof data.expires_in === 'number' ? data.expires_in : undefined,
        refreshExpiresIn:
          typeof data.refresh_expires_in === 'number' ? data.refresh_expires_in : undefined,
      },
    };
  } catch (error) {
    return { kind: 'transient', cause: error };
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

export interface LogoutResult {
  /** true si le navigateur est redirigé vers la déconnexion SSO Keycloak. */
  redirectedToSso: boolean;
}

export async function logout(): Promise<LogoutResult> {
  const [accessToken, refreshToken] = await Promise.all([
    Storage.get(storageKey('access_token')),
    Storage.get(storageKey('refresh_token')),
  ]);

  await clearStoredAuthState();
  clearCollabApiClientAuth();
  clearCollabApiCache();
  lastOAuthCallback = null;
  inflightOAuthCallback = null;

  // Évite une course revoke + prochain /token via le proxy (502).
  await revokeOAuthTokensWithTimeout(accessToken, refreshToken);

  if (!Capacitor.isNativePlatform()) {
    // Logout local uniquement (évite l’écran Keycloak si post_logout_redirect_uri n’est pas enregistrée).
    localStorage.setItem(OAUTH_FORCE_LOGIN_KEY, '1');
    return { redirectedToSso: false };
  }

  await getAuthManager().logout(accessToken ?? '', refreshToken ?? '');
  return { redirectedToSso: false };
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
    // Hors ligne : on garde la session, le refresh sera retenté au prochain appel API.
    return refreshResult.success || refreshResult.transient === true;
  } catch {
    return false;
  }
}
