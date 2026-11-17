import type { GeodesyPointTitlePicto } from '@ign/gdp-tools';

export interface WebPdfCartEntry {
  key: string;
  layerId: string | null;
  geodesyId: string | null;
  title: string;
  subtitle: string | null;
  titlePicto?: GeodesyPointTitlePicto;
  pdfUrl: string | null;
  longitude: number;
  latitude: number;
}

export type WebPdfCartAddResult = 'added' | 'already' | 'limit';

export type WebPdfCartToggleResult = 'added' | 'removed' | 'limit';

export interface WebPdfCartAddManyResult {
  added: number;
  alreadyInCart: number;
  limitReached: boolean;
}
