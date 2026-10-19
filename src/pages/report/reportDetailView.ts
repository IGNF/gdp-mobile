import { buildGeodesyPointTitleDisplay, type GeodesyPointTitlePicto } from '@ign/gdp-tools';

import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import { GDP_REPORT_CONFORM_ETAT } from '@/features/report/utils/gdpWizardThemeAttributes';
import {
  getLocalReportDraftStatusColors,
  getLocalReportDraftStatusLabel,
} from '@/features/report/utils/localReportDraftStatus';
import {
  resolveCommuneLabel,
  resolveVoieSuivieLabel,
} from '@/features/map/components/MapBottomSheet/pointFiche/pointFicheUtils';
import { GDP_GEODESY_POINT_DISPLAY_OPTIONS } from '@/features/map/utils/geodesyReportContext';
import { getStatusColors, getStatusLabel } from '@/shared/utils/reportStatus';

/** Données affichées par la fiche détail, quelle que soit la source (brouillon local ou serveur). */
export interface ReportDetailView {
  /** Id EspaceCo du signalement (nom du repère tant qu'il n'est pas envoyé), avec le picto du repère. */
  title: string;
  titlePicto?: GeodesyPointTitlePicto;
  statusLabel: string;
  statusColors: { color: string; background: string };
  photoUrl?: string;
  isConform: boolean;
  positionModified: boolean;
  createdAt: Date;
  /** Adresse du repère : voie suivie, à défaut sa commune. */
  address?: string;
  longitude: number | null;
  latitude: number | null;
  comment: string;
}

export function buildReportDetailViewFromDraft(draft: LocalReportDraft): ReportDetailView {
  return {
    title: draft.serverId !== undefined ? `ID : #${draft.serverId}` : draft.title,
    titlePicto: draft.titlePicto,
    statusLabel: getLocalReportDraftStatusLabel(draft.status),
    statusColors: getLocalReportDraftStatusColors(draft.status),
    photoUrl: draft.photos[0]?.dataUrl,
    isConform: draft.isConform,
    positionModified: draft.positionModified,
    createdAt: new Date(draft.createdAt),
    address: draft.voieSuivie || draft.commune,
    longitude: draft.longitude,
    latitude: draft.latitude,
    comment: draft.comment,
  };
}

/**
 * Signalement serveur : thème `gdp-tools` (`id`, `etat`, `move`) ou ancien thème `Géodésie`
 * (`Etat du point`, sans identifiant de repère ni indicateur de déplacement). `point` : repère
 * relu dans le WFS (picto, voie suivie), absent tant qu'il n'est pas chargé ou si la requête échoue.
 */
export function buildReportDetailViewFromGroupReport(
  report: GroupReport,
  point?: Record<string, unknown>,
): ReportDetailView {
  const attributes = report.themeAttributes;
  const etat = (attributes.etat ?? attributes['Etat du point'])?.trim();
  const isConform = etat?.toUpperCase() === GDP_REPORT_CONFORM_ETAT;
  const titleDisplay = point
    ? buildGeodesyPointTitleDisplay(point, { ...GDP_GEODESY_POINT_DISPLAY_OPTIONS, layerId: 'DATA_GEOD' })
    : null;

  return {
    title: `ID : #${report.id}`,
    titlePicto: titleDisplay?.titlePicto,
    statusLabel: getStatusLabel(report.status),
    statusColors: getStatusColors(report.status),
    photoUrl: report.photoUrls[0],
    isConform,
    positionModified: attributes.move?.trim().toLowerCase() === 'true',
    createdAt: report.createdAt,
    address:
      (point && (resolveVoieSuivieLabel(point) || resolveCommuneLabel(point))) ||
      report.communeTitle ||
      undefined,
    longitude: report.longitude,
    latitude: report.latitude,
    comment: report.comment,
  };
}
