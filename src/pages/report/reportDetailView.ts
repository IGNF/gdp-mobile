import type { GroupReport } from '@/domain/report/groupReportModels';
import type { LocalReportDraft } from '@/domain/report/localReportDraft';
import {
  NON_CONFORM_REASON_LABELS,
  type NonConformReason,
} from '@/features/report/components/GeodesyPointReportWizard';
import {
  GDP_REPORT_CONFORM_ETAT,
  resolveNonConformReasonFromGdpEtat,
} from '@/features/report/utils/gdpWizardThemeAttributes';
import {
  getLocalReportDraftStatusColors,
  getLocalReportDraftStatusLabel,
} from '@/features/report/utils/localReportDraftStatus';
import { getStatusColors, getStatusLabel } from '@/shared/utils/reportStatus';

/** Données affichées par la fiche détail, quelle que soit la source (brouillon local ou serveur). */
export interface ReportDetailView {
  idLabel: string;
  statusLabel: string;
  statusColors: { color: string; background: string };
  photoUrl?: string;
  isConform: boolean;
  /** « Conforme » ou motifs de non-conformité. */
  etatDetail: string;
  positionModified: boolean;
  longitude: number | null;
  latitude: number | null;
  comment: string;
}

function formatNonConformReasons(reasons: readonly string[]): string {
  return reasons.map((reason) => NON_CONFORM_REASON_LABELS[reason as NonConformReason]).join(', ') || '—';
}

export function buildReportDetailViewFromDraft(draft: LocalReportDraft): ReportDetailView {
  return {
    idLabel: `ID_${draft.geodesyId ?? draft.title}`,
    statusLabel: getLocalReportDraftStatusLabel(draft.status),
    statusColors: getLocalReportDraftStatusColors(draft.status),
    photoUrl: draft.photos[0]?.dataUrl,
    isConform: draft.isConform,
    etatDetail: draft.isConform ? 'Conforme' : formatNonConformReasons(draft.nonConformReasons ?? []),
    positionModified: draft.positionModified,
    longitude: draft.longitude,
    latitude: draft.latitude,
    comment: draft.comment,
  };
}

/**
 * Signalement serveur : thème `gdp-tools` (`id`, `etat`, `move`) ou ancien thème `Géodésie`
 * (`Etat du point`, sans identifiant de repère ni indicateur de déplacement).
 */
export function buildReportDetailViewFromGroupReport(report: GroupReport): ReportDetailView {
  const attributes = report.themeAttributes;
  const pointId = attributes.id?.trim();
  const etat = (attributes.etat ?? attributes['Etat du point'])?.trim();
  const isConform = etat?.toUpperCase() === GDP_REPORT_CONFORM_ETAT;
  const reason = resolveNonConformReasonFromGdpEtat(etat);

  return {
    idLabel: pointId ? `ID_${pointId}` : `Signalement #${report.id}`,
    statusLabel: getStatusLabel(report.status),
    statusColors: getStatusColors(report.status),
    photoUrl: report.photoUrls[0],
    isConform,
    etatDetail: isConform ? 'Conforme' : reason ? formatNonConformReasons([reason]) : etat || '—',
    positionModified: attributes.move?.trim().toLowerCase() === 'true',
    longitude: report.longitude,
    latitude: report.latitude,
    comment: report.comment,
  };
}
