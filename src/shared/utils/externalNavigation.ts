import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export interface ExternalNavigationDestination {
  longitude: number;
  latitude: number;
  label?: string;
}

/**
 * Ouvre l'app de navigation du système (Plans sur iOS, Google Maps sur Android/web)
 * avec l'itinéraire vers `destination`. Aucune origine n'est fournie : l'app de
 * navigation utilise la position courante si elle y a accès, sinon elle affiche
 * son propre écran de construction d'itinéraire en laissant l'utilisateur choisir
 * son point de départ.
 */
export function openExternalNavigation({ longitude, latitude, label }: ExternalNavigationDestination) {
  const url =
    Capacitor.getPlatform() === 'ios'
      ? buildAppleMapsUrl(longitude, latitude, label)
      : buildGoogleMapsUrl(longitude, latitude);

  return Browser.open({ url });
}

function buildAppleMapsUrl(longitude: number, latitude: number, label?: string): string {
  const params = new URLSearchParams({
    daddr: `${latitude},${longitude}`,
    dirflg: 'd',
  });

  if (label) {
    params.set('q', label);
  }

  return `https://maps.apple.com/?${params.toString()}`;
}

function buildGoogleMapsUrl(longitude: number, latitude: number): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${latitude},${longitude}`,
    travelmode: 'driving',
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
