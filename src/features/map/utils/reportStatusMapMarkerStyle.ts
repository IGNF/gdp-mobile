import { ReportStatus } from '@ign/mobile-core';
import Feature from 'ol/Feature';
import type { Style } from 'ol/style';
import { Icon, Style as OlStyle, Text, Fill, Stroke } from 'ol/style';

import type { LocalReportDraftStatus } from '@/domain/report/localReportDraft';
import {
  areClusteredFeaturesAtSamePoint,
  clusterSamePointKey,
  getClusteredSubFeatures,
} from '@/features/map/utils/reportClusterSpiderfy';
import { getLocalReportDraftStatusColors } from '@/features/report/utils/localReportDraftStatus';
import { getColorCode, resolveCssColor } from '@/shared/utils/color';
import { getStatusColors } from '@/shared/utils/reportStatus';

/** Même couleur que le badge de statut affiché sur la page « Anciens signalements ». */
function resolveStatusHexColor(status: ReportStatus | string): string {
  return resolveCssColor(getStatusColors(status).color) || '#888888';
}

function encodeMarkerSvg(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Épingle colorée + disque blanc, sans picto.
 * Ancrage en bas de la pointe pour pointer la coordonnée exacte.
 */
function createPinMarkerSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <defs>
        <filter id="pinShadow" x="-25%" y="-10%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#pinShadow)">
        <path
          d="M18 46 C18 46 4 30.5 4 18 A14 14 0 1 1 32 18 C32 30.5 18 46 18 46 Z"
          fill="${color}"
        />
        <circle cx="18" cy="17.5" r="9.5" fill="#ffffff"/>
      </g>
    </svg>
  `;
}

/** Pastille de cluster (nombre) — cercle plein, distinct des épingles unitaires. */
function createClusterMarkerSvg(color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <defs>
        <filter id="clusterShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <g filter="url(#clusterShadow)">
        <circle cx="22" cy="22" r="18" fill="${color}" fill-opacity="0.22"/>
        <circle cx="22" cy="22" r="14" fill="${color}"/>
        <circle cx="22" cy="22" r="14" fill="none" stroke="#ffffff" stroke-width="2.5"/>
      </g>
    </svg>
  `;
}

const markerStyleCache = new Map<string, OlStyle>();

export function createReportStatusMapMarkerStyle(status: ReportStatus | string): OlStyle {
  const cacheKey = String(status);
  const cached = markerStyleCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const color = resolveStatusHexColor(status);
  const style = new OlStyle({
    image: new Icon({
      src: encodeMarkerSvg(createPinMarkerSvg(color)),
      anchor: [0.5, 1],
      rotateWithView: false,
    }),
  });

  markerStyleCache.set(cacheKey, style);
  return style;
}

const clusterStyleCache = new Map<number, OlStyle>();

function createReportClusterMapMarkerStyle(count: number): OlStyle {
  const cached = clusterStyleCache.get(count);
  if (cached) {
    return cached;
  }

  const color = getColorCode('secondary') || getColorCode('medium') || '#4A7FB5';
  const style = new OlStyle({
    image: new Icon({
      src: encodeMarkerSvg(createClusterMarkerSvg(color)),
      anchor: [0.5, 0.5],
      rotateWithView: false,
    }),
    text: new Text({
      text: String(count),
      font: 'bold 12px system-ui, sans-serif',
      fill: new Fill({ color: '#ffffff' }),
      stroke: new Stroke({ color: 'rgba(0,0,0,0.15)', width: 2 }),
      offsetY: 1,
    }),
  });

  clusterStyleCache.set(count, style);
  return style;
}

/**
 * Icône « pile » (pin + badge nombre) — plusieurs signalements faits sur exactement le même
 * point. Distincte de la pastille de cluster ({@link createReportClusterMapMarkerStyle}, ronde
 * et sans forme de pin), qui elle ne regroupe que des points proches mais distincts.
 */
function createStackedPinMarkerSvg(color: string, count: number): string {
  const label = count > 9 ? '9+' : String(count);
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
      <defs>
        <filter id="stackPinShadow" x="-25%" y="-10%" width="150%" height="150%">
          <feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#stackPinShadow)">
        <path
          d="M18 46 C18 46 4 30.5 4 18 A14 14 0 1 1 32 18 C32 30.5 18 46 18 46 Z"
          fill="${color}"
        />
        <circle cx="18" cy="17.5" r="9.5" fill="#ffffff"/>
      </g>
      <circle cx="30" cy="8" r="8" fill="#ffffff" stroke="${color}" stroke-width="1.5"/>
      <text x="30" y="11" text-anchor="middle" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="${color}">${label}</text>
    </svg>
  `;
}

const stackedMarkerStyleCache = new Map<number, OlStyle>();

/** Couleur neutre : un « même point » peut regrouper des signalements de statuts différents. */
function resolveStackedMarkerColor(): string {
  return getColorCode('secondary') || getColorCode('medium') || '#4A7FB5';
}

function createStackedReportMarkerStyle(count: number): OlStyle {
  const cached = stackedMarkerStyleCache.get(count);
  if (cached) {
    return cached;
  }

  const style = new OlStyle({
    image: new Icon({
      src: encodeMarkerSvg(createStackedPinMarkerSvg(resolveStackedMarkerColor(), count)),
      // Le badge élargit le canevas à droite : l'ancre reste sur la pointe du pin (x=18 sur 40).
      anchor: [18 / 40, 1],
      rotateWithView: false,
    }),
  });

  stackedMarkerStyleCache.set(count, style);
  return style;
}

/**
 * @param hiddenClusterKey Clé (voir {@link clusterSamePointKey}) du cluster « même point »
 * actuellement éclaté (spiderfy) : son marqueur pile est masqué, remplacé par les satellites.
 */
export function styleReportMapFeature(feature: Feature, hiddenClusterKey: string | null = null): Style | undefined {
  const clusteredFeatures = getClusteredSubFeatures(feature);
  if (clusteredFeatures.length > 1) {
    if (areClusteredFeaturesAtSamePoint(clusteredFeatures)) {
      const key = clusterSamePointKey('server', feature);
      if (key && key === hiddenClusterKey) {
        return undefined;
      }
      return createStackedReportMarkerStyle(clusteredFeatures.length);
    }
    return createReportClusterMapMarkerStyle(clusteredFeatures.length);
  }

  const status = clusteredFeatures[0].get('status') ?? ReportStatus.Pending;
  return createReportStatusMapMarkerStyle(status);
}

/** Même couleur que le badge de statut affiché sur la page « Signalements » (brouillons locaux). */
function resolveLocalDraftHexColor(status: LocalReportDraftStatus): string {
  return resolveCssColor(getLocalReportDraftStatusColors(status).color) || '#4A7FB5';
}

const localDraftMarkerStyleCache = new Map<LocalReportDraftStatus, OlStyle>();

export function createLocalReportDraftMapMarkerStyle(status: LocalReportDraftStatus): OlStyle {
  const cached = localDraftMarkerStyleCache.get(status);
  if (cached) {
    return cached;
  }

  const color = resolveLocalDraftHexColor(status);
  const style = new OlStyle({
    image: new Icon({
      src: encodeMarkerSvg(createPinMarkerSvg(color)),
      anchor: [0.5, 1],
      rotateWithView: false,
    }),
  });

  localDraftMarkerStyleCache.set(status, style);
  return style;
}

/** @param hiddenClusterKey Voir {@link styleReportMapFeature}. */
export function styleLocalReportDraftMapFeature(
  feature: Feature,
  hiddenClusterKey: string | null = null,
): Style | undefined {
  const clusteredFeatures = getClusteredSubFeatures(feature);
  if (clusteredFeatures.length > 1) {
    if (areClusteredFeaturesAtSamePoint(clusteredFeatures)) {
      const key = clusterSamePointKey('local', feature);
      if (key && key === hiddenClusterKey) {
        return undefined;
      }
      return createStackedReportMarkerStyle(clusteredFeatures.length);
    }
    return createReportClusterMapMarkerStyle(clusteredFeatures.length);
  }

  const status = (clusteredFeatures[0].get('status') as LocalReportDraftStatus | undefined) ?? 'not_sent';
  return createLocalReportDraftMapMarkerStyle(status);
}

/** Marqueur d'un signalement individuel « éclaté » (spiderfy) hors de son cluster même-point. */
export function styleSpiderfySatelliteFeature(feature: Feature): Style {
  if (feature.get('reportSource') === 'local') {
    const status = (feature.get('status') as LocalReportDraftStatus | undefined) ?? 'not_sent';
    return createLocalReportDraftMapMarkerStyle(status);
  }

  const status = feature.get('status') ?? ReportStatus.Pending;
  return createReportStatusMapMarkerStyle(status);
}

/** Trait discret reliant un satellite éclaté (spiderfy) à son point d'origine. */
export function styleSpiderfyLegFeature(): Style {
  return new OlStyle({
    stroke: new Stroke({ color: 'rgba(74, 127, 181, 0.55)', width: 1.5, lineDash: [2, 3] }),
  });
}
