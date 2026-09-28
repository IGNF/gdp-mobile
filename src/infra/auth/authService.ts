import { App, type URLOpenListenerEvent } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, CapacitorHttp, type PluginListenerHandle } from '@capacitor/core';
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
/**
 * Délai laissé au retour `appUrlOpen` après `browserFinished` : quand Keycloak a déjà une
 * session (« Se souvenir de moi »), il redirige instantanément et l’onglet se ferme parfois
 * avant que l’app ne reçoive le code.
 */
const NATIVE_BROWSER_FINISHED_GRACE_MS = 2000;
/** Horodatage de la dernière relance SSO automatique depuis le callback (anti-boucle). */
const OAUTH_CALLBACK_RETRY_KEY = 'gdp_oauth_callback_retry_at';
const OAUTH_CALLBACK_RETRY_WINDOW_MS = 60_000;
/** Nom d’erreur : code OAuth inutilisable (vérificateur PKCE absent, code déjà consommé ou expiré). */
const STALE_OAUTH_CALLBACK_ERROR = 'StaleOAuthCallback';

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

async function completeOAuthCode(code: string, redirectUri: string): Promise<AuthResult> {
  const result = await getAuthManager().completeOAuthCallback(code, redirectUri);

  if (!result.success) {
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
      error: authError('Informations utilisateur ou jeton manquants après connexion'),
    };
  }

  return persistSuccessfulAuth(result.tokens, result.user as AppUser);
}

/**
 * Flux OAuth natif (navigateur in-app + deep link), à la place de `AuthManager.loginWithOAuth` :
 * - `state` propre à chaque tentative : Capacitor conserve un `appUrlOpen` reçu sans écouteur
 *   et le rejoue à l’écouteur suivant. Sans ce contrôle, la tentative N+1 échangeait le code
 *   de la tentative N avec un nouveau vérificateur PKCE (« Token exchange failed » en boucle).
 * - `browserFinished` n’est un abandon qu’après un délai de grâce (voir constante).
 */
async function loginWithNativeOAuth(redirectUri: string): Promise<AuthResult> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallengeFromVerifier(codeVerifier);
  const state = generateCodeVerifier();
  // Clé lue par `AuthManager.completeOAuthCallback`.
  localStorage.setItem(OAUTH_CODE_VERIFIER_KEY, codeVerifier);

  const authUrl = `${config.oAuth.ssoBaseUrl}/auth?${new URLSearchParams({
    client_id: config.oAuth.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  }).toString()}`;

  return new Promise<AuthResult>((resolve) => {
    const listeners: PluginListenerHandle[] = [];
    let settled = false;
    let handlingCallback = false;
    let browserFinishedTimer: number | undefined;

    const settle = (result: AuthResult) => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(browserFinishedTimer);
      listeners.forEach((listener) => void listener.remove());
      resolve(result);
    };

    const fail = (message: string) => {
      localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
      settle({ success: false, user: null, error: authError(message) });
    };

    const handleAppUrlOpen = async ({ url }: URLOpenListenerEvent) => {
      if (settled || handlingCallback || !url.startsWith(redirectUri.split('?')[0])) {
        return;
      }

      const callbackUrl = new URL(url);
      if (callbackUrl.searchParams.get('state') !== state) {
        // Retour d’une tentative précédente, rejoué par Capacitor : on l’ignore.
        return;
      }

      handlingCallback = true;
      window.clearTimeout(browserFinishedTimer);

      if (callbackUrl.searchParams.get('error')) {
        fail('La connexion a été refusée ou annulée.');
        return;
      }

      const code = callbackUrl.searchParams.get('code');
      if (!code) {
        fail('Code d’autorisation absent dans l’URL de retour.');
        return;
      }

      try {
        settle(await completeOAuthCode(code, redirectUri));
      } catch (error) {
        localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
        settle({ success: false, user: null, error: authError('Échec du callback OAuth', error) });
      }
    };

    const handleBrowserFinished = () => {
      if (settled || handlingCallback) {
        return;
      }
      window.clearTimeout(browserFinishedTimer);
      browserFinishedTimer = window.setTimeout(() => {
        if (!handlingCallback) {
          fail('Connexion annulée.');
        }
      }, NATIVE_BROWSER_FINISHED_GRACE_MS);
    };

    void (async () => {
      try {
        listeners.push(await App.addListener('appUrlOpen', (event) => void handleAppUrlOpen(event)));
        listeners.push(await Browser.addListener('browserFinished', handleBrowserFinished));
        await Browser.open({ url: authUrl });
      } catch (error) {
        localStorage.removeItem(OAUTH_CODE_VERIFIER_KEY);
        settle({
          success: false,
          user: null,
          error: authError('Impossible d’ouvrir la page de connexion', error),
        });
      }
    })();
  });
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

function staleOAuthCallbackError(message: string, cause?: unknown): Error {
  const error = authError(message, cause);
  error.name = STALE_OAUTH_CALLBACK_ERROR;
  return error;
}

/**
 * Le callback a échoué parce que le code reçu n’est plus échangeable (onglet restauré,
 * rechargement, retour arrière…) : relancer le SSO suffit, Keycloak renvoie un code neuf
 * sans ressaisie si sa session (« Se souvenir de moi ») est encore valide.
 */
export function isStaleOAuthCallbackError(error: Error | undefined): boolean {
  return error?.name === STALE_OAUTH_CALLBACK_ERROR;
}

/**
 * Autorise une seule relance SSO automatique par fenêtre de 60 s, pour ne pas boucler
 * si l’échec n’est pas dû à un code périmé (ex. URI de redirection mal configurée).
 */
export function consumeOAuthCallbackRetry(): boolean {
  try {
    const lastRetryAt = Number(sessionStorage.getItem(OAUTH_CALLBACK_RETRY_KEY));
    if (lastRetryAt && Date.now() - lastRetryAt < OAUTH_CALLBACK_RETRY_WINDOW_MS) {
      return false;
    }
    sessionStorage.setItem(OAUTH_CALLBACK_RETRY_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

function resetOAuthCallbackRetry(): void {
  try {
    sessionStorage.removeItem(OAUTH_CALLBACK_RETRY_KEY);
  } catch {
    // sessionStorage indisponible : rien à nettoyer.
  }
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

    return await loginWithNativeOAuth(redirectUri);
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
        error: staleOAuthCallbackError(
          'Session OAuth expirée. Relancez la connexion depuis la page de login.',
        ),
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
        error: staleOAuthCallbackError(formatOAuthExchangeFailure(result.error), result.error),
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
      if (result.success) {
        resetOAuthCallbackRetry();
      }
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
    if (!refreshResult.success && refreshResult.error?.message === 'Session expirée') {
      // Jetons périmés : on les oublie pour ne plus tenter de les restaurer à chaque ouverture.
      await clearStoredAuthState();
    }
    return refreshResult.success;
  } catch {
    return false;
  }
}
