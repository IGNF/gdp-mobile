import { ReportStatus } from '@ign/mobile-core';
import Feature from 'ol/Feature';
import type { Style } from 'ol/style';
import { Icon, Style as OlStyle } from 'ol/style';

import { getColorCode } from '@/shared/utils/color';
import { getStatusColorToken } from '@/shared/utils/reportStatus';

type StatusIconKind = 'check' | 'clock' | 'close' | 'pencil' | 'send' | 'tag';

const STATUS_ICON_PATHS: Record<StatusIconKind, string> = {
  check:
    'M6.75 15.625 L0.375 9 a1.208 1.208 0 0 1 0-1.75 1.208 1.208 0 0 1 1.75 0 L6.75 12 L17.875 0.375 a1.208 1.208 0 0 1 1.75 0 1.208 1.208 0 0 1 0 1.75 Z',
  clock:
    'M11.25 22.5 A11.25 11.25 0 1 1 22.5 11.25 11.263 11.263 0 0 1 11.25 22.5 Z M11.25 1.646 A9.6 9.6 0 1 0 20.85 11.246 9.615 9.615 0 0 0 11.25 1.646 Z M16.723 15.64 a0.773 0.773 0 0 1-0.385-0.1 l-5.551-3.2 a0.771 0.771 0 0 1-0.385-0.665 V4.747 a0.769 0.769 0 1 1 1.538 0 v6.48 l5.167 2.98 a0.766 0.766 0 0 1 0.28 1.048 0.768 0.768 0 0 1-0.665 0.385 Z',
  close:
    'M11.25 22.5 A11.25 11.25 0 1 1 22.5 11.25 11.263 11.263 0 0 1 11.25 22.5 Z M11.25 1.646 A9.6 9.6 0 1 0 20.85 11.246 9.615 9.615 0 0 0 11.25 1.646 Z M8.4 8.4 l5.7 5.7 m0-5.7 l-5.7 5.7',
  pencil:
    'M20.625 3.375 a2.25 2.25 0 0 0-3.182 0 L4.5 16.318 V22.5 h6.182 L20.625 12.557 a2.25 2.25 0 0 0 0-3.182 Z M7.5 19.5 H6 v-1.5 l9.75-9.75 1.5 1.5 Z',
  send: 'M0 11.25 L22.5 0 11.25 22.5 9 13.5 Z',
  tag: 'M22.5 11.25 L11.25 0 H0 v11.25 L11.25 22.5 Z M6.75 6.75 a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25 Z',
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
    case ReportStatus.Cluster:
      return 'tag';
    case ReportStatus.Pending:
    case ReportStatus.Pending_Qualification:
    case ReportStatus.Pending_Entry:
    case ReportStatus.Pending_Validation:
    default:
      return 'clock';
  }
}

function resolveStatusHexColor(status: ReportStatus | string): string {
  return getColorCode(getStatusColorToken(status)) || getColorCode('medium');
}

function encodeMarkerSvg(svg: string): string {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function createStatusMarkerSvg(color: string, iconKind: StatusIconKind): string {
  const contrast = getColorCode('white');
  const iconPath = STATUS_ICON_PATHS[iconKind];
  const iconTransform =
    iconKind === 'check'
      ? 'translate(5 7.375)'
      : iconKind === 'clock' || iconKind === 'close'
        ? 'translate(3.75 3.75)'
        : iconKind === 'send'
          ? 'translate(3.75 3.75) scale(0.9)'
          : iconKind === 'tag'
            ? 'translate(3.75 3.75) scale(0.85)'
            : 'translate(3.75 3.75) scale(0.85)';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="${color}" fill-opacity="0.18"/>
      <circle cx="20" cy="20" r="15" fill="${contrast}" stroke="${color}" stroke-width="2.5"/>
      <g transform="translate(20 20)">
        <g transform="translate(-11.25 -11.25)">
          <path d="${iconPath}" transform="${iconTransform}" fill="${color}"/>
        </g>
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
      src: encodeMarkerSvg(createStatusMarkerSvg(color, iconKind)),
      anchor: [0.5, 0.5],
      rotateWithView: false,
    }),
  });

  markerStyleCache.set(cacheKey, style);
  return style;
}

export function styleReportMapFeature(feature: Feature): Style {
  const status = feature.get('status') ?? ReportStatus.Pending;
  return createReportStatusMapMarkerStyle(status);
}
