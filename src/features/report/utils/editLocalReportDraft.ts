import type { LocalReportDraft, LocalReportDraftPhotoRole } from '@/domain/report/localReportDraft';
import type { NonConformReason } from '@/features/report/components/GeodesyPointReportWizard';
import {
  buildGdpWizardComment,
  buildGdpWizardThemeFormAttributes,
  extractGdpWizardUserComment,
} from '@/features/report/utils/gdpWizardThemeAttributes';

/**
 * Modification champ par champ d'un brouillon non envoyé (fiche détail). Chaque fonction
 * renvoie un nouveau brouillon en gardant cohérents les champs dérivés : commentaire envoyé
 * (motifs ajoutés à la fin), attributs du thème (`etat`, `move`).
 */

function draftNonConformReasons(draft: LocalReportDraft): NonConformReason[] {
  return (draft.nonConformReasons ?? []) as NonConformReason[];
}

/** Commentaire saisi par l'utilisateur, sans les motifs ajoutés à la fin. */
export function getDraftUserComment(draft: LocalReportDraft): string {
  return extractGdpWizardUserComment(draft.comment, draftNonConformReasons(draft));
}

function withThemeAttributes(
  draft: LocalReportDraft,
  isConform: boolean,
  nonConformReasons: readonly NonConformReason[],
  positionModified: boolean,
): Record<string, string> {
  // `etat` recalculé (il peut disparaître, ex. motif « photo non conforme » seul) ; le reste est conservé.
  const otherAttributes = { ...draft.themeAttributes };
  delete otherAttributes.etat;
  return buildGdpWizardThemeFormAttributes({
    isConform,
    nonConformReasons,
    extraThemeAttributes: otherAttributes,
    positionModified,
  });
}

export function updateDraftConformity(
  draft: LocalReportDraft,
  isConform: boolean,
  nonConformReasons: readonly NonConformReason[],
): LocalReportDraft {
  const reasons = isConform ? [] : [...nonConformReasons];
  return {
    ...draft,
    isConform,
    nonConformReasons: reasons,
    comment: buildGdpWizardComment(getDraftUserComment(draft), reasons),
    themeAttributes: withThemeAttributes(draft, isConform, reasons, draft.positionModified),
  };
}

export function updateDraftComment(draft: LocalReportDraft, userComment: string): LocalReportDraft {
  return {
    ...draft,
    comment: buildGdpWizardComment(userComment, draftNonConformReasons(draft)),
  };
}

function arePositionsEqual(
  a: { longitude: number; latitude: number },
  b: { longitude: number; latitude: number },
): boolean {
  return Math.abs(a.longitude - b.longitude) < 1e-6 && Math.abs(a.latitude - b.latitude) < 1e-6;
}

/** Position d'origine du repère ; inconnue pour un brouillon déplacé enregistré avant `originalLongitude`. */
export function getDraftOriginalPosition(
  draft: LocalReportDraft,
): { longitude: number; latitude: number } | null {
  if (draft.originalLongitude !== undefined && draft.originalLatitude !== undefined) {
    return { longitude: draft.originalLongitude, latitude: draft.originalLatitude };
  }

  return draft.positionModified ? null : { longitude: draft.longitude, latitude: draft.latitude };
}

export function updateDraftPosition(
  draft: LocalReportDraft,
  position: { longitude: number; latitude: number },
): LocalReportDraft {
  const original = getDraftOriginalPosition(draft);
  // Origine inconnue : le repère reste considéré comme déplacé.
  const positionModified = original ? !arePositionsEqual(original, position) : true;

  return {
    ...draft,
    longitude: position.longitude,
    latitude: position.latitude,
    originalLongitude: original?.longitude,
    originalLatitude: original?.latitude,
    positionModified,
    themeAttributes: withThemeAttributes(
      draft,
      draft.isConform,
      draftNonConformReasons(draft),
      positionModified,
    ),
  };
}

export function updateDraftPhoto(
  draft: LocalReportDraft,
  role: LocalReportDraftPhotoRole,
  dataUrl: string,
): LocalReportDraft {
  return {
    ...draft,
    photos: [...draft.photos.filter((photo) => photo.role !== role), { role, dataUrl }].sort(
      (a, b) => a.role.localeCompare(b.role),
    ),
  };
}
