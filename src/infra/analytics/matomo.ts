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
  '/map/search': 'Recherche',
  '/map/search/rgp': 'Recherche Stations RGP',
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

export function initMatomo(): void {
  if (!config.matomo.enabled || initStarted) {
    return;
  }

  initStarted = true;

  const paq = getPaq();
  const trackerUrl = `${config.matomo.url}/matomo.php`;

  paq.push(['setTrackerUrl', trackerUrl]);
  paq.push(['setSiteId', config.matomo.siteId]);
  paq.push(['setCustomDimension', 1, __APP_VERSION__]);
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

  paq.push(['setCustomDimension', 2, Capacitor.getPlatform()]);
  paq.push(['setCustomUrl', window.location.href]);
  paq.push(['setDocumentTitle', title]);
  paq.push(['trackPageView']);
}

function trackEvent(category: string, action: string, name?: string, value?: number): void {
  if (!config.matomo.enabled) {
    return;
  }

  initMatomo();

  const paq = getPaq();
  paq.push(['trackEvent', category, action, name, value]);
}

/**
 * Nom d'événement au format « Contexte – Détail ». Le rapport « Noms d'événement » de Matomo
 * n'affiche ni la catégorie ni l'action : le nom doit se comprendre seul.
 */
function eventName(...parts: string[]): string {
  return parts.join(' – ');
}

export function trackOverlayOpen(scope: 'Menu' | 'Carte', name: string): void {
  trackEvent(scope, 'Ouverture', eventName(scope, name));
}

export function trackLogout(): void {
  trackEvent('Auth', 'Déconnexion', eventName('Menu', 'Déconnexion'));
}

/** Panneau Couches de `/map` ou mini-carte du signalement. */
export type LayerTrackingOrigin = 'Couches' | 'Mini-carte';

export function trackLayerVisibilityChange(
  origin: LayerTrackingOrigin,
  layerLabel: string,
  visible: boolean,
): void {
  trackEvent('Couche', visible ? 'Activer' : 'Masquer', eventName(origin, layerLabel));
}

export function trackLayerReload(layerLabel: string): void {
  trackEvent('Couche', 'Recharger', eventName('Stations RGP', layerLabel));
}

export function trackMiniMapBasemapChange(basemapLabel: string): void {
  trackEvent('Couche', 'Changer fond', eventName('Mini-carte', basemapLabel));
}

/** Une valeur retenue pour un filtre (un choix multiple produit un critère par valeur cochée). */
export interface GeodesyFilterCriterion {
  title: string;
  value: string;
}

function formatActiveFiltersCount(activeCount: number): string {
  if (activeCount === 0) {
    return 'par défaut';
  }
  return activeCount === 1 ? '1 actif' : `${activeCount} actifs`;
}

/** Un événement de synthèse, puis un événement par critère pour agréger chaque valeur séparément. */
export function trackGeodesyFiltersApplied(
  criteria: readonly GeodesyFilterCriterion[],
  activeCount: number,
): void {
  trackEvent(
    'Filtre géodésie',
    'Appliquer',
    eventName('Filtres', formatActiveFiltersCount(activeCount)),
    activeCount,
  );
  for (const criterion of criteria) {
    trackEvent('Filtre géodésie', 'Critère', eventName('Filtre', `${criterion.title} : ${criterion.value}`));
  }
}

export function trackGeodesyFiltersResetDraft(): void {
  trackEvent('Filtre géodésie', 'Réinitialiser', eventName('Filtres', 'réinitialisés'));
}

export type GeolocationTrackingMode = 'none' | 'following' | 'locked';

const GEOLOCATION_MODE_LABELS: Record<GeolocationTrackingMode, string> = {
  none: 'Suivi position désactivé',
  following: 'Suivi position activé',
  locked: 'Suivi position verrouillé',
};

/** Clic FAB géolocalisation (cycle none → following → locked → none). */
export function trackGeolocationMode(mode: GeolocationTrackingMode): void {
  trackEvent('Géolocalisation', 'Mode', GEOLOCATION_MODE_LABELS[mode]);
}

/** Point d'entrée de l'envoi : wizard sur la carte ou brouillon dans « Mes signalements ». */
export type ReportSubmissionSource = 'Carte' | 'Brouillon';

export type ReportSubmissionFailure = 'authRequired' | 'reportCreationFailed';

const REPORT_SUBMISSION_FAILURE_LABELS: Record<ReportSubmissionFailure, string> = {
  authRequired: 'Connexion requise',
  reportCreationFailed: 'Création impossible',
};

function formatConformity(isConform: boolean): string {
  return isConform ? 'Conforme' : 'Non conforme';
}

export function trackReportDraftSaved(isConform: boolean, photoCount: number): void {
  trackEvent(
    'Signalement',
    'Brouillon enregistré',
    eventName('Signalement', formatConformity(isConform)),
    photoCount,
  );
}

export function trackReportSubmitted(
  source: ReportSubmissionSource,
  isConform: boolean,
  photoCount: number,
): void {
  trackEvent(
    'Signalement',
    'Envoi réussi',
    eventName('Signalement', source, formatConformity(isConform)),
    photoCount,
  );
}

/** Signalement créé côté serveur, mais photos non jointes. */
export function trackReportSubmittedWithoutPhotos(
  source: ReportSubmissionSource,
  isConform: boolean,
  photoCount: number,
): void {
  trackEvent(
    'Signalement',
    'Envoi partiel',
    eventName('Signalement', source, formatConformity(isConform)),
    photoCount,
  );
}

export function trackReportSubmitFailed(
  source: ReportSubmissionSource,
  failure: ReportSubmissionFailure,
): void {
  trackEvent(
    'Signalement',
    'Envoi échoué',
    eventName('Signalement', source, REPORT_SUBMISSION_FAILURE_LABELS[failure]),
  );
}
