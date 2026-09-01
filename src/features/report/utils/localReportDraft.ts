import type { GeodesyPointReportContext } from '@ign/gdp-tools';

import type { LocalReportDraft, LocalReportDraftPhoto } from '@/domain/report/localReportDraft';
import type { ReportPhoto } from '@/domain/report/models';
import type { NonConformReason } from '@/features/report/components/GeodesyPointReportWizard';
import { resolveVoieSuivieLabel } from '@/features/map/components/MapBottomSheet/pointFiche/pointFicheUtils';

function generateLocalReportDraftId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export interface BuildLocalReportDraftParams {
  reportContext: GeodesyPointReportContext;
  isConform: boolean;
  nonConformReasons: NonConformReason[];
  comment: string;
  longitude: number;
  latitude: number;
  positionModified: boolean;
  photos: ReportPhoto[];
}

export async function buildLocalReportDraft(
  params: BuildLocalReportDraftParams,
): Promise<LocalReportDraft> {
  const photos: LocalReportDraftPhoto[] = await Promise.all(
    params.photos.map(async (photo) => ({
      role: photo.role,
      dataUrl: await fileToDataUrl(photo.file),
    })),
  );

  return {
    id: generateLocalReportDraftId(),
    geodesyId: params.reportContext.geodesyId,
    title: params.reportContext.title,
    titlePicto: params.reportContext.titlePicto,
    layerTitle: params.reportContext.layerTitle,
    voieSuivie: resolveVoieSuivieLabel(params.reportContext.properties) ?? undefined,
    longitude: params.longitude,
    latitude: params.latitude,
    positionModified: params.positionModified,
    isConform: params.isConform,
    nonConformReasons: params.nonConformReasons,
    comment: params.comment,
    photos,
    status: 'not_sent',
    createdAt: new Date().toISOString(),
  };
}
