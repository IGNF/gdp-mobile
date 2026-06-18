/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
  readonly VITE_SECRET?: string;
  readonly VITE_BASE_API_URL?: string;
  readonly VITE_OAUTH_CLIENT_ID?: string;
  readonly VITE_OAUTH_BASE_URL?: string;
  readonly VITE_OAUTH_ANDROID_REDIRECT_URI?: string;
  readonly VITE_OAUTH_IOS_REDIRECT_URI?: string;
  readonly VITE_OAUTH_WEB_REDIRECT_URI?: string;
  readonly VITE_USE_QUALIF?: string;
  readonly VITE_AUTH_REQUIRED?: string;
  readonly VITE_GEODESY_WFS_API_KEY?: string;
  readonly VITE_GEOPORTAIL_SCAN_API_KEY?: string;
  readonly VITE_GDP_REPORT_COMMUNITY_ID?: string;
  readonly VITE_GDP_REPORT_THEME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
