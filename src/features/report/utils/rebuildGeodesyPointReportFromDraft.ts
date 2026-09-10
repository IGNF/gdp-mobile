import {
  withGeodesyPointReportPosition,
  type GeodesyPointReportContext,
} from '@ign/gdp-tools';

import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import type { ReportPhoto } from '@/domain/report/models';

function dataUrlToFile(dataUrl: string, fileName: string): File {
  const [header, payload] = dataUrl.split(',');
  const mime = /data:(.*?);/.exec(header)?.[1] ?? 'image/jpeg';
  const binary = atob(payload ?? '');
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], fileName, { type: mime });
}

/** Reconstitue un contexte signalement depuis un brouillon local. */
export function buildGeodesyPointReportContextFromDraft(
  draft: LocalReportDraft,
): GeodesyPointReportContext {
  const properties = draft.properties ?? {
    ...(draft.geodesyId ? { id: draft.geodesyId } : {}),
    ...(draft.themeAttributes?.domaine ? { domaine: draft.themeAttributes.domaine } : {}),
    ...(draft.themeAttributes?.etat ? { etat: draft.themeAttributes.etat } : {}),
    ...(draft.themeAttributes?.gps ? { gps: draft.themeAttributes.gps } : {}),
  };

  return withGeodesyPointReportPosition(
    {
      title: draft.title,
      titlePicto: draft.titlePicto,
      layerTitle: draft.layerTitle ?? '',
      longitude: draft.longitude,
      latitude: draft.latitude,
      attributes: [],
      photos: [],
      comment: draft.comment,
      properties,
      geodesyId: draft.geodesyId,
    },
    { longitude: draft.longitude, latitude: draft.latitude },
  );
}

export function buildReportPhotosFromDraft(draft: LocalReportDraft): ReportPhoto[] {
  return draft.photos.map((photo, index) => {
    const file = dataUrlToFile(photo.dataUrl, `${photo.role}-${index}.jpg`);
    return {
      role: photo.role,
      file,
      previewUrl: photo.dataUrl,
    };
  });
}
