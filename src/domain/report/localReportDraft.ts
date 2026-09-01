import type { GeodesyPointTitlePicto } from '@ign/gdp-tools';

export type LocalReportDraftPhotoRole = 'photo1' | 'photo2';

export interface LocalReportDraftPhoto {
  role: LocalReportDraftPhotoRole;
  dataUrl: string;
}

export type LocalReportDraftStatus = 'not_sent' | 'taken_into_account' | 'rejected';

export interface LocalReportDraft {
  id: string;
  geodesyId?: string;
  title: string;
  titlePicto?: GeodesyPointTitlePicto;
  layerTitle?: string;
  voieSuivie?: string;
  longitude: number;
  latitude: number;
  positionModified: boolean;
  isConform: boolean;
  nonConformReasons: string[];
  comment: string;
  photos: LocalReportDraftPhoto[];
  status: LocalReportDraftStatus;
  createdAt: string;
}
