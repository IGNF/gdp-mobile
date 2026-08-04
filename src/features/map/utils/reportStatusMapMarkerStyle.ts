import { ReportStatus } from '@ign/mobile-core';
import Feature from 'ol/Feature';
import type { Style } from 'ol/style';
import { Icon, Style as OlStyle, Text, Fill, Stroke } from 'ol/style';

import { getColorCode } from '@/shared/utils/color';
import { getStatusColorToken } from '@/shared/utils/reportStatus';

type StatusIconKind = 'check' | 'clock' | 'close' | 'pencil' | 'send';

/** Pictogrammes 24×24 simplifiés, lisibles dans l'épingle. */
const STATUS_ICON_PATHS: Record<StatusIconKind, string> = {
  check:
    'M9.12 17.66 L3.7 12.24 l1.41-1.41 4.01 4.01 8.48-8.49 1.41 1.42 Z',
  clock:
    'M12 2 a10 10 0 1 0 0.01 0 Z M12 4 a8 8 0 1 1-0.01 0 Z M12.75 7 v5.05 l3.6 2.15 -0.75 1.25 -4.35-2.6 V7 Z',
  close:
    'M6.1 7.5 L7.5 6.1 17.9 16.5 16.5 17.9 Z M16.5 6.1 L17.9 7.5 7.5 17.9 6.1 16.5 Z',
  pencil:
    'M14.06 2.94 a1.5 1.5 0 0 1 2.12 0 l4.88 4.88 a1.5 1.5 0 0 1 0 2.12 L9.5 21.5 H4.5 v-5 L14.06 2.94 Z M6.5 18 v2 h2 l8.9-8.9 -2-2 L6.5 18 Z',
  send:
    'M3.2 11.2 L20.5 3.4 a0.9 0.9 0 0 1 1.15 1.15 L13.8 21.8 a0.9 0.9 0 0 1-1.65 0.05 L9.9 14.1 3.15 12.55 A0.9 0.9 0 0 1 3.2 11.2 Z M10.7 13.85 L18.4 6.1 11.55 14.55 Z',
};

function resolveStatusIconKind(status: ReportStatus | string): StatusIconKind {
  switch (status) {
    case ReportStatus.Valid:
    case ReportStatus.Valid_Already_Treated:
      return 'check';
    case ReportStatus.Reject:
    case ReportStatus.Reject_Irrelevant:
      return 'close';
    case ReportStatus.Submit:
      return 'send';
    case ReportStatus.Draft:
      return 'pencil';
    case ReportStatus.Pending:
    case ReportStatus.Pending_Qualification:
    case ReportStatus.Pending_Entry:
    case ReportStatus.Pending_Validation:
    case ReportStatus.Cluster:
    default:
      return 'clock';
  }
}

function resolveStatusHexColor(status: ReportStatus | string): string {
  return getColorCode(getStatusColorToken(status)) || '#888888';
}

function encodeMarkerSvg(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Épingle colorée + disque blanc + picto.
 * Ancrage en bas de la pointe pour pointer la coordonnée exacte.
 */
function createPinMarkerSvg(color: string, iconKind: StatusIconKind): string {
  const iconPath = STATUS_ICON_PATHS[iconKind];

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
      <g transform="translate(18 17.5)">
        <g transform="translate(-8 -8) scale(0.67)">
          <path d="${iconPath}" fill="${color}"/>
        </g>
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
  const iconKind = resolveStatusIconKind(status);
  const style = new OlStyle({
    image: new Icon({
      src: encodeMarkerSvg(createPinMarkerSvg(color, iconKind)),
      anchor: [0.5, 1],
      rotateWithView: false,
    }),
  });

  markerStyleCache.set(cacheKey, style);
  return style;
}

const clusterStyleCache = new Map<number, OlStyle>();

export function createReportClusterMapMarkerStyle(count: number): OlStyle {
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

export function styleReportMapFeature(feature: Feature): Style {
  const clusteredFeatures = feature.get('features') as Feature[] | undefined;
  if (Array.isArray(clusteredFeatures) && clusteredFeatures.length > 1) {
    return createReportClusterMapMarkerStyle(clusteredFeatures.length);
  }

  const targetFeature = clusteredFeatures?.[0] ?? feature;
  const status = targetFeature.get('status') ?? ReportStatus.Pending;
  return createReportStatusMapMarkerStyle(status);
}
