import { Capacitor } from '@capacitor/core';

import { config } from '@/shared/config/env';

type MatomoCommand = [string, ...unknown[]];

declare global {
  interface Window {
    _paq?: MatomoCommand[];
  }
}

const PAGE_TITLES: Record<string, string> = {
  '/welcome': 'Accueil',
  '/login': 'Connexion',
  '/auth/callback': 'Connexion',
  '/map': 'Carte',
  '/reports': 'Mes signalements',
  '/reports/history': 'Anciens signalements',
};

let initStarted = false;

function getPaq(): MatomoCommand[] {
  return (window._paq = window._paq ?? []);
}

function resolvePageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }
  if (pathname.startsWith('/reports/history/')) {
    return 'Détail ancien signalement';
  }
  if (pathname.startsWith('/reports/')) {
    return 'Détail du signalement';
  }
  return pathname;
}

export function isMatomoEnabled(): boolean {
  return config.matomo.enabled;
}

export function initMatomo(): void {
  if (!config.matomo.enabled || initStarted) {
    return;
  }

  initStarted = true;

  const paq = getPaq();
  const trackerUrl = `${config.matomo.url}/matomo.php`;

  paq.push(['setTrackerUrl', trackerUrl]);
  paq.push(['setSiteId', config.matomo.siteId]);
  paq.push(['enableLinkTracking']);

  const script = document.createElement('script');
  script.async = true;
  script.src = `${config.matomo.url}/matomo.js`;
  document.head.appendChild(script);
}

export function trackPageView(pathname: string): void {
  if (!config.matomo.enabled) {
    return;
  }

  initMatomo();

  const paq = getPaq();
  const title = resolvePageTitle(pathname);
  const url = window.location.href;

  paq.push(['setCustomDimension', 1, Capacitor.getPlatform()]);
  paq.push(['setCustomUrl', url]);
  // Titre seul en argument : le 2e paramètre de trackPageView finit dans `data`, pas dans `url`.
  paq.push(['trackPageView', title]);
}

export function trackEvent(category: string, action: string, name?: string, value?: number): void {
  if (!config.matomo.enabled) {
    return;
  }

  const paq = getPaq();
  paq.push(['trackEvent', category, action, name, value]);
}

export function trackOverlayOpen(scope: 'Menu' | 'Carte', name: string): void {
  trackEvent(scope, 'Ouverture', name);
}
