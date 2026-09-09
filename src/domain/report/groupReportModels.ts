import type { ReportStatus } from '@ign/mobile-core';

export interface GroupReport {
  id: number;
  communityId: number;
  themeName?: string;
  themeAttributes: Record<string, string>;
  status: ReportStatus;
  comment: string;
  geometry: string;
  longitude: number | null;
  latitude: number | null;
  createdAt: Date;
  modifiedAt?: Date;
  authorName?: string;
  /**
   * URLs des pièces jointes (photos) du signalement, telles que renvoyées par l'API.
   * Nécessitent un téléchargement authentifié (voir `collabApiClient.getDocument`) — pas
   * utilisables directement comme `src` d'une balise `<img>`.
   */
  photoUrls: string[];
}
