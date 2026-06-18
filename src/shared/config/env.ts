const env = import.meta.env;

type Environment = 'production' | 'qualification';

interface OAuthConfig {
  clientId: string;
  ssoBaseUrl: string;
  baseUrl: string;
  androidRedirectUri: string;
  iosRedirectUri: string;
  webRedirectUri: string;
}

interface Config {
  environment: Environment;
  api: { baseUrl: string };
  oAuth: OAuthConfig;
  isQualification: boolean;
  authRequired: boolean;
  geodesy: {
    wfsApiKey: string;
    geoportailScanApiKey: string;
  };
  report: {
    communityId: string;
    theme: string;
  };
}

const useQualification = env.VITE_USE_QUALIF === 'true';

function trimEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

function normalizeUrl(value: string): string {
  return trimEnv(value).replace(/\/+$/, '');
}

export const config: Config = {
  environment: useQualification ? 'qualification' : 'production',
  isQualification: useQualification,
  authRequired: env.VITE_AUTH_REQUIRED === 'true',
  api: {
    baseUrl: (() => {
      const base =
        trimEnv(env.VITE_BASE_API_URL) || 'https://espacecollaboratif.ign.fr/gcms/api/';
      const normalized = base.replace(/\/+$/, '');
      return `${normalized}/`;
    })(),
  },
  oAuth: (() => {
    const ssoBaseUrl = normalizeUrl(env.VITE_OAUTH_BASE_URL || '');
    return {
      clientId: trimEnv(env.VITE_OAUTH_CLIENT_ID),
      ssoBaseUrl,
      baseUrl: ssoBaseUrl,
      androidRedirectUri: trimEnv(env.VITE_OAUTH_ANDROID_REDIRECT_URI) || 'fr.ign.gdp://auth/callback',
      iosRedirectUri: trimEnv(env.VITE_OAUTH_IOS_REDIRECT_URI) || 'fr.ign.gdp://auth/callback',
      webRedirectUri: trimEnv(env.VITE_OAUTH_WEB_REDIRECT_URI) || 'http://localhost:5173/auth/callback',
    };
  })(),
  geodesy: {
    wfsApiKey: trimEnv(env.VITE_GEODESY_WFS_API_KEY),
    geoportailScanApiKey: trimEnv(env.VITE_GEOPORTAIL_SCAN_API_KEY) || 'ign_scan_ws',
  },
  report: {
    communityId: trimEnv(env.VITE_GDP_REPORT_COMMUNITY_ID),
    theme: trimEnv(env.VITE_GDP_REPORT_THEME) || 'gdp-tools',
  },
};
