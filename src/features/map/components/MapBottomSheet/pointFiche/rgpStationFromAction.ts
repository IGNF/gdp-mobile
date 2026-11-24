import {
  GEODESY_GDP_RGP2_ATTRIBUTE_KEYS,
  GEODESY_ATTRIBUTE_LABELS,
  getGeodesyAttributeLabel,
  parseGdpRgp2DispoStates,
  resolveGdpRgp2AvailabilityLevel,
  type GdpRgp2AvailabilityLevel,
  type GdpRgp2DispoState,
} from '@ign/gdp-tools';

import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';

import { readProperty } from './pointFicheUtils';

/** Fiche station sur le portail RGP IGN (`#<acronyme>`). */
export const RGP_IGN_STATIONS_FICHE_URL = 'https://rgp.ign.fr/STATIONS/';

export function buildRgpIgnStationFicheUrl(stationAcronym: string): string | null {
  const station = stationAcronym.trim();
  if (!station) {
    return null;
  }

  return `${RGP_IGN_STATIONS_FICHE_URL}#${encodeURIComponent(station)}`;
}

export interface RgpStationField {
  key: string;
  label: string;
  value: string;
}

export interface RgpStationCoordinates {
  longitude: string | null;
  latitude: string | null;
  hauteur: string | null;
}

export type RgpStationLine =
  | { type: 'field'; field: RgpStationField }
  | { type: 'coordinates'; coordinates: RgpStationCoordinates };

export interface RgpStationView {
  name: string;
  commune: string | null;
  availabilityLevel: GdpRgp2AvailabilityLevel;
  dispoStates: readonly GdpRgp2DispoState[];
  lines: readonly RgpStationLine[];
  ficheUrl: string | null;
}

function labelForKey(key: string): string {
  const normalized = key.toLowerCase();
  return (
    GEODESY_ATTRIBUTE_LABELS[normalized as keyof typeof GEODESY_ATTRIBUTE_LABELS] ??
    getGeodesyAttributeLabel(key)
  );
}

function formatCoordinateField(key: 'longitude' | 'latitude', raw: string | null): string | null {
  if (!raw?.trim()) {
    return null;
  }

  const value = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(value)) {
    return raw.trim();
  }

  return key === 'latitude' ? `${value.toFixed(5)}° N` : `${value.toFixed(5)}° E`;
}

function formatHauteurField(raw: string | null): string | null {
  if (!raw?.trim()) {
    return null;
  }

  const trimmed = raw.trim();
  return /\bm\s*$/i.test(trimmed) ? trimmed : `${trimmed} m`;
}

/** Données station issues du flux GDP_RGP2 pour la fiche carte. */
export function buildRgpStationView(action: MapGeodesyClickAction): RgpStationView {
  const name = readProperty(action, 'nom') ?? action.point.title;
  const commune = readProperty(action, 'commune');
  const dispoRaw = readProperty(action, 'dispo');
  const dispoStates = parseGdpRgp2DispoStates(dispoRaw);
  const availabilityLevel = resolveGdpRgp2AvailabilityLevel(dispoRaw);

  const skipInList = new Set(['nom', 'commune', 'dispo', 'geometry', 'longitude', 'latitude', 'hauteur', 'info']);

  const coordinates: RgpStationCoordinates = {
    longitude: formatCoordinateField('longitude', readProperty(action, 'longitude')),
    latitude: formatCoordinateField('latitude', readProperty(action, 'latitude')),
    hauteur: formatHauteurField(readProperty(action, 'hauteur')),
  };

  const lines: RgpStationLine[] = [];

  for (const key of GEODESY_GDP_RGP2_ATTRIBUTE_KEYS) {
    if (skipInList.has(key)) {
      if (key === 'longitude') {
        const hasCoordinates = Object.values(coordinates).some(Boolean);
        if (hasCoordinates) {
          lines.push({ type: 'coordinates', coordinates });
        }
      }
      continue;
    }

    const value = readProperty(action, key);
    if (!value) {
      continue;
    }

    lines.push({
      type: 'field',
      field: { key, label: labelForKey(key), value },
    });
  }

  return {
    name,
    commune,
    availabilityLevel,
    dispoStates,
    lines,
    ficheUrl: buildRgpIgnStationFicheUrl(name),
  };
}