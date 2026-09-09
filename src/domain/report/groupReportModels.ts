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
   * URLs des pièces jointes (photos) du signalement (`attachments[].uri` /
   * `attachments[].download_uri`) — URLs absolues et publiques, utilisables directement
   * comme `src` d'une balise `<img>` (vérifié en conditions réelles, aucune authentification
   * requise sur `espacecollaboratif.ign.fr/document/...`).
   */
  photoUrls: string[];
}
