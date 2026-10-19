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
  /** Position d'origine du repère (avant déplacement), pour modifier le brouillon. */
  originalLongitude?: number;
  originalLatitude?: number;
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

/**
 * Brouillon déjà parvenu à EspaceCo. Un envoi complet supprime le brouillon ; il ne reste
 * que si les photos n'ont pas pu être jointes (ou s'il date d'avant cette règle).
 * 
 */
export function isLocalReportDraftSent(draft: LocalReportDraft): boolean {
  return draft.status === 'sent' || draft.serverId !== undefined;
}

export function getLocalReportDraftEffectiveStatus(draft: LocalReportDraft): LocalReportDraftStatus {
  return isLocalReportDraftSent(draft) ? 'sent' : 'not_sent';
}
