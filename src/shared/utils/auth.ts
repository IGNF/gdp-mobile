import { Capacitor } from '@capacitor/core';

import { config } from '@/shared/config/env';

const DEFAULT_MOBILE_REDIRECT_URI = 'fr.ign.gdp://auth/callback';

export function getRedirectUri(): string {
  switch (Capacitor.getPlatform()) {
    case 'android':
      return config.oAuth.androidRedirectUri || DEFAULT_MOBILE_REDIRECT_URI;
    case 'ios':
      return config.oAuth.iosRedirectUri || DEFAULT_MOBILE_REDIRECT_URI;
    case 'web':
    default: {
      if (typeof window !== 'undefined' && window.location.origin) {
        const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
        return `${window.location.origin}${basePath}/auth/callback`;
      }
      return config.oAuth.webRedirectUri;
    }
  }
}
