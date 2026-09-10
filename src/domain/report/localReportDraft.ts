import type { GeodesyPointTitlePicto } from '@ign/gdp-tools';

export type LocalReportDraftPhotoRole = 'photo1' | 'photo2';

export interface LocalReportDraftPhoto {
  role: LocalReportDraftPhotoRole;
  dataUrl: string;
}

export type LocalReportDraftStatus = 'not_sent' | 'sent';

export interface LocalReportDraft {
  id: string;
  geodesyId?: string;
  title: string;
  titlePicto?: GeodesyPointTitlePicto;
  layerTitle?: string;
  voieSuivie?: string;
  commune?: string;
  longitude: number;
  latitude: number;
  positionModified: boolean;
  isConform: boolean;
  nonConformReasons: string[];
  comment: string;
  photos: LocalReportDraftPhoto[];
  status: LocalReportDraftStatus;
  createdAt: string;
  /** Whitelist thème `gdp-tools` au moment de l’enregistrement. */
  themeAttributes?: Record<string, string>;
  /** Propriétés WFS du repère (id, domaine, etat, expl_gps…). */
  properties?: Record<string, unknown>;
  /** Identifiant EspaceCo après envoi réussi. */
  serverId?: number;
}
