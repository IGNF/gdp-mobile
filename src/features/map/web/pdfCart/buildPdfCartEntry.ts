import type { MapGeodesyClickAction } from '@/features/map/hooks/useMapGeodesyClick';
import {
  readProperty,
  resolveCommuneLabel,
} from '@/features/map/components/MapBottomSheet/pointFiche/pointFicheUtils';

import type { WebPdfCartEntry } from './pdfCartTypes';

export function buildPdfCartEntryKey(action: MapGeodesyClickAction): string {
  const layerId = action.reportContext.layerId ?? '';
  const geodesyId = action.reportContext.geodesyId ?? readProperty(action, 'no') ?? '';
  const { longitude, latitude } = action.point;

  return [layerId, geodesyId, longitude.toFixed(6), latitude.toFixed(6)].join(':');
}

function buildPdfCartSubtitle(action: MapGeodesyClickAction): string | null {
  const commune = resolveCommuneLabel(action.reportContext.properties);
  const no = readProperty(action, 'no');
  const parts = [no ? `N° ${no}` : null, commune].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function buildPdfCartEntry(action: MapGeodesyClickAction): WebPdfCartEntry {
  const { longitude, latitude } = action.point;

  return {
    key: buildPdfCartEntryKey(action),
    layerId: action.reportContext.layerId ?? null,
    geodesyId: action.reportContext.geodesyId ?? null,
    title: action.point.title.trim() || 'Repère géodésique',
    subtitle: buildPdfCartSubtitle(action),
    titlePicto: action.point.titlePicto,
    pdfUrl: readProperty(action, 'url_pdf'),
    longitude,
    latitude,
  };
}
